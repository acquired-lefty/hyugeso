-- =========================================================
-- 05_server_xp.sql — 04_admin_notes.sql 실행 후 한 번 실행
-- 목적: 경험치를 서버(DB)에서만 계산
--   지금까지는 아이 계정이 자기 경험치·기록을 직접 고칠 수 있었음.
--   이제 기록은 아래 세 함수로만 남길 수 있고, 경험치 값은 함수 안에서 정해짐.
--   (경험치 규칙은 js/xp.js · CLAUDE.md의 XP 표와 같게 유지)
-- =========================================================

-- 1) 칭호 (js/xp.js의 TITLES와 같게)
create or replace function public.title_for(lv int) returns text
language sql immutable as $$
  select (array['새내기 손님', '단골 손님', '견습 알바', '매점 조수',
                '주방 보조', '휴게소 탐정', '수석 탐정', '휴게소의 전설'])[least(greatest(lv, 1), 8)];
$$;

-- 2) 경험치 지급 (내부용, 아이 계정은 직접 부를 수 없음). 레벨 = 1 + floor(XP / 200)
create or replace function public.grant_xp(uid uuid, src text, amt int, stage text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into xp_log (user_id, source, amount, stage_id) values (uid, src, amt, stage);
  update profiles
     set xp = xp + amt,
         level = 1 + (xp + amt) / 200,
         title = title_for(1 + (xp + amt) / 200)
   where id = uid;
end; $$;

-- 3) 스테이지 클리어: 첫 클리어일 때만 기록·복습 예약·공동 목표·경험치
create or replace function public.complete_stage(
  p_stage text, p_concept text, p_attempts int, p_hints int, p_bonus boolean
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rows jsonb := '[]'::jsonb;
  pr profiles%rowtype;
begin
  if uid is null then raise exception 'login required'; end if;
  if p_stage !~ '^s1-w(0[1-9]|1[0-2])$' then raise exception 'unknown stage'; end if;
  if p_concept !~ '^[a-z]+-[a-z]+-[0-9]{2}$' then raise exception 'unknown concept'; end if;

  -- 같은 아이가 두 번 연달아 보내도 한 번만 처리되도록 잠금
  select * into pr from profiles where id = uid for update;

  if exists (select 1 from progress where user_id = uid and stage_id = p_stage and cleared) then
    return jsonb_build_object('first', false, 'rows', rows,
      'xp', pr.xp, 'level', pr.level, 'title', pr.title);
  end if;

  insert into progress (user_id, stage_id, cleared, attempts, hints_used, cleared_at)
  values (uid, p_stage, true, greatest(coalesce(p_attempts, 0), 0), greatest(coalesce(p_hints, 0), 0), now())
  on conflict (user_id, stage_id) do update
    set cleared = true, attempts = excluded.attempts, hints_used = excluded.hints_used, cleared_at = excluded.cleared_at;

  insert into review_quiz (user_id, concept_id, due_at) values (uid, p_concept, now() + interval '14 days');
  update team_goals set current = least(current + 1, target) where id = 's1-kitchen';

  perform grant_xp(uid, 'clear', 100, p_stage);
  rows := rows || jsonb_build_object('source', 'clear', 'amount', 100);
  if coalesce(p_hints, 0) = 0 then
    perform grant_xp(uid, 'no_hint', 50, p_stage);
    rows := rows || jsonb_build_object('source', 'no_hint', 'amount', 50);
  end if;
  if coalesce(p_bonus, false) then
    perform grant_xp(uid, 'bonus', 30, p_stage);
    rows := rows || jsonb_build_object('source', 'bonus', 'amount', 30);
  end if;
  perform grant_xp(uid, 'team', 10, p_stage);
  rows := rows || jsonb_build_object('source', 'team', 'amount', 10);

  select * into pr from profiles where id = uid;
  return jsonb_build_object('first', true, 'rows', rows, 'xp', pr.xp, 'level', pr.level, 'title', pr.title);
end; $$;

-- 4) 영상 단서: 처음 모을 때만 경험치 20
create or replace function public.collect_clue(p_clue text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  added int;
  pr profiles%rowtype;
begin
  if uid is null then raise exception 'login required'; end if;
  if p_clue !~ '^s1-w(0[1-9]|1[0-2])$' then raise exception 'unknown clue'; end if;
  select * into pr from profiles where id = uid for update;

  insert into clues (user_id, clue_id) values (uid, p_clue) on conflict do nothing;
  get diagnostics added = row_count;
  if added > 0 then perform grant_xp(uid, 'clue', 20, p_clue); end if;

  select * into pr from profiles where id = uid;
  return jsonb_build_object('new', added > 0, 'gained', case when added > 0 then 20 else 0 end,
    'xp', pr.xp, 'level', pr.level, 'title', pr.title);
end; $$;

-- 5) 복습 퀴즈: 예정일이 지났고 아직 안 푼 것만, 정답이면 경험치 40
create or replace function public.answer_review(p_id bigint, p_correct boolean, p_stage text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  done int;
  pr profiles%rowtype;
begin
  if uid is null then raise exception 'login required'; end if;
  if p_stage is not null and p_stage !~ '^s1-w(0[1-9]|1[0-2])$' then raise exception 'unknown stage'; end if;
  select * into pr from profiles where id = uid for update;

  update review_quiz set correct = coalesce(p_correct, false), answered_at = now()
   where id = p_id and user_id = uid and answered_at is null and due_at <= now();
  get diagnostics done = row_count;
  if done > 0 and p_correct then perform grant_xp(uid, 'review', 40, p_stage); end if;

  select * into pr from profiles where id = uid;
  return jsonb_build_object('gained', case when done > 0 and p_correct then 40 else 0 end,
    'xp', pr.xp, 'level', pr.level, 'title', pr.title);
end; $$;

-- 6) 권한: 아이 계정은 읽기만, 기록은 위 함수로만
revoke update on public.profiles from authenticated;
revoke update (xp, level, title) on public.profiles from authenticated;
revoke insert, update, delete on public.progress, public.xp_log, public.clues, public.review_quiz from anon, authenticated;

revoke execute on function public.grant_xp(uuid, text, int, text) from public, anon, authenticated;
revoke execute on function public.contribute_team(text) from public, anon, authenticated;
revoke execute on function public.complete_stage(text, text, int, int, boolean) from public, anon;
revoke execute on function public.collect_clue(text) from public, anon;
revoke execute on function public.answer_review(bigint, boolean, text) from public, anon;
grant execute on function public.complete_stage(text, text, int, int, boolean) to authenticated;
grant execute on function public.collect_clue(text) to authenticated;
grant execute on function public.answer_review(bigint, boolean, text) to authenticated;

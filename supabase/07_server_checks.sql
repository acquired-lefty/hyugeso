-- =========================================================
-- 07_server_checks.sql — 06_signup_profile.sql 실행 후 한 번 실행
-- 목적
--   1) 영상 암호를 서버에서 확인 (게임 화면 코드에는 암호 대신 '지문(해시)'만 남김)
--      회차 암호는 clue_keys 표에 두고 대표님만 읽고 바꿈 (대시보드 "회차 설정"의 암호 칸)
--   2) 회차 공개 날짜 전에는 클리어·단서 기록이 남지 않음 (대표님 계정은 미리보기 가능)
--   3) 대표님이 아이 계정의 비밀번호를 새로 정해 줄 수 있음 (가짜 이메일이라 메일 재설정 불가)
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

-- 1) 회차 암호 표 (관리자만 읽기·쓰기)
create table if not exists public.clue_keys (
  stage_id text primary key check (stage_id ~ '^s1-w(0[1-9]|1[0-2])$'),
  answer text not null check (char_length(answer) between 1 and 30),
  updated_at timestamptz default now()
);
alter table public.clue_keys enable row level security;
revoke all on public.clue_keys from anon, public;
grant select, insert, update, delete on public.clue_keys to authenticated;
drop policy if exists "clue_keys_admin" on public.clue_keys;
create policy "clue_keys_admin" on public.clue_keys for all to authenticated using (is_admin()) with check (is_admin());

insert into public.clue_keys (stage_id, answer) values
  ('s1-w01', '빠른덧셈'), ('s1-w02', '자리차지'), ('s1-w03', '남은하루')
on conflict (stage_id) do nothing;

-- 모은 단서에 암호 글자를 함께 저장 (단서 도감·지하 자물쇠에 표시)
alter table public.clues add column if not exists word text;
update public.clues c set word = k.answer from public.clue_keys k where k.stage_id = c.clue_id and c.word is null;

-- 띄어쓰기 무시, 영어는 소문자로 (화면의 normalize()와 같은 규칙)
create or replace function public.clue_norm(p text) returns text
language sql immutable as $$ select lower(regexp_replace(coalesce(p, ''), '\s+', '', 'g')); $$;

-- 2) 회차 공개 날짜: 대시보드 설정(stage_settings.opens_at)이 우선, 없으면 기본 일정 (js/stages/index.js의 opensAt과 같게)
create or replace function public.stage_default_open(p_stage text) returns date
language sql immutable as $$
  select case p_stage
    when 's1-w03' then date '2026-10-12' when 's1-w04' then date '2026-10-15'
    when 's1-w05' then date '2026-10-19' when 's1-w06' then date '2026-10-22'
    when 's1-w07' then date '2026-10-26' when 's1-w08' then date '2026-10-29'
    when 's1-w09' then date '2026-11-02' when 's1-w10' then date '2026-11-05'
    when 's1-w11' then date '2026-11-09' when 's1-w12' then date '2026-11-12'
  end;
$$;

-- 한국 시간 0시 기준으로 열렸는지 (대표님 계정은 항상 true)
create or replace function public.stage_is_open(p_stage text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare d date;
begin
  if is_admin() then return true; end if;
  select opens_at into d from stage_settings where stage_id = p_stage;
  d := coalesce(d, stage_default_open(p_stage));
  return d is null or now() >= (d::timestamp at time zone 'Asia/Seoul');
end; $$;

-- 06의 complete_stage에 공개 날짜 확인을 더해 다시 만듦
create or replace function public.complete_stage(
  p_stage text, p_concept text, p_attempts int, p_hints int, p_bonus boolean
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  rows jsonb := '[]'::jsonb;
  pr profiles%rowtype;
begin
  if uid is null or not is_approved() then raise exception 'not approved'; end if;
  if p_stage !~ '^s1-w(0[1-9]|1[0-2])$' then raise exception 'unknown stage'; end if;
  if p_concept !~ '^[a-z]+-[a-z]+-[0-9]{2}$' then raise exception 'unknown concept'; end if;
  if not stage_is_open(p_stage) then raise exception 'not open yet'; end if;

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

-- 단서 모으기: 이제 입력한 암호를 함께 받아 서버가 맞는지 확인
-- 암호가 아직 등록되지 않은 회차는 입력한 글자를 그대로 단서로 기록 (대시보드에서 등록 권장)
drop function if exists public.collect_clue(text);
create or replace function public.collect_clue(p_clue text, p_answer text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  key text;
  w text;
  added int := 0;
  pr profiles%rowtype;
begin
  if uid is null or not is_approved() then raise exception 'not approved'; end if;
  if p_clue !~ '^s1-w(0[1-9]|1[0-2])$' then raise exception 'unknown clue'; end if;
  if not stage_is_open(p_clue) then raise exception 'not open yet'; end if;
  select * into pr from profiles where id = uid for update;

  select answer into key from clue_keys where stage_id = p_clue;
  w := nullif(clue_norm(coalesce(key, p_answer)), '');
  if w is null or char_length(w) > 30 or (key is not null and clue_norm(p_answer) <> clue_norm(key)) then
    return jsonb_build_object('ok', false, 'new', false, 'gained', 0, 'xp', pr.xp, 'level', pr.level, 'title', pr.title);
  end if;

  insert into clues (user_id, clue_id, word) values (uid, p_clue, w) on conflict do nothing;
  get diagnostics added = row_count;
  if added > 0 then perform grant_xp(uid, 'clue', 20, p_clue); end if;

  select * into pr from profiles where id = uid;
  return jsonb_build_object('ok', true, 'new', added > 0, 'gained', case when added > 0 then 20 else 0 end,
    'xp', pr.xp, 'level', pr.level, 'title', pr.title);
end; $$;

-- 3) 대표님용: 아이 계정 비밀번호 새로 정하기 (관리자 계정 비밀번호는 바꿀 수 없음)
create or replace function public.admin_set_password(p_user uuid, p_password text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  if char_length(coalesce(p_password, '')) < 6 then raise exception 'password too short'; end if;
  if exists (select 1 from profiles where id = p_user and is_admin) then raise exception 'not for admin'; end if;
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
   where id = p_user;
  if not found then raise exception 'no such user'; end if;
end; $$;

-- 실행 권한: 로그인한 사용자만 (관리자 확인은 함수 안에서)
revoke execute on function public.stage_is_open(text) from public, anon;
revoke execute on function public.collect_clue(text, text) from public, anon;
revoke execute on function public.admin_set_password(uuid, text) from public, anon;
grant execute on function public.stage_is_open(text) to authenticated;
grant execute on function public.collect_clue(text, text) to authenticated;
grant execute on function public.admin_set_password(uuid, text) to authenticated;

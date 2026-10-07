-- =========================================================
-- 06_signup_profile.sql — 05_server_xp.sql 실행 후 한 번 실행
-- 목적
--   1) 가입 신청 + 대표님 승인 (승인 전에는 게임 기록이 남지 않음)
--      어린이(만 14세 미만) 계정은 대표님이 "보호자 동의 확인"을 해야만 승인됨
--   2) 프로필: 아바타(편집형, 그림만), 닉네임(대표님 승인 후 표시)
--   3) 회차 설정: 공개 날짜, 연계 유튜브 영상 주소 (대표님이 대시보드에서 입력)
-- 실행 후 Supabase 설정: Authentication → Sign In / Providers →
--   "Allow new users to sign up" 켜기 ("Confirm email"은 꺼 둔 채로)
-- =========================================================

-- 1) 프로필에 칸 추가 (지금 있는 계정은 모두 '승인됨'으로 시작)
alter table public.profiles add column if not exists status text not null default 'approved';
alter table public.profiles alter column status set default 'pending';
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (status in ('pending', 'approved', 'rejected'));
alter table public.profiles add column if not exists age_group text;              -- 'child'(만 14세 미만) / 'adult'
alter table public.profiles add column if not exists guardian_ok boolean not null default false; -- 신청할 때 "보호자와 함께" 체크
alter table public.profiles add column if not exists consent_checked_at timestamptz; -- 대표님이 보호자 동의를 확인한 시각
alter table public.profiles add column if not exists display_name text;           -- 승인된 닉네임 (다른 사람에게 보이는 이름)
alter table public.profiles add column if not exists display_name_pending text;   -- 승인 기다리는 닉네임
alter table public.profiles add column if not exists avatar jsonb;                -- 아바타 설정 (그림 조합, 사진 아님)
alter table public.profiles add column if not exists requested_at timestamptz default now();

-- 2) 가입하면 프로필이 '승인 대기'로 생김 (아이디 hajoon@hyugeso.local → hajoon)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname, age_group, guardian_ok)
  values (
    new.id,
    split_part(new.email, '@', 1),
    case when new.raw_user_meta_data ->> 'age_group' in ('child', 'adult') then new.raw_user_meta_data ->> 'age_group' end,
    coalesce(new.raw_user_meta_data ->> 'guardian_ok', '') = 'true'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create or replace function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'approved' from profiles where id = auth.uid()), false);
$$;

-- 3) 프로필은 본인 것과 관리자만 읽기 (다른 아이의 정보는 보이지 않음)
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select to authenticated
  using (id = auth.uid() or is_admin());

-- 4) 승인된 계정만 기록을 남김 (05의 세 함수에 승인 확인을 더해 다시 만듦)
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

create or replace function public.collect_clue(p_clue text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  added int;
  pr profiles%rowtype;
begin
  if uid is null or not is_approved() then raise exception 'not approved'; end if;
  if p_clue !~ '^s1-w(0[1-9]|1[0-2])$' then raise exception 'unknown clue'; end if;
  select * into pr from profiles where id = uid for update;

  insert into clues (user_id, clue_id) values (uid, p_clue) on conflict do nothing;
  get diagnostics added = row_count;
  if added > 0 then perform grant_xp(uid, 'clue', 20, p_clue); end if;

  select * into pr from profiles where id = uid;
  return jsonb_build_object('new', added > 0, 'gained', case when added > 0 then 20 else 0 end,
    'xp', pr.xp, 'level', pr.level, 'title', pr.title);
end; $$;

create or replace function public.answer_review(p_id bigint, p_correct boolean, p_stage text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  done int;
  pr profiles%rowtype;
begin
  if uid is null or not is_approved() then raise exception 'not approved'; end if;
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

-- 5) 내 프로필 바꾸기: 아바타는 바로 반영, 닉네임은 '승인 대기'로 들어감
create or replace function public.update_my_profile(p_avatar jsonb, p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  n text := nullif(btrim(coalesce(p_name, '')), '');
  pr profiles%rowtype;
begin
  if uid is null or not is_approved() then raise exception 'not approved'; end if;
  if p_avatar is not null then
    if jsonb_typeof(p_avatar) <> 'object' or pg_column_size(p_avatar) > 600 then raise exception 'bad avatar'; end if;
    update profiles set avatar = p_avatar where id = uid;
  end if;
  if n is not null then
    if char_length(n) > 12 then raise exception 'name too long'; end if;
    update profiles set display_name_pending = case when n = display_name then null else n end where id = uid;
  end if;
  select * into pr from profiles where id = uid;
  return jsonb_build_object('avatar', pr.avatar, 'display_name', pr.display_name, 'display_name_pending', pr.display_name_pending);
end; $$;

-- 6) 대표님용: 가입 승인·거절 (어린이는 보호자 동의 확인 필수), 닉네임 승인·거절
create or replace function public.admin_set_status(p_user uuid, p_status text, p_consent boolean) returns void
language plpgsql security definer set search_path = public as $$
declare ag text;
begin
  if not is_admin() then raise exception 'admin only'; end if;
  if p_status not in ('pending', 'approved', 'rejected') then raise exception 'bad status'; end if;
  select age_group into ag from profiles where id = p_user;
  if not found then raise exception 'no such user'; end if;
  -- 어른으로 신청한 계정이 아니면(어린이 또는 정보 없음) 보호자 동의 확인이 있어야 승인
  if p_status = 'approved' and ag is distinct from 'adult' and not coalesce(p_consent, false) then
    raise exception 'guardian consent required';
  end if;
  update profiles
     set status = p_status,
         consent_checked_at = case when p_status = 'approved' and coalesce(p_consent, false) then now() else consent_checked_at end
   where id = p_user;
end; $$;

create or replace function public.admin_review_name(p_user uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'admin only'; end if;
  update profiles
     set display_name = case when p_ok then display_name_pending else display_name end,
         display_name_pending = null
   where id = p_user;
end; $$;

-- 7) 회차 설정: 공개 날짜(한국 시간 0시 기준 날짜)와 유튜브 영상 주소
create table if not exists public.stage_settings (
  stage_id text primary key check (stage_id ~ '^s1-w(0[1-9]|1[0-2])$'),
  opens_at date,
  video_url text check (video_url is null or video_url ~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/'),
  updated_at timestamptz default now()
);
alter table public.stage_settings enable row level security;
revoke all on public.stage_settings from anon, public;
grant select, insert, update, delete on public.stage_settings to authenticated;
drop policy if exists "settings_read" on public.stage_settings;
drop policy if exists "settings_admin" on public.stage_settings;
create policy "settings_read" on public.stage_settings for select to authenticated using (true);
create policy "settings_admin" on public.stage_settings for all to authenticated using (is_admin()) with check (is_admin());

-- 8) 함수 권한
revoke execute on function public.is_approved() from public, anon;
revoke execute on function public.update_my_profile(jsonb, text) from public, anon;
revoke execute on function public.admin_set_status(uuid, text, boolean) from public, anon;
revoke execute on function public.admin_review_name(uuid, boolean) from public, anon;
grant execute on function public.is_approved() to authenticated;
grant execute on function public.update_my_profile(jsonb, text) to authenticated;
grant execute on function public.admin_set_status(uuid, text, boolean) to authenticated;
grant execute on function public.admin_review_name(uuid, boolean) to authenticated;

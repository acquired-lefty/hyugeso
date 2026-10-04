-- =========================================================
-- 02_setup.sql — 01_schema.sql 실행 후 한 번 더 실행
-- =========================================================

-- 1) 아이디를 만들면 프로필이 자동으로 생기게 함
--    (아이디 hajoon@hyugeso.local → 닉네임 hajoon)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) 아이가 스스로 관리자 권한을 켜지 못하도록
--    프로필에서 수정 가능한 칸을 경험치·레벨·칭호로 제한
revoke update on public.profiles from authenticated;
grant update (xp, level, title) on public.profiles to authenticated;

-- 3) 공동 목표 함수: 진행 바만 올림 (경험치는 게임 쪽에서 기록)
create or replace function public.contribute_team(goal text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.team_goals set current = least(current + 1, target) where id = goal;
end; $$;

-- 4) 시즌1 공동 목표
insert into public.team_goals (id, title, target)
values ('s1-kitchen', '부엌 공동 목표', 60)
on conflict (id) do nothing;

-- =========================================================
-- 대표님 계정을 관리자로 지정 (아이디 부분만 바꿔서 실행)
-- update public.profiles set is_admin = true where nickname = '대표님아이디';
-- =========================================================

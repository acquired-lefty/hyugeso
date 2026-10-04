-- =========================================================
-- 수상한 휴게소 게임 — Supabase 데이터베이스 설정
-- 사용법: Supabase 대시보드 > SQL Editor > New query
--         이 파일 전체를 붙여넣고 [Run] 한 번 클릭
-- =========================================================

-- 1) 아이별 프로필 (닉네임·레벨·경험치만 저장, 실명 없음)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  level int not null default 1,
  xp int not null default 0,
  title text default '새내기 손님',
  is_admin boolean not null default false,
  created_at timestamptz default now()
);

-- 2) 스테이지별 진행도 (정답률·재시도·힌트 사용 기록)
create table if not exists progress (
  user_id uuid references profiles(id) on delete cascade,
  stage_id text not null,              -- 예: 's1-w01'
  cleared boolean default false,
  attempts int default 0,              -- 재시도 횟수
  hints_used int default 0,
  cleared_at timestamptz,
  primary key (user_id, stage_id)
);

-- 3) 경험치 획득 기록 (무엇으로 몇 XP 받았는지)
create table if not exists xp_log (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  source text not null,                -- clear / no_hint / bonus / clue / review / team
  amount int not null,
  stage_id text,
  created_at timestamptz default now()
);

-- 4) 단서 도감 (영상 속 단서 입력 = 영상 시청 확인)
create table if not exists clues (
  user_id uuid references profiles(id) on delete cascade,
  clue_id text not null,
  collected_at timestamptz default now(),
  primary key (user_id, clue_id)
);

-- 5) 2주 후 복습 퀴즈 (파지율 측정)
create table if not exists review_quiz (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete cascade,
  concept_id text not null,            -- 예: 'math-mul-01'
  due_at timestamptz not null,
  correct boolean,
  answered_at timestamptz
);

-- 6) 친구들 공동 목표 (모두가 함께 채우는 진행 바)
create table if not exists team_goals (
  id text primary key,
  title text not null,
  target int not null,
  current int not null default 0
);

-- 7) 자동 일시정지 방지용 신호 테이블
create table if not exists heartbeat (
  id int primary key default 1,
  note text default 'alive'
);
insert into heartbeat (id) values (1) on conflict do nothing;

-- =========================================================
-- 보안 규칙: 아이는 자기 기록만, 대표님(관리자)은 전체 조회
-- =========================================================
alter table profiles    enable row level security;
alter table progress    enable row level security;
alter table xp_log      enable row level security;
alter table clues       enable row level security;
alter table review_quiz enable row level security;
alter table team_goals  enable row level security;
alter table heartbeat   enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- 프로필: 로그인한 친구들은 닉네임·레벨을 서로 볼 수 있음, 수정은 본인 것만
create policy "profiles_read"   on profiles for select to authenticated using (true);
create policy "profiles_update" on profiles for update to authenticated using (id = auth.uid());

-- 개인 기록: 본인 또는 관리자만
create policy "progress_own" on progress for all to authenticated
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());
create policy "xp_own" on xp_log for all to authenticated
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());
create policy "clues_own" on clues for all to authenticated
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());
create policy "review_own" on review_quiz for all to authenticated
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid());

-- 공동 목표: 모두 읽기 가능, 증가는 아래 함수로만
create policy "team_read" on team_goals for select to authenticated using (true);

-- 신호 테이블: 누구나 읽기만 가능
create policy "heartbeat_read" on heartbeat for select to anon, authenticated using (true);

-- 공동 목표 1 증가 (본인 기여 XP도 함께 기록)
create or replace function contribute_team(goal text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update team_goals set current = least(current + 1, target) where id = goal;
  insert into xp_log (user_id, source, amount) values (auth.uid(), 'team', 10);
  update profiles set xp = xp + 10 where id = auth.uid();
end; $$;

-- 대표님용 요약 보기: 아이별 정답률·평균 재시도·복습 정답률
create or replace view learning_summary as
select p.nickname, p.level, p.xp,
  count(pr.*) filter (where pr.cleared)                     as stages_cleared,
  round(avg(pr.attempts)::numeric, 1)                       as avg_attempts,
  round(avg(pr.hints_used)::numeric, 1)                     as avg_hints,
  (select round(100.0 * avg(case when r.correct then 1 else 0 end), 0)
     from review_quiz r where r.user_id = p.id and r.answered_at is not null) as review_rate_pct
from profiles p left join progress pr on pr.user_id = p.id
group by p.id;

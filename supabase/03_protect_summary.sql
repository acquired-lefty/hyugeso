-- =========================================================
-- 03_protect_summary.sql — 02_setup.sql 실행 후 한 번 실행
-- 목적: 대표님용 요약 보기(learning_summary)를 관리자만 보게 함
--   뷰는 RLS 규칙을 거치지 않아, 그대로 두면 공개 키만으로
--   모든 아이의 닉네임·레벨·학습 기록을 읽을 수 있었음
-- =========================================================

-- 1) 로그인 안 한 사용자(공개 키)는 아예 못 읽게 함
revoke all on public.learning_summary from anon, public;
grant select on public.learning_summary to authenticated;

-- 2) 로그인한 사용자 중 관리자(is_admin)에게만 행이 보이게 함
--    아이 계정으로 읽으면 빈 결과가 나옴
create or replace view public.learning_summary as
select p.nickname, p.level, p.xp,
  count(pr.*) filter (where pr.cleared)                     as stages_cleared,
  round(avg(pr.attempts)::numeric, 1)                       as avg_attempts,
  round(avg(pr.hints_used)::numeric, 1)                     as avg_hints,
  (select round(100.0 * avg(case when r.correct then 1 else 0 end), 0)
     from review_quiz r where r.user_id = p.id and r.answered_at is not null) as review_rate_pct
from profiles p left join progress pr on pr.user_id = p.id
where exists (
  select 1 from profiles a where a.id = auth.uid() and a.is_admin
)
group by p.id;

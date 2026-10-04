-- =========================================================
-- 04_admin_notes.sql — 03_protect_summary.sql 실행 후 한 번 실행
-- 목적: 대표님용 대시보드의 수기 메모 ("아들이 먼저 꺼낸 질문" 등)
--   아이 계정은 읽기·쓰기 모두 불가, 관리자(is_admin)만 사용
--   메모에도 실명·학교·연락처는 적지 않음 (CLAUDE.md 개인정보 원칙)
-- =========================================================

create table if not exists admin_notes (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,  -- 어느 아이에 대한 메모인지
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz default now()
);

alter table admin_notes enable row level security;

revoke all on admin_notes from anon, public;
grant select, insert, delete on admin_notes to authenticated;

drop policy if exists "notes_admin_read"   on admin_notes;
drop policy if exists "notes_admin_insert" on admin_notes;
drop policy if exists "notes_admin_delete" on admin_notes;
create policy "notes_admin_read"   on admin_notes for select to authenticated using (is_admin());
create policy "notes_admin_insert" on admin_notes for insert to authenticated with check (is_admin());
create policy "notes_admin_delete" on admin_notes for delete to authenticated using (is_admin());

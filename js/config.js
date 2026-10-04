// Supabase 주소와 공개 키를 넣으면 실제 저장 모드로 동작합니다.
// 비워 두면 '체험 모드'(이 기기 브라우저에만 저장)로 동작합니다.
// anon key는 공개되어도 되는 키입니다. 데이터 보호는 RLS 규칙이 담당합니다.
export const CONFIG = {
  SUPABASE_URL: 'https://znybtfadndksnpvuzucm.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueWJ0ZmFkbmRrc25wdnV6dWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNjY1OTUsImV4cCI6MjEwNjY0MjU5NX0.sBVMtw9sJKxZfXzNgqtj4RnnAoEeo5skrh82yfjBHgQ',
  EMAIL_DOMAIN: 'hyugeso.local',
  XP_PER_LEVEL: 200,
};

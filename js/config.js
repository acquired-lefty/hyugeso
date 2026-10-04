// Supabase 주소와 공개 키를 넣으면 실제 저장 모드로 동작합니다.
// 비워 두면 '체험 모드'(이 기기 브라우저에만 저장)로 동작합니다.
// anon key는 공개되어도 되는 키입니다. 데이터 보호는 RLS 규칙이 담당합니다.
export const CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  EMAIL_DOMAIN: 'hyugeso.local',
  XP_PER_LEVEL: 200,
};

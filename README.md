# 어딘가 수상한 휴게소

초3 교과 연계 웹게임. 1주차 "레시피 3배로!"(곱셈) 포함.

## 1. 먼저 체험해 보기 (설정 없이)
1. 이 폴더 전체를 GitHub 저장소에 올립니다 (`.github` 폴더 포함).
2. 저장소 Settings → Pages → Branch를 `main` / `root`로 저장.
3. 1~2분 뒤 표시되는 주소로 접속 → 아무 영어 아이디로 입장.
   체험 모드라 기록은 그 기기에만 저장됩니다.

## 2. 실제 저장 켜기 (Supabase)
1. supabase.com → New project (Region: Seoul).
2. SQL Editor에서 `supabase/01_schema.sql` 실행 → 이어서 `supabase/02_setup.sql` → `supabase/03_protect_summary.sql` → `supabase/04_admin_notes.sql` → `supabase/05_server_xp.sql` 순서로 실행.
3. Authentication → Sign In / Providers → Email → **Confirm email 끄기**.
4. Project Settings → API에서 Project URL과 anon public key 복사.
5. `js/config.js`의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 붙여넣고 저장소에 반영.

## 3. 아이 아이디 발급
1. Authentication → Users → Add user → Create new user.
2. Email: `영어아이디@hyugeso.local` (예: `hajoon@hyugeso.local`), 비밀번호 입력, **Auto Confirm User** 체크.
3. 아이에게는 `영어아이디`와 비밀번호만 알려 줍니다.
4. 대표님 계정도 같은 방식으로 만든 뒤, SQL Editor에서
   `update profiles set is_admin = true where nickname = '대표님아이디';`

## 4. 자동 정지 방지
1. 저장소 Settings → Secrets and variables → Actions → New repository secret.
2. `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 개 등록.
3. Actions 탭 → Supabase Keepalive → Run workflow로 한 번 실행해 성공 확인.

## 5. 영상 암호 맞추기
주차별 암호 (띄어쓰기 무시): 1주차 `빠른덧셈`, 2주차 `자리차지`. 영상 대본에 이 암호가 나오도록 맞춥니다.
바꾸려면 `js/stages/s1-wNN.js`의 `clue.answer`를 수정합니다.

## 6. 학습 대시보드
사이트 주소 뒤에 `admin.html`을 붙여 접속합니다 (예: `https://acquired-lefty.github.io/hyugeso/admin.html`).
관리자(`is_admin`) 계정만 들어갈 수 있고, 게임 화면 상단의 "대시보드" 링크도 관리자에게만 보입니다.

대시보드 아래 **기록 내보내기** 버튼으로 모든 기록을 파일(JSON)로 저장할 수 있습니다. 무료 플랜은 자동 백업이 없으니 한 달에 한 번쯤 저장해 두세요.

## 7. 주차 공개 날짜
`js/stages/index.js`에서 주차마다 `opensAt: '2026-10-19'`처럼 날짜를 넣으면 그날 0시(한국 시간)에 자동으로 열립니다.
대표님 계정은 날짜 전에도 "미리보기"로 해 볼 수 있습니다.

## 8. Claude Code로 이어서 작업
저장소를 Claude Code에서 열면 `CLAUDE.md`를 읽고 맥락을 이어받습니다.
첫 요청 예시: "3주차 암호는 ○○야. 3주차 스테이지를 만들어 줘."

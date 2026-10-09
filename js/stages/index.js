// 시즌1 '부엌문 편' 12회차.
// open: 스테이지가 완성되고 영상 암호까지 정해졌으면 true (load만 있고 open: false면 만드는 중)
// opensAt: 기본 공개 날짜(한국 시간 0시). 매주 월·목 공개 일정 (3회차 2026-10-12 시작)
//   대표님이 대시보드 "회차 설정"에서 날짜를 바꾸면 그 날짜(stage_settings)가 우선함
// 대표님(관리자) 계정은 공개 날짜 전에도 미리 해 볼 수 있음
export const TEAM_GOAL_ID = 's1-kitchen';
export const CLUE_TOTAL = 12;

export const SEASON1 = [
  { id: 's1-w01', week: 1, title: '휴게소 첫날, 레시피 3배로!', subject: '수학: 곱셈', open: true, load: () => import('./s1-w01.js') },
  { id: 's1-w02', week: 2, title: '냉동고의 빈 병', subject: '과학: 물질의 상태', open: true, load: () => import('./s1-w02.js') },
  { id: 's1-w03', week: 3, title: '쿠키 공평하게 나누기', subject: '수학: 나눗셈', opensAt: '2026-10-12', open: true, load: () => import('./s1-w03.js') },
  { id: 's1-w04', week: 4, title: '주방 소리 추리', subject: '과학: 소리', opensAt: '2026-10-15', open: false },
  { id: 's1-w05', week: 5, title: '완벽한 팬케이크의 비밀', subject: '수학: 원', opensAt: '2026-10-19', open: false },
  { id: 's1-w06', week: 6, title: '중간 미션: 메뉴 가격표', subject: '통합: 수학과 경제', opensAt: '2026-10-22', open: false, load: () => import('./s1-w06.js') },
  { id: 's1-w07', week: 7, title: '피자 조각 싸움', subject: '수학: 분수', opensAt: '2026-10-26', open: false },
  { id: 's1-w08', week: 8, title: '동물 손님의 주문서', subject: '과학: 동물의 생활', opensAt: '2026-10-29', open: false },
  { id: 's1-w09', week: 9, title: '계량컵이 거짓말을?', subject: '수학: 들이와 무게', opensAt: '2026-11-02', open: false },
  { id: 's1-w10', week: 10, title: '초코 케이크 흙 실험', subject: '과학: 지표의 변화', opensAt: '2026-11-05', open: false },
  { id: 's1-w11', week: 11, title: '손님 주문 그래프', subject: '수학: 자료의 정리', opensAt: '2026-11-09', open: false },
  { id: 's1-w12', week: 12, title: '피날레: 잠긴 방 열기', subject: '통합: 시즌 복습', opensAt: '2026-11-12', open: false, load: () => import('./s1-w12.js') },
];

// 실제 공개 날짜: 대시보드 설정이 있으면 그것, 없으면 기본 일정
export const opensDate = (s, settings = {}) => settings[s.id]?.opens_at || s.opensAt || '';

// 공개 날짜를 한국 시간 0시 기준으로 비교
const opensTime = (date) => (date ? new Date(`${date}T00:00:00+09:00`).getTime() : 0);

// 'open'(아이들도 가능) / 'preview'(날짜 전, 관리자만) / 'soon'(날짜 전) / 'locked'(아직 안 만듦)
export function stageStatus(s, { isAdmin = false, now = Date.now(), settings = {} } = {}) {
  if (!s.open || !s.load) return 'locked';
  if (now >= opensTime(opensDate(s, settings))) return 'open';
  return isAdmin ? 'preview' : 'soon';
}

// 예: '10월 19일 공개'
export const opensLabel = (s, settings = {}) => {
  const date = opensDate(s, settings);
  if (!date) return '';
  const [, m, d] = date.split('-').map(Number);
  return `${m}월 ${d}일 공개`;
};

// 시즌1 '부엌문 편' 12회차.
// open: 스테이지 파일이 완성됐으면 true + load 연결
// opensAt: 공개 날짜(한국 시간). 이 날짜가 되면 아이들에게 자동으로 열림. 비워 두면 바로 공개
//   예) opensAt: '2026-10-19'
// 대표님(관리자) 계정은 공개 날짜 전에도 미리 해 볼 수 있음
export const TEAM_GOAL_ID = 's1-kitchen';
export const CLUE_TOTAL = 12;

export const SEASON1 = [
  { id: 's1-w01', week: 1, title: '휴게소 첫날, 레시피 3배로!', subject: '수학: 곱셈', open: true, load: () => import('./s1-w01.js') },
  { id: 's1-w02', week: 2, title: '냉동고의 빈 병', subject: '과학: 물질의 상태', open: true, load: () => import('./s1-w02.js') },
  { id: 's1-w03', week: 3, title: '쿠키 공평하게 나누기', subject: '수학: 나눗셈', open: false },
  { id: 's1-w04', week: 4, title: '주방 소리 추리', subject: '과학: 소리', open: false },
  { id: 's1-w05', week: 5, title: '완벽한 팬케이크의 비밀', subject: '수학: 원', open: false },
  { id: 's1-w06', week: 6, title: '중간 미션: 메뉴 가격표', subject: '통합: 수학과 경제', open: false },
  { id: 's1-w07', week: 7, title: '피자 조각 싸움', subject: '수학: 분수', open: false },
  { id: 's1-w08', week: 8, title: '동물 손님의 주문서', subject: '과학: 동물의 생활', open: false },
  { id: 's1-w09', week: 9, title: '계량컵이 거짓말을?', subject: '수학: 들이와 무게', open: false },
  { id: 's1-w10', week: 10, title: '초코 케이크 흙 실험', subject: '과학: 지표의 변화', open: false },
  { id: 's1-w11', week: 11, title: '손님 주문 그래프', subject: '수학: 자료의 정리', open: false },
  { id: 's1-w12', week: 12, title: '피날레: 잠긴 방 열기', subject: '통합: 시즌 복습', open: false },
];

// 공개 날짜를 한국 시간 0시 기준으로 비교
const opensTime = (s) => (s.opensAt ? new Date(`${s.opensAt}T00:00:00+09:00`).getTime() : 0);

// 'open'(아이들도 가능) / 'preview'(날짜 전, 관리자만) / 'soon'(날짜 전) / 'locked'(아직 안 만듦)
export function stageStatus(s, { isAdmin = false, now = Date.now() } = {}) {
  if (!s.open || !s.load) return 'locked';
  if (now >= opensTime(s)) return 'open';
  return isAdmin ? 'preview' : 'soon';
}

// 예: '10월 19일 공개'
export const opensLabel = (s) => {
  if (!s.opensAt) return '';
  const [, m, d] = s.opensAt.split('-').map(Number);
  return `${m}월 ${d}일 공개`;
};

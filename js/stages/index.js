// 시즌1 '부엌문 편' 12주. 새 주차를 공개할 때 open을 true로 바꾸고 load를 연결합니다.
export const TEAM_GOAL_ID = 's1-kitchen';
export const CLUE_TOTAL = 12;

export const SEASON1 = [
  { id: 's1-w01', week: 1, title: '휴게소 첫날, 레시피 3배로!', subject: '수학: 곱셈', open: true, load: () => import('./s1-w01.js') },
  { id: 's1-w02', week: 2, title: '냉동고의 사라진 얼음', subject: '과학: 물질의 상태', open: false },
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

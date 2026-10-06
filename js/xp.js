import { CONFIG } from './config.js';

// 칭호 (supabase/05_server_xp.sql의 title_for와 같게 유지)
export const TITLES = [
  '새내기 손님', '단골 손님', '견습 알바', '매점 조수',
  '주방 보조', '휴게소 탐정', '수석 탐정', '휴게소의 전설',
];

// 경험치 규칙 (CLAUDE.md의 XP 표, supabase/05_server_xp.sql과 같게 유지)
// 실제 모드에서는 서버 함수가 경험치를 계산하고, 여기 값은 체험 모드와 화면 표시에 씀
export const XP = { clear: 100, no_hint: 50, bonus: 30, clue: 20, review: 40, team: 10 };

export const XP_LABEL = {
  clear: '주문 완료',
  no_hint: '힌트 없이 해결',
  bonus: '숨은 주문 해결',
  clue: '영상 단서 발견',
  review: '복습 퀴즈 정답',
  team: '공동 목표에 보탬',
};

export const levelFor = (xp) => 1 + Math.floor(xp / CONFIG.XP_PER_LEVEL);
export const titleFor = (level) => TITLES[Math.min(level - 1, TITLES.length - 1)];
export const levelProgress = (xp) => (xp % CONFIG.XP_PER_LEVEL) / CONFIG.XP_PER_LEVEL;

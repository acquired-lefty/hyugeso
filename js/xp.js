import { CONFIG } from './config.js';

export const TITLES = [
  '새내기 손님', '단골 손님', '견습 알바', '매점 조수',
  '주방 보조', '휴게소 탐정', '수석 탐정', '휴게소의 전설',
];

// 경험치 규칙 (CLAUDE.md의 XP 표와 같게 유지)
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

// entries: [{ source, stageId }] → 경험치 기록 후 프로필 갱신
export async function grantXp(store, profile, entries) {
  const rows = entries.map((e) => ({ ...e, amount: XP[e.source] }));
  const gained = rows.reduce((sum, r) => sum + r.amount, 0);
  if (!gained) return { gained: 0, rows, levelUp: false, profile };
  await store.logXp(rows);
  const xp = profile.xp + gained;
  const level = levelFor(xp);
  const title = titleFor(level);
  await store.updateProfile({ xp, level, title });
  return { gained, rows, levelUp: level > profile.level, profile: { ...profile, xp, level, title } };
}

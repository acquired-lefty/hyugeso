// 오리지널 캐릭터 트리오 (CLAUDE.md '캐릭터' 항목 참고)
const INK = '#1A1F33';

const INNER = {
  kkam: `
    <rect x="14" y="10" width="52" height="80" rx="26" fill="#FBF6EC" stroke="${INK}" stroke-width="3"/>
    <g class="eyes"><path d="M27 40 a5 5 0 0 0 10 0z" fill="${INK}"/><path d="M45 40 a5 5 0 0 0 10 0z" fill="${INK}"/></g>
    <path d="M25 39h14M43 39h14" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M37 52q4 3 9-1" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M22 60h36v22q0 6-6 6H28q-6 0-6-6z" fill="#F2A93B" stroke="${INK}" stroke-width="3"/>`,
  tipo: `
    <path d="M15 56q-13-1-11 13q2 10 13 8" fill="none" stroke="${INK}" stroke-width="3"/>
    <path d="M62 64L77 44" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
    <path d="M62 64L77 44" stroke="#8ED8C9" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="40" cy="65" rx="28" ry="24" fill="#8ED8C9" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="40" cy="41" rx="16" ry="5" fill="#8ED8C9" stroke="${INK}" stroke-width="3"/>
    <rect x="28" y="36" width="24" height="3" fill="${INK}"/>
    <rect x="33" y="22" width="14" height="15" rx="2" fill="${INK}"/>
    <path d="M28 61h8M44 61h8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M37 73h6" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`,
  ddal: `
    <rect x="16" y="8" width="48" height="86" rx="4" fill="#3B57A6" stroke="${INK}" stroke-width="3"/>
    <rect x="22" y="16" width="36" height="26" rx="2" fill="#8ED8C9" stroke="${INK}" stroke-width="2"/>
    <path d="M29 27h6M45 27h6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M35 35h10" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="22" y="48" width="24" height="30" fill="#27345C" stroke="${INK}" stroke-width="2"/>
    <circle cx="29" cy="56" r="3" fill="#F2A93B"/><circle cx="39" cy="56" r="3" fill="#E5658F"/>
    <circle cx="29" cy="69" r="3" fill="#8ED8C9"/><circle cx="39" cy="69" r="3" fill="#F2A93B"/>
    <rect x="51" y="50" width="6" height="12" rx="1" fill="#FBF6EC"/>
    <rect x="24" y="83" width="32" height="6" fill="#0F1630"/>`,
};

export const CHAR_NAME = { kkam: '규리사', tipo: '티포', ddal: '자판남' };

// 각 캐릭터의 웃음소리 (대본·게임 공통)
export const LAUGH = { kkam: '푸흡.', tipo: '쉬이익— not bad.', ddal: '딸깍, 딸깍. 정확합니다만.' };

// 화면 공통 대사 (그 회차 진행 캐릭터가 말함: 들어가기·힌트·결과·암호·복습)
export const LINES = {
  kkam: {
    offer: '힌트를 봐도 괜찮은 거지.', noMore: '힌트는 다 말한 거지. 이제 네 차례.', notIt: '음… 그건 아닌 거지.',
    tooMany: '음… 너무 많은 거지.', tooFew: '음… 조금 모자란 거지.', typeFirst: '숫자를 먼저 눌러 주는 거지.', right: '기억하고 있는 거지.',
    retry: '다시 해 본 거지. 경험치는 처음 한 번만 주는 거지. 그래도 연습은 남는 거지.',
    findClue: '영상에서 암호를 찾았다면 입력해 보는 거지.',
    clueWrong: '음… 그 암호는 아닌 거지. 영상을 다시 보고 와도 되는 거지.',
    clueGot: (xp) => `푸흡. 단서 카드 획득. 경험치 +${xp}인 거지.`, clueHave: '이미 가진 단서인 거지.', clueAlready: '이 단서는 이미 도감에 있는 거지.',
    reviewIntro: (w) => `${w}회차 복습인 거지. 천천히 생각해도 되는 거지.`,
    reviewOk: (xp) => `푸흡. 기억하고 있는 거지. 경험치 +${xp}.`, reviewAgain: '한 번 더. 힌트를 봐도 괜찮은 거지.',
    reviewEnd: '괜찮은 거지. 복습은 잊은 걸 다시 꺼내 보는 연습인 거지.', practiceAgain: '연습으로 한 번 더 푸는 거지.',
    practiceOk: '맞는 거지. 연습이라 경험치는 없는 거지.', pickFirst: '답을 먼저 골라 주는 거지.',
  },
  tipo: {
    offer: '힌트 봐도 돼. Okay?', noMore: '힌트는 다 말했어. 이제 네 차례.', notIt: '음… 그건 아니야.',
    tooMany: '음… 너무 많아.', tooFew: '음… 모자라.', typeFirst: '숫자부터 눌러.', right: 'Perfect.',
    retry: '다시 해 봤네. 경험치는 처음 한 번만. 그래도 연습은 not bad.',
    findClue: '영상에서 암호 찾았으면 입력해. Okay?',
    clueWrong: '음… 그 암호는 아니야. 영상 다시 보고 와.',
    clueGot: (xp) => `쉬이익— 단서 카드 획득. 경험치 +${xp}. Perfect.`, clueHave: '이미 가진 단서야.', clueAlready: '이 단서는 이미 도감에 있어.',
    reviewIntro: (w) => `${w}회차 복습. 천천히. Okay?`,
    reviewOk: (xp) => `쉬이익— 기억하고 있네. 경험치 +${xp}.`, reviewAgain: '한 번 더. 힌트 봐도 돼.',
    reviewEnd: '괜찮아. 복습은 잊은 걸 다시 꺼내는 연습이야.', practiceAgain: '연습으로 한 번 더. Okay.',
    practiceOk: '맞아. 연습이라 경험치는 없어.', pickFirst: '답부터 골라.',
  },
  ddal: {
    offer: '힌트를 봐도 괜찮습니다만.', noMore: '힌트는 다 말했습니다만. 이제 차례입니다만.', notIt: '음… 그건 아닌 것 같습니다만.',
    tooMany: '음… 너무 많습니다만.', tooFew: '음… 조금 모자랍니다만.', typeFirst: '숫자를 먼저 눌러 주셔야 합니다만.', right: '기억하고 있습니다만.',
    retry: '다시 하셨습니다만. 경험치는 처음 한 번만 드립니다만. 연습은 남습니다만.',
    findClue: '영상에서 암호를 찾으셨다면 입력하시면 됩니다만.',
    clueWrong: '음… 그 암호는 아닙니다만. 영상을 다시 보고 오셔도 됩니다만.',
    clueGot: (xp) => `딸깍, 딸깍. 단서 카드 획득입니다만. 경험치 +${xp}.`, clueHave: '이미 가진 단서입니다만.', clueAlready: '이 단서는 이미 도감에 있습니다만.',
    reviewIntro: (w) => `${w}회차 복습입니다만. 천천히 생각하셔도 됩니다만.`,
    reviewOk: (xp) => `딸깍, 딸깍. 기억하고 계십니다만. 경험치 +${xp}.`, reviewAgain: '한 번 더입니다만. 힌트를 봐도 괜찮습니다만.',
    reviewEnd: '괜찮습니다만. 복습은 잊은 걸 다시 꺼내는 연습입니다만.', practiceAgain: '연습으로 한 번 더 풉니다만.',
    practiceOk: '맞습니다만. 연습이라 경험치는 없습니다만.', pickFirst: '답을 먼저 골라 주셔야 합니다만.',
  },
};

export const charSvg = (key, cls = '') =>
  `<svg viewBox="0 0 80 100" class="char char-${key} ${cls}" aria-hidden="true">${INNER[key]}</svg>`;

// 장면 SVG 안에 넣을 때 사용
export const charNested = (key, x, y, w) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${w * 1.25}" viewBox="0 0 80 100" class="char char-${key}">${INNER[key]}</svg>`;

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

export const charSvg = (key, cls = '') =>
  `<svg viewBox="0 0 80 100" class="char char-${key} ${cls}" aria-hidden="true">${INNER[key]}</svg>`;

// 장면 SVG 안에 넣을 때 사용
export const charNested = (key, x, y, w) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${w * 1.25}" viewBox="0 0 80 100" class="char char-${key}">${INNER[key]}</svg>`;

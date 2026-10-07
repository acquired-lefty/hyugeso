// 아바타: 사진 대신 그림 조합 (CLAUDE.md 개인정보 원칙: 사진 수집 금지)
// 저장 형태: { base, color, eyes, acc } — profiles.avatar(jsonb)에 그대로 저장

export const AVATAR_PARTS = {
  base: [
    { id: 'round', name: '동글' },
    { id: 'can', name: '통통' },
    { id: 'drop', name: '물방울' },
    { id: 'cloud', name: '구름' },
  ],
  color: [
    { id: 'sodium', name: '노랑', hex: '#F2A93B' },
    { id: 'mint', name: '민트', hex: '#8ED8C9' },
    { id: 'neon', name: '분홍', hex: '#E5658F' },
    { id: 'machine', name: '파랑', hex: '#6F8DE0' },
    { id: 'kraft', name: '갈색', hex: '#C9A574' },
    { id: 'paper', name: '하양', hex: '#FBF6EC' },
  ],
  eyes: [
    { id: 'dot', name: '점 눈' },
    { id: 'sleepy', name: '졸린 눈' },
    { id: 'smile', name: '웃는 눈' },
    { id: 'glasses', name: '안경' },
  ],
  acc: [
    { id: 'none', name: '없음' },
    { id: 'chef', name: '요리사 모자' },
    { id: 'cap', name: '모자' },
    { id: 'bow', name: '리본' },
    { id: 'leaf', name: '새싹' },
  ],
};

const valid = (part, id) => AVATAR_PARTS[part].some((o) => o.id === id);

// 저장된 값이 없거나 이상하면 아이디로 정해지는 기본 아바타
export function normalizeAvatar(a, seed = '') {
  const n = [...String(seed)].reduce((s, c) => s + c.charCodeAt(0), 0);
  const pick = (part, i) => AVATAR_PARTS[part][(n + i) % AVATAR_PARTS[part].length].id;
  const out = {};
  ['base', 'color', 'eyes', 'acc'].forEach((part, i) => {
    out[part] = a && valid(part, a[part]) ? a[part] : (part === 'acc' ? 'none' : pick(part, i));
  });
  return out;
}

const BODY = {
  round: '<circle cx="50" cy="56" r="34"/>',
  can: '<rect x="20" y="22" width="60" height="68" rx="16"/>',
  drop: '<path d="M50 14C66 34 84 46 84 64a34 34 0 0 1-68 0c0-18 18-30 34-50z"/>',
  cloud: '<path d="M26 86a18 18 0 0 1-4-35 22 22 0 0 1 40-16 18 18 0 0 1 22 22 16 16 0 0 1-6 29z"/>',
};

const EYES = {
  dot: '<circle cx="40" cy="56" r="4"/><circle cx="60" cy="56" r="4"/>',
  sleepy: '<path d="M33 56h14M53 56h14" stroke-width="4" stroke-linecap="round"/>',
  smile: '<path d="M34 58q6-8 12 0M54 58q6-8 12 0" stroke-width="4" fill="none" stroke-linecap="round"/>',
  glasses: '<circle cx="40" cy="56" r="8" fill="none" stroke-width="3"/><circle cx="60" cy="56" r="8" fill="none" stroke-width="3"/><path d="M48 56h4" stroke-width="3"/><circle cx="40" cy="56" r="2.5"/><circle cx="60" cy="56" r="2.5"/>',
};

const ACC = {
  none: '',
  chef: '<path d="M32 26a10 10 0 0 1 8-14 12 12 0 0 1 20 0 10 10 0 0 1 8 14z" fill="#FBF6EC" stroke="#1A1F33" stroke-width="2.5"/><rect x="34" y="24" width="32" height="8" rx="2" fill="#FBF6EC" stroke="#1A1F33" stroke-width="2.5"/>',
  cap: '<path d="M28 30a22 14 0 0 1 44 0z" fill="#3B57A6" stroke="#1A1F33" stroke-width="2.5"/><path d="M66 30h16" stroke="#3B57A6" stroke-width="5" stroke-linecap="round"/>',
  bow: '<path d="M50 24l-14-8v16zM50 24l14-8v16z" fill="#E5658F" stroke="#1A1F33" stroke-width="2.5"/><circle cx="50" cy="24" r="4" fill="#E5658F" stroke="#1A1F33" stroke-width="2.5"/>',
  leaf: '<path d="M50 24v-10" stroke="#3E8F82" stroke-width="3"/><path d="M50 16c-4-8-14-8-16-4 4 6 12 6 16 4zM50 14c4-8 14-8 16-4-4 6-12 6-16 4z" fill="#8ED8C9" stroke="#3E8F82" stroke-width="2"/>',
};

export function avatarSvg(a, { size = 48, label = '' } = {}) {
  const v = normalizeAvatar(a);
  const fill = AVATAR_PARTS.color.find((c) => c.id === v.color).hex;
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" class="avatar-svg" role="img" aria-label="${label || '아바타'}">
    <g fill="${fill}" stroke="#1A1F33" stroke-width="3">${BODY[v.base]}</g>
    <g fill="#1A1F33" stroke="#1A1F33">${EYES[v.eyes]}</g>
    <path d="M44 70q6 5 12 0" fill="none" stroke="#1A1F33" stroke-width="3" stroke-linecap="round"/>
    ${ACC[v.acc]}
  </svg>`;
}

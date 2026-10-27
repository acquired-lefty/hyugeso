// 단순한 동물 그림 (SVG, 64×64). 8회차 칸 나누기에서 사용. 실제 사진·캐릭터를 닮게 그리지 않는다.
const svg = (label, body) => `<svg viewBox="0 0 64 64" role="img" aria-label="${label}">${body}</svg>`;

export const ANIMAL_ART = {
  두더지: svg('두더지 그림', `
    <ellipse cx="32" cy="38" rx="22" ry="14" fill="#4A3F3A"/>
    <ellipse cx="51" cy="38" rx="6" ry="4" fill="#E8A0A8"/>
    <circle cx="44" cy="33" r="1.8" fill="#111"/>
    <path d="M14 48l-4 6M20 50l-2 6M44 50l2 6M48 48l5 5" stroke="#E8A0A8" stroke-width="3" stroke-linecap="round"/>`),
  개미: svg('개미 그림', `
    <circle cx="16" cy="34" r="7" fill="#3A2A22"/>
    <circle cx="30" cy="34" r="6" fill="#3A2A22"/>
    <ellipse cx="46" cy="34" rx="10" ry="8" fill="#3A2A22"/>
    <path d="M24 38l-6 12M30 40v12M36 38l6 12M24 30l-6-10M30 28v-10M36 30l6-10" stroke="#3A2A22" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12 28l-4-8M18 27l2-9" stroke="#3A2A22" stroke-width="2" stroke-linecap="round"/>`),
  붕어: svg('붕어 그림', `
    <ellipse cx="30" cy="32" rx="20" ry="12" fill="#C9A24A"/>
    <path d="M48 32l12-10v20z" fill="#B08A36"/>
    <path d="M28 20q6-6 12 0" fill="#B08A36"/>
    <circle cx="18" cy="29" r="2.5" fill="#111"/>`),
  고등어: svg('고등어 그림', `
    <ellipse cx="30" cy="32" rx="22" ry="9" fill="#9FB7C9"/>
    <path d="M14 26q6 3 0 6M22 25q6 3 0 6M30 25q6 3 0 6M38 26q6 3 0 6" stroke="#2F4F6B" stroke-width="2" fill="none"/>
    <path d="M50 32l11-9v18z" fill="#2F4F6B"/>
    <circle cx="13" cy="31" r="2.2" fill="#111"/>`),
  낙타: svg('낙타 그림', `
    <path d="M10 40q2-14 14-14q6-10 12 0q8-6 14 4v10z" fill="#C99A5B"/>
    <path d="M48 32l6-14h5v6l-5 2-2 8z" fill="#C99A5B"/>
    <circle cx="57" cy="20" r="1.4" fill="#111"/>
    <path d="M16 40v16M24 40v16M40 40v16M48 40v16" stroke="#A97B42" stroke-width="4" stroke-linecap="round"/>`),
  사막여우: svg('사막여우 그림', `
    <path d="M14 30L8 4l18 18z" fill="#E8C089"/><path d="M50 30l6-26-18 18z" fill="#E8C089"/>
    <path d="M14 28L11 10l11 12z" fill="#F4D9C0"/><path d="M50 28l3-18-11 12z" fill="#F4D9C0"/>
    <ellipse cx="32" cy="38" rx="18" ry="15" fill="#E8C089"/>
    <path d="M24 44q8 10 16 0z" fill="#FBF6EC"/>
    <circle cx="25" cy="36" r="2.2" fill="#111"/><circle cx="39" cy="36" r="2.2" fill="#111"/>
    <circle cx="32" cy="45" r="2.2" fill="#111"/>`),
};

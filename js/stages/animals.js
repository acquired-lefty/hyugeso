// 동물 그림 (SVG, 64×64). 8회차 칸 나누기에서 사용. 실제 사진·다른 작품의 캐릭터를 닮게 그리지 않는다.
// 공통 그림체: 진한 갈색 테두리, 밝은 면·그림자 두 단계, 눈에 흰 반짝임.
const LINE = '#3A2A22';
const svg = (label, body) => `<svg viewBox="0 0 64 64" role="img" aria-label="${label}">
  <g stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
const eye = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${LINE}" stroke="none"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff" stroke="none"/>`;

export const ANIMAL_ART = {
  // 흙 둔덕 위의 두더지: 벨벳 같은 몸, 분홍 코, 넓적한 앞발
  두더지: svg('두더지 그림', `
    <path d="M4 56q28-10 56 0v4H4z" fill="#A9784C"/>
    <circle cx="14" cy="57" r="1.4" fill="#7E5634" stroke="none"/><circle cx="46" cy="58" r="1.2" fill="#7E5634" stroke="none"/>
    <path d="M8 44q0-18 22-20q20 0 26 12q2 6-2 10q-8 6-26 6q-20 0-20-8z" fill="#5A4C47"/>
    <path d="M14 42q4-12 18-14" fill="none" stroke="#7A6A64" stroke-width="2.4"/>
    <path d="M8 44q-4 2-6 0" fill="none"/>
    <path d="M54 37q8 0 8 4t-8 3z" fill="#EFA3AE"/>
    <circle cx="61" cy="40.5" r="1" fill="#C96A79" stroke="none"/>
    ${eye(48, 35, 1.3)}
    <path d="M30 50q-4 6 2 8q4-1 4-6M42 49q-2 6 3 8q4-1 3-7" fill="#EFA3AE"/>
    <path d="M30 56l-2 2M33 57v2M44 56l-1 2M47 56l1 2" fill="none" stroke-width="1.2"/>`),

  // 옆에서 본 개미: 머리·가슴·배 세 부분, 다리 6개, 꺾인 더듬이
  개미: svg('개미 그림', `
    <path d="M24 36l-6 10-4 2M27 37l-1 12-3 3M31 36l5 10 4 1" fill="none" stroke-width="1.8"/>
    <path d="M24 31l-5-8-4-1M28 30l1-9 3-3M31 31l6-7 4 0" fill="none" stroke-width="1.8"/>
    <ellipse cx="46" cy="33" rx="13" ry="10" fill="#6B3A24"/>
    <path d="M38 28q8-5 16 0" fill="none" stroke="#9A5A38" stroke-width="2.4"/>
    <ellipse cx="28" cy="33" rx="6" ry="4.5" fill="#6B3A24"/>
    <circle cx="35" cy="33" r="1.8" fill="#6B3A24"/>
    <circle cx="14" cy="31" r="7" fill="#6B3A24"/>
    <path d="M10 26q2-3 5-3" fill="none" stroke="#9A5A38" stroke-width="2"/>
    ${eye(11, 30, 1.6)}
    <path d="M12 25l-2-9 5-5M16 25l2-9 5-3" fill="none" stroke-width="1.6"/>
    <path d="M8 35q2 2 4 1" fill="none" stroke-width="1.2"/>`),

  // 붕어: 몸이 높고 둥근 민물고기, 비늘 무늬, 긴 등지느러미
  붕어: svg('붕어 그림', `
    <path d="M48 32l12-11q2 11 0 22z" fill="#B88A35"/>
    <path d="M18 22q10-10 24-4l-4 6z" fill="#B88A35"/>
    <path d="M6 32q4-14 22-15q16 0 22 15q-6 15-22 15q-18-1-22-15z" fill="#D9A93F"/>
    <path d="M12 38q14 8 30 2" fill="none" stroke="#F2D27A" stroke-width="3"/>
    <g fill="none" stroke="#A97A2A" stroke-width="1.1">
      <path d="M24 26q3 3 0 6M30 25q3 3 0 6M36 26q3 3 0 6M27 32q3 3 0 6M33 32q3 3 0 6M39 32q3 3 0 6"/>
    </g>
    <path d="M20 26q-3 6 0 12" fill="none" stroke-width="1.3"/>
    <path d="M28 44q2 6 8 5" fill="#B88A35"/>
    ${eye(13, 29)}
    <path d="M6 33q2 1 3 0" fill="none" stroke-width="1.2"/>`),

  // 고등어: 날씬한 바닷물고기, 등에 물결무늬, 은빛 배, 깊게 갈라진 꼬리
  고등어: svg('고등어 그림', `
    <path d="M50 32l11-10-3 10 3 10z" fill="#2F5A78"/>
    <path d="M4 32q8-10 26-10q16 0 22 10q-6 10-22 10q-18 0-26-10z" fill="#CFD9E0"/>
    <path d="M4 32q8-10 26-10q16 0 22 10z" fill="#4E86A8"/>
    <g fill="none" stroke="#1F3D55" stroke-width="1.6">
      <path d="M16 25q3 3 0 6M22 24q3 3 0 6M28 24q3 3 0 6M34 24q3 3 0 6M40 25q3 3 0 6"/>
    </g>
    <path d="M28 22l4-5 4 5" fill="#2F5A78"/>
    <path d="M44 25l2-2M46 27l2-2" fill="none" stroke-width="1.2"/>
    <path d="M14 32h30" fill="none" stroke="#9FB3C2" stroke-width="1"/>
    ${eye(11, 30, 2)}`),

  // 단봉낙타: 등에 혹 하나, 긴 목, 무릎이 굵은 긴 다리
  낙타: svg('낙타 그림', `
    <path d="M16 40v18M22 41v17M38 41v17M44 40v18" fill="none" stroke="${LINE}" stroke-width="5"/>
    <path d="M16 40v18M22 41v17M38 41v17M44 40v18" fill="none" stroke="#C99A5B" stroke-width="3"/>
    <path d="M10 38q0-8 10-10q4-14 14-12q8 2 10 12q6 0 8 4v8q-6 4-20 4q-16 0-22-6z" fill="#D9AE6E"/>
    <path d="M24 24q6-8 12-2" fill="none" stroke="#EBC88F" stroke-width="2.4"/>
    <path d="M46 34q4-2 6-10q2-8 6-9q4 0 4 4l-2 3q-4 0-5 6q-1 8-5 10z" fill="#D9AE6E"/>
    <path d="M56 16q2-3 4-1" fill="none"/>
    ${eye(58, 18, 1.2)}
    <path d="M62 21q-1 1-2 0" fill="none" stroke-width="1.1"/>
    <path d="M10 36q-4 2-5 8" fill="none" stroke-width="1.6"/>
    <path d="M16 58h-2M22 58h-2M38 58h-2M44 58h-2" fill="none" stroke-width="2"/>`),

  // 사막여우 얼굴: 아주 큰 귀, 크림색 얼굴, 까만 코
  사막여우: svg('사막여우 그림', `
    <path d="M18 34L6 4q14 4 22 20z" fill="#E7BC80"/>
    <path d="M46 34L58 4q-14 4-22 20z" fill="#E7BC80"/>
    <path d="M18 30L10 9q10 4 15 15z" fill="#F6CFC4" stroke="none"/>
    <path d="M46 30l8-21q-10 4-15 15z" fill="#F6CFC4" stroke="none"/>
    <path d="M12 36q2-14 20-14t20 14q-2 16-20 20q-18-4-20-20z" fill="#EBC48C"/>
    <ellipse cx="32" cy="48" rx="10" ry="7" fill="#FBF3E4" stroke="none"/>
    <path d="M24 30q-2 3 0 5M40 30q2 3 0 5" fill="none" stroke="#C99A5B" stroke-width="1.4"/>
    ${eye(24, 39, 2.6)}${eye(40, 39, 2.6)}
    <path d="M29 46q3-2 6 0q-3 4-6 0z" fill="${LINE}"/>
    <path d="M32 48v3M32 51q-3 2-5 0M32 51q3 2 5 0" fill="none" stroke-width="1.2"/>
    <circle cx="22" cy="47" r=".8" fill="${LINE}" stroke="none"/><circle cx="42" cy="47" r=".8" fill="${LINE}" stroke="none"/>`),
};

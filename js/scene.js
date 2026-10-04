import { charNested } from './characters.js';

const lock = (x, y) => `
  <g transform="translate(${x} ${y})" class="lock">
    <path d="M4 9V5a6 6 0 0 1 12 0v4" fill="none" stroke="#8A93B8" stroke-width="3"/>
    <rect x="0" y="9" width="20" height="15" rx="3" fill="#8A93B8"/>
  </g>`;

// open: { kitchen: true, arcade: false, bus: false, basement: false }
export function sceneSvg(open) {
  const door = (key, label, body) => `
    <g data-door="${key}" class="door ${open[key] ? 'door-open' : 'door-locked'}"
       tabindex="0" role="button" aria-label="${label}${open[key] ? ', 열려 있음' : ', 잠겨 있음'}">${body}</g>`;

  return `
<svg viewBox="0 0 360 320" class="scene-svg" role="group" aria-label="밤의 휴게소">
  <rect width="360" height="320" fill="#1C2747"/>
  <g fill="#FBF6EC" opacity=".7">
    <circle cx="30" cy="30" r="1.5"/><circle cx="92" cy="54" r="1"/><circle cx="160" cy="22" r="1.5"/>
    <circle cx="214" cy="60" r="1"/><circle cx="252" cy="18" r="1"/><circle cx="340" cy="86" r="1.5"/>
  </g>
  <circle cx="306" cy="42" r="17" fill="#FBF6EC"/>
  <circle cx="314" cy="36" r="15" fill="#1C2747"/>

  <rect y="268" width="360" height="52" fill="#141C36"/>
  <path d="M0 296H360" stroke="#F2A93B" stroke-width="3" stroke-dasharray="18 14" opacity=".5"/>

  <rect x="20" y="130" width="240" height="138" fill="#27345C" stroke="#0F1630" stroke-width="3"/>
  <rect x="12" y="118" width="256" height="16" fill="#33427A"/>
  <path d="M70 116v4M210 116v4" stroke="#8A93B8" stroke-width="3"/>
  <rect x="40" y="78" width="200" height="38" rx="6" fill="#0F1630" stroke="#F2A93B" stroke-width="2"/>
  <text x="140" y="104" text-anchor="middle" class="sign">어딘가 <tspan class="flicker">수상한</tspan> 휴게소</text>

  ${door('kitchen', '부엌문', `
    <path d="M40 268L104 268L128 304L16 304Z" fill="#F2A93B" opacity=".16"/>
    <rect x="40" y="170" width="64" height="98" fill="#F2A93B" stroke="#0F1630" stroke-width="3"/>
    <rect x="48" y="180" width="48" height="32" fill="#FBF6EC" opacity=".85"/>
    <circle cx="94" cy="228" r="3.5" fill="#1A1F33"/>
    <text x="72" y="162" text-anchor="middle" class="door-label">부엌</text>`)}

  ${door('arcade', '오락실 문', `
    <rect x="150" y="170" width="64" height="98" fill="#1C2747" stroke="#E5658F" stroke-width="3" opacity=".75"/>
    <text x="182" y="162" text-anchor="middle" class="door-label neon">오락실</text>
    ${lock(172, 204)}`)}

  ${door('bus', '버스 승강장', `
    <rect x="300" y="152" width="6" height="116" fill="#8A93B8"/>
    <rect x="280" y="128" width="46" height="28" rx="4" fill="#3B57A6" stroke="#FBF6EC" stroke-width="2"/>
    <text x="303" y="147" text-anchor="middle" class="bus-label">승강장</text>
    ${lock(293, 176)}`)}

  ${door('basement', '지하로 가는 문', `
    <rect x="222" y="252" width="34" height="14" fill="#0F1630" stroke="#8A93B8" stroke-width="2"/>
    <text x="239" y="245" text-anchor="middle" class="door-label small">지하</text>`)}

  ${charNested('kkam', 108, 214, 40)}
</svg>`;
}

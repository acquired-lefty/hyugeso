import { charSvg, CHAR_NAME } from './characters.js';

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export function bubble(who, text) {
  return h('div', { class: `bubble bubble-${who}` },
    h('div', { class: 'bubble-face', html: charSvg(who) }),
    h('div', { class: 'bubble-body' },
      h('span', { class: 'bubble-name' }, CHAR_NAME[who]),
      h('p', {}, text)));
}

// 숫자·한글 끝소리에 맞춰 을/를, 이/가 등을 붙임
const DIGIT_HAS_FINAL = { 0: true, 1: true, 2: false, 3: true, 4: false, 5: false, 6: true, 7: true, 8: true, 9: false };
export function josa(word, withFinal, withoutFinal) {
  const s = String(word);
  const last = s[s.length - 1];
  let hasFinal;
  if (/[0-9]/.test(last)) hasFinal = DIGIT_HAS_FINAL[last];
  else {
    const code = s.charCodeAt(s.length - 1);
    hasFinal = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false;
  }
  return s + (hasFinal ? withFinal : withoutFinal);
}

export const normalize = (s) => String(s).replace(/\s+/g, '').toLowerCase();

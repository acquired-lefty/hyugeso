// 1주차: 휴게소 첫날, 레시피 3배로! (수학 3-2 곱셈)
// 레시피 1판의 양 × 주문 수만큼, 창고에서 100·10·1 단위 상자를 골라 담는다.
import { h, bubble, josa } from '../ui.js';
import { LAUGH } from '../characters.js';

const BOX_NAME = { 100: '통', 10: '봉지', 1: '낱개' };

const ROUNDS = [
  {
    who: 'kkam', dish: '팬케이크', dishUnit: '판', item: '달걀', unit: '개', per: 3, times: 4, boxes: [10, 1],
    line: '첫 손님이야. 팬케이크 4판 주문인 거지.',
    hints: ['1판에 3개. 4판이면 3을 4번 더하는 거지.', '3, 6, 9… 하나만 더 세어 보는 거지.'],
  },
  {
    who: 'tipo', dish: '쿠키', dishUnit: '판', item: '초코칩', unit: '개', per: 24, times: 3, boxes: [10, 1],
    line: '쿠키는 내 담당. 3판. 대충은 안 돼. 정확하게.',
    hints: ['24를 3번 더하는 거지.', '20×3 하고, 4×3 하고, 둘을 더하는 거지.'],
  },
  {
    who: 'ddal', dish: '젤리 화채', dishUnit: '그릇', item: '젤리', unit: '개', per: 128, times: 3, boxes: [100, 10, 1],
    line: '단체 손님입니다만. 젤리 화채 3그릇.',
    hints: ['128을 3번 더하는 거지.', '100×3, 20×3, 8×3을 따로 구해서 더하는 거지.'],
  },
];

const BONUS = {
  who: 'ddal', dish: '호떡', dishUnit: '접시', item: '호떡', unit: '개', per: 12, times: 15, boxes: [100, 10, 1],
  line: '…숨은 주문이 있습니다만. 호떡 15접시. 한 접시에 12개.',
  hints: ['12를 15번 더하면 너무 길지. 15를 10과 5로 나누는 거지.', '12×10은 120, 12×5는 60. 이제 더하는 거지.'],
};

export default {
  id: 's1-w01',
  conceptId: 'math-mul-01',
  clue: { id: 's1-w01', answer: '빠른덧셈', ask: '영상에서 깜빡이가 알려 준 창고 암호는?' },

  mount(root, { finish, exit }) {
    const stats = { attempts: 0, hints: 0, bonus: false };

    const header = (label) => h('header', { class: 'stage-head' },
      h('button', { class: 'link', onclick: exit }, '휴게소로'),
      h('span', { class: 'stage-step' }, label));

    function intro() {
      root.replaceChildren(h('section', { class: 'stage' },
        header('1주차'),
        h('h2', {}, '레시피 3배로!'),
        bubble('kkam', '어서 와. 오늘은 주문 준비인 거지. 레시피에 적힌 양에 주문 수를 곱해서, 창고에서 딱 맞게 꺼내 오면 되는 거지.'),
        h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => round(0) }, '창고 들어가기'))));
    }

    function play(r, label, onCorrect) {
      const target = r.per * r.times;
      const cart = Object.fromEntries(r.boxes.map((b) => [b, 0]));
      let wrongHere = 0;
      let hintStep = 0;

      const totalEl = h('strong', { class: 'total-num' }, '0');
      const cartEl = h('div', { class: 'cart-chips' });
      const talk = h('div', { class: 'talk' }, bubble(r.who, r.line));
      const hintBtn = h('button', { class: 'btn ghost', onclick: showHint }, '힌트 보기');
      const sendBtn = h('button', { class: 'btn primary', onclick: submit }, '주방으로 보내기');

      const total = () => r.boxes.reduce((s, b) => s + b * cart[b], 0);

      function refresh() {
        totalEl.textContent = total();
        cartEl.replaceChildren(...r.boxes.filter((b) => cart[b] > 0).map((b) =>
          h('button', {
            class: `chip chip-${b}`, 'aria-label': `${BOX_NAME[b]} 하나 빼기`,
            onclick: () => { cart[b] -= 1; refresh(); },
          }, `${BOX_NAME[b]} ×${cart[b]}`)));
        if (!cartEl.children.length) cartEl.append(h('span', { class: 'muted' }, '아직 비어 있어요'));
      }

      function say(who, text) { talk.replaceChildren(bubble(who, text)); }

      function showHint() {
        if (hintStep >= r.hints.length) { say('kkam', '힌트는 다 말한 거지. 이제 네 차례.'); return; }
        stats.hints += r === BONUS ? 0 : 1;
        say('kkam', r.hints[hintStep]);
        hintStep += 1;
      }

      function submit() {
        const t = total();
        if (t === 0) { say(r.who, '상자를 먼저 담아야 하는 거지.'); return; }
        stats.attempts += 1;
        if (t === target) {
          say(r.who, `${LAUGH[r.who]} ${r.item} ${target}${r.unit}, 딱 맞는 거지.`);
          sendBtn.replaceWith(h('button', { class: 'btn primary', onclick: onCorrect }, '다음으로'));
          hintBtn.disabled = true;
          shelf.querySelectorAll('button').forEach((b) => { b.disabled = true; });
          cartEl.querySelectorAll('button').forEach((b) => { b.disabled = true; });
          return;
        }
        wrongHere += 1;
        const msg = t > target ? '음… 너무 많은 거지. 상자가 넘쳐.' : '음… 조금 모자란 거지.';
        say(r.who, wrongHere >= 2 && hintStep === 0 ? `${msg} 힌트를 봐도 괜찮은 거지.` : msg);
      }

      const shelf = h('div', { class: 'shelf' }, ...r.boxes.map((b) =>
        h('button', {
          class: `box box-${b}`,
          onclick: () => { cart[b] += 1; refresh(); },
        }, h('span', { class: 'box-art' }), h('span', { class: 'box-label' }, `${b}${r.unit} ${BOX_NAME[b]}`))));

      root.replaceChildren(h('section', { class: 'stage' },
        header(label),
        talk,
        h('div', { class: 'order' },
          h('div', { class: 'recipe' },
            h('span', { class: 'tag' }, '레시피'),
            h('p', {}, `${r.dish} 1${r.dishUnit}`),
            h('p', { class: 'big' }, `${r.item} ${r.per}${r.unit}`)),
          h('div', { class: 'slip' },
            h('span', { class: 'tag' }, '주문서'),
            h('p', {}, r.dish),
            h('p', { class: 'big' }, `${r.times}${r.dishUnit}`))),
        h('p', { class: 'ask' }, `창고에서 ${josa(r.item, '을', '를')} 몇 ${r.unit} 꺼내야 할까?`),
        shelf,
        h('div', { class: 'cart' },
          h('div', { class: 'cart-total' }, h('span', {}, `담은 ${r.item}`), totalEl, h('span', {}, r.unit)),
          h('p', { class: 'muted small' }, '담은 상자를 누르면 하나씩 빠져요.'),
          cartEl),
        h('div', { class: 'actions' },
          h('button', { class: 'btn ghost', onclick: () => { r.boxes.forEach((b) => { cart[b] = 0; }); refresh(); } }, '비우기'),
          hintBtn, sendBtn)));
      refresh();
    }

    function round(i) {
      if (i >= ROUNDS.length) { bonusOffer(); return; }
      play(ROUNDS[i], `주문 ${i + 1} / ${ROUNDS.length}`, () => round(i + 1));
    }

    function bonusOffer() {
      root.replaceChildren(h('section', { class: 'stage' },
        header('숨은 주문'),
        bubble('ddal', '오늘 주문은 끝입니다만… 아직 하나 남았습니다만. 조금 어렵습니다만.'),
        h('div', { class: 'actions' },
          h('button', { class: 'btn ghost', onclick: done }, '오늘은 여기까지'),
          h('button', { class: 'btn primary', onclick: () => play(BONUS, '숨은 주문', () => { stats.bonus = true; done(); }) }, '도전하기'))));
    }

    function done() { finish({ ...stats }); }

    intro();
  },
};

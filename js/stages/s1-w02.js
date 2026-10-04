// 2주차: 냉동고의 사라진 얼음 (과학 3-2 물질의 상태)
// 냉동고·주방 물건을 고체·액체·기체 칸에 나눠 담는다.
import { h, bubble } from '../ui.js';
import { LAUGH } from '../characters.js';

const STATES = [
  { key: 'solid', name: '고체' },
  { key: 'liquid', name: '액체' },
  { key: 'gas', name: '기체' },
];
const NAME = Object.fromEntries(STATES.map((s) => [s.key, s.name]));

const ROUNDS = [
  {
    who: 'kkam', place: '냉동고',
    line: '얼음을 찾기 전에, 냉동고부터 정리하는 거지. 하나씩 칸을 골라 주는 거지.',
    items: [
      ['얼음', 'solid'], ['물', 'liquid'], ['숟가락', 'solid'],
      ['우유', 'liquid'], ['풍선 속 공기', 'gas'], ['냉동 만두', 'solid'],
    ],
    hints: [
      '고체는 모양이 그대로, 액체는 그릇에 따라 모양이 바뀌고, 기체는 퍼져서 눈에 잘 안 보이는 거지.',
      '컵에 하나씩 옮겨 담는다고 생각해 보는 거지. 모양이 그대로면 고체, 컵 모양이 되면 액체인 거지.',
    ],
  },
  {
    who: 'tipo', place: '주방 선반',
    line: '주방 선반도 엉망이야. 요리사는 재료 상태부터 알아야 해. 음… ready?',
    items: [
      ['버터', 'solid'], ['식용유', 'liquid'], ['소금', 'solid'],
      ['간장', 'liquid'], ['사이다 거품 속 기체', 'gas'], ['꿀', 'liquid'],
    ],
    hints: [
      '손으로 집었을 때 모양이 그대로인지, 흘러내리는지 떠올려 보는 거지.',
      '사이다 거품 속에는 눈에 안 보이는 게 들어 있는 거지. 풍선 속 공기랑 같은 무리인 거지.',
    ],
  },
  {
    who: 'ddal', place: '사라진 얼음 수첩',
    line: '사라진 얼음을 추적했습니다만. 얼음이 어떤 모습으로 바뀌었는지 나눠 주셨으면 합니다만.',
    items: [
      ['냉동고 밖에서 얼음이 녹은 것', 'liquid'], ['물을 얼려 만든 얼음', 'solid'], ['냄비에서 물이 끓어 생긴 수증기', 'gas'],
      ['녹아서 흐르는 아이스크림', 'liquid'], ['처마 끝 고드름', 'solid'], ['젖은 빨래에서 날아간 수증기', 'gas'],
    ],
    hints: [
      '얼음, 물, 수증기는 다 같은 물인 거지. 모습만 바뀐 거지.',
      '차가워서 굳어 있으면 고체, 녹아서 흐르면 액체, 날아가서 안 보이면 기체인 거지.',
    ],
  },
];

const BONUS = {
  who: 'ddal', place: '숨은 주문 창고',
  line: '…숨은 주문입니다만. 조금 헷갈리는 것만 모았습니다만.',
  items: [
    ['모래', 'solid'], ['밀가루', 'solid'], ['샴푸', 'liquid'],
    ['헬륨 풍선 속 헬륨', 'gas'], ['젤리', 'solid'], ['우유', 'liquid'],
  ],
  hints: [
    '가루는 부을 수 있지만, 알갱이 하나를 보면 모양이 그대로인 거지.',
    '샴푸와 우유는 병 모양을 따라가는 거지. 헬륨은 풍선 속에 퍼져 있는 거지.',
  ],
};

// 2주 후 복습 퀴즈 문제 (숫자로 답함)
const REVIEW = [
  { q: '얼음, 우유, 숟가락, 주스, 풍선 속 공기. 이 중 액체는 몇 개?', answer: 2, unit: '개',
    hints: ['액체는 담는 그릇에 따라 모양이 바뀌는 거지.', '하나씩 컵에 옮겨 담는다고 생각해 보는 거지. 컵 모양이 되는 건?'] },
  { q: '돌, 물, 연필, 식용유, 지우개, 꿀. 이 중 고체는 몇 개?', answer: 3, unit: '개',
    hints: ['고체는 어디에 담아도 모양이 그대로인 거지.', '손으로 집을 수 있고 흘러내리지 않는 걸 세어 보는 거지.'] },
  { q: '풍선 속 공기, 얼음, 자전거 바퀴 속 공기, 물, 수증기. 이 중 기체는 몇 개?', answer: 3, unit: '개',
    hints: ['기체는 퍼져서 눈에 잘 안 보이는 거지.', '공기와 수증기를 찾아서 세어 보는 거지.'] },
  { q: '냉동고에 고체 4개, 액체 2개가 있어. 고체 하나가 녹아서 액체가 됐어. 이제 액체는 몇 개?', answer: 3, unit: '개',
    hints: ['녹으면 고체가 액체로 바뀌는 거지.', '액체 2개에 녹은 것 하나가 더해지는 거지.'] },
];

export default {
  id: 's1-w02',
  conceptId: 'sci-state-01',
  review: REVIEW,
  clue: { id: 's1-w02', answer: '얼음', ask: '영상에서 알려 준 냉동고 암호는?' },

  mount(root, { finish, exit }) {
    const stats = { attempts: 0, hints: 0, bonus: false };

    const header = (label) => h('header', { class: 'stage-head' },
      h('button', { class: 'link', onclick: exit }, '휴게소로'),
      h('span', { class: 'stage-step' }, label));

    function intro() {
      root.replaceChildren(h('section', { class: 'stage' },
        header('2주차'),
        h('h2', {}, '냉동고의 사라진 얼음'),
        bubble('kkam', '…냉동고 얼음이 사라진 거지. 범인을 찾으려면 물건을 고체, 액체, 기체로 나눠 보는 게 먼저인 거지.'),
        h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => round(0) }, '냉동고 열기'))));
    }

    function play(r, label, onCorrect) {
      const picked = r.items.map(() => null);
      let wrongHere = 0;
      let hintStep = 0;
      let solved = false;

      const talk = h('div', { class: 'talk' }, bubble(r.who, r.line));
      const hintBtn = h('button', { class: 'btn ghost', onclick: showHint }, '힌트 보기');
      const sendBtn = h('button', { class: 'btn primary', onclick: submit }, '칸에 넣기');
      const countEls = Object.fromEntries(STATES.map((s) => [s.key, h('strong', {}, '0')]));

      function say(who, text) { talk.replaceChildren(bubble(who, text)); }

      function showHint() {
        if (hintStep >= r.hints.length) { say('kkam', '힌트는 다 말한 거지. 이제 네 차례.'); return; }
        stats.hints += r === BONUS ? 0 : 1;
        say('kkam', r.hints[hintStep]);
        hintStep += 1;
      }

      const rows = r.items.map(([name], i) => {
        const btns = STATES.map((s) => h('button', {
          class: `state-btn state-${s.key}`, 'aria-pressed': 'false',
          onclick: () => { if (solved) return; picked[i] = s.key; refresh(); },
        }, s.name));
        return { btns, el: h('li', { class: 'sort-item' }, h('span', { class: 'sort-name' }, name), h('div', { class: 'state-group', role: 'group', 'aria-label': `${name} 칸 고르기` }, ...btns)) };
      });

      function refresh() {
        rows.forEach((row, i) => row.btns.forEach((b, j) => b.setAttribute('aria-pressed', String(picked[i] === STATES[j].key))));
        for (const s of STATES) countEls[s.key].textContent = picked.filter((p) => p === s.key).length;
      }

      function submit() {
        if (picked.includes(null)) { say(r.who, '아직 칸을 안 고른 물건이 있는 거지.'); return; }
        stats.attempts += 1;
        if (picked.every((p, i) => p === r.items[i][1])) {
          solved = true;
          say(r.who, `${LAUGH[r.who]} ${r.place} 정리 끝. 딱 맞는 거지.`);
          sendBtn.replaceWith(h('button', { class: 'btn primary', onclick: onCorrect }, '다음으로'));
          hintBtn.disabled = true;
          rows.forEach((row) => row.btns.forEach((b) => { b.disabled = true; }));
          return;
        }
        // 어느 물건이 틀렸는지는 말하지 않고, 칸마다 넘치는지·모자란지만 알려 줌
        wrongHere += 1;
        const off = STATES.map((s) => {
          const have = picked.filter((p) => p === s.key).length;
          const need = r.items.filter(([, k]) => k === s.key).length;
          return have === need ? null : { name: s.name, over: have > need };
        }).filter(Boolean);
        // 예: "고체 칸은 넘치고, 액체 칸은 모자란 거지."
        const msg = off.length
          ? `음… ${off.map((o, i) => (i < off.length - 1
            ? `${o.name} 칸은 ${o.over ? '넘치고' : '모자라고'}`
            : `${o.name} 칸은 ${o.over ? '넘치는' : '모자란'} 거지.`)).join(', ')}`
          : '음… 칸마다 개수는 맞는데, 자리가 바뀐 물건이 있는 거지.';
        say(r.who, wrongHere >= 2 && hintStep === 0 ? `${msg} 힌트를 봐도 괜찮은 거지.` : msg);
      }

      root.replaceChildren(h('section', { class: 'stage' },
        header(label),
        talk,
        h('p', { class: 'ask' }, `${r.place}의 물건을 고체, 액체, 기체 중 맞는 칸으로 골라 주는 거지.`),
        h('ul', { class: 'sort-list' }, ...rows.map((row) => row.el)),
        h('div', { class: 'bins' }, ...STATES.map((s) =>
          h('div', { class: `bin bin-${s.key}` }, h('span', {}, `${NAME[s.key]} 칸`), countEls[s.key]))),
        h('div', { class: 'actions' },
          h('button', { class: 'btn ghost', onclick: () => { if (solved) return; picked.fill(null); refresh(); } }, '비우기'),
          hintBtn, sendBtn)));
      refresh();
    }

    function round(i) {
      if (i >= ROUNDS.length) { bonusOffer(); return; }
      play(ROUNDS[i], `정리 ${i + 1} / ${ROUNDS.length}`, () => round(i + 1));
    }

    function bonusOffer() {
      root.replaceChildren(h('section', { class: 'stage' },
        header('숨은 주문'),
        bubble('ddal', '얼음 추적은 끝입니다만… 헷갈리는 물건이 조금 남았습니다만.'),
        h('div', { class: 'actions' },
          h('button', { class: 'btn ghost', onclick: done }, '오늘은 여기까지'),
          h('button', { class: 'btn primary', onclick: () => play(BONUS, '숨은 주문', () => { stats.bonus = true; done(); }) }, '도전하기'))));
    }

    function done() { finish({ ...stats }); }

    intro();
  },
};

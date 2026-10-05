// 2주차: 냉동고의 빈 병 (과학 3-2 물질의 상태)
// 고체·액체·기체 나누기 → 모양이 그대로인 것 고르기 → 공기가 자리를 차지하는 실험 → (숨은 주문) 공기의 무게
import { h, bubble } from '../ui.js';
import { LAUGH } from '../characters.js';

const STATES = [
  { key: 'solid', name: '고체' },
  { key: 'liquid', name: '액체' },
  { key: 'gas', name: '기체' },
];

// 라운드 종류: sort(칸 나누기) / pick(맞는 것 모두 고르기) / choice(3지선다)
const ROUNDS = [
  {
    type: 'sort', who: 'kkam', place: '냉동고 옆 선반',
    line: '빈 병을 찾기 전에, 선반부터 정리하는 거지. 물건마다 고체, 액체, 기체 칸을 골라 주는 거지.',
    items: [
      ['숟가락', 'solid'], ['우유', 'liquid'], ['수증기', 'gas'],
      ['얼음', 'solid'], ['주스', 'liquid'], ['풍선 속 공기', 'gas'],
      ['접시', 'solid'], ['간장', 'liquid'], ['빈 병 속 공기', 'gas'],
    ],
    hints: [
      '고체는 모양이 그대로, 액체는 그릇에 따라 모양이 바뀌고, 기체는 퍼져서 눈에 잘 안 보이는 거지.',
      '“빈” 병도 사실 비어 있지 않은 거지. 눈에 안 보이는 게 꽉 차 있는 거지.',
    ],
  },
  {
    type: 'pick', who: 'tipo', place: '설거지통',
    line: '병 씻기 전에 재료부터 옮겨 담아야 해. 다른 그릇에 옮겨도 모양이 그대로인 것만 골라. Quick.',
    ask: '다른 그릇에 옮겨 담아도 모양이 그대로인 것을 모두 골라 주는 거지.',
    items: [
      ['숟가락', true], ['우유', false], ['얼음 조각', true], ['간장', false],
      ['지우개', true], ['병 속 공기', false], ['주스', false], ['구슬', true],
    ],
    hints: [
      '고체는 어디에 옮겨 담아도 모양이 그대로인 거지.',
      '흘러내리거나 퍼지는 건 그릇 모양을 따라가는 거지. 손으로 집을 수 있는 걸 골라 보는 거지.',
    ],
  },
  {
    type: 'choice', who: 'ddal', place: '실험',
    line: '실험입니다만. 컵 바닥에 마른 휴지를 붙이고, 컵을 거꾸로 해서 물속에 똑바로 쑥 넣었습니다만.',
    ask: '컵 안의 휴지는 어떻게 될까?',
    art: 'cup',
    choices: ['젖는다', '안 젖는다', '반만 젖는다'],
    answer: '안 젖는다',
    explain: '컵 안의 공기가 자리를 차지하고 있어서, 물이 들어오지 못하는 겁니다만.',
    hints: [
      '컵이 “비어” 보여도 안에는 공기가 들어 있는 거지.',
      '공기가 먼저 자리를 차지하고 있으면, 물이 그 자리로 들어갈 수 있을지 생각해 보는 거지.',
    ],
  },
];

const BONUS = {
  type: 'choice', who: 'ddal', place: '숨은 주문',
  line: '…숨은 주문입니다만. 막대 양 끝에 바람 뺀 풍선을 하나씩 달아서 수평을 맞췄습니다만.',
  ask: '한쪽 풍선에만 바람을 가득 넣어 다시 달면, 막대는 어떻게 될까?',
  art: 'balance',
  choices: ['바람 넣은 쪽이 내려간다', '바람 뺀 쪽이 내려간다', '그대로 수평이다'],
  answer: '바람 넣은 쪽이 내려간다',
  explain: '공기에도 무게가 있어서, 공기를 넣은 쪽이 더 무거워지는 겁니다만.',
  hints: [
    '바람을 넣으면 풍선 안에 무엇이 더 들어가는지 생각해 보는 거지.',
    '공기도 물질이라 무게가 있는 거지. 더 많이 들어간 쪽은?',
  ],
};

// 실험 그림 (설명용, 움직이지 않음)
const ART = {
  cup: `<svg viewBox="0 0 200 120" class="exp-art" role="img" aria-label="휴지를 붙인 컵을 거꾸로 물에 넣는 그림">
    <rect x="10" y="50" width="180" height="62" rx="6" fill="#BFE6F5" stroke="#5C9DB8" stroke-width="3"/>
    <path d="M70 20h60l-6 64H76z" fill="#fff" fill-opacity=".7" stroke="#1A1F33" stroke-width="3"/>
    <rect x="80" y="24" width="40" height="12" rx="2" fill="#FBF6EC" stroke="#C9A574" stroke-width="2"/>
    <path d="M100 4v10M94 9l6 6 6-6" stroke="#1A1F33" stroke-width="3" fill="none"/>
  </svg>`,
  balance: `<svg viewBox="0 0 200 110" class="exp-art" role="img" aria-label="막대 양 끝에 바람 뺀 풍선을 단 저울 그림">
    <path d="M100 8v14" stroke="#1A1F33" stroke-width="3"/>
    <rect x="20" y="22" width="160" height="6" rx="3" fill="#C9A574" stroke="#7A5A2E" stroke-width="2"/>
    <path d="M32 28v24M168 28v24" stroke="#1A1F33" stroke-width="2"/>
    <ellipse cx="32" cy="62" rx="8" ry="11" fill="#E5658F"/>
    <ellipse cx="168" cy="62" rx="8" ry="11" fill="#8ED8C9"/>
    <text x="32" y="98" text-anchor="middle" font-size="13" fill="#1A1F33">풍선 1</text>
    <text x="168" y="98" text-anchor="middle" font-size="13" fill="#1A1F33">풍선 2</text>
  </svg>`,
};

// 2주 후 복습 퀴즈 문제 (숫자로 답함)
const REVIEW = [
  { q: '얼음, 우유, 숟가락, 주스, 풍선 속 공기. 이 중 액체는 몇 개?', answer: 2, unit: '개',
    hints: ['액체는 담는 그릇에 따라 모양이 바뀌는 거지.', '하나씩 컵에 옮겨 담는다고 생각해 보는 거지. 컵 모양이 되는 건?'] },
  { q: '돌, 물, 연필, 식용유, 지우개, 꿀. 이 중 고체는 몇 개?', answer: 3, unit: '개',
    hints: ['고체는 어디에 담아도 모양이 그대로인 거지.', '손으로 집을 수 있고 흘러내리지 않는 걸 세어 보는 거지.'] },
  { q: '풍선 속 공기, 얼음, 자전거 바퀴 속 공기, 물, 수증기. 이 중 기체는 몇 개?', answer: 3, unit: '개',
    hints: ['기체는 퍼져서 눈에 잘 안 보이는 거지.', '공기와 수증기를 찾아서 세어 보는 거지.'] },
  { q: '휴지를 붙인 컵 4개를 거꾸로 물에 넣었어. 그중 1개는 바닥에 구멍이 나 있어서 공기가 빠져나갔어. 휴지가 젖지 않은 컵은 몇 개?', answer: 3, unit: '개',
    hints: ['공기가 컵 안 자리를 차지하고 있으면 물이 못 들어오는 거지.', '구멍 난 컵만 공기가 빠져나가는 거지. 4개에서 하나를 빼 보는 거지.'] },
];

export default {
  id: 's1-w02',
  conceptId: 'sci-state-01',
  review: REVIEW,
  clue: { id: 's1-w02', answer: '자리차지', ask: '영상에서 냉동고 문에 적힌 암호는?' },

  mount(root, { finish, exit }) {
    const stats = { attempts: 0, hints: 0, bonus: false };

    const header = (label) => h('header', { class: 'stage-head' },
      h('button', { class: 'link', onclick: exit }, '휴게소로'),
      h('span', { class: 'stage-step' }, label));

    function intro() {
      root.replaceChildren(h('section', { class: 'stage' },
        header('2주차'),
        h('h2', {}, '냉동고의 빈 병'),
        bubble('kkam', '…냉동고에 빈 병이 하나 있는 거지. 정말 “빈” 병일까. 오늘은 고체, 액체, 기체를 알아보는 거지.'),
        h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => round(0) }, '냉동고 열기'))));
    }

    // 세 종류 라운드가 함께 쓰는 틀: 말풍선, 힌트, 정답 처리
    function play(r, label, onCorrect) {
      let wrongHere = 0;
      let hintStep = 0;
      let solved = false;

      const talk = h('div', { class: 'talk' }, bubble(r.who, r.line));
      const say = (who, text) => talk.replaceChildren(bubble(who, text));
      const hintBtn = h('button', { class: 'btn ghost', onclick: showHint }, '힌트 보기');
      const actions = h('div', { class: 'actions' });

      function showHint() {
        if (hintStep >= r.hints.length) { say('kkam', '힌트는 다 말한 거지. 이제 네 차례.'); return; }
        stats.hints += r === BONUS ? 0 : 1;
        say('kkam', r.hints[hintStep]);
        hintStep += 1;
      }

      function correct(extra) {
        solved = true;
        say(r.who, `${LAUGH[r.who]} ${extra || `${r.place} 정리 끝. 딱 맞는 거지.`}`);
        hintBtn.disabled = true;
        body.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        actions.replaceChildren(h('button', { class: 'btn primary', onclick: onCorrect }, '다음으로'));
      }

      // 3지선다는 두 번 틀리면 정답이 남으므로 첫 오답부터 힌트를 권함
      function wrong(msg) {
        wrongHere += 1;
        const offer = hintStep === 0 && (wrongHere >= 2 || r.type === 'choice');
        say(r.who, offer ? `${msg} 힌트를 봐도 괜찮은 거지.` : msg);
      }

      const body = h('div', { class: 'round-body' });
      const ui = { sort: sortRound, pick: pickRound, choice: choiceRound }[r.type]({
        r, body, isSolved: () => solved, correct, wrong, say,
      });

      actions.replaceChildren(...(ui.extraButtons || []), hintBtn, ...(ui.submit ? [ui.submit] : []));
      root.replaceChildren(h('section', { class: 'stage' }, header(label), talk, body, actions));
    }

    // 칸 나누기: 물건마다 고체·액체·기체 버튼을 누름 (끌어 놓기 없이 누르기만)
    function sortRound({ r, body, isSolved, correct, wrong, say }) {
      const picked = r.items.map(() => null);
      const countEls = Object.fromEntries(STATES.map((s) => [s.key, h('strong', {}, '0')]));
      const rows = r.items.map(([name], i) => {
        const btns = STATES.map((s) => h('button', {
          class: `state-btn state-${s.key}`, 'aria-pressed': 'false',
          onclick: () => { if (isSolved()) return; picked[i] = s.key; refresh(); },
        }, s.name));
        return { btns, el: h('li', { class: 'sort-item' }, h('span', { class: 'sort-name' }, name), h('div', { class: 'state-group', role: 'group', 'aria-label': `${name} 칸 고르기` }, ...btns)) };
      });
      function refresh() {
        rows.forEach((row, i) => row.btns.forEach((b, j) => b.setAttribute('aria-pressed', String(picked[i] === STATES[j].key))));
        for (const s of STATES) countEls[s.key].textContent = picked.filter((p) => p === s.key).length;
      }
      body.append(
        h('p', { class: 'ask' }, `${r.place}의 물건을 고체, 액체, 기체 중 맞는 칸으로 골라 주는 거지.`),
        h('ul', { class: 'sort-list' }, ...rows.map((row) => row.el)),
        h('div', { class: 'bins' }, ...STATES.map((s) =>
          h('div', { class: `bin bin-${s.key}` }, h('span', {}, `${s.name} 칸`), countEls[s.key]))));
      refresh();

      const submit = h('button', {
        class: 'btn primary',
        onclick: () => {
          if (picked.includes(null)) { say(r.who, '아직 칸을 안 고른 물건이 있는 거지.'); return; }
          stats.attempts += 1;
          if (picked.every((p, i) => p === r.items[i][1])) { correct(); return; }
          // 어느 물건이 틀렸는지는 말하지 않고, 칸마다 넘치는지·모자란지만 알려 줌
          const off = STATES.map((s) => {
            const have = picked.filter((p) => p === s.key).length;
            const need = r.items.filter(([, k]) => k === s.key).length;
            return have === need ? null : { name: s.name, over: have > need };
          }).filter(Boolean);
          wrong(off.length
            ? `음… ${off.map((o, i) => (i < off.length - 1
              ? `${o.name} 칸은 ${o.over ? '넘치고' : '모자라고'}`
              : `${o.name} 칸은 ${o.over ? '넘치는' : '모자란'} 거지.`)).join(', ')}`
            : '음… 칸마다 개수는 맞는데, 자리가 바뀐 물건이 있는 거지.');
        },
      }, '칸에 넣기');
      const clear = h('button', { class: 'btn ghost', onclick: () => { if (isSolved()) return; picked.fill(null); refresh(); } }, '비우기');
      return { submit, extraButtons: [clear] };
    }

    // 맞는 것 모두 고르기: 고른 개수가 많은지·모자란지만 알려 줌
    function pickRound({ r, body, isSolved, correct, wrong, say }) {
      const on = r.items.map(() => false);
      const btns = r.items.map(([name], i) => h('button', {
        class: 'pick-btn', 'aria-pressed': 'false',
        onclick: () => { if (isSolved()) return; on[i] = !on[i]; btns[i].setAttribute('aria-pressed', String(on[i])); },
      }, name));
      body.append(h('p', { class: 'ask' }, r.ask), h('div', { class: 'pick-grid' }, ...btns));

      const submit = h('button', {
        class: 'btn primary',
        onclick: () => {
          const have = on.filter(Boolean).length;
          if (!have) { say(r.who, '하나도 안 골랐어. 먼저 골라 봐.'); return; }
          stats.attempts += 1;
          if (on.every((v, i) => v === r.items[i][1])) { correct(`${r.place} 옮겨 담기 끝. Perfect.`); return; }
          const need = r.items.filter(([, v]) => v).length;
          if (have > need) wrong('음… 너무 많이 골랐어. 모양이 바뀌는 게 섞여 있어.');
          else if (have < need) wrong('음… 조금 모자라. 모양이 그대로인 게 더 있어.');
          else wrong('음… 개수는 맞는데, 바꿔야 할 게 있어.');
        },
      }, '골랐어');
      return { submit };
    }

    // 3지선다: 고르면 바로 확인, 정답이면 한 줄 설명
    function choiceRound({ r, body, correct, wrong }) {
      body.append(
        r.art ? h('div', { class: 'exp-figure', html: ART[r.art] }) : '',
        h('p', { class: 'ask' }, r.ask),
        h('div', { class: 'choice-list' }, ...r.choices.map((c) => h('button', {
          class: 'choice-btn',
          onclick: () => {
            stats.attempts += 1;
            if (c === r.answer) correct(r.explain);
            else wrong('음… 그건 아닌 것 같습니다만.');
          },
        }, c))));
      return {};
    }

    function round(i) {
      if (i >= ROUNDS.length) { bonusOffer(); return; }
      play(ROUNDS[i], `라운드 ${i + 1} / ${ROUNDS.length}`, () => round(i + 1));
    }

    function bonusOffer() {
      root.replaceChildren(h('section', { class: 'stage' },
        header('숨은 주문'),
        bubble('ddal', '빈 병의 비밀은 풀렸습니다만… 공기에 대해 하나 더 알아볼 게 있습니다만.'),
        h('div', { class: 'actions' },
          h('button', { class: 'btn ghost', onclick: done }, '오늘은 여기까지'),
          h('button', { class: 'btn primary', onclick: () => play(BONUS, '숨은 주문', () => { stats.bonus = true; done(); }) }, '도전하기'))));
    }

    function done() { finish({ ...stats }); }

    intro();
  },
};

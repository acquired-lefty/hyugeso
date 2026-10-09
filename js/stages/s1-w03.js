// 3회차: 쿠키 공평하게 나누기 (수학 3-2 나눗셈)
// 한 바퀴씩 나눠 담기 → 몫·나머지 구하기 → 검산과 "나머지 < 나누는 수" → (숨은 주문) 2월 29일이 있는 해
// 내레이터: 티포 (3~4회차). 들어가기·힌트·숨은 주문 안내를 맡는다.
import { h, bubble } from '../ui.js';
import { LAUGH } from '../characters.js';

const HOST = 'tipo';

// 말하는 캐릭터별 "힌트 권하기" 말투
const OFFER = {
  kkam: '힌트를 봐도 괜찮은 거지.',
  tipo: '힌트 봐도 돼. Okay?',
  ddal: '힌트를 봐도 괜찮습니다만.',
};

// 몫·나머지 오답 피드백 (방향만, 정답은 말하지 않음)
const DIV_MSG = {
  tipo: {
    qBig: 'Stop. 한 접시에 그만큼 주면 쿠키가 모자라.',
    qSmall: '음… 몫이 너무 작아. 한 접시를 다시 세어 봐.',
    rBig: '음… 나머지가 너무 커.',
    rSmall: '음… 나머지가 모자라.',
  },
  ddal: {
    qBig: '몫이 너무 큽니다만. 그만큼씩 주면 쿠키가 모자랍니다만.',
    qSmall: '몫이 너무 작습니다만. 아직 더 나눠 줄 수 있습니다만.',
    rBig: '몫은 맞습니다만… 나머지가 너무 큽니다만.',
    rSmall: '몫은 맞습니다만… 나머지가 모자랍니다만.',
  },
};

// 라운드마다 steps를 차례로 푼다. kind: deal(한 바퀴 돌리기) / div(몫·나머지) / fill(검산 빈칸) / choice(고르기)
const ROUNDS = [
  {
    who: 'tipo', label: '라운드 1 / 3',
    line: '쿠키 25개, 접시 4개. 한 바퀴 돌릴 때마다 접시마다 1개씩. 공평하게. Okay?',
    steps: [{
      kind: 'deal', n: 25, d: 4,
      ask: '쿠키를 다 나눴으면, 한 접시에 몇 개씩이고 몇 개가 남았는지 맞춰 봐.',
      hints: [
        '접시 하나에 담긴 쿠키 수가 몫, 접시에 못 들어가고 남은 쿠키가 나머지야.',
        '접시 한 개만 보고 쿠키를 세어 봐. 그다음 쟁반에 남은 쿠키를 세어 봐.',
      ],
    }],
  },
  {
    who: 'ddal', label: '라운드 2 / 3',
    line: '포장 주문이 세 건입니다만. 몫과 나머지를 정확히 알려 주시면 됩니다만.',
    steps: [
      { kind: 'div', n: 17, d: 3, story: '쿠키 17개를 봉지 3개에 똑같이 나눠 담습니다만.',
        hints: ['몫은 한 봉지에 몇 개씩인지, 나머지는 나누고 남은 쿠키 수야.', '3씩 세어 봐. 3, 6, 9, 12, 15, 18… 17을 넘지 않는 건 어디까지?'] },
      { kind: 'div', n: 30, d: 7, story: '쿠키 30개를 손님 7명에게 똑같이 나눠 줍니다만.',
        hints: ['몫은 한 명이 받는 쿠키 수, 나머지는 나누고 남은 쿠키 수야.', '7씩 세어 봐. 7, 14, 21, 28, 35… 30을 넘지 않는 건 어디까지?'] },
      { kind: 'div', n: 23, d: 5, story: '쿠키 23개를 상자 5개에 똑같이 나눠 담습니다만.',
        hints: ['몫은 한 상자에 몇 개씩인지, 나머지는 나누고 남은 쿠키 수야.', '5씩 세어 봐. 5, 10, 15, 20, 25… 23을 넘지 않는 건 어디까지?'] },
    ],
  },
  {
    who: 'kkam', label: '라운드 3 / 3',
    line: '나눗셈이 맞았는지 거꾸로 확인하는 걸 검산이라고 하는 거지.',
    steps: [
      { kind: 'fill', n: 25, d: 4, q: 6,
        ask: '25 ÷ 4 = 6 … □. 검산으로 □를 찾아 주는 거지.',
        hints: ['검산은 (나누는 수) × (몫) + (나머지) = (처음 수)가 되는지 보는 거야.', '4 × 6 = 24. 25가 되려면 얼마를 더해야 할까?'] },
      { kind: 'choice',
        ask: '손님 쪽지에 “29 ÷ 4 = 6 … 5”라고 적혀 있는 거지. 맞는 계산일까?',
        choices: [
          '맞다',
          '틀리다 — 나머지 5가 4보다 커서, 한 접시에 1개씩 더 줄 수 있다',
          '틀리다 — 4 × 6 + 5는 29가 아니다',
        ],
        answer: 1,
        explain: '나머지는 나누는 수보다 작아야 하는 거지. 29 ÷ 4 = 7 … 1인 거지.',
        hints: ['나머지가 나누는 수와 같거나 더 크면, 한 바퀴를 더 돌릴 수 있어.', '쿠키 5개가 남았는데 접시는 4개. 접시마다 1개씩 더 줄 수 있을까?'] },
    ],
  },
];

const BONUS = {
  who: 'tipo', label: '숨은 주문',
  line: '…숨은 주문. 달력에 2월 29일이 있는 해는 4년에 한 번뿐이래.',
  steps: [{
    kind: 'choice',
    ask: '다음 중 2월 29일이 있는 해는?',
    choices: ['2026년', '2027년', '2028년', '2030년'],
    answer: 2,
    explain: '28 ÷ 4 = 7, 나머지 0. 2028은 4로 나누어떨어져서 2월 29일이 있어. Perfect.',
    hints: [
      '2월 29일이 있는 해는 4로 나눌 때 나머지가 0인 해야.',
      '2000은 4로 나누어떨어져. 그러니까 뒤의 두 자리 26, 27, 28, 30만 4로 나눠 봐.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 (숫자로 답함)
const REVIEW = [
  { q: '쿠키 22개를 접시 5개에 똑같이 나눠 담았어. 남는 쿠키는 몇 개?', answer: 2, unit: '개',
    hints: ['접시마다 똑같이 담고 남는 게 나머지인 거지.', '5씩 세어 보는 거지. 5, 10, 15, 20. 22에서 20을 빼면?'] },
  { q: '사탕 27개를 친구 6명에게 똑같이 나눠 주면, 한 명이 몇 개씩 받을까?', answer: 4, unit: '개',
    hints: ['한 명이 받는 수가 몫인 거지.', '6씩 세어 보는 거지. 6, 12, 18, 24, 30. 27을 넘지 않는 건 몇 번째?'] },
  { q: '머핀 19개를 상자에 4개씩 담으면, 꽉 찬 상자는 몇 개?', answer: 4, unit: '개',
    hints: ['4개씩 묶으면 몇 묶음이 되는지 보는 거지.', '4, 8, 12, 16, 20. 19를 넘지 않는 건 몇 번째?'] },
  { q: '어떤 수를 3으로 나눴더니 몫이 5, 나머지가 2였어. 어떤 수는?', answer: 17, unit: '',
    hints: ['검산을 떠올리는 거지. (나누는 수) × (몫) + (나머지).', '3 × 5를 먼저 하고, 2를 더해 보는 거지.'] },
];

// − / + 로만 숫자를 고르는 칸 (자유 입력 없음)
function stepper(label, max) {
  let v = 0;
  const out = h('output', { class: 'step-val', 'aria-live': 'polite' }, '0');
  const set = (n) => { v = Math.max(0, Math.min(max, n)); out.textContent = v; };
  const minus = h('button', { class: 'step-btn', 'aria-label': `${label} 1 줄이기`, onclick: () => set(v - 1) }, '−');
  const plus = h('button', { class: 'step-btn', 'aria-label': `${label} 1 늘리기`, onclick: () => set(v + 1) }, '+');
  const el = h('div', { class: 'stepper' }, h('span', { class: 'step-label' }, label), h('div', { class: 'step-row' }, minus, out, plus));
  return { el, get: () => v };
}

const cookies = (n) => Array.from({ length: n }, () => h('span', { class: 'cookie', 'aria-hidden': 'true' }));

export default {
  id: 's1-w03',
  conceptId: 'math-div-01',
  review: REVIEW,
  clue: { id: 's1-w03', answer: '남은하루', ask: '영상에서 오븐 문에 적힌 암호는?' },

  mount(root, { finish, exit }) {
    const stats = { attempts: 0, hints: 0, bonus: false };

    const header = (label) => h('header', { class: 'stage-head' },
      h('button', { class: 'link', onclick: exit }, '휴게소로'),
      h('span', { class: 'stage-step' }, label));

    function intro() {
      root.replaceChildren(h('section', { class: 'stage' },
        header('3회차'),
        h('h2', {}, '쿠키 공평하게 나누기'),
        bubble(HOST, '쿠키 25개 구웠어. 오늘 손님은 공평한 걸 좋아해. 똑같이 나누는 법, 그리고 남는 쿠키까지. Okay?'),
        h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => round(0) }, '쿠키 꺼내기'))));
    }

    // 한 라운드: steps를 하나씩 풀고, 다 풀면 onDone
    function play(r, onDone) {
      const talk = h('div', { class: 'talk' }, bubble(r.who, r.line));
      const say = (who, text) => talk.replaceChildren(bubble(who, text));
      const progress = h('p', { class: 'muted small' });
      const body = h('div', { class: 'round-body' });
      const actions = h('div', { class: 'actions' });
      root.replaceChildren(h('section', { class: 'stage' }, header(r.label), talk, progress, body, actions));

      function step(i) {
        if (i >= r.steps.length) { onDone(); return; }
        const s = r.steps[i];
        progress.textContent = r.steps.length > 1 ? `문제 ${i + 1} / ${r.steps.length}` : '';
        let wrongHere = 0;
        let hintStep = 0;

        const hintBtn = h('button', { class: 'btn ghost', onclick: showHint }, '힌트 보기');
        function showHint() {
          if (hintStep >= s.hints.length) { say(HOST, '힌트는 다 말했어. 이제 네 차례.'); return; }
          stats.hints += r === BONUS ? 0 : 1;
          say(HOST, s.hints[hintStep]);
          hintStep += 1;
        }

        function correct(text) {
          say(r.who, `${LAUGH[r.who]} ${text}`);
          body.querySelectorAll('button').forEach((b) => { b.disabled = true; });
          const last = i === r.steps.length - 1;
          actions.replaceChildren(h('button', { class: 'btn primary', onclick: () => step(i + 1) }, last ? '다음으로' : '다음 문제'));
        }

        // 고르기 문제는 두 번 틀리면 답이 좁혀지므로 첫 오답부터 힌트를 권함
        function wrong(msg) {
          wrongHere += 1;
          const offer = hintStep === 0 && (wrongHere >= 2 || s.kind === 'choice');
          say(r.who, offer ? `${msg} ${OFFER[r.who]}` : msg);
        }

        // 몫·나머지 확인: 몫이 틀리면 몫 방향만, 몫이 맞으면 나머지 방향만 알려 줌
        function checkDiv(n, d, q, rem) {
          stats.attempts += 1;
          const Q = Math.floor(n / d);
          const R = n % d;
          const m = DIV_MSG[r.who];
          if (q === Q && rem === R) { correct(`${n} ÷ ${d} = ${Q} … ${R}.`); return; }
          if (q !== Q) wrong(q > Q ? m.qBig : m.qSmall);
          else wrong(rem > R ? m.rBig : m.rSmall);
        }

        body.replaceChildren();
        if (s.kind === 'deal') dealStep(s, { say, actions, hintBtn, checkDiv, who: r.who });
        else if (s.kind === 'div') divStep(s, { actions, hintBtn, checkDiv });
        else if (s.kind === 'fill') fillStep(s, { actions, hintBtn, correct, wrong });
        else choiceStep(s, { actions, hintBtn, correct, wrong });
      }

      // 몫·나머지 입력 칸
      function divInputs(n, d, onCheck, hintBtn) {
        const q = stepper('몫', 30);
        const rem = stepper('나머지', 30);
        body.append(
          h('p', { class: 'div-eq', 'aria-label': `${n} 나누기 ${d}는 몫 몇, 나머지 몇` }, `${n} ÷ ${d} = □ … □`),
          h('div', { class: 'steppers' }, q.el, rem.el));
        actions.replaceChildren(hintBtn, h('button', { class: 'btn primary', onclick: () => onCheck(n, d, q.get(), rem.get()) }, '확인'));
      }

      // 라운드 1: "한 바퀴 돌리기"를 누를 때마다 접시마다 1개씩, 더 못 돌리면 멈추고 몫·나머지 입력
      function dealStep(s, { say, actions, hintBtn, checkDiv, who }) {
        let left = s.n;
        const plates = Array.from({ length: s.d }, () => 0);
        const tray = h('div', { class: 'tray-cookies' });
        const plateEls = plates.map((_, i) => h('div', { class: 'plate' },
          h('div', { class: 'plate-cookies' }), h('span', { class: 'plate-name' }, `접시 ${i + 1}`)));
        const turnBtn = h('button', { class: 'btn primary', onclick: turn }, '한 바퀴 돌리기');

        function draw() {
          tray.replaceChildren(...cookies(left));
          tray.setAttribute('aria-label', `쟁반에 남은 쿠키 ${left}개`);
          plateEls.forEach((el, i) => {
            el.firstChild.replaceChildren(...cookies(plates[i]));
            el.setAttribute('aria-label', `접시 ${i + 1}에 쿠키 ${plates[i]}개`);
          });
        }

        function turn() {
          left -= s.d;
          for (let i = 0; i < s.d; i += 1) plates[i] += 1;
          draw();
          if (left >= s.d) return;
          turnBtn.disabled = true;
          say(who, `Stop. 쿠키가 접시 수보다 적어서 한 바퀴를 더 못 돌려. ${s.ask}`);
          body.append(h('p', { class: 'muted small' }, '한 접시에 담긴 수가 몫, 쟁반에 남은 수가 나머지예요.'));
          divInputs(s.n, s.d, checkDiv, hintBtn);
        }

        body.append(
          h('p', { class: 'ask' }, `쿠키 ${s.n}개를 접시 ${s.d}개에 똑같이 나눠 담아요.`),
          h('div', { class: 'tray', role: 'img' }, h('span', { class: 'tray-name' }, '쟁반'), tray),
          h('div', { class: 'plates' }, ...plateEls));
        actions.replaceChildren(turnBtn);
        draw();
      }

      function divStep(s, { hintBtn, checkDiv }) {
        body.append(h('p', { class: 'ask' }, s.story));
        divInputs(s.n, s.d, checkDiv, hintBtn);
      }

      // 검산 빈칸: (나누는 수) × (몫) + □ = (처음 수)
      function fillStep(s, { actions, hintBtn, correct, wrong }) {
        const box = stepper('□', 20);
        const R = s.n - s.d * s.q;
        body.append(
          h('p', { class: 'ask' }, s.ask),
          h('p', { class: 'div-eq', 'aria-label': `${s.d} 곱하기 ${s.q} 더하기 빈칸은 ${s.n}` }, `${s.d} × ${s.q} + □ = ${s.n}`),
          h('div', { class: 'steppers' }, box.el));
        actions.replaceChildren(hintBtn, h('button', {
          class: 'btn primary',
          onclick: () => {
            stats.attempts += 1;
            const v = box.get();
            if (v === R) { correct(`${s.d} × ${s.q} + ${R} = ${s.n}. 검산 통과인 거지.`); return; }
            wrong(v > R ? '음… 더하면 처음 수보다 많아지는 거지.' : '음… 더해도 처음 수에 모자란 거지.');
          },
        }, '확인'));
      }

      function choiceStep(s, { actions, hintBtn, correct, wrong }) {
        body.append(
          h('p', { class: 'ask' }, s.ask),
          h('div', { class: 'choice-list' }, ...s.choices.map((c, i) => h('button', {
            class: 'choice-btn',
            onclick: () => {
              stats.attempts += 1;
              if (i === s.answer) correct(s.explain);
              else wrong(r === BONUS ? '음… 그 해는 4로 나누면 나머지가 있어.' : '음… 그건 아닌 거지.');
            },
          }, c))));
        actions.replaceChildren(hintBtn);
      }

      step(0);
    }

    function round(i) {
      if (i >= ROUNDS.length) { bonusOffer(); return; }
      play(ROUNDS[i], () => round(i + 1));
    }

    function bonusOffer() {
      root.replaceChildren(h('section', { class: 'stage' },
        header('숨은 주문'),
        bubble(HOST, '오늘 주문은 끝. …그런데 숨은 주문이 하나 있어. 조금 어려워.'),
        h('div', { class: 'actions' },
          h('button', { class: 'btn ghost', onclick: done }, '오늘은 여기까지'),
          h('button', { class: 'btn primary', onclick: () => play(BONUS, () => { stats.bonus = true; done(); }) }, '도전하기'))));
    }

    function done() { finish({ ...stats }); }

    intro();
  },
};

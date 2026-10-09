// 회차 스테이지 공통 틀: 들어가기 → 본 라운드 → 숨은 주문 → finish
// 회차 파일은 문제 내용(cfg)만 적고 mountStage(root, cfg, ctx)를 부른다. 예시: s1-w03.js
//
// cfg = {
//   episode: '3회차', title: '쿠키 공평하게 나누기',
//   host: 'tipo',                      // 그 회차 진행 캐릭터(hostFor): 들어가기·힌트·결과
//   intro: { line, start },            // 첫 대사, 시작 버튼 글자
//   rounds: [{ who, label?, line, steps: [step, …] }],   // 본 라운드 3개
//   bonus: { offer, who, line, steps },                    // 숨은 주문 (선택)
// }
// step.kind: boxes(상자 담기) / sort(칸 나누기) / pick(모두 고르기) / choice(고르기)
//            deal(한 바퀴씩 나눠 담기) / div(몫·나머지) / fill(빈칸 숫자) / listen(소리 듣고 고르기)
//            review(복습 문제 pool에서 하나: 숫자 답은 숫자 버튼, 보기가 있으면 3지선다. 6회차 중간 복습)
// 고르기(choice·listen)의 보기는 항상 3개. 숫자 답은 화면 숫자 버튼(0~9)으로만 입력
// 모든 step에 hints: ['개념', '구체적으로 쪼개기'] (2단계)
import { h, bubble, josa } from '../ui.js';
import { LAUGH, LINES } from '../characters.js';
import { playSound, stopSound } from '../sound.js';

const VOICE = LINES; // 캐릭터별 말투 (characters.js)

// 몫·나머지 오답 피드백 (방향만, 정답은 말하지 않음)
const DIV_MSG = {
  kkam: { qBig: '음… 몫이 너무 큰 거지. 그만큼씩 주면 모자라는 거지.', qSmall: '음… 몫이 너무 작은 거지. 더 나눠 줄 수 있는 거지.', rBig: '몫은 맞는 거지… 나머지가 너무 큰 거지.', rSmall: '몫은 맞는 거지… 나머지가 모자란 거지.' },
  tipo: { qBig: 'Stop. 한 접시에 그만큼 주면 쿠키가 모자라.', qSmall: '음… 몫이 너무 작아. 한 접시를 다시 세어 봐.', rBig: '음… 나머지가 너무 커.', rSmall: '음… 나머지가 모자라.' },
  ddal: { qBig: '몫이 너무 큽니다만. 그만큼씩 주면 쿠키가 모자랍니다만.', qSmall: '몫이 너무 작습니다만. 아직 더 나눠 줄 수 있습니다만.', rBig: '몫은 맞습니다만… 나머지가 너무 큽니다만.', rSmall: '몫은 맞습니다만… 나머지가 모자랍니다만.' },
};

// 오답 후 힌트를 바로 권하는 형태 (보기가 적어 두 번 틀리면 답이 좁혀짐)
const OFFER_FIRST = new Set(['choice', 'listen']);

const BOX_NAME = { 100: '통', 10: '봉지', 1: '낱개' };

// 숫자 버튼판 (0~9, 최대 4자리). 칸이 여러 개면 칸을 눌러 고른 뒤 숫자를 누름
// fields: [{ label, unit }] → { el, get(i) } (빈칸이면 null)
export function numberPad(fields) {
  const vals = fields.map(() => '');
  let cur = 0;
  const outs = fields.map((f, i) => h('button', {
    class: 'pad-field', type: 'button', 'aria-pressed': String(i === 0), 'aria-label': `${f.label || '답'} 칸`,
    onclick: () => { cur = i; show(); },
  }, f.label ? h('span', { class: 'pad-label' }, f.label) : '', h('output', { class: 'pad-val' }, '?'), h('span', { class: 'pad-unit' }, f.unit || '')));
  function show() {
    outs.forEach((o, i) => {
      o.querySelector('.pad-val').textContent = vals[i] || '?';
      o.setAttribute('aria-pressed', String(i === cur));
    });
  }
  const type = (d) => { if (vals[cur].length < 4) vals[cur] = vals[cur] === '0' ? d : vals[cur] + d; };
  const key = (label, fn, aria) => h('button', { class: 'pad-key', type: 'button', 'aria-label': aria || label, onclick: () => { fn(); show(); } }, label);
  const el = h('div', { class: 'keypad' },
    h('div', { class: `pad-screen ${fields.length > 1 ? 'multi' : ''}`, 'aria-live': 'polite' }, ...outs),
    h('div', { class: 'pad-keys' },
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => key(String(n), () => type(String(n)))),
      key('지우기', () => { vals[cur] = ''; }, '모두 지우기'),
      key('0', () => type('0')),
      key('⌫', () => { vals[cur] = vals[cur].slice(0, -1); }, '한 칸 지우기')));
  if (fields.length === 1) outs[0].disabled = true; // 칸이 하나면 고를 필요 없음
  show();
  return { el, get: (i = 0) => (vals[i] === '' ? null : Number(vals[i])) };
}
export const keypad = (unit) => numberPad([{ unit }]);

const cookies = (n) => Array.from({ length: n }, () => h('span', { class: 'cookie', 'aria-hidden': 'true' }));

export function mountStage(root, cfg, { finish, exit }) {
  const host = cfg.host;
  const stats = { attempts: 0, hints: 0, bonus: false };
  const leave = () => { stopSound(); exit(); };
  const done = () => { stopSound(); finish({ ...stats }); };

  const header = (label) => h('header', { class: 'stage-head' },
    h('button', { class: 'link', onclick: leave }, '휴게소로'),
    h('span', { class: 'stage-step' }, label));

  function intro() {
    root.replaceChildren(h('section', { class: 'stage' },
      header(cfg.episode),
      h('h2', {}, cfg.title),
      bubble(host, cfg.intro.line),
      h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => round(0) }, cfg.intro.start))));
  }

  // 한 라운드: steps를 하나씩 풀고, 다 풀면 onDone
  function play(r, label, isBonus, onDone) {
    const talk = h('div', { class: 'talk' }, bubble(r.who, r.line));
    const say = (who, text) => talk.replaceChildren(bubble(who, text));
    const progress = h('p', { class: 'muted small step-progress' });
    const body = h('div', { class: 'round-body' });
    const actions = h('div', { class: 'actions' });
    root.replaceChildren(h('section', { class: 'stage' }, header(label), talk, progress, body, actions));

    function step(i) {
      stopSound();
      if (i >= r.steps.length) { onDone(); return; }
      const s = r.steps[i];
      progress.textContent = r.steps.length > 1 ? `문제 ${i + 1} / ${r.steps.length}` : '';
      let wrongHere = 0;
      let hintStep = 0;
      let offerFirst = OFFER_FIRST.has(s.kind);

      const hintBtn = h('button', {
        class: 'btn ghost',
        onclick: () => {
          if (hintStep >= s.hints.length) { say(host, VOICE[host].noMore); return; }
          if (!isBonus) stats.hints += 1;
          say(host, s.hints[hintStep]);
          hintStep += 1;
        },
      }, '힌트 보기');

      const ctx = {
        r, s, body, actions, hintBtn, say,
        offerFirst: () => { offerFirst = true; },
        attempt: () => { stats.attempts += 1; },
        correct(text) {
          stopSound();
          say(r.who, `${LAUGH[r.who]} ${text}`);
          // 소리 버튼은 정답 뒤에도 다시 들을 수 있게 남겨 둠
          body.querySelectorAll('button:not(.sound-btn)').forEach((b) => { b.disabled = true; });
          hintBtn.disabled = true;
          const last = i === r.steps.length - 1;
          actions.replaceChildren(h('button', { class: 'btn primary', onclick: () => step(i + 1) }, last ? '다음으로' : '다음 문제'));
        },
        wrong(msg) {
          wrongHere += 1;
          const offer = hintStep === 0 && (wrongHere >= 2 || offerFirst);
          say(r.who, offer ? `${msg} ${VOICE[r.who].offer}` : msg);
        },
      };
      body.replaceChildren();
      KINDS[s.kind](ctx);
    }
    step(0);
  }

  function round(i) {
    if (i >= cfg.rounds.length) { bonusOffer(); return; }
    const r = cfg.rounds[i];
    play(r, r.label || `라운드 ${i + 1} / ${cfg.rounds.length}`, false, () => round(i + 1));
  }

  function bonusOffer() {
    if (!cfg.bonus) { done(); return; }
    root.replaceChildren(h('section', { class: 'stage' },
      header('숨은 주문'),
      bubble(cfg.bonus.offerWho || host, cfg.bonus.offer),
      h('div', { class: 'actions' },
        h('button', { class: 'btn ghost', onclick: done }, '오늘은 여기까지'),
        h('button', { class: 'btn primary', onclick: () => play(cfg.bonus, '숨은 주문', true, () => { stats.bonus = true; done(); }) }, '도전하기'))));
  }

  intro();
}

// ---------- 문제 형태 ----------

// 몫·나머지 입력 칸 + 확인
function divInputs({ r, body, actions, hintBtn, say, attempt, correct, wrong }, n, d) {
  const pad = numberPad([{ label: '몫' }, { label: '나머지' }]);
  body.append(
    h('p', { class: 'div-eq', 'aria-label': `${n} 나누기 ${d}는 몫 몇, 나머지 몇` }, `${n} ÷ ${d} = □ … □`),
    h('p', { class: 'muted small pad-help' }, '몫 칸이나 나머지 칸을 누르고 숫자를 눌러요.'),
    pad.el);
  actions.replaceChildren(hintBtn, h('button', {
    class: 'btn primary',
    onclick: () => {
      const q = pad.get(0);
      const rem = pad.get(1);
      if (q == null || rem == null) { say(r.who, VOICE[r.who].typeFirst); return; }
      attempt();
      const Q = Math.floor(n / d);
      const R = n % d;
      const m = DIV_MSG[r.who];
      if (q === Q && rem === R) { correct(`${n} ÷ ${d} = ${Q} … ${R}.`); return; }
      // 몫이 틀리면 몫 방향만, 몫이 맞으면 나머지 방향만 알려 줌
      if (q !== Q) wrong(q > Q ? m.qBig : m.qSmall);
      else wrong(rem > R ? m.rBig : m.rSmall);
    },
  }, '확인'));
}

const KINDS = {
  // 1회차: 100·10·1 단위 상자를 담아 레시피 × 주문 수 만들기
  boxes(ctx) {
    const { r, s, body, actions, hintBtn, say, attempt, correct, wrong } = ctx;
    const target = s.per * s.times;
    const cart = Object.fromEntries(s.boxes.map((b) => [b, 0]));
    const totalEl = h('strong', { class: 'total-num' }, '0');
    const cartEl = h('div', { class: 'cart-chips' });
    const total = () => s.boxes.reduce((sum, b) => sum + b * cart[b], 0);
    function refresh() {
      totalEl.textContent = total();
      cartEl.replaceChildren(...s.boxes.filter((b) => cart[b] > 0).map((b) =>
        h('button', { class: `chip chip-${b}`, 'aria-label': `${BOX_NAME[b]} 하나 빼기`, onclick: () => { cart[b] -= 1; refresh(); } },
          `${BOX_NAME[b]} ×${cart[b]}`)));
      if (!cartEl.children.length) cartEl.append(h('span', { class: 'muted' }, '아직 비어 있어요'));
    }
    body.append(
      h('div', { class: 'order' },
        h('div', { class: 'recipe' }, h('span', { class: 'tag' }, '레시피'), h('p', {}, `${s.dish} 1${s.dishUnit}`), h('p', { class: 'big' }, `${s.item} ${s.per}${s.unit}`)),
        h('div', { class: 'slip' }, h('span', { class: 'tag' }, '주문서'), h('p', {}, s.dish), h('p', { class: 'big' }, `${s.times}${s.dishUnit}`))),
      h('p', { class: 'ask' }, `창고에서 ${josa(s.item, '을', '를')} 몇 ${s.unit} 꺼내야 할까?`),
      h('div', { class: 'shelf' }, ...s.boxes.map((b) => h('button', { class: `box box-${b}`, onclick: () => { cart[b] += 1; refresh(); } },
        h('span', { class: 'box-art' }), h('span', { class: 'box-label' }, `${b}${s.unit} ${BOX_NAME[b]}`)))),
      h('div', { class: 'cart' },
        h('div', { class: 'cart-total' }, h('span', {}, `담은 ${s.item}`), totalEl, h('span', {}, s.unit)),
        h('p', { class: 'muted small' }, '담은 상자를 누르면 하나씩 빠져요.'),
        cartEl));
    refresh();
    actions.replaceChildren(
      h('button', { class: 'btn ghost', onclick: () => { s.boxes.forEach((b) => { cart[b] = 0; }); refresh(); } }, '비우기'),
      hintBtn,
      h('button', {
        class: 'btn primary',
        onclick: () => {
          const t = total();
          if (t === 0) { say(r.who, '상자를 먼저 담아야 하는 거지.'); return; }
          attempt();
          if (t === target) { correct(`${s.item} ${target}${s.unit}, 딱 맞는 거지.`); return; }
          wrong(t > target ? '음… 너무 많은 거지. 상자가 넘쳐.' : '음… 조금 모자란 거지.');
        },
      }, '주방으로 보내기'));
  },

  // 칸 나누기: 물건마다 칸 버튼을 누름 (어느 물건이 틀렸는지는 말하지 않고, 칸마다 넘치는지·모자란지만)
  sort(ctx) {
    const { r, s, body, actions, hintBtn, say, attempt, correct, wrong } = ctx;
    const picked = s.items.map(() => null);
    const countEls = Object.fromEntries(s.bins.map((b) => [b.key, h('strong', {}, '0')]));
    const rows = s.items.map(([name], i) => {
      const btns = s.bins.map((b) => h('button', {
        class: `state-btn state-${b.key}`, 'aria-pressed': 'false',
        onclick: () => { picked[i] = b.key; refresh(); },
      }, b.name));
      return { btns, el: h('li', { class: 'sort-item' }, h('span', { class: 'sort-name' }, name), h('div', { class: 'state-group', role: 'group', 'aria-label': `${name} 칸 고르기` }, ...btns)) };
    });
    function refresh() {
      rows.forEach((row, i) => row.btns.forEach((b, j) => b.setAttribute('aria-pressed', String(picked[i] === s.bins[j].key))));
      for (const b of s.bins) countEls[b.key].textContent = picked.filter((p) => p === b.key).length;
    }
    body.append(
      h('p', { class: 'ask' }, s.ask),
      h('ul', { class: 'sort-list' }, ...rows.map((row) => row.el)),
      h('div', { class: 'bins' }, ...s.bins.map((b) => h('div', { class: `bin bin-${b.key}` }, h('span', {}, `${b.name} 칸`), countEls[b.key]))));
    refresh();
    actions.replaceChildren(
      h('button', { class: 'btn ghost', onclick: () => { picked.fill(null); refresh(); } }, '비우기'),
      hintBtn,
      h('button', {
        class: 'btn primary',
        onclick: () => {
          if (picked.includes(null)) { say(r.who, '아직 칸을 안 고른 물건이 있는 거지.'); return; }
          attempt();
          if (picked.every((p, i) => p === s.items[i][1])) { correct(s.okText); return; }
          const off = s.bins.map((b) => {
            const have = picked.filter((p) => p === b.key).length;
            const need = s.items.filter(([, k]) => k === b.key).length;
            return have === need ? null : { name: b.name, over: have > need };
          }).filter(Boolean);
          wrong(off.length
            ? `음… ${off.map((o, i) => (i < off.length - 1
              ? `${o.name} 칸은 ${o.over ? '넘치고' : '모자라고'}`
              : `${o.name} 칸은 ${o.over ? '넘치는' : '모자란'} 거지.`)).join(', ')}`
            : '음… 칸마다 개수는 맞는데, 자리가 바뀐 물건이 있는 거지.');
        },
      }, '칸에 넣기'));
  },

  // 맞는 것 모두 고르기: 고른 개수가 많은지·모자란지만 알려 줌
  pick(ctx) {
    const { r, s, body, actions, hintBtn, say, attempt, correct, wrong } = ctx;
    const on = s.items.map(() => false);
    const btns = s.items.map(([name], i) => h('button', {
      class: 'pick-btn', 'aria-pressed': 'false',
      onclick: () => { on[i] = !on[i]; btns[i].setAttribute('aria-pressed', String(on[i])); },
    }, name));
    body.append(h('p', { class: 'ask' }, s.ask), h('div', { class: 'pick-grid' }, ...btns));
    actions.replaceChildren(hintBtn, h('button', {
      class: 'btn primary',
      onclick: () => {
        const have = on.filter(Boolean).length;
        if (!have) { say(r.who, '하나도 안 골랐어. 먼저 골라 봐.'); return; }
        attempt();
        if (on.every((v, i) => v === s.items[i][1])) { correct(s.okText); return; }
        const need = s.items.filter(([, v]) => v).length;
        wrong(have > need ? s.msgs.many : have < need ? s.msgs.few : s.msgs.swap);
      },
    }, '골랐어'));
  },

  // 고르기: 누르면 바로 확인, 정답이면 한 줄 설명
  choice(ctx) {
    const { r, s, body, actions, hintBtn, attempt, correct, wrong } = ctx;
    body.append(
      s.art ? h('div', { class: 'exp-figure', html: s.art }) : '',
      h('p', { class: 'ask' }, s.ask),
      h('div', { class: 'choice-list' }, ...s.choices.map((c, i) => h('button', {
        class: 'choice-btn',
        onclick: () => {
          attempt();
          if (i === s.answer) correct(s.explain);
          else wrong(s.wrongMsg || VOICE[r.who].notIt);
        },
      }, c))));
    actions.replaceChildren(hintBtn);
  },

  // 소리 듣고 고르기: 소리 버튼을 눌러야 재생 (휴대폰 자동 재생 제한)
  listen(ctx) {
    const { r, s, body, say } = ctx;
    const status = h('p', { class: 'muted small sound-status', role: 'status' });
    const soundBtns = s.sounds.map((snd) => {
      const btn = h('button', {
        class: 'btn sound-btn',
        onclick: () => {
          soundBtns.forEach((b) => b.classList.remove('is-playing'));
          btn.classList.add('is-playing');
          status.textContent = `${snd.label} 재생 중…`;
          playSound(snd.src, {
            onEnd: () => { btn.classList.remove('is-playing'); status.textContent = '다시 들으려면 한 번 더 누르세요.'; },
            onError: () => { btn.classList.remove('is-playing'); status.textContent = '소리가 안 나와요. 기기 소리를 켜고 다시 눌러 보세요.'; say(r.who, '…소리가 안 들리면 기기 소리를 켜 보는 거야.'); },
          });
        },
      }, h('span', { class: 'sound-icon', 'aria-hidden': 'true' }, '▶'), snd.label);
      return btn;
    });
    body.append(h('div', { class: 'sound-row' }, ...soundBtns), status);
    KINDS.choice(ctx);
  },

  // 한 바퀴 돌리기를 누를 때마다 접시마다 1개씩, 더 못 돌리면 멈추고 몫·나머지 입력
  deal(ctx) {
    const { r, s, body, actions, say } = ctx;
    let left = s.n;
    const plates = Array.from({ length: s.d }, () => 0);
    const tray = h('div', { class: 'tray-cookies' });
    const plateEls = plates.map((_, i) => h('div', { class: 'plate' },
      h('div', { class: 'plate-cookies' }), h('span', { class: 'plate-name' }, `접시 ${i + 1}`)));
    function draw() {
      tray.replaceChildren(...cookies(left));
      tray.setAttribute('aria-label', `쟁반에 남은 쿠키 ${left}개`);
      plateEls.forEach((el, i) => {
        el.firstChild.replaceChildren(...cookies(plates[i]));
        el.setAttribute('aria-label', `접시 ${i + 1}에 쿠키 ${plates[i]}개`);
      });
    }
    const turnBtn = h('button', {
      class: 'btn primary',
      onclick: () => {
        left -= s.d;
        for (let i = 0; i < s.d; i += 1) plates[i] += 1;
        draw();
        if (left >= s.d) return;
        say(r.who, `${s.stopLine} ${s.ask}`);
        body.append(h('p', { class: 'muted small' }, '한 접시에 담긴 수가 몫, 쟁반에 남은 수가 나머지예요.'));
        divInputs(ctx, s.n, s.d);
      },
    }, '한 바퀴 돌리기');
    body.append(
      h('p', { class: 'ask' }, `쿠키 ${s.n}개를 접시 ${s.d}개에 똑같이 나눠 담아요.`),
      h('div', { class: 'tray', role: 'img' }, h('span', { class: 'tray-name' }, '쟁반'), tray),
      h('div', { class: 'plates' }, ...plateEls));
    actions.replaceChildren(turnBtn);
    draw();
  },

  div(ctx) {
    ctx.body.append(h('p', { class: 'ask' }, ctx.s.story));
    divInputs(ctx, ctx.s.n, ctx.s.d);
  },

  // 복습 문제: pool에서 하나를 골라 출제. 숫자 답은 숫자 버튼, 보기가 있으면 3지선다
  review(ctx) {
    const { r, s, body, actions, hintBtn, say, attempt, correct, wrong, offerFirst } = ctx;
    const item = s.pool[Math.floor(Math.random() * s.pool.length)];
    s.hints = item.hints; // 힌트 버튼이 이 문제의 힌트를 말하게 함
    body.append(s.from ? h('p', { class: 'muted small' }, s.from) : '', h('p', { class: 'ask' }, item.q));
    if (item.choices) {
      offerFirst(); // 3지선다는 첫 오답부터 힌트 권유
      body.append(h('div', { class: 'choice-list' }, ...item.choices.map((c, i) => h('button', {
        class: 'choice-btn',
        onclick: () => { attempt(); if (i === item.answer) correct(`${c}. ${VOICE[r.who].right}`); else wrong(VOICE[r.who].notIt); },
      }, c))));
      actions.replaceChildren(hintBtn);
      return;
    }
    const pad = keypad(item.unit);
    body.append(pad.el);
    actions.replaceChildren(hintBtn, h('button', {
      class: 'btn primary',
      onclick: () => {
        const v = pad.get();
        if (v == null) { say(r.who, VOICE[r.who].typeFirst); return; }
        attempt();
        if (v === item.answer) { correct(`${item.answer}${item.unit}. ${VOICE[r.who].right}`); return; }
        wrong(v > item.answer ? VOICE[r.who].tooMany : VOICE[r.who].tooFew);
      },
    }, '확인'));
  },

  // 빈칸 숫자: 식 속 □에 들어갈 수 (많다/모자라다만 알려 줌)
  fill(ctx) {
    const { r, s, body, actions, hintBtn, say, attempt, correct, wrong } = ctx;
    const pad = numberPad([{ label: '□' }]);
    body.append(
      h('p', { class: 'ask' }, s.ask),
      h('p', { class: 'div-eq', 'aria-label': s.eqLabel || s.eq }, s.eq),
      pad.el);
    actions.replaceChildren(hintBtn, h('button', {
      class: 'btn primary',
      onclick: () => {
        const v = pad.get();
        if (v == null) { say(r.who, VOICE[r.who].typeFirst); return; }
        attempt();
        if (v === s.answer) { correct(s.okText); return; }
        wrong(v > s.answer ? s.msgs.big : s.msgs.small);
      },
    }, '확인'));
  },
};

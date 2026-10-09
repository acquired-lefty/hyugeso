// 체험 모드로 공개된 모든 회차를 끝까지 실행하는 자동 검사 (CI: .github/workflows/check.yml)
// 각 회차 파일의 stage 설정(정답 포함)을 읽어 문제 형태별로 자동으로 풀고,
// 휴대폰·태블릿·PC 세 폭에서 가로 넘침, 화면 오류, 경험치 기록을 확인한다.
// 실행: python3 -m http.server 8000 & node tests/e2e.mjs   (BASE 환경변수로 주소 변경)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SEASON1, hostFor } from '../js/stages/index.js';

// 영상 암호 (화면 코드에는 지문만 있음)
const ANSWERS = JSON.parse(readFileSync(new URL('./clue-answers.json', import.meta.url), 'utf8'));
const hashOf = (w) => createHash('sha256').update(w.replace(/\s+/g, '').toLowerCase(), 'utf8').digest('hex');

const { chromium } = await import(process.env.PW_MODULE || 'playwright');
const BASE = process.env.BASE || 'http://localhost:8000/';
const SHOTS = process.env.SHOTS || '';
const WIDTHS = [['mobile', 390], ['tablet', 820], ['pc', 1440]];

// 실제 Supabase 대신 체험 모드로 실행
const DEMO_CONFIG = "export const CONFIG = { SUPABASE_URL: '', SUPABASE_ANON_KEY: '', EMAIL_DOMAIN: 'hyugeso.local', XP_PER_LEVEL: 200 };";

const errors = [];
const fail = (msg) => errors.push(msg);

// 숫자 버튼판: 칸을 고르고(칸이 여러 개일 때) 지운 뒤 숫자를 누름
async function enterNumbers(p, values) {
  for (const [i, v] of values.entries()) {
    if (values.length > 1) await p.locator('.pad-field').nth(i).click();
    await p.locator('.pad-key[aria-label="모두 지우기"]').click();
    await pressNumber(p, v);
  }
}

const clickText = (p, text) => p.locator(`.stage button:text-is("${text}")`).click();

// 문제 형태별 자동 풀이 (정답 제출까지)
const SOLVE = {
  async boxes(p, s) {
    let rest = s.per * s.times;
    for (const b of [...s.boxes].sort((x, y) => y - x)) {
      const n = Math.floor(rest / b); rest -= n * b;
      for (let i = 0; i < n; i += 1) await p.locator(`.box-${b}`).click();
    }
    await clickText(p, '주방으로 보내기');
  },
  async sort(p, s) {
    for (let i = 0; i < s.items.length; i += 1) await p.locator('.sort-item').nth(i).locator(`.state-${s.items[i][1]}`).click();
    await clickText(p, '칸에 넣기');
  },
  async pick(p, s) {
    for (let i = 0; i < s.items.length; i += 1) if (s.items[i][1]) await p.locator('.pick-btn').nth(i).click();
    await clickText(p, '골랐어');
  },
  async choice(p, s) { await p.locator('.choice-btn').nth(s.answer).click(); },
  async listen(p, s) {
    await p.locator('.sound-btn').first().click();
    await p.locator('.choice-btn').nth(s.answer).click();
  },
  async deal(p, s) {
    for (let i = 0; i < Math.floor(s.n / s.d); i += 1) await clickText(p, '한 바퀴 돌리기');
    await enterNumbers(p, [Math.floor(s.n / s.d), s.n % s.d]);
    await clickText(p, '확인');
  },
  async div(p, s) {
    await enterNumbers(p, [Math.floor(s.n / s.d), s.n % s.d]);
    await clickText(p, '확인');
  },
  async fill(p, s) { await enterNumbers(p, [s.answer]); await clickText(p, '확인'); },
  async review(p, s) {
    const q = await p.locator('.stage .ask').innerText();
    await answerItem(p, s.pool.find((x) => x.q === q));
  },
};

async function pressNumber(p, n) {
  for (const d of String(n)) await p.locator(`.pad-key[aria-label="${d}"]`).click();
}

// 복습 문제 하나 맞히기 (숫자 답 또는 3지선다)
async function answerItem(p, item) {
  if (item.choices) { await p.locator('.choice-btn').nth(item.answer).click(); return; }
  await enterNumbers(p, [item.answer]);
  await clickText(p, '확인');
}

// ---------- 게임 규칙 점검 (CLAUDE.md "게임 규칙") ----------
// 3지선다 보기 3개, 진행 캐릭터 2회마다 교대, 복습 형식(수학 숫자·과학 3지선다), 암호가 화면에 새지 않음
function checkRules(meta, mod, answer) {
  const tag = `rules/${meta.id}`;
  const st = mod.stage;
  if (st.host !== hostFor(meta.week)) fail(`${tag}: 진행 캐릭터 ${st.host} (규칙: ${hostFor(meta.week)})`);
  const steps = [...st.rounds, ...(st.bonus ? [st.bonus] : [])].flatMap((r) => r.steps);
  for (const s of steps) {
    if ((s.kind === 'choice' || s.kind === 'listen') && s.choices.length !== 3) fail(`${tag}: 보기 ${s.choices.length}개 (3개여야 함): ${s.ask}`);
    if (s.hints?.length !== 2 && s.kind !== 'review') fail(`${tag}: 힌트는 2단계여야 함: ${s.ask || s.kind}`);
  }
  const science = meta.subject.startsWith('과학');
  for (const item of mod.review || []) {
    if (item.choices && item.choices.length !== 3) fail(`${tag}: 복습 보기 ${item.choices.length}개: ${item.q}`);
    if (science && !item.choices) fail(`${tag}: 과학 회차 복습은 3지선다여야 함: ${item.q}`);
    if (meta.subject.startsWith('수학') && item.choices) fail(`${tag}: 수학 회차 복습은 숫자 답이어야 함: ${item.q}`);
  }
  if (meta.open && !((mod.review || []).length >= 3 && mod.review.length <= 4)) fail(`${tag}: 복습 문제는 3~4개 (지금 ${(mod.review || []).length}개)`);
  if (answer) {
    // 암호를 반으로 나눠 사이에 두 글자까지 끼어도 걸러냄 (예: '자리를 차지')
    const w = answer.replace(/\s+/g, '');
    const half = Math.ceil(w.length / 2);
    const leak = new RegExp(`${w.slice(0, half)}.{0,2}${w.slice(half)}`);
    const text = JSON.stringify({ st, review: mod.review, ask: mod.clue.ask, title: meta.title }).replace(/\s+/g, '');
    if (leak.test(text)) fail(`${tag}: 화면 문구에 암호 '${answer}'와 거의 같은 표현이 있음`);
  }
}

// 오답 하나를 내 보고 피드백이 나오는지 확인 (고르기 형태만)
async function tryWrong(p, s, tag) {
  if (s.kind !== 'choice' && s.kind !== 'listen') return;
  const wrongIdx = s.choices.findIndex((_, i) => i !== s.answer);
  await p.locator('.choice-btn').nth(wrongIdx).click();
  const said = await p.locator('.talk p').innerText();
  if (!/힌트/.test(said)) fail(`${tag}: 고르기 오답 뒤 힌트 권유가 없음 (${said})`);
}

async function playRound(p, r, tag, { useHint, wrong }) {
  for (let i = 0; i < r.steps.length; i += 1) {
    const s = r.steps[i];
    if (!SOLVE[s.kind]) { fail(`${tag}: 자동 풀이가 없는 문제 형태 ${s.kind}`); return; }
    // 첫 화면에 힌트 버튼이 없는 형태(예: 한 바퀴 돌리기)는 다음 라운드에서 힌트를 씀
    if (useHint.left && await p.locator('.stage button:text-is("힌트 보기")').count()) {
      useHint.left = false;
      await clickText(p, '힌트 보기');
      const said = await p.locator('.talk p').innerText();
      if (said !== s.hints[0]) fail(`${tag}: 힌트 문구가 다름 (${said})`);
    }
    if (wrong) await tryWrong(p, s, tag);
    await SOLVE[s.kind](p, s);
    const next = i === r.steps.length - 1 ? '다음으로' : '다음 문제';
    await p.locator(`.stage button:text-is("${next}")`).click();
  }
}

async function checkOverflow(p, w, tag) {
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  if (sw > w) fail(`${tag}: 가로 넘침 ${sw}px > ${w}px`);
}

const browser = await chromium.launch();
const stages = [];
for (const meta of SEASON1.filter((s) => s.open && s.load)) {
  const mod = (await meta.load()).default;
  const answer = ANSWERS[meta.id];
  if (!answer) fail(`${meta.id}: tests/clue-answers.json에 암호가 없음`);
  else if (hashOf(answer) !== mod.clue.hash) fail(`${meta.id}: 회차 파일의 clue.hash가 암호 '${answer}'와 맞지 않음`);
  stages.push({ meta, mod, answer: answer || '' });
}
for (const meta of SEASON1.filter((s) => s.load)) checkRules(meta, (await meta.load()).default, ANSWERS[meta.id]);

for (const [name, w] of WIDTHS) {
  const full = name === 'mobile';
  const p = await browser.newPage({ viewport: { width: w, height: 900 } });
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => fail(`${name}: 화면 오류 ${e.message}`));
  await p.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: DEMO_CONFIG }));
  await p.route(/jsdelivr|fonts\.googleapis|fonts\.gstatic/, (r) => r.abort());
  await p.clock.setFixedTime(new Date('2026-12-01T09:00:00+09:00')); // 모든 회차 공개 이후
  await p.goto(BASE);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.fill('#uid', 'tester');
  await p.click('text=휴게소 들어가기');
  await p.waitForSelector('.scene');

  for (const { meta, mod, answer } of stages) {
    const tag = `${name}/${meta.id}`;
    try {
      await p.click('[data-door="kitchen"]');
      await p.waitForSelector('.weeks');
      await p.locator('.week', { hasText: meta.title }).locator('button:text-is("시작")').click();
      await p.waitForSelector('.stage h2');
      await checkOverflow(p, w, `${tag}/intro`);
      await clickText(p, mod.stage.intro.start);
      const hint = { left: full }; // 휴대폰 폭에서는 힌트를 한 번 써 보고 '힌트 없이' 경험치가 빠지는지 확인
      for (const [i, r] of mod.stage.rounds.entries()) {
        await playRound(p, r, `${tag}/r${i + 1}`, { useHint: hint, wrong: full });
        await checkOverflow(p, w, `${tag}/r${i + 1}`);
      }
      if (mod.stage.bonus) {
        await clickText(p, '도전하기');
        await playRound(p, mod.stage.bonus, `${tag}/bonus`, { useHint: {}, wrong: full });
      }
      await p.waitForSelector('.result');
      if (!(await p.locator(`.result .bubble-${hostFor(meta.week)}`).count())) fail(`${tag}: 결과 화면 대사가 진행 캐릭터가 아님`);
      if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}-${meta.id}-result.png`, fullPage: true });
      await p.click('.result >> text=암호 입력');
      await p.fill('#clue', '틀린 암호');
      await p.click('.clue-form button:text-is("확인")');
      if (!/아닌|아니/.test(await p.locator('.talk p').innerText())) fail(`${tag}: 틀린 암호가 통과됨`);
      await p.fill('#clue', ` ${answer.slice(0, 2)} ${answer.slice(2)} `); // 띄어쓰기는 무시되어야 함
      await p.click('.clue-form button:text-is("확인")');
      const said = await p.locator('.talk p').innerText();
      if (!/단서 카드 획득/.test(said)) fail(`${tag}: 암호 입력 실패 (${said})`);
      if (!(await p.locator(`.talk .bubble-${hostFor(meta.week)}`).count())) fail(`${tag}: 암호 화면 대사가 진행 캐릭터가 아님`);
      await checkOverflow(p, w, `${tag}/clue`);

      const db = await p.evaluate(() => JSON.parse(localStorage.getItem('hyugeso-demo-v1')));
      const log = db.xpLog.filter((x) => x.stage_id === meta.id).map((x) => x.source).sort().join(',');
      const expect = ['clear', 'team', 'clue', ...(mod.stage.bonus ? ['bonus'] : []), ...(full && !hint.left ? [] : ['no_hint'])].sort().join(',');
      if (log !== expect) fail(`${tag}: 경험치 기록 ${log} (기대 ${expect})`);
      if (!db.progress[meta.id]?.cleared) fail(`${tag}: 클리어 기록 없음`);
      await p.click('.clue-form button:text-is("휴게소로")');
      await p.waitForSelector('.scene');
      await p.click('.strip-link');
      const card = p.locator('.clue-card').nth(SEASON1.indexOf(meta));
      if ((await card.locator('.clue-word').innerText()) !== answer.replace(/\s+/g, '')) fail(`${tag}: 단서 도감에 암호가 안 보임`);
      await p.click('.clue-book button:text-is("휴게소로")');
      await p.waitForSelector('.scene');
      console.log(`ok  ${tag}`);
    } catch (err) {
      fail(`${tag}: ${err.message.split('\n')[0]}`);
      if (SHOTS) await p.screenshot({ path: `${SHOTS}/${name}-${meta.id}-fail.png`, fullPage: true });
      await p.goto(BASE); await p.waitForSelector('.scene');
    }
  }
  if (full) await extraChecks(p, w);
  await p.close();
}
await browser.close();

// 만드는 중인 회차(load는 있고 open: false)와 2층·지하 화면 (휴대폰 폭에서 한 번)
async function extraChecks(p, w) {
  const draft = SEASON1.filter((s) => !s.open && s.load);
  for (const meta of draft) {
    const tag = `draft/${meta.id}`;
    try {
      const mod = (await meta.load()).default;
      // 12회차 자물쇠는 모든 단서가 있어야 열림 → 체험 기록에 단서를 채워 둠
      await p.evaluate((ids) => {
        const db = JSON.parse(localStorage.getItem('hyugeso-demo-v1'));
        for (const id of ids) if (!db.clues[id]) db.clues[id] = { at: new Date().toISOString(), word: `단서${id.slice(-2)}` };
        localStorage.setItem('hyugeso-demo-v1', JSON.stringify(db));
      }, mod.id === 's1-w12' ? SEASON1.map((s) => s.id) : []);
      await p.evaluate(async (id) => {
        const m = (await import(`./js/stages/${id}.js`)).default;
        const app = document.getElementById('app');
        app.replaceChildren(); window.__done = null;
        m.mount(app, { finish: (r) => { window.__done = r; }, exit: () => {} });
      }, meta.id);
      if (mod.id === 's1-w12') {
        await p.waitForSelector('.locks');
        const open = await p.locator('.lock.is-open').count();
        if (open !== SEASON1.length) fail(`${tag}: 열린 자물쇠 ${open}개`);
        await checkOverflow(p, w, `${tag}/locks`);
        await clickText(p, '지하 문 열기');
      }
      await clickText(p, mod.stage.intro.start);
      for (const [i, r] of mod.stage.rounds.entries()) {
        await playRound(p, r, `${tag}/r${i + 1}`, { useHint: {}, wrong: true });
        await checkOverflow(p, w, `${tag}/r${i + 1}`);
      }
      if (mod.stage.bonus) { await clickText(p, '도전하기'); await playRound(p, mod.stage.bonus, `${tag}/bonus`, { useHint: {} }); }
      const done = await p.evaluate(() => window.__done);
      if (!done || done.bonus !== !!mod.stage.bonus) fail(`${tag}: 끝까지 가지 못함 ${JSON.stringify(done)}`);
      console.log(`ok  ${tag}`);
    } catch (err) { fail(`${tag}: ${err.message.split('\n')[0]}`); }
  }

  // 2주 후 복습 퀴즈: 예약 날짜를 앞당겨 공개된 회차의 복습을 모두 풀어 봄
  try {
    await p.evaluate(() => {
      const db = JSON.parse(localStorage.getItem('hyugeso-demo-v1'));
      db.reviews.forEach((r, i) => { r.due_at = new Date(Date.now() - (100 - i) * 1000).toISOString(); });
      localStorage.setItem('hyugeso-demo-v1', JSON.stringify(db));
    });
    for (const { meta, mod } of stages) {
      await p.goto(BASE); await p.waitForSelector('.scene');
      await p.click('.review-alert button');
      await p.waitForSelector('.stage .ask');
      const head = await p.locator('.stage h2').innerText();
      const { mod: m, meta: mt } = stages.find((x) => head.startsWith(`${x.meta.week}회차`));
      const q = await p.locator('.stage .ask').innerText();
      const item = m.review.find((x) => x.q === q);
      if (!(await p.locator(`.talk .bubble-${hostFor(mt.week)}`).count())) fail(`review/${mt.id}: 복습 대사가 진행 캐릭터가 아님`);
      await answerItem(p, item);
      try { await p.locator('.talk p', { hasText: '+40' }).waitFor({ timeout: 5000 }); } catch { fail(`review/${mt.id}: 복습 정답 경험치 없음 (${await p.locator('.talk p').innerText()})`); }
      await checkOverflow(p, w, `review/${mt.id}`);
      void meta; void mod;
    }
    console.log('ok  review');
  } catch (err) { fail(`review: ${err.message.split('\n')[0]}`); }

  // 2층: 6회차 클리어 기록을 넣고 복습실·전시실 확인
  try {
    await p.evaluate(() => {
      const db = JSON.parse(localStorage.getItem('hyugeso-demo-v1'));
      db.progress['s1-w06'] = { stage_id: 's1-w06', cleared: true, attempts: 1, hints_used: 0, cleared_at: new Date().toISOString() };
      localStorage.setItem('hyugeso-demo-v1', JSON.stringify(db));
    });
    await p.goto(BASE); await p.waitForSelector('.scene');
    await p.click('[data-door="floor2"]');
    await p.click('.room-btn:has-text("복습실")');
    await p.locator('.gallery-item').first().locator('button').click();
    const mod = (await SEASON1[0].load()).default;
    const q = await p.locator('.stage .ask').innerText(); // 문제는 무작위라 화면에서 읽음
    const it = mod.review.find((x) => x.q === q);
    await enterNumbers(p, [it.answer + 1]);
    await clickText(p, '확인');
    if (!/너무 많은/.test(await p.locator('.talk p').innerText())) fail('floor2: 연습 오답 피드백 없음');
    await clickText(p, '⌫'); await clickText(p, '지우기');
    await pressNumber(p, it.answer);
    await clickText(p, '확인');
    if (!/맞는 거지/.test(await p.locator('.talk p').innerText())) fail('floor2: 연습 정답 처리 안 됨');
    await checkOverflow(p, w, 'floor2/practice');
    await p.click('.actions button:text-is("복습실로")');
    await p.click('button:text-is("2층으로")');
    await p.click('.room-btn:has-text("단서 전시실")');
    const words = await p.locator('.gallery .clue-word').allInnerTexts();
    if (!words.includes(ANSWERS['s1-w01'])) fail(`floor2: 전시실에 단서가 안 보임 (${words.join(',')})`);
    await checkOverflow(p, w, 'floor2/gallery');
    console.log('ok  floor2');
  } catch (err) { fail(`floor2: ${err.message.split('\n')[0]}`); }
}

if (errors.length) {
  console.error(`\n실패 ${errors.length}건\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`\n모든 회차 통과 (${stages.length}개 × ${WIDTHS.length}폭)`);

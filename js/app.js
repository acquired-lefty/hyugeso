import { store, STATUS_MESSAGE } from './store.js';
import { h, bubble, normalize, clueHash } from './ui.js';
import { sceneSvg } from './scene.js';
import { levelProgress, XP_LABEL } from './xp.js';
import { SEASON1, TEAM_GOAL_ID, CLUE_TOTAL, stageStatus, opensLabel, hostFor } from './stages/index.js';
import { LINES } from './characters.js';
import { AVATAR_PARTS, avatarSvg, normalizeAvatar } from './avatar.js';
import { youtubeId, embedUrl, watchUrl } from './video.js';
import { keypad } from './stages/engine.js';

const root = document.getElementById('app');
let profile = null;
let teamBadge = false; // 공동 목표 달성 칭호 표시 여부 (휴게소 화면에서 갱신)
let settings = {};      // 회차 설정(공개 날짜·영상 주소), 로그인할 때 불러옴
const shownName = (p) => p.display_name || p.nickname;

function showError(err, retry) {
  root.replaceChildren(h('section', { class: 'panel' },
    bubble('kkam', err.message || '문제가 생긴 거지.'),
    h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: retry }, '다시 시도'))));
}

async function guard(fn) {
  try { await fn(); } catch (err) { console.error(err); showError(err, () => guard(fn)); }
}

// ---------- 로그인 ----------
function renderLogin(message) {
  const idInput = h('input', { id: 'uid', name: 'uid', autocomplete: 'username', autocapitalize: 'none', required: true });
  const pwInput = h('input', { id: 'pw', name: 'pw', type: 'password', autocomplete: 'current-password', required: !store.isDemo });
  const note = h('p', { class: 'form-note', role: 'alert' }, message || '');

  const form = h('form', {
    class: 'login',
    onsubmit: async (e) => {
      e.preventDefault();
      note.textContent = '';
      try {
        await store.login(idInput.value, pwInput.value);
        await boot();
      } catch (err) { note.textContent = err.message; }
    },
  },
  h('label', { for: 'uid' }, '아이디'), idInput,
  h('label', { for: 'pw' }, store.isDemo ? '비밀번호 (체험 모드에서는 비워도 돼요)' : '비밀번호'), pwInput,
  note,
  h('button', { class: 'btn primary wide', type: 'submit' }, '휴게소 들어가기'));

  root.replaceChildren(h('section', { class: 'panel login-panel' },
    h('h1', { class: 'title' }, '어딘가 수상한 휴게소'),
    bubble('kkam', '…손님? 이름표부터 보여 주는 거지.'),
    form,
    h('p', { class: 'signup-link' }, '처음 왔나요? ', h('button', { class: 'link', type: 'button', onclick: () => renderSignup() }, '가입 신청하기')),
    store.isDemo ? h('p', { class: 'demo-note' }, '체험 모드: 기록이 이 기기에만 저장돼요.') : null));
}

// ---------- 가입 신청 (아이디·비밀번호만, 대표님 승인 후 사용) ----------
function renderSignup() {
  const idInput = h('input', { id: 'su-id', autocomplete: 'username', autocapitalize: 'none', required: true, maxlength: 20 });
  const pwInput = h('input', { id: 'su-pw', type: 'password', autocomplete: 'new-password', required: true, minlength: 6 });
  const pw2Input = h('input', { id: 'su-pw2', type: 'password', autocomplete: 'new-password', required: true, minlength: 6 });
  const guardian = h('input', { id: 'su-guardian', type: 'checkbox' });
  const guardianRow = h('label', { class: 'check-row', for: 'su-guardian' }, guardian, ' 보호자(엄마·아빠 등)와 함께 신청하고 있어요');
  const age = (value, label) => h('label', { class: 'choice-chip' },
    h('input', { type: 'radio', name: 'su-age', value, onchange: () => { guardianRow.hidden = value !== 'child'; } }), ` ${label}`);
  const note = h('p', { class: 'form-note', role: 'alert' });
  guardianRow.hidden = true;

  const form = h('form', {
    class: 'login',
    onsubmit: async (e) => {
      e.preventDefault();
      note.textContent = '';
      if (pwInput.value !== pw2Input.value) { note.textContent = '비밀번호 두 칸이 서로 달라요.'; return; }
      const ageGroup = form.querySelector('input[name="su-age"]:checked')?.value;
      try {
        const res = await store.signup(idInput.value, pwInput.value, { ageGroup, guardianOk: guardian.checked });
        root.replaceChildren(h('section', { class: 'panel login-panel' },
          h('h1', { class: 'title' }, res.pending ? '신청 완료' : '가입 완료'),
          bubble('kkam', res.pending
            ? '신청서는 받은 거지. 대표님이 확인하고 승인하면 들어올 수 있는 거지.'
            : '체험 모드라 바로 들어갈 수 있는 거지.'),
          h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => renderLogin() }, '로그인 화면으로'))));
      } catch (err) { note.textContent = err.message; }
    },
  },
  h('label', { for: 'su-id' }, '아이디 (영어 소문자·숫자, 2~20글자)'), idInput,
  h('label', { for: 'su-pw' }, '비밀번호 (6글자 이상)'), pwInput,
  h('label', { for: 'su-pw2' }, '비밀번호 한 번 더'), pw2Input,
  h('fieldset', { class: 'age-field' },
    h('legend', {}, '누가 쓰나요?'),
    age('child', '어린이 (만 14세 미만)'), age('adult', '어른')),
  guardianRow,
  h('p', { class: 'small muted' }, '이름·학교·연락처는 받지 않아요. 아이디도 실제 이름 말고 별명으로 정해 주세요.'),
  note,
  h('button', { class: 'btn primary wide', type: 'submit' }, '가입 신청 보내기'));

  root.replaceChildren(h('section', { class: 'panel login-panel' },
    h('header', { class: 'stage-head' },
      h('button', { class: 'link', onclick: () => renderLogin() }, '로그인으로'),
      h('span', { class: 'stage-step' }, '가입 신청')),
    h('h1', { class: 'title' }, '가입 신청'),
    form));
}

// ---------- 상단 상태 ----------
function statusBar() {
  const pct = Math.round(levelProgress(profile.xp) * 100);
  return h('header', { class: 'status' },
    h('div', { class: 'who' },
      h('button', { class: 'who-btn', onclick: () => guard(renderProfile), 'aria-label': '내 프로필 꾸미기' },
        h('span', { class: 'who-avatar', html: avatarSvg(normalizeAvatar(profile.avatar, profile.nickname), { size: 36 }) }),
        h('strong', {}, shownName(profile))),
      h('span', { class: 'lv' }, `Lv.${profile.level}`),
      h('span', { class: 'title-badge' }, profile.title),
      teamBadge ? h('span', { class: 'title-badge team-badge' }, TEAM_TITLE) : null,
      profile.is_admin ? h('a', { class: 'link small', href: 'admin.html' }, '대시보드') : null),
    h('div', { class: 'xpbar', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': '다음 레벨까지' },
      h('span', { style: `width:${pct}%` })),
    h('button', { class: 'link small', onclick: async () => { await store.logout(); profile = null; teamBadge = false; renderLogin(); } }, '나가기'));
}

// ---------- 휴게소 (허브) ----------
const FLOOR2_STAGE = 's1-w06';   // 이 회차를 클리어하면 2층이 열림
const BASEMENT_STAGE = 's1-w12'; // 이 회차를 클리어하면 지하가 열림
const TEAM_TITLE = '부엌 지킴이'; // 공동 목표 달성 + 한 번이라도 보탠 친구에게 붙는 칭호

const DOOR_LINE = {
  arcade: '오락실은 아직 잠겨 있는 거지. 부엌 주문부터.',
  bus: '버스는 아직 안 오는 거지. 시간표가 비어 있어.',
  floor2: '2층은 6회차 주문을 끝내면 불이 켜지는 거지.',
  basement: '…거긴 아직. 12회차까지 단서를 모아야 하는 거지.',
};

async function renderHub() {
  const [clues, team, due, progress, helped] = await Promise.all([
    store.listClues(), store.teamGoal(TEAM_GOAL_ID), store.dueReviews(), store.allProgress(), store.helpedTeam(),
  ]);
  const teamDone = !!team && team.current >= team.target;
  teamBadge = teamDone && helped;
  const open = {
    kitchen: true, arcade: false, bus: false,
    floor2: !!progress[FLOOR2_STAGE]?.cleared,
    basement: !!progress[BASEMENT_STAGE]?.cleared,
  };

  const reviewAlert = due.length ? h('section', { class: 'review-alert' },
    bubble('kkam', `2주 전에 풀었던 주문, 기억나는지 보는 거지. 복습할 단서 ${due.length}개.`),
    h('button', { class: 'btn primary wide', onclick: () => guard(() => renderReview(due[0])) }, '복습하기')) : '';
  const tip = h('div', { class: 'scene-tip' }, bubble('kkam', teamDone
    ? '부엌 공동 목표를 다 채운 거지. 친구들 덕분에 휴게소가 반짝이는 거지.'
    : '불 켜진 문을 눌러 보는 거지.'));
  const scene = h('section', { class: 'scene', html: sceneSvg(open, { deco: teamDone }) });

  scene.querySelectorAll('[data-door]').forEach((el) => {
    const go = () => {
      const key = el.dataset.door;
      if (key === 'kitchen') guard(renderKitchen);
      else if (key === 'floor2' && open.floor2) guard(renderFloor2);
      else if (key === 'basement' && open.basement) guard(renderBasement);
      else tip.replaceChildren(bubble('kkam', DOOR_LINE[open[key] ? `${key}Open` : key] || DOOR_LINE[key]));
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  const teamPct = team ? Math.round((team.current / team.target) * 100) : 0;
  root.replaceChildren(
    statusBar(),
    // replaceChildren은 null을 "null" 글자로 표시하므로 빈 문자열 사용
    store.isDemo ? h('p', { class: 'demo-note' }, '체험 모드: 기록이 이 기기에만 저장돼요.') : '',
    h('div', { class: 'hub-layout' },
      scene,
      h('div', { class: 'hub-side' },
        reviewAlert,
        tip,
        h('section', { class: 'strip' },
          h('button', { class: 'strip-item strip-link', onclick: () => guard(renderClueBook) },
            h('span', { class: 'strip-label' }, '단서 도감 보기'),
            h('strong', {}, `${Object.keys(clues).length} / ${CLUE_TOTAL}`)),
          team ? h('div', { class: 'strip-item grow' },
            h('span', { class: 'strip-label' }, teamDone ? `${team.title} 달성!` : `${team.title}, 친구들과 함께`),
            h('div', { class: 'teambar' }, h('span', { style: `width:${teamPct}%` })),
            h('span', { class: 'small muted' }, `${team.current} / ${team.target}`)) : null))));
}

// ---------- 2층 (6회차 클리어 후): 복습실 + 단서 전시실 ----------
const pageHead = (label, back) => h('header', { class: 'stage-head' },
  h('button', { class: 'link', onclick: () => guard(back) }, back === renderHub ? '휴게소로' : '2층으로'),
  h('span', { class: 'stage-step' }, label));

function renderFloor2() {
  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel floor2' },
      pageHead('2층', renderHub),
      h('h2', {}, '휴게소 2층'),
      bubble('kkam', '2층 불이 켜진 거지. 지난 문제를 다시 풀어 보는 방, 모은 단서와 영상을 모아 둔 방이 있는 거지.'),
      h('div', { class: 'room-grid' },
        h('button', { class: 'room-btn', onclick: () => guard(renderPracticeRoom) },
          h('strong', {}, '복습실'), h('span', { class: 'small' }, '끝낸 회차 문제를 언제든 다시 풀어요. 연습이라 경험치는 없어요.')),
        h('button', { class: 'room-btn', onclick: () => guard(renderGallery) },
          h('strong', {}, '단서 전시실'), h('span', { class: 'small' }, '모은 단서와 회차 영상을 다시 봐요.')))));
}

async function renderPracticeRoom() {
  const progress = await store.allProgress();
  const done = SEASON1.filter((s) => s.load && progress[s.id]?.cleared);
  const items = await Promise.all(done.map(async (s) => ({ s, mod: (await s.load()).default })));
  const usable = items.filter(({ mod }) => mod.review?.length);
  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel' },
      pageHead('복습실', renderFloor2),
      h('h2', {}, '복습실'),
      bubble('kkam', usable.length ? '풀고 싶은 회차를 고르는 거지. 몇 번이고 다시 해도 되는 거지.' : '아직 다시 풀 회차가 없는 거지.'),
      h('ol', { class: 'gallery' }, ...usable.map(({ s, mod }) => h('li', { class: 'gallery-item' },
        h('span', {}, h('strong', {}, `${s.week}회 `), s.subject),
        h('button', { class: 'btn primary small', onclick: () => guard(() => renderPractice(s, mod)) }, '연습하기'))))));
}

// 연습 문제: 기록·경험치 없음, 오답은 방향만, 한 번 틀리면 힌트 버튼 (말은 그 회차 진행 캐릭터)
function renderPractice(meta, mod) {
  const item = mod.review[Math.floor(Math.random() * mod.review.length)];
  const who = hostFor(meta.week);
  const L = LINES[who];
  let hintStep = 0;
  const talk = h('div', { class: 'talk' }, bubble(who, `${meta.week}회차 연습. ${L.pickFirst}`));
  const say = (text) => talk.replaceChildren(bubble(who, text));
  const hintBtn = h('button', {
    class: 'btn ghost', disabled: true,
    onclick: () => {
      if (hintStep >= item.hints.length) { say(L.noMore); return; }
      say(item.hints[hintStep]); hintStep += 1;
    },
  }, '힌트 보기');
  const actions = h('div', { class: 'actions' });
  const again = h('button', { class: 'btn ghost', onclick: () => renderPractice(meta, mod) }, '다른 문제');
  const answer = reviewAnswer(item, {
    onRight: () => {
      say(`${item.choices ? item.choices[item.answer] : `${item.answer}${item.unit}`}. ${L.practiceOk}`);
      actions.replaceChildren(again, h('button', { class: 'btn primary', onclick: () => guard(renderPracticeRoom) }, '복습실로'));
    },
    onWrong: (dir) => { hintBtn.disabled = false; say(`${dir === 'more' ? L.tooMany : dir === 'less' ? L.tooFew : L.notIt} ${L.offer}`); },
    onEmpty: () => say(item.choices ? L.pickFirst : L.typeFirst),
  });
  actions.replaceChildren(again, hintBtn, ...answer.buttons);
  root.replaceChildren(
    statusBar(),
    h('div', { class: 'stage-holder' },
      h('section', { class: 'stage' },
        h('header', { class: 'stage-head' },
          h('button', { class: 'link', onclick: () => guard(renderPracticeRoom) }, '복습실로'),
          h('span', { class: 'stage-step' }, '연습')),
        h('h2', {}, `${meta.week}회차 연습: ${meta.subject}`),
        talk, h('p', { class: 'ask' }, item.q), answer.el, actions)));
}

// 복습 문제 답하기 칸: 숫자 답은 숫자 버튼, 보기가 있으면 3지선다
// onWrong('more' | 'less' | 'no'), 답하면 버튼을 잠그고, unlock()으로 다시 풀 수 있게 함
function reviewAnswer(item, { onRight, onWrong, onEmpty }) {
  let el;
  let get;
  const lock = (on) => el.querySelectorAll('button').forEach((b) => { b.disabled = on; });
  const judge = (v) => {
    if (v == null) { onEmpty(); return; }
    if (v === item.answer) { lock(true); onRight(); return; }
    onWrong(item.choices ? 'no' : v > item.answer ? 'more' : 'less');
  };
  if (item.choices) {
    el = h('div', { class: 'choice-list' }, ...item.choices.map((c, i) => h('button', { class: 'choice-btn', onclick: () => judge(i) }, c)));
    return { el, buttons: [], lock, judge };
  }
  const pad = keypad(item.unit);
  el = pad.el;
  get = pad.get;
  const check = h('button', { class: 'btn primary', onclick: () => judge(get()) }, '확인');
  return { el, buttons: [check], lock, judge, check };
}

async function renderGallery() {
  const clues = await store.listClues();
  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel' },
      pageHead('단서 전시실', renderFloor2),
      h('h2', {}, '단서 전시실'),
      bubble('kkam', '모은 단서와 회차 영상을 모아 둔 거지. 못 찾은 단서는 영상을 다시 보면 있는 거지.'),
      h('ol', { class: 'gallery' }, ...SEASON1.map((s) => {
        const got = clues[s.id];
        const video = youtubeId(settings[s.id]?.video_url);
        return h('li', { class: 'gallery-item' },
          h('span', {}, h('strong', {}, `${s.week}회 `), s.title, ' · ', h('strong', { class: 'clue-word' }, got ? got.word || '✓' : '?')),
          video ? h('button', { class: 'btn ghost small', onclick: () => guard(() => renderVideo(s, renderGallery)) }, '영상 보기') : '');
      }))));
}

// ---------- 지하 (12회차 클리어 후) ----------
async function renderBasement() {
  const clues = await store.listClues();
  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel' },
      pageHead('지하', renderHub),
      h('h2', {}, '지하의 잠긴 방'),
      bubble('ddal', '자물쇠 12개가 모두 열린 방입니다만. 시즌1을 끝까지 온 손님만 들어올 수 있습니다만.'),
      h('ol', { class: 'clue-grid' }, ...SEASON1.map((s) => h('li', { class: `clue-card ${clues[s.id] ? 'is-got' : ''}` },
        h('span', { class: 'clue-week' }, `${s.week}회`),
        h('strong', { class: 'clue-word' }, clues[s.id]?.word || (clues[s.id] ? '✓' : '?')))))));
}

// ---------- 단서 도감 ----------
async function renderClueBook() {
  const clues = await store.listClues();
  const day = (iso) => new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  const cards = SEASON1.map((s) => {
    const got = clues[s.id];
    return h('li', { class: `clue-card ${got ? 'is-got' : ''}` },
      h('span', { class: 'clue-week' }, `${s.week}회`),
      h('strong', { class: 'clue-word' }, got ? got.word || '✓' : '?'),
      h('span', { class: 'small muted' }, got ? `${day(got.at)} 발견` : s.title));
  });
  const count = Object.keys(clues).length;

  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel clue-book' },
      h('header', { class: 'stage-head' },
        h('button', { class: 'link', onclick: () => guard(renderHub) }, '휴게소로'),
        h('span', { class: 'stage-step' }, '단서 도감')),
      h('h2', {}, `단서 도감 ${count} / ${CLUE_TOTAL}`),
      bubble('kkam', count
        ? '모은 단서는 지하의 잠긴 방을 여는 열쇠가 되는 거지. 하나도 잃어버리면 안 되는 거지.'
        : '아직 단서가 없는 거지. 영상에서 암호를 찾아 부엌에서 입력하는 거지.'),
      h('ol', { class: 'clue-grid' }, ...cards)));
}

// ---------- 부엌 (회차 목록) ----------
async function renderKitchen() {
  const progress = await store.allProgress();
  const list = h('ol', { class: 'weeks' }, ...SEASON1.map((s) => {
    const done = progress[s.id]?.cleared;
    const st = stageStatus(s, { isAdmin: !!profile.is_admin, settings });
    const playable = st === 'open' || st === 'preview';
    const label = st === 'soon' ? opensLabel(s, settings) : '잠김';
    const video = youtubeId(settings[s.id]?.video_url);
    return h('li', { class: `week ${done ? 'is-done' : playable ? 'is-open' : 'is-locked'}` },
      h('span', { class: 'week-num' }, `${s.week}회`),
      h('div', { class: 'week-body' },
        h('strong', {}, s.title),
        h('span', { class: 'small muted' }, s.subject, st === 'preview' ? h('span', { class: 'nowrap' }, ` · 미리보기 (${opensLabel(s, settings)})`) : null)),
      playable
        ? h('div', { class: 'week-actions' },
          h('button', { class: 'btn primary small', onclick: () => guard(() => runStage(s)) }, done ? '다시 하기' : '시작'),
          video ? h('button', { class: 'btn ghost small', onclick: () => guard(() => renderVideo(s)) }, '영상 보기') : null,
          h('button', { class: 'btn ghost small', onclick: () => guard(() => renderClue(s)) }, '암호 입력'))
        : h('span', { class: 'small muted' }, done ? '완료' : label));
  }));

  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel kitchen' },
      h('header', { class: 'stage-head' },
        h('button', { class: 'link', onclick: () => guard(renderHub) }, '휴게소로'),
        h('span', { class: 'stage-step' }, '부엌')),
      h('h2', {}, '부엌 주문판'),
      bubble('tipo', '이번 회차 주문만 열려 있어. 나머지는… 기다려. not bad한 건 원래 천천히 와.'),
      list));
}

// ---------- 영상 단서 입력 ----------
async function renderClue(stageMeta, afterResult) {
  const mod = (await stageMeta.load()).default;
  if (!mod.clue.hash) throw new Error('이 회차 암호는 아직 준비 중인 거지. 나중에 다시 오는 거지.');
  const who = hostFor(stageMeta.week);
  const L = LINES[who];
  const already = await store.hasClue(mod.clue.id);
  const backLabel = afterResult ? '휴게소로' : '부엌으로';
  const goBack = () => guard(afterResult ? renderHub : renderKitchen);
  const input = h('input', { id: 'clue', autocomplete: 'off' });
  const note = h('div', { class: 'talk' }, bubble(who, already ? L.clueAlready : mod.clue.ask));
  const submitBtn = h('button', { class: 'btn primary', type: 'submit' }, '확인');
  let bar = statusBar();

  const form = h('form', {
    class: 'clue-form',
    onsubmit: async (e) => {
      e.preventDefault();
      const wrong = () => note.replaceChildren(bubble(who, L.clueWrong));
      const typed = normalize(input.value);
      if (!typed || await clueHash(typed) !== mod.clue.hash) { wrong(); return; }
      submitBtn.disabled = true;
      let res;
      try { res = await store.collectClue(profile, mod.clue.id, typed); } catch (err) {
        note.replaceChildren(bubble(who, err.message)); submitBtn.disabled = false; return;
      }
      if (!res.ok) { wrong(); submitBtn.disabled = false; return; }
      profile = res.profile;
      if (res.isNew) {
        note.replaceChildren(bubble(who, L.clueGot(res.gained)));
        const fresh = statusBar(); bar.replaceWith(fresh); bar = fresh;
      } else {
        note.replaceChildren(bubble(who, L.clueHave));
      }
      // 맞힌 뒤에는 확인 버튼을 다음 화면으로 가는 버튼으로 바꿈
      input.disabled = true;
      const next = h('button', { class: 'btn primary', type: 'button', onclick: goBack }, backLabel);
      submitBtn.replaceWith(next);
      next.focus();
    },
  },
  h('label', { for: 'clue' }, '영상 암호'), input,
  submitBtn);

  root.replaceChildren(
    bar,
    h('section', { class: 'panel clue-panel' },
      h('header', { class: 'stage-head' },
        h('button', { class: 'link', onclick: goBack }, backLabel),
        h('span', { class: 'stage-step' }, `${stageMeta.week}회차 단서`)),
      clueVideo(stageMeta),
      note,
      already
        ? h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: goBack }, backLabel))
        : form));
}

// ---------- 복습 퀴즈 (첫 클리어 14일 후) ----------
// 두 번 안에 맞히면 정답으로 기록하고 경험치, 두 번 다 틀리면 오답으로 기록 (정답은 알려 주지 않음)
const REVIEW_TRIES = 2;

async function findStageByConcept(conceptId) {
  for (const s of SEASON1.filter((x) => x.open && x.load)) {
    const mod = (await s.load()).default;
    if (mod.conceptId === conceptId) return { meta: s, mod };
  }
  return null;
}

async function renderReview(review) {
  const found = await findStageByConcept(review.concept_id);
  const questions = found?.mod.review || [];
  if (!questions.length) throw new Error('이 복습 문제는 아직 준비 중인 거지. 나중에 다시 오는 거지.');
  const { meta } = found;
  const item = questions[Math.floor(Math.random() * questions.length)];
  const who = hostFor(meta.week);
  const L = LINES[who];
  // 3지선다는 두 번이면 답이 좁혀져서 한 번만, 숫자 답은 두 번까지
  const maxTries = item.choices ? 1 : REVIEW_TRIES;

  let tries = 0;
  let hintStep = 0;
  let practice = false;

  const talk = h('div', { class: 'talk' }, bubble(who, L.reviewIntro(meta.week)));
  const say = (text) => talk.replaceChildren(bubble(who, text));
  const hintBtn = h('button', { class: 'btn ghost', type: 'button', disabled: true, onclick: showHint }, '힌트 보기');
  const actions = h('div', { class: 'actions' });

  function showHint() {
    if (hintStep >= item.hints.length) { say(L.noMore); return; }
    say(item.hints[hintStep]);
    hintStep += 1;
  }

  function endButtons(extra) {
    answer.lock(true);
    actions.replaceChildren(
      extra || '',
      h('button', { class: 'btn primary', type: 'button', onclick: () => guard(renderHub) }, '휴게소로'));
  }

  const shown = () => (item.choices ? item.choices[item.answer] : `${item.answer}${item.unit}`);
  const answer = reviewAnswer(item, {
    onEmpty: () => say(item.choices ? L.pickFirst : L.typeFirst),
    onRight: () => guard(async () => {
      tries += 1;
      if (practice) { say(`${shown()}. ${L.practiceOk}`); endButtons(); return; }
      const res = await store.answerReview(profile, review.id, true, meta.id);
      profile = res.profile;
      say(`${L.reviewOk(res.gained)}${res.levelUp ? ` Lv.${profile.level}!` : ''}`);
      endButtons();
    }),
    onWrong: (d) => guard(async () => {
      tries += 1;
      const dir = d === 'more' ? L.tooMany : d === 'less' ? L.tooFew : L.notIt;
      if (practice || tries < maxTries) {
        hintBtn.disabled = false;
        say(`${dir} ${L.reviewAgain}`);
        return;
      }
      answer.lock(true);
      profile = (await store.answerReview(profile, review.id, false, meta.id)).profile;
      say(`${dir} ${L.reviewEnd}`);
      endButtons(h('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => {
          practice = true; tries = 0;
          answer.lock(false); hintBtn.disabled = false;
          actions.replaceChildren(hintBtn, ...answer.buttons);
          say(L.practiceAgain);
        },
      }, '연습으로 다시 풀기'));
    }),
  });
  actions.replaceChildren(hintBtn, ...answer.buttons);

  root.replaceChildren(
    statusBar(),
    h('div', { class: 'stage-holder' },
      h('section', { class: 'stage review-form' },
        h('header', { class: 'stage-head' },
          h('button', { class: 'link', onclick: () => guard(renderHub) }, '휴게소로'),
          h('span', { class: 'stage-step' }, '복습 퀴즈')),
        h('h2', {}, `${meta.week}회차 복습: ${meta.subject}`),
        talk,
        h('p', { class: 'ask' }, item.q),
        answer.el,
        actions)));
}

// ---------- 내 프로필 (아바타 꾸미기·닉네임) ----------
const PART_LABEL = { base: '모양', color: '색', eyes: '눈', acc: '꾸미기' };

async function renderProfile() {
  const draft = normalizeAvatar(profile.avatar, profile.nickname);
  const preview = h('div', { class: 'avatar-preview' });
  const paint = () => { preview.innerHTML = avatarSvg(draft, { size: 120, label: '내 아바타 미리보기' }); };
  const groups = Object.entries(AVATAR_PARTS).map(([part, options]) => {
    const btns = options.map((o) => h('button', {
      type: 'button', class: 'part-btn', 'aria-pressed': String(draft[part] === o.id),
      style: o.hex ? `--swatch:${o.hex}` : null,
      onclick: () => {
        draft[part] = o.id;
        btns.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i].id === o.id)));
        paint();
      },
    }, o.hex ? h('span', { class: 'swatch' }) : null, o.name));
    return h('fieldset', { class: 'part-group' }, h('legend', {}, PART_LABEL[part]), h('div', { class: 'part-row' }, ...btns));
  });
  paint();

  const nameInput = h('input', { id: 'pf-name', maxlength: 12, value: profile.display_name_pending || profile.display_name || '' });
  const note = h('p', { class: 'form-note', role: 'status' });
  const pendingNote = () => (profile.display_name_pending
    ? `"${profile.display_name_pending}"는 대표님 승인을 기다리는 중이에요.`
    : '닉네임은 대표님이 승인하면 보여요. 실제 이름은 적지 말아 주세요.');
  const pendingEl = h('p', { class: 'small muted' }, pendingNote());

  const save = h('button', {
    class: 'btn primary', type: 'button',
    onclick: async () => {
      save.disabled = true; note.textContent = '';
      try {
        const name = nameInput.value.trim();
        profile = await store.updateMyProfile(profile, { avatar: { ...draft }, name: name && name !== profile.display_name ? name : null });
        note.textContent = '저장했어요.';
        pendingEl.textContent = pendingNote();
        root.querySelector('.status').replaceWith(statusBar());
      } catch (err) { note.textContent = err.message; } finally { save.disabled = false; }
    },
  }, '저장');

  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel profile-panel' },
      h('header', { class: 'stage-head' },
        h('button', { class: 'link', onclick: () => guard(renderHub) }, '휴게소로'),
        h('span', { class: 'stage-step' }, '내 프로필')),
      h('h2', {}, '내 프로필'),
      h('div', { class: 'profile-grid' },
        h('div', { class: 'profile-left' }, preview,
          h('p', { class: 'small muted' }, `아이디: ${profile.nickname}`)),
        h('div', { class: 'profile-right' }, ...groups)),
      h('label', { for: 'pf-name', class: 'pf-label' }, '닉네임 (12글자까지)'),
      nameInput, pendingEl, note,
      h('div', { class: 'actions' }, save)));
}

// ---------- 회차 연계 영상 ----------
function videoBlock(id) {
  return h('div', { class: 'video-block' },
    h('div', { class: 'video-frame' },
      h('iframe', {
        src: embedUrl(id), title: '회차 영상', loading: 'lazy', allowfullscreen: true,
        allow: 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen',
        referrerpolicy: 'strict-origin-when-cross-origin',
      })),
    h('a', { class: 'link small', href: watchUrl(id), target: '_blank', rel: 'noopener' }, '화면이 안 나오면 유튜브에서 보기'));
}

// 암호 입력 화면: 펼치면 영상이 나옴 (펼치기 전에는 영상을 불러오지 않음)
function clueVideo(stageMeta) {
  const id = youtubeId(settings[stageMeta.id]?.video_url);
  if (!id) return '';
  const box = h('details', { class: 'clue-video' }, h('summary', {}, '영상 다시 보기'));
  box.addEventListener('toggle', () => { if (box.open && !box.querySelector('.video-block')) box.append(videoBlock(id)); });
  return box;
}

async function renderVideo(stageMeta, back = renderKitchen) {
  const id = youtubeId(settings[stageMeta.id]?.video_url);
  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel video-panel' },
      h('header', { class: 'stage-head' },
        h('button', { class: 'link', onclick: () => guard(back) }, back === renderKitchen ? '부엌으로' : '전시실로'),
        h('span', { class: 'stage-step' }, `${stageMeta.week}회차 영상`)),
      h('h2', {}, stageMeta.title),
      id ? videoBlock(id) : bubble('kkam', '이 회차 영상은 아직 준비 중인 거지.'),
      bubble('kkam', '영상 속에 암호가 숨어 있는 거지. 찾으면 입력하는 거지.'),
      h('div', { class: 'actions' },
        h('button', { class: 'btn ghost', onclick: () => guard(() => runStage(stageMeta)) }, '게임 시작'),
        h('button', { class: 'btn primary', onclick: () => guard(() => renderClue(stageMeta)) }, '암호 입력'))));
}

// ---------- 스테이지 실행 ----------
async function runStage(meta) {
  const mod = (await meta.load()).default;
  const holder = h('div', { class: 'stage-holder' });
  root.replaceChildren(holder);
  mod.mount(holder, {
    exit: () => guard(renderKitchen),
    finish: (result) => guard(() => completeStage(meta, mod, result)),
  });
}

async function completeStage(meta, mod, result) {
  // 첫 클리어 판단과 경험치 계산은 store(실제 모드는 서버 함수)가 함
  const res = await store.completeStage(profile, {
    stageId: meta.id, conceptId: mod.conceptId,
    attempts: result.attempts, hints: result.hints, bonus: result.bonus,
  });
  profile = res.profile;
  const firstClear = res.first;
  const teamHelped = res.first;
  const who = hostFor(meta.week);

  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel result' },
      h('h2', {}, '주문 완료!'),
      res.levelUp ? h('div', { class: 'levelup' },
        h('span', {}, '레벨 업'),
        h('strong', {}, `Lv.${profile.level} ${profile.title}`)) : null,
      firstClear
        ? h('ul', { class: 'xp-list' }, ...res.rows.map((r) =>
          h('li', {}, h('span', {}, XP_LABEL[r.source]), h('strong', {}, `+${r.amount}`))))
        : bubble(who, LINES[who].retry),
      teamHelped ? h('p', { class: 'small muted' }, '부엌 공동 목표가 한 칸 찼어요.') : null,
      bubble(who, LINES[who].findClue),
      h('div', { class: 'actions' },
        h('button', { class: 'btn ghost', onclick: () => guard(renderHub) }, '휴게소로'),
        h('button', { class: 'btn primary', onclick: () => guard(() => renderClue(meta, true)) }, '암호 입력'))));
}

// ---------- 시작 ----------
async function boot() {
  const uid = await store.currentUser();
  if (!uid) { renderLogin(); return; }
  profile = await store.loadProfile();
  if (!profile) {
    await store.logout();
    renderLogin('프로필을 찾지 못했어요. 대표님께 아이디 설정을 확인해 달라고 해 주세요.');
    return;
  }
  if ((profile.status || 'approved') !== 'approved') {
    await store.logout();
    renderLogin(STATUS_MESSAGE[profile.status] || STATUS_MESSAGE.pending);
    return;
  }
  settings = await store.loadSettings();
  await renderHub();
}

guard(async () => { await store.init(); await boot(); });

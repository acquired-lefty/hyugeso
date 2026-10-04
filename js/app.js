import { store } from './store.js';
import { h, bubble, normalize } from './ui.js';
import { sceneSvg } from './scene.js';
import { grantXp, levelProgress, XP_LABEL } from './xp.js';
import { SEASON1, TEAM_GOAL_ID, CLUE_TOTAL } from './stages/index.js';

const root = document.getElementById('app');
let profile = null;

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
    store.isDemo ? h('p', { class: 'demo-note' }, '체험 모드: 기록이 이 기기에만 저장돼요.') : null));
}

// ---------- 상단 상태 ----------
function statusBar() {
  const pct = Math.round(levelProgress(profile.xp) * 100);
  return h('header', { class: 'status' },
    h('div', { class: 'who' },
      h('strong', {}, profile.nickname),
      h('span', { class: 'lv' }, `Lv.${profile.level}`),
      h('span', { class: 'title-badge' }, profile.title),
      profile.is_admin ? h('a', { class: 'link small', href: 'admin.html' }, '대시보드') : null),
    h('div', { class: 'xpbar', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': '다음 레벨까지' },
      h('span', { style: `width:${pct}%` })),
    h('button', { class: 'link small', onclick: async () => { await store.logout(); profile = null; renderLogin(); } }, '나가기'));
}

// ---------- 휴게소 (허브) ----------
const DOOR_LINE = {
  arcade: '오락실은 아직 잠겨 있는 거지. 부엌 주문부터.',
  bus: '버스는 아직 안 오는 거지. 시간표가 비어 있어.',
  basement: '…거긴 아직. 단서가 더 모여야 하는 거지.',
};

async function renderHub() {
  const [clues, team] = await Promise.all([store.countClues(), store.teamGoal(TEAM_GOAL_ID)]);
  const tip = h('div', { class: 'scene-tip' }, bubble('kkam', '불 켜진 문을 눌러 보는 거지.'));
  const scene = h('section', { class: 'scene', html: sceneSvg({ kitchen: true, arcade: false, bus: false, basement: false }) });

  scene.querySelectorAll('[data-door]').forEach((el) => {
    const go = () => {
      const key = el.dataset.door;
      if (key === 'kitchen') guard(renderKitchen);
      else tip.replaceChildren(bubble('kkam', DOOR_LINE[key]));
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  const teamPct = team ? Math.round((team.current / team.target) * 100) : 0;
  root.replaceChildren(
    statusBar(),
    store.isDemo ? h('p', { class: 'demo-note' }, '체험 모드: 기록이 이 기기에만 저장돼요.') : null,
    scene,
    tip,
    h('section', { class: 'strip' },
      h('div', { class: 'strip-item' },
        h('span', { class: 'strip-label' }, '단서 도감'),
        h('strong', {}, `${clues} / ${CLUE_TOTAL}`)),
      team ? h('div', { class: 'strip-item grow' },
        h('span', { class: 'strip-label' }, `${team.title}, 친구들과 함께`),
        h('div', { class: 'teambar' }, h('span', { style: `width:${teamPct}%` })),
        h('span', { class: 'small muted' }, `${team.current} / ${team.target}`)) : null));
}

// ---------- 부엌 (주차 목록) ----------
async function renderKitchen() {
  const progress = await store.allProgress();
  const list = h('ol', { class: 'weeks' }, ...SEASON1.map((s) => {
    const done = progress[s.id]?.cleared;
    const status = done ? '완료' : s.open ? '열림' : '잠김';
    return h('li', { class: `week ${done ? 'is-done' : s.open ? 'is-open' : 'is-locked'}` },
      h('span', { class: 'week-num' }, `${s.week}주`),
      h('div', { class: 'week-body' },
        h('strong', {}, s.title),
        h('span', { class: 'small muted' }, s.subject)),
      s.open
        ? h('div', { class: 'week-actions' },
          h('button', { class: 'btn primary small', onclick: () => guard(() => runStage(s)) }, done ? '다시 하기' : '시작'),
          h('button', { class: 'btn ghost small', onclick: () => guard(() => renderClue(s)) }, '암호 입력'))
        : h('span', { class: 'small muted' }, status));
  }));

  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel kitchen' },
      h('header', { class: 'stage-head' },
        h('button', { class: 'link', onclick: () => guard(renderHub) }, '휴게소로'),
        h('span', { class: 'stage-step' }, '부엌')),
      h('h2', {}, '부엌 주문판'),
      bubble('tipo', '이번 주 주문만 열려 있어. 나머지는… 기다려. not bad한 건 원래 천천히 와.'),
      list));
}

// ---------- 영상 단서 입력 ----------
async function renderClue(stageMeta, afterResult) {
  const mod = (await stageMeta.load()).default;
  const already = await store.hasClue(mod.clue.id);
  const input = h('input', { id: 'clue', autocomplete: 'off' });
  const note = h('div', { class: 'talk' }, bubble('kkam', already ? '이 단서는 이미 도감에 있는 거지.' : mod.clue.ask));

  const form = h('form', {
    class: 'clue-form',
    onsubmit: async (e) => {
      e.preventDefault();
      if (normalize(input.value) !== normalize(mod.clue.answer)) {
        note.replaceChildren(bubble('kkam', '음… 그 암호는 아닌 거지. 영상을 다시 보고 와도 되는 거지.'));
        return;
      }
      const isNew = await store.addClue(mod.clue.id);
      if (isNew) {
        const res = await grantXp(store, profile, [{ source: 'clue', stageId: stageMeta.id }]);
        profile = res.profile;
        note.replaceChildren(bubble('kkam', `푸흡. 단서 카드 획득. 경험치 +${res.gained}인 거지.`));
      } else {
        note.replaceChildren(bubble('kkam', '이미 가진 단서인 거지.'));
      }
      input.disabled = true;
    },
  },
  h('label', { for: 'clue' }, '창고 암호'), input,
  h('button', { class: 'btn primary', type: 'submit', disabled: already }, '확인'));

  root.replaceChildren(
    statusBar(),
    h('section', { class: 'panel' },
      h('header', { class: 'stage-head' },
        h('button', { class: 'link', onclick: () => guard(afterResult ? renderHub : renderKitchen) }, afterResult ? '휴게소로' : '부엌으로'),
        h('span', { class: 'stage-step' }, `${stageMeta.week}주차 단서`)),
      note,
      already ? null : form));
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
  const prev = await store.getProgress(meta.id);
  const firstClear = !prev?.cleared;
  const entries = [];
  let teamHelped = false;

  if (firstClear) {
    await store.saveProgress({
      stage_id: meta.id, cleared: true,
      attempts: result.attempts, hints_used: result.hints,
      cleared_at: new Date().toISOString(),
    });
    await store.scheduleReview(mod.conceptId, 14);
    await store.contributeTeam(TEAM_GOAL_ID);
    teamHelped = true;
    entries.push({ source: 'clear', stageId: meta.id });
    if (result.hints === 0) entries.push({ source: 'no_hint', stageId: meta.id });
    if (result.bonus) entries.push({ source: 'bonus', stageId: meta.id });
    entries.push({ source: 'team', stageId: meta.id });
  }

  const res = await grantXp(store, profile, entries);
  profile = res.profile;

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
        : bubble('kkam', '다시 해 본 거지. 경험치는 처음 한 번만 주는 거지. 그래도 연습은 남는 거지.'),
      teamHelped ? h('p', { class: 'small muted' }, '부엌 공동 목표가 한 칸 찼어요.') : null,
      bubble('kkam', '영상에서 창고 암호를 찾았다면 입력해 보는 거지.'),
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
  await renderHub();
}

guard(async () => { await store.init(); await boot(); });

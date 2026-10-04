// 대표님용 학습 대시보드 (admin.html)
// 실제 모드: is_admin 계정만 들어올 수 있음. 아이들 기록 조회는 DB의 RLS 규칙이 관리자에게만 허용.
// 체험 모드: 이 기기에 저장된 기록만 보여 줌.
import { store } from './store.js';
import { h } from './ui.js';
import { XP_LABEL } from './xp.js';
import { SEASON1 } from './stages/index.js';

const root = document.getElementById('app');
const STAGE = Object.fromEntries(SEASON1.map((s) => [s.id, s]));
let conceptTitle = {};

const dash = (v) => (v == null || v === '' ? '–' : v);
const day = (iso) => (iso ? new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : '–');
const stageName = (id) => (STAGE[id] ? `${STAGE[id].week}주 ${STAGE[id].title}` : id);

function showError(err, retry) {
  root.replaceChildren(h('section', { class: 'panel' },
    h('p', { class: 'form-note', role: 'alert' }, err.message || '문제가 생겼어요.'),
    h('div', { class: 'actions' }, h('button', { class: 'btn primary', onclick: retry }, '다시 시도'))));
}

async function guard(fn) {
  try { await fn(); } catch (err) { console.error(err); showError(err, () => guard(fn)); }
}

async function logout() { await store.logout(); renderLogin(); }

function topBar(profile) {
  return h('header', { class: 'admin-top' },
    h('h1', { class: 'title' }, '학습 대시보드'),
    h('div', { class: 'admin-top-right' },
      h('span', { class: 'small muted' }, profile.nickname),
      h('a', { class: 'link small', href: './' }, '게임으로'),
      h('button', { class: 'link small', onclick: () => guard(logout) }, '나가기')));
}

// ---------- 로그인 ----------
function renderLogin(message) {
  const idInput = h('input', { id: 'uid', autocomplete: 'username', autocapitalize: 'none', required: true });
  const pwInput = h('input', { id: 'pw', type: 'password', autocomplete: 'current-password', required: !store.isDemo });
  const note = h('p', { class: 'form-note', role: 'alert' }, message || '');
  const form = h('form', {
    class: 'login',
    onsubmit: async (e) => {
      e.preventDefault();
      note.textContent = '';
      try { await store.login(idInput.value, pwInput.value); await boot(); } catch (err) { note.textContent = err.message; }
    },
  },
  h('label', { for: 'uid' }, '관리자 아이디'), idInput,
  h('label', { for: 'pw' }, '비밀번호'), pwInput,
  note,
  h('button', { class: 'btn primary wide', type: 'submit' }, '대시보드 열기'));

  root.replaceChildren(h('section', { class: 'panel login-panel' },
    h('h1', { class: 'title' }, '학습 대시보드'),
    h('p', { class: 'muted' }, '대표님(관리자) 계정으로만 들어올 수 있어요.'),
    form,
    store.isDemo ? h('p', { class: 'demo-note' }, '체험 모드: 이 기기에 저장된 기록만 보여요.') : null));
}

// ---------- 전체 요약 ----------
async function renderSummary(profile) {
  const kids = await store.adminChildren();
  const head = ['아이디', '레벨', 'XP', '클리어', '평균 시도', '평균 힌트', '복습 정답률', '단서'];
  const table = kids.length
    ? h('div', { class: 'table-wrap' }, h('table', { class: 'admin-table' },
      h('thead', {}, h('tr', {}, ...head.map((t) => h('th', { scope: 'col' }, t)))),
      h('tbody', {}, ...kids.map((k) => h('tr', {},
        h('th', { scope: 'row' }, h('button', { class: 'link', onclick: () => guard(() => renderChild(profile, k)) }, k.nickname)),
        ...[`Lv.${dash(k.level)}`, dash(k.xp), dash(k.stages_cleared), dash(k.avg_attempts), dash(k.avg_hints),
          k.review_rate_pct == null ? '–' : `${k.review_rate_pct}%`, dash(k.clues)]
          .map((v, i) => h('td', { 'data-label': head[i + 1] }, v)))))))
    : h('p', { class: 'muted' }, '아직 아이 계정이 없어요. Supabase에서 아이디를 발급하면 여기에 나타나요.');

  root.replaceChildren(
    topBar(profile),
    // replaceChildren은 null을 "null" 글자로 표시하므로 빈 문자열 사용
    store.isDemo ? h('p', { class: 'demo-note' }, '체험 모드: 이 기기에 저장된 기록만 보여요.') : '',
    h('section', { class: 'panel' },
      h('h2', {}, '아이별 요약'),
      h('p', { class: 'small muted' }, '아이디를 누르면 상세 기록과 메모를 볼 수 있어요. 평균은 첫 클리어 기준이에요.'),
      table));
}

// ---------- 아이 상세 ----------
function section(title, body) {
  return h('section', { class: 'panel admin-block' }, h('h2', {}, title), body);
}

function list(rows, empty, render) {
  return rows.length ? h('ul', { class: 'admin-list' }, ...rows.map((r) => h('li', {}, ...render(r)))) : h('p', { class: 'muted small' }, empty);
}

async function renderChild(profile, kid) {
  const [detail, notes] = await Promise.all([store.adminDetail(kid.id), store.listNotes(kid.id)]);

  const stages = list(detail.progress.filter((p) => p.cleared), '아직 클리어한 주차가 없어요.', (p) => [
    h('strong', {}, stageName(p.stage_id)),
    h('span', { class: 'small muted' }, `${day(p.cleared_at)} · 시도 ${dash(p.attempts)}회 · 힌트 ${dash(p.hints_used)}회`),
  ]);

  const clues = list(detail.clues, '아직 입력한 영상 단서가 없어요.', (c) => [
    h('strong', {}, stageName(c.clue_id)),
    h('span', { class: 'small muted' }, `${day(c.collected_at)} 입력 (영상 시청 확인)`),
  ]);

  const now = Date.now();
  const reviews = list(detail.reviews, '예약된 복습이 없어요.', (r) => {
    let state = '대기';
    if (r.answered_at) state = r.correct ? '정답' : '오답';
    else if (new Date(r.due_at).getTime() <= now) state = '복습할 때가 됨';
    return [
      h('strong', {}, conceptTitle[r.concept_id] || r.concept_id),
      h('span', { class: 'small muted' }, `${day(r.due_at)} 예정 · ${state}`),
    ];
  });

  const xp = list(detail.xpLog, 'XP 기록이 없어요.', (x) => [
    h('strong', {}, `${XP_LABEL[x.source] || x.source} +${x.amount}`),
    h('span', { class: 'small muted' }, `${day(x.created_at)}${x.stage_id ? ` · ${stageName(x.stage_id)}` : ''}`),
  ]);

  // 수기 메모
  const textarea = h('textarea', { id: 'note', rows: 3, maxlength: 1000, placeholder: '예: 곱셈을 덧셈으로 바꿔 생각하는 방법을 먼저 물어봄' });
  const noteMsg = h('p', { class: 'form-note', role: 'alert' });
  const form = h('form', {
    class: 'note-form',
    onsubmit: async (e) => {
      e.preventDefault();
      const body = textarea.value.trim();
      if (!body) return;
      try { await store.addNote(kid.id, body); await renderChild(profile, kid); } catch (err) { noteMsg.textContent = err.message; }
    },
  },
  h('label', { for: 'note' }, '아이가 먼저 꺼낸 질문, 관찰한 점'),
  textarea,
  h('p', { class: 'small muted' }, '실명·학교·연락처는 적지 말아 주세요.'),
  noteMsg,
  h('div', { class: 'actions' }, h('button', { class: 'btn primary small', type: 'submit' }, '메모 저장')));

  const noteList = list(notes, '아직 메모가 없어요.', (n) => [
    h('p', { class: 'note-body' }, n.body),
    h('span', { class: 'small muted' }, day(n.created_at), ' ',
      h('button', {
        class: 'link small',
        onclick: async () => {
          if (!confirm('이 메모를 지울까요?')) return;
          await guard(async () => { await store.deleteNote(n.id); await renderChild(profile, kid); });
        },
      }, '지우기')),
  ]);

  root.replaceChildren(
    topBar(profile),
    h('div', { class: 'stage-head' },
      h('button', { class: 'link', onclick: () => guard(() => renderSummary(profile)) }, '전체 요약으로'),
      h('span', { class: 'stage-step' }, kid.nickname)),
    h('section', { class: 'strip' },
      ...[['레벨', `Lv.${dash(kid.level)}`], ['XP', dash(kid.xp)], ['클리어', dash(kid.stages_cleared)], ['단서', dash(kid.clues)]]
        .map(([label, value]) => h('div', { class: 'strip-item grow' }, h('span', { class: 'strip-label' }, label), h('strong', {}, value)))),
    // 태블릿·PC에서는 메모(왼쪽)와 기록(오른쪽) 두 칸, 휴대폰에서는 한 줄로 쌓임
    h('div', { class: 'admin-detail' },
      h('div', { class: 'admin-col admin-col-notes' }, section('수기 메모', h('div', {}, form, noteList))),
      h('div', { class: 'admin-col' },
        section('주차별 기록', stages),
        section('영상 단서', clues),
        section('복습 퀴즈', reviews),
        section('최근 XP (20개)', xp))));
}

// ---------- 시작 ----------
async function boot() {
  const uid = await store.currentUser();
  if (!uid) { renderLogin(); return; }
  const profile = await store.loadProfile();
  if (!profile) { await store.logout(); renderLogin('프로필을 찾지 못했어요.'); return; }
  if (!store.isDemo && !profile.is_admin) {
    await store.logout();
    renderLogin('관리자 계정이 아니에요. 대표님 계정으로 들어와 주세요.');
    return;
  }
  await renderSummary(profile);
}

async function loadConceptTitles() {
  const mods = await Promise.all(SEASON1.filter((s) => s.open && s.load).map(async (s) => [s, (await s.load()).default]));
  conceptTitle = Object.fromEntries(mods.map(([s, m]) => [m.conceptId, `${s.week}주 ${s.subject}`]));
}

guard(async () => { await store.init(); await loadConceptTitles(); await boot(); });

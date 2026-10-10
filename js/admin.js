// 대표님용 학습 대시보드 (admin.html)
// 실제 모드: is_admin 계정만 들어올 수 있음. 아이들 기록 조회는 DB의 RLS 규칙이 관리자에게만 허용.
// 체험 모드: 이 기기에 저장된 기록만 보여 줌.
import { store } from './store.js';
import { h, clueHash } from './ui.js';
import { XP_LABEL } from './xp.js';
import { SEASON1, opensDate } from './stages/index.js';
import { avatarSvg, normalizeAvatar } from './avatar.js';
import { youtubeId } from './video.js';

const root = document.getElementById('app');
const STAGE = Object.fromEntries(SEASON1.map((s) => [s.id, s]));
let conceptTitle = {};

const dash = (v) => (v == null || v === '' ? '–' : v);
const day = (iso) => (iso ? new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : '–');
const stageName = (id) => (STAGE[id] ? `${STAGE[id].week}회 ${STAGE[id].title}` : id);

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
  const remember = h('input', { id: 'remember', type: 'checkbox', checked: store.remember });
  idInput.value = store.lastId;
  const note = h('p', { class: 'form-note', role: 'alert' }, message || '');
  const form = h('form', {
    class: 'login',
    onsubmit: async (e) => {
      e.preventDefault();
      note.textContent = '';
      try { await store.login(idInput.value, pwInput.value, { remember: remember.checked }); await boot(); } catch (err) { note.textContent = err.message; }
    },
  },
  h('label', { for: 'uid' }, '관리자 아이디'), idInput,
  h('label', { for: 'pw' }, '비밀번호'), pwInput,
  h('label', { class: 'check-row remember-row', for: 'remember' }, remember, ' 로그인 상태 유지'),
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
        h('th', { scope: 'row' }, h('button', { class: 'link kid-link', onclick: () => guard(() => renderChild(profile, k)) },
          h('span', { class: 'kid-avatar', html: avatarSvg(normalizeAvatar(k.avatar, k.nickname), { size: 28 }) }),
          k.display_name ? `${k.nickname} (${k.display_name})` : k.nickname)),
        ...[`Lv.${dash(k.level)}`, dash(k.xp), dash(k.stages_cleared), dash(k.avg_attempts), dash(k.avg_hints),
          k.review_rate_pct == null ? '–' : `${k.review_rate_pct}%`, dash(k.clues)]
          .map((v, i) => h('td', { 'data-label': head[i + 1] }, v)))))))
    : h('p', { class: 'muted' }, '아직 승인된 계정이 없어요. 가입 신청을 승인하면 여기에 나타나요.');

  root.replaceChildren(
    topBar(profile),
    // replaceChildren은 null을 "null" 글자로 표시하므로 빈 문자열 사용
    store.isDemo ? h('p', { class: 'demo-note' }, '체험 모드: 이 기기에 저장된 기록만 보여요.') : '',
    h('section', { class: 'panel' },
      h('h2', {}, '아이별 요약'),
      h('p', { class: 'small muted' }, '아이디를 누르면 상세 기록과 메모를 볼 수 있어요. 평균은 첫 클리어 기준이에요.'),
      table),
    await accountsPanel(profile),
    await settingsPanel(profile),
    backupPanel());
}

// ---------- 가입 신청·닉네임 승인 ----------
const AGE = { child: '어린이', adult: '어른' };
async function accountsPanel(profile) {
  const accounts = await store.adminAccounts();
  const pending = accounts.filter((a) => a.status === 'pending');
  const rejected = accounts.filter((a) => a.status === 'rejected');
  const names = accounts.filter((a) => a.status === 'approved' && a.display_name_pending);
  const redo = () => guard(() => renderSummary(profile));
  const msg = h('p', { class: 'form-note', role: 'alert' });
  const act = (fn) => async () => { msg.textContent = ''; try { await fn(); redo(); } catch (err) { msg.textContent = err.message; } };

  const signupRow = (a) => {
    const isChild = a.age_group !== 'adult';
    const consent = h('input', { type: 'checkbox', id: `consent-${a.id}` });
    return h('li', { class: 'account-row' },
      h('div', {},
        h('strong', {}, a.nickname),
        h('span', { class: 'small muted' }, ` · ${AGE[a.age_group] || '구분 없음'} · ${new Date(a.requested_at).toLocaleDateString('ko-KR')} 신청`),
        isChild ? h('p', { class: 'small muted' }, a.guardian_ok ? '신청할 때 "보호자와 함께" 체크함' : '"보호자와 함께" 체크 없음') : ''),
      isChild ? h('label', { class: 'check-row small', for: `consent-${a.id}` }, consent, ' 보호자 동의 확인함 (연락해서 확인)') : '',
      h('div', { class: 'week-actions' },
        h('button', { class: 'btn primary small', onclick: act(() => store.adminSetStatus(a.id, 'approved', isChild ? consent.checked : false)) }, '승인'),
        a.status === 'pending' ? h('button', { class: 'btn ghost small', onclick: act(() => store.adminSetStatus(a.id, 'rejected')) }, '거절') : ''));
  };

  return h('section', { class: 'panel admin-section' },
    h('h2', {}, `가입 신청 ${pending.length}건`),
    h('p', { class: 'small muted' }, '어린이(만 14세 미만)는 보호자께 직접 연락해 동의를 확인한 뒤 승인해 주세요. 확인 날짜가 기록돼요.'),
    msg,
    pending.length ? h('ul', { class: 'admin-list' }, ...pending.map(signupRow)) : h('p', { class: 'muted small' }, '기다리는 신청이 없어요.'),
    names.length ? h('div', {},
      h('h3', {}, `닉네임 승인 ${names.length}건`),
      h('ul', { class: 'admin-list' }, ...names.map((a) => h('li', { class: 'account-row' },
        h('div', {}, h('strong', {}, a.nickname), h('span', { class: 'small muted' }, ` → "${a.display_name_pending}"${a.display_name ? ` (지금: ${a.display_name})` : ''}`)),
        h('div', { class: 'week-actions' },
          h('button', { class: 'btn primary small', onclick: act(() => store.adminReviewName(a.id, true)) }, '승인'),
          h('button', { class: 'btn ghost small', onclick: act(() => store.adminReviewName(a.id, false)) }, '거절')))))) : '',
    rejected.length ? h('details', { class: 'clue-video' }, h('summary', {}, `거절한 신청 ${rejected.length}건`),
      h('ul', { class: 'admin-list' }, ...rejected.map(signupRow))) : '',
    passwordBox(accounts.filter((a) => a.status === 'approved')));
}

// 아이 계정 비밀번호 새로 정하기 (아이디가 가짜 이메일이라 메일 재설정이 안 됨)
function passwordBox(approved) {
  if (!approved.length) return '';
  const pick = h('select', { id: 'pw-user', 'aria-label': '계정 고르기' },
    ...approved.map((a) => h('option', { value: a.id }, a.display_name ? `${a.nickname} (${a.display_name})` : a.nickname)));
  const pw = h('input', { id: 'pw-new', type: 'text', minlength: 6, maxlength: 40, autocomplete: 'off', placeholder: '새 비밀번호 (6글자 이상)' });
  const msg = h('p', { class: 'form-note', role: 'status' });
  const btn = h('button', {
    class: 'btn ghost small',
    onclick: async () => {
      msg.textContent = '';
      const name = pick.selectedOptions[0]?.textContent;
      if (!confirm(`${name} 계정의 비밀번호를 바꿀까요?`)) return;
      btn.disabled = true;
      try {
        await store.adminSetPassword(pick.value, pw.value.trim());
        msg.textContent = `${name} 비밀번호를 바꿨어요. 아이에게 새 비밀번호를 알려 주세요.`;
        pw.value = '';
      } catch (err) { msg.textContent = err.message; } finally { btn.disabled = false; }
    },
  }, '비밀번호 바꾸기');
  return h('details', { class: 'clue-video' }, h('summary', {}, '비밀번호를 잊은 아이가 있나요?'),
    h('p', { class: 'small muted' }, '새 비밀번호를 정해 주면 바로 그 비밀번호로 들어올 수 있어요.'),
    h('div', { class: 'setting-inputs pw-inputs' }, pick, pw, btn), msg);
}

// ---------- 회차 설정: 공개 날짜·유튜브 영상 주소 ----------
async function settingsPanel(profile) {
  const [settings, keys] = await Promise.all([store.loadSettings(), store.adminClueKeys()]);
  const mods = Object.fromEntries(await Promise.all(SEASON1.filter((s) => s.open && s.load).map(async (s) => [s.id, (await s.load()).default])));
  const msg = h('p', { class: 'form-note', role: 'status' });
  const rows = await Promise.all(SEASON1.map(async (s) => {
    const cur = settings[s.id] || {};
    const key = keys?.[s.id] || '';
    const keyInput = h('input', { type: 'text', value: key, maxlength: 30, placeholder: '영상 암호', 'aria-label': `${s.week}회차 영상 암호` });
    // 서버 암호가 게임 파일의 암호 지문과 같은지 표시
    const hash = mods[s.id]?.clue.hash;
    let keyState = keys == null ? '암호 칸을 쓰려면 07 SQL 실행 필요' : !key ? '서버 암호 미등록' : '';
    if (key && hash) keyState = (await clueHash(key)) === hash ? '암호 ✓ 게임과 같음' : '⚠ 게임 파일의 암호와 다름';
    const date = h('input', { type: 'date', value: cur.opens_at || '', 'aria-label': `${s.week}회차 공개 날짜` });
    const url = h('input', { type: 'url', value: cur.video_url || '', placeholder: 'https://youtu.be/…', 'aria-label': `${s.week}회차 영상 주소` });
    const save = h('button', {
      class: 'btn ghost small',
      onclick: async () => {
        msg.textContent = '';
        if (url.value.trim() && !youtubeId(url.value.trim())) { msg.textContent = `${s.week}회차: 유튜브 영상 주소가 아니에요.`; return; }
        try {
          await store.adminSaveSetting(s.id, { opensAt: date.value, videoUrl: url.value.trim() });
          if (keys != null && keyInput.value.trim() !== key) await store.adminSaveClueKey(s.id, keyInput.value);
          msg.textContent = `${s.week}회차 저장했어요.`;
          setTimeout(() => guard(() => renderSummary(profile)), 600);
        } catch (err) { msg.textContent = err.message; }
      },
    }, '저장');
    return h('li', { class: 'setting-row' },
      h('strong', {}, `${s.week}회 ${s.title}`),
      h('span', { class: 'small muted' }, `${s.open ? '' : '(게임 준비 중) '}공개: ${opensDate(s, settings) || '바로'}${cur.opens_at ? ' · 직접 지정' : s.opensAt ? ' · 기본 일정' : ''}${keyState ? ` · ${keyState}` : ''}`),
      h('div', { class: 'setting-inputs' }, date, url, keys == null ? '' : keyInput, save));
  }));
  return h('section', { class: 'panel admin-section' },
    h('h2', {}, '회차 설정'),
    h('p', { class: 'small muted' }, '기본 공개 일정은 매주 월·목이에요. 날짜를 넣으면 그 날짜(한국 시간 0시)가 우선해요. 날짜를 비우고 저장하면 기본 일정으로 돌아가요.'),
    h('p', { class: 'small muted' }, '영상 암호는 서버가 아이들의 입력을 확인할 때 써요. 새 회차는 게임과 같은 암호를 넣어 주세요(✓ 표시 확인).'),
    msg,
    h('ul', { class: 'admin-list' }, ...rows));
}

// ---------- 기록 내보내기 (백업) ----------
// 무료 플랜은 자동 백업이 없어서, 한 달에 한 번쯤 파일로 저장해 두기를 권함
function backupPanel() {
  const msg = h('p', { class: 'small muted', role: 'status' }, '모든 기록을 파일 하나(JSON)로 저장해요. 한 달에 한 번쯤 저장해 두세요.');
  const btn = h('button', {
    class: 'btn ghost small',
    onclick: () => guard(async () => {
      btn.disabled = true;
      try {
        const data = await store.adminExport();
        const stamp = new Date().toLocaleDateString('sv-SE'); // 2026-10-06 형식
        const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: `hyugeso-backup-${stamp}.json` });
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        msg.textContent = `${stamp} 기록을 저장했어요. 다운로드 폴더를 확인해 주세요.`;
      } finally { btn.disabled = false; }
    }),
  }, '기록 내보내기');
  return h('section', { class: 'panel admin-backup' }, h('h2', {}, '백업'), msg, h('div', { class: 'actions' }, btn));
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

  const stages = list(detail.progress.filter((p) => p.cleared), '아직 클리어한 회차가 없어요.', (p) => [
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
        section('회차별 기록', stages),
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
  conceptTitle = Object.fromEntries(mods.map(([s, m]) => [m.conceptId, `${s.week}회 ${s.subject}`]));
}

guard(async () => { await store.init(); await loadConceptTitles(); await boot(); });

import { CONFIG } from './config.js';
import { XP, levelFor, titleFor } from './xp.js';

const DEMO_KEY = 'hyugeso-demo-v1';
let sb = null;
let live = false;
let userId = null;

const readDemo = () => {
  try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || {}; } catch { return {}; }
};
const writeDemo = (db) => {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(db)); } catch { /* 저장 불가 환경 */ }
};

// 서버 함수가 아직 없을 때 (새 SQL 실행 전)
const missingFn = (error) => error && (error.code === 'PGRST202' || /could not find the function/i.test(error.message || ''));
const NOT_OPEN = '아직 공개 전인 회차예요. 공개 날짜에 다시 와 주세요.';

function check(error, message) {
  if (error) {
    console.error(error);
    throw new Error(message || '저장 서버와 연결하지 못했어요. 잠시 후 다시 해 보세요.');
  }
}

// 서버 함수 결과 → 화면에서 쓰는 형태
function fromServer(profile, data, rows) {
  const next = { ...profile, xp: data.xp, level: data.level, title: data.title };
  const gained = rows.reduce((sum, r) => sum + r.amount, 0);
  return { gained, rows, profile: next, levelUp: next.level > profile.level };
}

// 체험 모드: 서버 함수와 같은 규칙으로 이 기기에서 경험치 계산 후 저장
function demoGrant(db, profile, entries) {
  const rows = entries.map((e) => ({ source: e.source, amount: XP[e.source], stage_id: e.stageId || null }));
  const gained = rows.reduce((sum, r) => sum + r.amount, 0);
  db.xpLog.push(...rows.map((r) => ({ ...r, created_at: new Date().toISOString() })));
  const xp = db.profile.xp + gained;
  const level = levelFor(xp);
  Object.assign(db.profile, { xp, level, title: titleFor(level) });
  writeDemo(db);
  return { gained, rows, profile: { ...profile, ...db.profile }, levelUp: level > profile.level };
}

function demoTeam(db, goalId = 's1-kitchen') {
  db.team = db.team || {};
  db.team[goalId] = db.team[goalId] || { id: goalId, title: '부엌 공동 목표', target: 60, current: 0 };
  return db.team[goalId];
}

export const STATUS_MESSAGE = {
  pending: '가입 신청이 승인 대기 중이에요. 대표님이 승인하면 들어올 수 있어요.',
  rejected: '가입이 승인되지 않았어요. 대표님께 물어봐 주세요.',
};

export const store = {
  get isDemo() { return !live; },

  async init() {
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      live = true;
    }
  },

  async currentUser() {
    if (live) {
      const { data } = await sb.auth.getSession();
      userId = data.session?.user?.id || null;
    } else {
      const db = readDemo();
      userId = db.session && db.profile ? db.profile.id : null;
    }
    return userId;
  },

  async login(rawId, password) {
    const id = rawId.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,20}$/.test(id)) {
      throw new Error('아이디는 영어 소문자와 숫자로 적어 주세요.');
    }
    if (live) {
      const { data, error } = await sb.auth.signInWithPassword({
        email: `${id}@${CONFIG.EMAIL_DOMAIN}`, password,
      });
      check(error, '아이디나 비밀번호가 맞지 않아요. 다시 확인해 주세요.');
      userId = data.user.id;
      // 승인 전·거절된 계정은 들어오지 못하게 바로 로그아웃
      const { data: prof } = await sb.from('profiles').select('status').eq('id', userId).maybeSingle();
      if (prof?.status !== 'approved') {
        await sb.auth.signOut();
        userId = null;
        throw new Error(STATUS_MESSAGE[prof?.status] || STATUS_MESSAGE.pending);
      }
      return;
    }
    let db = readDemo();
    if (!db.profile || db.profile.nickname !== id) {
      db = {
        profile: { id: `demo-${id}`, nickname: id, level: 1, xp: 0, title: '새내기 손님', is_admin: false },
        progress: {}, clues: {}, xpLog: [], reviews: [], team: db.team || {}, settings: db.settings || {},
      };
    }
    db.session = true;
    writeDemo(db);
    userId = db.profile.id;
  },

  // 가입 신청: 아이디·비밀번호만 (개인정보 없음). 실제 모드는 대표님 승인 후 로그인 가능
  async signup(rawId, password, { ageGroup, guardianOk }) {
    const id = rawId.trim().toLowerCase();
    if (!/^[a-z0-9_]{2,20}$/.test(id)) throw new Error('아이디는 영어 소문자, 숫자, _ 로 2~20글자예요.');
    if (!password || password.length < 6) throw new Error('비밀번호는 6글자 이상으로 정해 주세요.');
    if (!['child', 'adult'].includes(ageGroup)) throw new Error('어린이인지 어른인지 골라 주세요.');
    if (ageGroup === 'child' && !guardianOk) throw new Error('어린이는 보호자와 함께 신청해 주세요.');
    if (live) {
      const { error } = await sb.auth.signUp({
        email: `${id}@${CONFIG.EMAIL_DOMAIN}`, password,
        options: { data: { age_group: ageGroup, guardian_ok: guardianOk ? 'true' : 'false' } },
      });
      if (error) {
        console.error(error);
        if (/already registered|already exists/i.test(error.message)) throw new Error('이미 있는 아이디예요. 다른 아이디를 정해 주세요.');
        if (/not allowed|disabled/i.test(error.message)) throw new Error('지금은 가입 신청을 받지 않아요. 대표님께 물어봐 주세요.');
        if (/password/i.test(error.message)) throw new Error('비밀번호를 더 길고 어렵게 정해 주세요.');
        throw new Error('가입 신청을 보내지 못했어요. 잠시 후 다시 해 보세요.');
      }
      await sb.auth.signOut(); // 승인 전에는 로그인 상태로 두지 않음
      return { pending: true };
    }
    // 체험 모드: 이 기기에서만 쓰므로 바로 가입
    const db = { profile: { id: `demo-${id}`, nickname: id, level: 1, xp: 0, title: '새내기 손님', is_admin: false, status: 'approved', age_group: ageGroup },
      progress: {}, clues: {}, xpLog: [], reviews: [], team: readDemo().team || {}, settings: readDemo().settings || {}, session: false };
    writeDemo(db);
    return { pending: false };
  },

  async logout() {
    if (live) { await sb.auth.signOut(); }
    else { const db = readDemo(); db.session = false; writeDemo(db); }
    userId = null;
  },

  async loadProfile() {
    if (live) {
      const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      check(error);
      return data;
    }
    return readDemo().profile || null;
  },

  async allProgress() {
    if (live) {
      const { data, error } = await sb.from('progress').select('*').eq('user_id', userId);
      check(error);
      return Object.fromEntries((data || []).map((r) => [r.stage_id, r]));
    }
    return readDemo().progress || {};
  },

  // ---------- 경험치가 붙는 기록 (실제 모드: 서버 함수가 경험치를 계산, 05_server_xp.sql) ----------
  // 모두 { gained, rows, profile, levelUp } 형태로 돌려줌

  // 스테이지 클리어: 첫 클리어일 때만 기록·복습 예약·공동 목표·경험치
  async completeStage(profile, { stageId, conceptId, attempts, hints, bonus }) {
    if (live) {
      const { data, error } = await sb.rpc('complete_stage', {
        p_stage: stageId, p_concept: conceptId, p_attempts: attempts, p_hints: hints, p_bonus: !!bonus,
      });
      if (error && /not open/.test(error.message)) throw new Error(NOT_OPEN);
      check(error);
      return { first: data.first, ...fromServer(profile, data, data.rows) };
    }
    const db = readDemo();
    if (db.progress?.[stageId]?.cleared) return { first: false, ...demoGrant(db, profile, []) };
    db.progress[stageId] = { stage_id: stageId, cleared: true, attempts, hints_used: hints, cleared_at: new Date().toISOString() };
    db.reviews.push({ id: Date.now(), concept_id: conceptId, due_at: new Date(Date.now() + 14 * 86400000).toISOString() });
    const g = demoTeam(db);
    g.current = Math.min(g.current + 1, g.target);
    const entries = [{ source: 'clear', stageId }];
    if (hints === 0) entries.push({ source: 'no_hint', stageId });
    if (bonus) entries.push({ source: 'bonus', stageId });
    entries.push({ source: 'team', stageId });
    return { first: true, ...demoGrant(db, profile, entries) };
  },

  // 영상 단서: 서버가 암호를 다시 확인하고(07_server_checks.sql), 처음 모을 때만 경험치
  // { ok: false }면 서버 기준으로 틀린 암호
  async collectClue(profile, clueId, word) {
    if (live) {
      let { data, error } = await sb.rpc('collect_clue', { p_clue: clueId, p_answer: word });
      // 07 SQL 실행 전: 예전 함수로 기록
      if (missingFn(error)) ({ data, error } = await sb.rpc('collect_clue', { p_clue: clueId }));
      if (error && /not open/.test(error.message)) throw new Error(NOT_OPEN);
      check(error);
      if (data.ok === false) return { ok: false };
      return { ok: true, isNew: data.new, ...fromServer(profile, data, data.new ? [{ source: 'clue', amount: data.gained }] : []) };
    }
    const db = readDemo();
    if (db.clues[clueId]) return { ok: true, isNew: false, ...demoGrant(db, profile, []) };
    db.clues[clueId] = { at: new Date().toISOString(), word };
    return { ok: true, isNew: true, ...demoGrant(db, profile, [{ source: 'clue', stageId: clueId }]) };
  },

  // 복습 퀴즈 답 기록: 정답이면 경험치
  async answerReview(profile, reviewId, correct, stageId) {
    if (live) {
      const { data, error } = await sb.rpc('answer_review', { p_id: reviewId, p_correct: correct, p_stage: stageId || null });
      check(error);
      return fromServer(profile, data, data.gained ? [{ source: 'review', amount: data.gained }] : []);
    }
    const db = readDemo();
    const r = (db.reviews || []).find((x) => x.id === reviewId);
    if (!r || r.answered_at) return demoGrant(db, profile, []);
    Object.assign(r, { correct, answered_at: new Date().toISOString() });
    return demoGrant(db, profile, correct ? [{ source: 'review', stageId }] : []);
  },

  async hasClue(clueId) {
    if (live) {
      const { data, error } = await sb.from('clues').select('clue_id')
        .eq('user_id', userId).eq('clue_id', clueId).maybeSingle();
      check(error);
      return !!data;
    }
    return !!readDemo().clues?.[clueId];
  },

  // 단서 도감: { 's1-w01': { at: '모은 날짜', word: '암호' }, ... } (word는 07 SQL 실행 후부터)
  async listClues() {
    if (live) {
      let { data, error } = await sb.from('clues').select('clue_id, collected_at, word').eq('user_id', userId);
      if (error && /word/.test(error.message || '')) ({ data, error } = await sb.from('clues').select('clue_id, collected_at').eq('user_id', userId));
      check(error);
      return Object.fromEntries((data || []).map((c) => [c.clue_id, { at: c.collected_at, word: c.word || '' }]));
    }
    // 예전 체험 기록은 날짜만 있음
    return Object.fromEntries(Object.entries(readDemo().clues || {}).map(([id, v]) => [id, typeof v === 'string' ? { at: v, word: '' } : v]));
  },

  // 복습할 때가 된(예정일이 지났고 아직 안 푼) 복습 퀴즈
  async dueReviews() {
    const now = new Date().toISOString();
    if (live) {
      const { data, error } = await sb.from('review_quiz').select('*')
        .eq('user_id', userId).is('answered_at', null).lte('due_at', now).order('due_at');
      check(error);
      return data || [];
    }
    const db = readDemo();
    // 예전 체험 기록에는 id가 없을 수 있어 순서 번호로 채움
    (db.reviews || []).forEach((r, i) => { if (r.id == null) r.id = i + 1; });
    writeDemo(db);
    return (db.reviews || []).filter((r) => !r.answered_at && r.due_at <= now)
      .sort((a, b) => a.due_at.localeCompare(b.due_at));
  },

  async teamGoal(goalId) {
    if (live) {
      const { data, error } = await sb.from('team_goals').select('*').eq('id', goalId).maybeSingle();
      check(error);
      return data;
    }
    return demoTeam(readDemo(), goalId);
  },

  // 공동 목표에 한 번이라도 보탰는지 (공동 목표 달성 칭호용)
  async helpedTeam() {
    if (live) {
      const { count, error } = await sb.from('xp_log').select('*', { count: 'exact', head: true })
        .eq('user_id', userId).eq('source', 'team');
      check(error);
      return (count || 0) > 0;
    }
    return (readDemo().xpLog || []).some((x) => x.source === 'team');
  },

  // 내 프로필: 아바타는 바로, 닉네임은 대표님 승인 후 표시 (체험 모드는 바로 반영)
  async updateMyProfile(profile, { avatar, name }) {
    if (live) {
      const { data, error } = await sb.rpc('update_my_profile', { p_avatar: avatar || null, p_name: name || null });
      check(error, '프로필을 저장하지 못했어요.');
      return { ...profile, ...data };
    }
    const db = readDemo();
    if (avatar) db.profile.avatar = avatar;
    if (name) db.profile.display_name = name.trim().slice(0, 12);
    writeDemo(db);
    return { ...profile, ...db.profile };
  },

  // 회차 설정: { 's1-w03': { opens_at: '2026-10-12', video_url: 'https://…' }, … }
  async loadSettings() {
    if (live) {
      const { data, error } = await sb.from('stage_settings').select('*');
      check(error);
      return Object.fromEntries((data || []).map((r) => [r.stage_id, r]));
    }
    return { ...(readDemo().settings || {}) };
  },

  // ---------- 대표님용 대시보드 (실제 모드는 RLS가 관리자에게만 전체 기록을 열어 줌) ----------

  // 아이별 요약: learning_summary 뷰 + 아이디 + 단서 수
  async adminChildren() {
    if (live) {
      const [sum, prof, clue] = await Promise.all([
        sb.from('learning_summary').select('*'),
        sb.from('profiles').select('id, nickname, is_admin, status, display_name, avatar'),
        sb.from('clues').select('user_id'),
      ]);
      check(sum.error); check(prof.error); check(clue.error);
      const byNick = Object.fromEntries((sum.data || []).map((r) => [r.nickname, r]));
      const clueCount = {};
      for (const c of clue.data || []) clueCount[c.user_id] = (clueCount[c.user_id] || 0) + 1;
      return (prof.data || [])
        .filter((p) => !p.is_admin && (p.status || 'approved') === 'approved')
        .map((p) => ({ ...byNick[p.nickname], id: p.id, nickname: p.nickname, display_name: p.display_name, avatar: p.avatar, clues: clueCount[p.id] || 0 }))
        .sort((a, b) => a.nickname.localeCompare(b.nickname));
    }
    const db = readDemo();
    if (!db.profile) return [];
    const rows = Object.values(db.progress || {}).filter((r) => r.cleared);
    const avg = (key) => (rows.length ? Math.round((rows.reduce((s, r) => s + (r[key] || 0), 0) / rows.length) * 10) / 10 : null);
    const answered = (db.reviews || []).filter((r) => r.answered_at);
    return [{
      id: db.profile.id, nickname: db.profile.nickname, display_name: db.profile.display_name, avatar: db.profile.avatar, level: db.profile.level, xp: db.profile.xp,
      stages_cleared: rows.length, avg_attempts: avg('attempts'), avg_hints: avg('hints_used'),
      review_rate_pct: answered.length ? Math.round((100 * answered.filter((r) => r.correct).length) / answered.length) : null,
      clues: Object.keys(db.clues || {}).length,
    }];
  },

  // 아이 한 명의 상세 기록
  async adminDetail(childId) {
    if (live) {
      const [progress, clues, xpLog, reviews] = await Promise.all([
        sb.from('progress').select('*').eq('user_id', childId).order('stage_id'),
        sb.from('clues').select('*').eq('user_id', childId).order('collected_at'),
        sb.from('xp_log').select('*').eq('user_id', childId).order('created_at', { ascending: false }).limit(20),
        sb.from('review_quiz').select('*').eq('user_id', childId).order('due_at'),
      ]);
      for (const r of [progress, clues, xpLog, reviews]) check(r.error);
      return { progress: progress.data || [], clues: clues.data || [], xpLog: xpLog.data || [], reviews: reviews.data || [] };
    }
    const db = readDemo();
    return {
      progress: Object.values(db.progress || {}).sort((a, b) => a.stage_id.localeCompare(b.stage_id)),
      clues: Object.entries(db.clues || {}).map(([clue_id, v]) => ({ clue_id, collected_at: v?.at || v, word: v?.word })),
      xpLog: [...(db.xpLog || [])].reverse().slice(0, 20),
      reviews: [...(db.reviews || [])].sort((a, b) => a.due_at.localeCompare(b.due_at)),
    };
  },

  async listNotes(childId) {
    if (live) {
      const { data, error } = await sb.from('admin_notes').select('*')
        .eq('user_id', childId).order('created_at', { ascending: false });
      check(error, '메모를 불러오지 못했어요. 04_admin_notes.sql을 실행했는지 확인해 주세요.');
      return data || [];
    }
    return (readDemo().notes || []).filter((n) => n.user_id === childId).reverse();
  },

  async addNote(childId, body) {
    if (live) {
      const { error } = await sb.from('admin_notes').insert({ user_id: childId, body });
      check(error, '메모를 저장하지 못했어요.');
      return;
    }
    const db = readDemo();
    db.notes = db.notes || [];
    db.notes.push({ id: Date.now(), user_id: childId, body, created_at: new Date().toISOString() });
    writeDemo(db);
  },

  // 가입 신청·닉네임 승인 대기 목록
  async adminAccounts() {
    if (live) {
      const { data, error } = await sb.from('profiles')
        .select('id, nickname, status, age_group, guardian_ok, consent_checked_at, requested_at, display_name, display_name_pending, is_admin')
        .order('requested_at', { ascending: false });
      check(error);
      return (data || []).filter((p) => !p.is_admin);
    }
    const p = readDemo().profile;
    return p ? [{ ...p, status: p.status || 'approved' }] : [];
  },

  async adminSetStatus(childId, status, consent) {
    if (live) {
      const { error } = await sb.rpc('admin_set_status', { p_user: childId, p_status: status, p_consent: !!consent });
      if (error && /consent/.test(error.message)) throw new Error('어린이 계정은 "보호자 동의 확인함"에 체크해야 승인돼요.');
      check(error, '처리하지 못했어요.');
      return;
    }
    const db = readDemo(); if (db.profile?.id === childId) { db.profile.status = status; writeDemo(db); }
  },

  async adminReviewName(childId, ok) {
    if (live) {
      const { error } = await sb.rpc('admin_review_name', { p_user: childId, p_ok: ok });
      check(error, '처리하지 못했어요.');
      return;
    }
    const db = readDemo();
    if (db.profile?.id === childId) {
      if (ok) db.profile.display_name = db.profile.display_name_pending;
      db.profile.display_name_pending = null; writeDemo(db);
    }
  },

  // 회차 설정 저장 (날짜·영상 주소 둘 다 비우면 설정을 지움 → 기본 일정으로 돌아감)
  async adminSaveSetting(stageId, { opensAt, videoUrl }) {
    const row = { stage_id: stageId, opens_at: opensAt || null, video_url: videoUrl || null, updated_at: new Date().toISOString() };
    if (live) {
      const res = row.opens_at || row.video_url
        ? await sb.from('stage_settings').upsert(row)
        : await sb.from('stage_settings').delete().eq('stage_id', stageId);
      if (res.error && /video_url/.test(res.error.message)) throw new Error('유튜브 주소(https://youtube.com/… 또는 https://youtu.be/…)만 넣을 수 있어요.');
      check(res.error, '회차 설정을 저장하지 못했어요.');
      return;
    }
    const db = readDemo(); db.settings = db.settings || {};
    if (row.opens_at || row.video_url) db.settings[stageId] = row; else delete db.settings[stageId];
    writeDemo(db);
  },

  // 회차 암호 (서버 확인용, 07_server_checks.sql). 표가 없으면 null
  async adminClueKeys() {
    if (live) {
      const { data, error } = await sb.from('clue_keys').select('*');
      if (error) { console.error(error); return null; }
      return Object.fromEntries((data || []).map((r) => [r.stage_id, r.answer]));
    }
    return { ...(readDemo().clueKeys || {}) };
  },

  // 암호를 비우고 저장하면 서버 암호를 지움
  async adminSaveClueKey(stageId, answer) {
    const a = (answer || '').replace(/\s+/g, '');
    if (live) {
      const res = a
        ? await sb.from('clue_keys').upsert({ stage_id: stageId, answer: a, updated_at: new Date().toISOString() })
        : await sb.from('clue_keys').delete().eq('stage_id', stageId);
      check(res.error, '암호를 저장하지 못했어요. 07_server_checks.sql을 실행했는지 확인해 주세요.');
      return;
    }
    const db = readDemo(); db.clueKeys = db.clueKeys || {};
    if (a) db.clueKeys[stageId] = a; else delete db.clueKeys[stageId];
    writeDemo(db);
  },

  // 아이 계정 비밀번호 새로 정하기 (가짜 이메일이라 메일 재설정이 안 됨)
  async adminSetPassword(childId, password) {
    if (!password || password.length < 6) throw new Error('비밀번호는 6글자 이상으로 정해 주세요.');
    if (!live) throw new Error('체험 모드에는 비밀번호가 없어요.');
    const { error } = await sb.rpc('admin_set_password', { p_user: childId, p_password: password });
    if (missingFn(error)) throw new Error('07_server_checks.sql을 먼저 실행해 주세요.');
    if (error && /not for admin/.test(error.message)) throw new Error('관리자 계정 비밀번호는 여기서 바꿀 수 없어요.');
    check(error, '비밀번호를 바꾸지 못했어요.');
  },

  // 기록 내보내기(백업): 모든 표를 한 파일로 (실제 모드는 관리자 계정만 전체가 읽힘)
  async adminExport() {
    if (live) {
      const tables = ['profiles', 'progress', 'xp_log', 'clues', 'review_quiz', 'team_goals', 'admin_notes', 'stage_settings', 'learning_summary'];
      const results = await Promise.all(tables.map((t) => sb.from(t).select('*')));
      results.forEach((r) => check(r.error, '기록을 내보내지 못했어요.'));
      const keys = await sb.from('clue_keys').select('*'); // 07 SQL 실행 전에는 없음
      return { ...Object.fromEntries(tables.map((t, i) => [t, results[i].data || []])), clue_keys: keys.data || [] };
    }
    return { demo: readDemo() };
  },

  async deleteNote(noteId) {
    if (live) {
      const { error } = await sb.from('admin_notes').delete().eq('id', noteId);
      check(error, '메모를 지우지 못했어요.');
      return;
    }
    const db = readDemo();
    db.notes = (db.notes || []).filter((n) => n.id !== noteId);
    writeDemo(db);
  },
};

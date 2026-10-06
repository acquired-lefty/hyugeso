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
      return;
    }
    let db = readDemo();
    if (!db.profile || db.profile.nickname !== id) {
      db = {
        profile: { id: `demo-${id}`, nickname: id, level: 1, xp: 0, title: '새내기 손님', is_admin: false },
        progress: {}, clues: {}, xpLog: [], reviews: [], team: db.team || {},
      };
    }
    db.session = true;
    writeDemo(db);
    userId = db.profile.id;
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

  // 영상 단서: 처음 모을 때만 경험치
  async collectClue(profile, clueId) {
    if (live) {
      const { data, error } = await sb.rpc('collect_clue', { p_clue: clueId });
      check(error);
      return { isNew: data.new, ...fromServer(profile, data, data.new ? [{ source: 'clue', amount: data.gained }] : []) };
    }
    const db = readDemo();
    if (db.clues[clueId]) return { isNew: false, ...demoGrant(db, profile, []) };
    db.clues[clueId] = new Date().toISOString();
    return { isNew: true, ...demoGrant(db, profile, [{ source: 'clue', stageId: clueId }]) };
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

  // 단서 도감: { 's1-w01': '모은 날짜', ... }
  async listClues() {
    if (live) {
      const { data, error } = await sb.from('clues').select('clue_id, collected_at').eq('user_id', userId);
      check(error);
      return Object.fromEntries((data || []).map((c) => [c.clue_id, c.collected_at]));
    }
    return { ...(readDemo().clues || {}) };
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

  // ---------- 대표님용 대시보드 (실제 모드는 RLS가 관리자에게만 전체 기록을 열어 줌) ----------

  // 아이별 요약: learning_summary 뷰 + 아이디 + 단서 수
  async adminChildren() {
    if (live) {
      const [sum, prof, clue] = await Promise.all([
        sb.from('learning_summary').select('*'),
        sb.from('profiles').select('id, nickname, is_admin'),
        sb.from('clues').select('user_id'),
      ]);
      check(sum.error); check(prof.error); check(clue.error);
      const byNick = Object.fromEntries((sum.data || []).map((r) => [r.nickname, r]));
      const clueCount = {};
      for (const c of clue.data || []) clueCount[c.user_id] = (clueCount[c.user_id] || 0) + 1;
      return (prof.data || [])
        .filter((p) => !p.is_admin)
        .map((p) => ({ ...byNick[p.nickname], id: p.id, nickname: p.nickname, clues: clueCount[p.id] || 0 }))
        .sort((a, b) => a.nickname.localeCompare(b.nickname));
    }
    const db = readDemo();
    if (!db.profile) return [];
    const rows = Object.values(db.progress || {}).filter((r) => r.cleared);
    const avg = (key) => (rows.length ? Math.round((rows.reduce((s, r) => s + (r[key] || 0), 0) / rows.length) * 10) / 10 : null);
    const answered = (db.reviews || []).filter((r) => r.answered_at);
    return [{
      id: db.profile.id, nickname: db.profile.nickname, level: db.profile.level, xp: db.profile.xp,
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
      clues: Object.entries(db.clues || {}).map(([clue_id, collected_at]) => ({ clue_id, collected_at })),
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

  // 기록 내보내기(백업): 모든 표를 한 파일로 (실제 모드는 관리자 계정만 전체가 읽힘)
  async adminExport() {
    if (live) {
      const tables = ['profiles', 'progress', 'xp_log', 'clues', 'review_quiz', 'team_goals', 'admin_notes', 'learning_summary'];
      const results = await Promise.all(tables.map((t) => sb.from(t).select('*')));
      results.forEach((r) => check(r.error, '기록을 내보내지 못했어요.'));
      return Object.fromEntries(tables.map((t, i) => [t, results[i].data || []]));
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

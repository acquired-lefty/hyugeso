import { CONFIG } from './config.js';

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

  async updateProfile(patch) {
    if (live) {
      const { error } = await sb.from('profiles').update(patch).eq('id', userId);
      check(error);
      return;
    }
    const db = readDemo(); Object.assign(db.profile, patch); writeDemo(db);
  },

  async getProgress(stageId) {
    if (live) {
      const { data, error } = await sb.from('progress').select('*')
        .eq('user_id', userId).eq('stage_id', stageId).maybeSingle();
      check(error);
      return data;
    }
    return readDemo().progress?.[stageId] || null;
  },

  async allProgress() {
    if (live) {
      const { data, error } = await sb.from('progress').select('*').eq('user_id', userId);
      check(error);
      return Object.fromEntries((data || []).map((r) => [r.stage_id, r]));
    }
    return readDemo().progress || {};
  },

  async saveProgress(row) {
    if (live) {
      const { error } = await sb.from('progress').upsert({ user_id: userId, ...row });
      check(error);
      return;
    }
    const db = readDemo(); db.progress[row.stage_id] = row; writeDemo(db);
  },

  async logXp(entries) {
    const rows = entries.map((e) => ({ source: e.source, amount: e.amount, stage_id: e.stageId || null }));
    if (live) {
      const { error } = await sb.from('xp_log').insert(rows.map((r) => ({ user_id: userId, ...r })));
      check(error);
      return;
    }
    const db = readDemo();
    db.xpLog.push(...rows.map((r) => ({ ...r, created_at: new Date().toISOString() })));
    writeDemo(db);
  },

  async addClue(clueId) {
    if (live) {
      const { error } = await sb.from('clues').insert({ user_id: userId, clue_id: clueId });
      if (error?.code === '23505') return false;
      check(error);
      return true;
    }
    const db = readDemo();
    if (db.clues[clueId]) return false;
    db.clues[clueId] = new Date().toISOString(); writeDemo(db);
    return true;
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

  async countClues() {
    if (live) {
      const { count, error } = await sb.from('clues').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      check(error);
      return count || 0;
    }
    return Object.keys(readDemo().clues || {}).length;
  },

  async scheduleReview(conceptId, days) {
    const due = new Date(Date.now() + days * 86400000).toISOString();
    if (live) {
      const { error } = await sb.from('review_quiz').insert({ user_id: userId, concept_id: conceptId, due_at: due });
      check(error);
      return;
    }
    const db = readDemo(); db.reviews.push({ concept_id: conceptId, due_at: due }); writeDemo(db);
  },

  async teamGoal(goalId) {
    if (live) {
      const { data, error } = await sb.from('team_goals').select('*').eq('id', goalId).maybeSingle();
      check(error);
      return data;
    }
    return readDemo().team?.[goalId] || { id: goalId, title: '부엌 공동 목표', target: 60, current: 0 };
  },

  async contributeTeam(goalId) {
    if (live) {
      const { error } = await sb.rpc('contribute_team', { goal: goalId });
      check(error);
      return;
    }
    const db = readDemo();
    const g = db.team[goalId] || { id: goalId, title: '부엌 공동 목표', target: 60, current: 0 };
    g.current = Math.min(g.current + 1, g.target);
    db.team[goalId] = g; writeDemo(db);
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

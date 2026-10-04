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
};

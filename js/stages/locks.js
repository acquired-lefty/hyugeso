// 지하 잠긴 방의 자물쇠: 시즌 회차마다 단서(영상 암호) 하나가 열쇠가 된다.
// 이미 모은 단서는 자동으로 열리고, 못 모은 칸은 영상을 다시 보고 암호를 넣어 연다 (그때 단서도 기록됨).
// 시즌이 늘어나면 stages(그 시즌 회차 목록)만 바꿔서 그대로 쓴다.
import { h, bubble, normalize, clueHash } from '../ui.js';
import { store } from '../store.js';
import { youtubeId, watchUrl } from '../video.js';

export async function lockRoom(root, { stages, who, header, onAllOpen }) {
  const [clues, settings, profile] = await Promise.all([store.listClues(), store.loadSettings(), store.loadProfile()]);
  const talk = h('div', { class: 'talk' });
  const say = (text) => talk.replaceChildren(bubble(who, text));
  const list = h('ol', { class: 'locks' });
  const actions = h('div', { class: 'actions' });
  root.replaceChildren(h('section', { class: 'stage' }, header, h('h2', {}, '잠긴 방의 자물쇠'), talk, list, actions));

  const isOpen = (s) => !!clues[s.id];

  function lockItem(s) {
    const li = h('li', { class: `lock ${isOpen(s) ? 'is-open' : ''}` }, h('span', { class: 'lock-num' }, `${s.week}회 자물쇠`));
    if (isOpen(s)) {
      li.append(h('strong', { class: 'lock-word' }, clues[s.id].word || '✓'), h('span', { class: 'small muted' }, '열림'));
      return li;
    }
    if (!s.open || !s.load) {
      li.append(h('strong', { class: 'lock-word' }, '?'), h('span', { class: 'small muted' }, '아직 준비 중'));
      return li;
    }
    const video = youtubeId(settings[s.id]?.video_url);
    const input = h('input', { autocomplete: 'off', 'aria-label': `${s.week}회차 영상 암호` });
    const form = h('form', {
      class: 'lock-form',
      onsubmit: async (e) => {
        e.preventDefault();
        const mod = (await s.load()).default;
        const typed = normalize(input.value);
        if (!typed || !mod.clue.hash || await clueHash(typed) !== mod.clue.hash) {
          say('음… 이 자물쇠에 맞는 열쇠가 아닙니다만. 그 회차 영상을 다시 보면 찾을 수 있습니다만.');
          return;
        }
        try {
          const res = await store.collectClue(profile, s.id, typed);
          if (!res.ok) { say('음… 이 자물쇠에 맞는 열쇠가 아닙니다만.'); return; }
          clues[s.id] = { at: new Date().toISOString(), word: typed };
          say(res.isNew ? `딸깍. ${s.week}회 자물쇠가 열렸습니다만. 단서 카드도 챙겼습니다만. 경험치 +${res.gained}.` : `딸깍. ${s.week}회 자물쇠가 열렸습니다만.`);
          draw();
        } catch (err) { say(err.message); }
      },
    }, input, h('button', { class: 'btn primary', type: 'submit' }, '열쇠 넣기'),
    video ? h('a', { class: 'link small', href: watchUrl(video), target: '_blank', rel: 'noopener' }, '영상 다시 보기') : '');
    li.append(h('span', { class: 'small muted' }, s.title), form);
    return li;
  }

  function draw() {
    list.replaceChildren(...stages.map(lockItem));
    const left = stages.filter((s) => !isOpen(s)).length;
    if (left) {
      if (!talk.firstChild) say(`자물쇠가 ${stages.length}개입니다만. 모은 단서로 ${stages.length - left}개가 열렸습니다만. 남은 ${left}개는 영상 속 암호를 찾아와야 합니다만.`);
      actions.replaceChildren();
    } else {
      say('…자물쇠가 전부 열렸습니다만. 마지막 문이 남았습니다만.');
      actions.replaceChildren(h('button', { class: 'btn primary', onclick: onAllOpen }, '지하 문 열기'));
    }
  }
  draw();
}

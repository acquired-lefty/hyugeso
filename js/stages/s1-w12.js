// 12회차: 피날레 — 잠긴 방 열기 (시즌1 통합 복습)
// 대표님 결정: 지하 문의 자물쇠 12칸. 모은 단서는 자동으로 열리고, 못 모은 칸은 영상을 다시 보고 암호를 넣어야 열림.
// 다 열면 마지막 문제. 클리어하면 휴게소 지하가 열림 (app.js의 BASEMENT_STAGE).
// 내레이터: 자판남 (11~12회차)
// 마지막 문제는 임시: 채팅 구성문을 받으면 FINAL의 rounds·bonus를 바꾸고, 영상 암호를 받으면 clue.hash를 넣는다.
import { h } from '../ui.js';
import { mountStage } from './engine.js';
import { lockRoom } from './locks.js';
import { SEASON1 } from './index.js';

const FINAL = {
  episode: '12회차',
  title: '피날레: 잠긴 방 열기',
  host: 'ddal',
  intro: { line: '문 너머에 마지막 주문서가 있습니다만. 시즌 내내 배운 걸 꺼낼 차례입니다만.', start: '마지막 주문서 펼치기' },
  rounds: [
    {
      who: 'ddal', line: '(임시 문제) 마지막 문의 번호판입니다만.',
      steps: [{
        kind: 'choice',
        ask: '시즌1에서 모은 단서는 모두 몇 개일까?',
        choices: ['10개', '12개', '14개'],
        answer: 1,
        explain: '회차마다 하나씩, 12개입니다만.',
        hints: ['회차마다 단서가 하나씩 나왔습니다만.', '시즌1은 1회차부터 12회차까지입니다만.'],
      }],
    },
  ],
};

export default {
  id: 's1-w12',
  conceptId: 'math-final-01',
  review: [
    { q: '자물쇠 12개 중 7개를 열었어. 남은 자물쇠는 몇 개?', answer: 5, unit: '개',
      hints: ['전체에서 연 것을 빼는 거지.', '12 − 7을 해 보는 거지.'] },
  ],
  clue: { id: 's1-w12', hash: null, ask: '영상에서 지하 문에 적힌 암호는?' },
  stage: FINAL,
  mount(root, ctx) {
    const header = h('header', { class: 'stage-head' },
      h('button', { class: 'link', onclick: ctx.exit }, '휴게소로'),
      h('span', { class: 'stage-step' }, '12회차'));
    lockRoom(root, {
      stages: SEASON1, who: 'ddal', header,
      onAllOpen: () => mountStage(root, this.stage, ctx),
    }).catch((err) => { console.error(err); root.replaceChildren(h('p', { class: 'form-note' }, err.message)); });
  },
};

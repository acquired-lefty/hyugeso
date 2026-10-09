// 6회차: 중간 미션 — 메뉴 가격표 (1~5회차 중간 복습 + 수학·경제)
// 대표님 결정: 1~5회차 복습 문제에서 회차마다 한 문제씩 출제, 다 맞히면 2층 열쇠. 메뉴 가격표는 숨은 주문.
// 14일 뒤 자동 복습은 그대로 두고, 이 스테이지는 따로 있는 "중간 복습".
// 내레이터: 자판남 (5~6회차)
// 4·5회차 파일이 생기면 import와 ROUNDS의 해당 칸에 추가한다 (없는 회차는 건너뜀).
import { mountStage } from './engine.js';
import w01 from './s1-w01.js';
import w02 from './s1-w02.js';
import w03 from './s1-w03.js';

// 회차 한 칸 = 그 회차 복습 문제 중 하나를 골라 냄
const from = (week, mod) => mod?.review?.length && { kind: 'number', from: `${week}회차 복습`, pool: mod.review };

const ROUNDS = [
  { who: 'kkam', line: '1회차와 2회차에서 배운 거지. 기억나는지 보는 거지.', steps: [from(1, w01), from(2, w02)] },
  { who: 'tipo', line: '3회차랑 4회차. Okay, 천천히.', steps: [from(3, w03) /* , from(4, w04) */] },
  { who: 'ddal', line: '5회차입니다만. 이것만 풀면 2층 열쇠입니다만.', steps: [/* from(5, w05) */] },
].map((r) => ({ ...r, steps: r.steps.filter(Boolean) })).filter((r) => r.steps.length);

// 숨은 주문: 메뉴 가격표 (임시 문제, 채팅 구성문을 받으면 교체)
const MENU = '메뉴판: 쿠키 300원 · 우유 500원 · 호떡 700원';
const BONUS = {
  offer: '2층 열쇠는 챙겼습니다만… 계산대에 손님이 한 분 더 계십니다만.',
  who: 'ddal', line: `…숨은 주문입니다만. ${MENU}. 손님이 1000원을 내고 거스름돈 없이 두 가지를 사고 싶어 합니다만.`,
  steps: [{
    kind: 'choice',
    ask: '1000원으로 거스름돈 없이 딱 맞게 살 수 있는 것은?',
    choices: ['쿠키 2개 + 우유 1개', '우유 1개 + 호떡 1개', '쿠키 1개 + 호떡 1개'],
    answer: 2,
    explain: '300원 + 700원 = 1000원. 거스름돈이 없습니다만.',
    hints: [
      '가격을 더해서 1000원이 되는 것을 찾는 겁니다만.',
      '쿠키 2개는 300 + 300 = 600원. 하나씩 더해 보는 겁니다만.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 (숫자로 답함)
const REVIEW = [
  { q: '쿠키 300원, 우유 500원. 쿠키 2개와 우유 1개는 모두 얼마?', answer: 1100, unit: '원',
    hints: ['같은 물건이 여러 개면 곱하거나 여러 번 더하는 거지.', '300 + 300 = 600, 거기에 500을 더하는 거지.'] },
  { q: '1000원을 내고 700원짜리 호떡을 샀어. 거스름돈은 얼마?', answer: 300, unit: '원',
    hints: ['낸 돈에서 물건값을 빼면 거스름돈인 거지.', '1000 − 700을 해 보는 거지.'] },
  { q: '200원짜리 사탕 4개는 모두 얼마?', answer: 800, unit: '원',
    hints: ['200을 4번 더하는 거지.', '2 × 4 = 8. 그럼 200 × 4는?'] },
];

export default {
  id: 's1-w06',
  conceptId: 'math-mixed-01',
  review: REVIEW,
  // 영상 암호는 아직 없음: 받으면 hash를 넣고 tests/clue-answers.json에 추가
  clue: { id: 's1-w06', hash: null, ask: '영상에서 계산대 쪽지에 적힌 암호는?' },
  stage: {
    episode: '6회차',
    title: '중간 미션: 메뉴 가격표',
    host: 'ddal',
    intro: {
      line: '중간 점검입니다만. 지난 회차 문제를 하나씩 풀면 2층 열쇠를 드립니다만. 숫자 버튼으로 답을 누르시면 됩니다만.',
      start: '열쇠 받으러 가기',
    },
    rounds: ROUNDS,
    bonus: BONUS,
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

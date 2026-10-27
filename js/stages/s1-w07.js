// 7회차: 2층 피자 가게의 분수 (수학 3학년 분수)
// 똑같이 나눈 피자 고르기 → 단위분수 크기 비교 → 색칠한 조각의 분모 → (숨은 주문) 1/3 파운드 햄버거
// 진행 캐릭터: 규리사 (7~8회차). 무대: 2층(옛 푸드코트)의 피자 가게 — stages/index.js의 place: 'floor2'
// 영상 암호와 같거나 비슷한 표현은 화면·해설·힌트에 쓰지 않는다.
// 사실 확인: 1/3 > 1/4. 1/3 파운드 버거가 1/4 파운드보다 작다고 오해받아 덜 팔렸다는 이야기
//   https://en.wikipedia.org/wiki/Third-pound_burger
import { mountStage } from './engine.js';
import { pizzaSvg } from './pizza.js';

// 라운드 1: 피자 그림 6개 (조각 수·크기는 데이터로 바꿀 수 있음)
const PIZZAS = [
  { cuts: 2, equal: true },
  { cuts: [5, 3, 2], equal: false },
  { cuts: 4, equal: true },
  { cuts: [2, 1], equal: false },
  { cuts: 8, equal: true },
  { cuts: 3, equal: true },
];
const NUM = ['①', '②', '③', '④', '⑤', '⑥'];

// 라운드 3: 색칠한 한 조각의 분모 (숫자 버튼)
const shaded = (n) => ({
  kind: 'fill',
  art: pizzaSvg({ cuts: n, shade: [0], label: '똑같이 나눈 피자 중 한 조각이 색칠된 그림' }),
  ask: '색칠한 조각은 몇 분의 1입니까? 분모를 입력해 주십시오.',
  eq: '1/□',
  eqLabel: '□분의 1',
  answer: n,
  max: 20,
  okText: `1/${n}.`,
  msgs: { big: '음… 너무 큽니다만. 조각 수를 다시 세어 보십시오.', small: '음… 너무 작습니다만. 조각 수를 다시 세어 보십시오.' },
  hints: [
    '분모는 전체를 똑같이 나눈 조각 수인 거지.',
    '색칠 안 한 조각까지 모두 세어 보는 거지.',
  ],
});

// 라운드 2: 단위분수 비교 (보기 3개, 틀린 보기마다 방향만)
const compare = (a, b) => ({
  kind: 'choice',
  ask: `같은 피자에서 1/${a} 조각과 1/${b} 조각, 더 큰 쪽은?`,
  choices: [`1/${a}`, `1/${b}`, '같다'],
  answer: 0,
  wrongMsgs: [null, '음… 그건 더 많이 나눈 쪽이야.', '음… 같지 않아. 몇 조각으로 나눴는지 봐.'],
  explain: `1/${a}이 더 커.`,
  hints: [
    '분모는 몇 조각으로 나눴는지인 거지.',
    '많이 나눌수록 한 조각은 작아지는 거지. 티포도 여기서 헷갈렸던 거지.',
  ],
});

const ROUNDS = [
  {
    who: 'kkam',
    line: '피자 그림 여섯 개. 똑같이 나눈 것만 모두 고르는 거지.',
    steps: [{
      kind: 'pick',
      ask: '똑같이 나눈 피자를 모두 골라 주는 거지.',
      numbered: '피자', // 섞인 뒤 보이는 순서대로 피자 ①~⑥
      items: PIZZAS.map((p, i) => [`피자 ${NUM[i]}`, p.equal, pizzaSvg({ cuts: p.cuts, label: '피자 그림' })]),
      okText: '맞는 거지.',
      msgs: {
        many: '음… 똑같지 않은 것도 골랐어.',
        few: '음… 아직 남은 게 있는 거지.',
        swap: '음… 개수는 맞는데, 바꿔야 할 게 있는 거지.',
      },
      hints: [
        '분수는 똑같이 나눠야 하는 거지.',
        '조각들의 크기가 모두 같은지 하나씩 비교해 보는 거지.',
      ],
    }],
  },
  {
    who: 'tipo',
    line: '피자 조각 크기 비교. 대충 보면 안 돼. Okay?',
    steps: [compare(2, 3), compare(4, 8)],
  },
  {
    who: 'ddal',
    line: '그림의 색칠한 조각은 몇 분의 1입니까? 분모를 입력해 주십시오.',
    steps: [shaded(6), shaded(4), shaded(8)],
  },
];

const BONUS = {
  offer: '피자는 끝난 거지… 그런데 옆 가게 햄버거 이야기가 하나 남은 거지.',
  who: 'kkam',
  line: '1/3 파운드 햄버거와 1/4 파운드 햄버거, 고기가 더 많은 건 어느 쪽인 거지?',
  steps: [{
    kind: 'choice',
    ask: '고기가 더 많은 햄버거는?',
    choices: ['1/3 파운드', '1/4 파운드', '똑같다'],
    answer: 0,
    noLaugh: true,
    explain: '푸흡. 어른들보다 낫네. 3조각으로 나눈 하나가 4조각으로 나눈 하나보다 큰 거지.',
    hints: [
      '영상 속 어른들이 빠진 함정인 거지.',
      '분모가 작을수록 한 조각은 큰 거지.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 (수학 회차: 숫자 답, 진행 캐릭터 규리사가 힌트)
const REVIEW = [
  { q: '똑같이 5조각으로 나눈 것 중 1조각은 몇 분의 1일까? 분모를 입력해.', answer: 5, unit: '',
    hints: ['몇 조각으로 나눴는지 보는 거지.', '분모는 전체 조각 수인 거지.'] },
  { q: '1/2, 1/3, 1/6 중 가장 작은 조각의 분모는?', answer: 6, unit: '',
    hints: ['분모가 클수록 한 조각은 작은 거지.', '셋 중 가장 큰 분모를 찾는 거지.'] },
  { q: '똑같이 4조각으로 나눈 것 중 3조각은 3/4이야. 분자는?', answer: 3, unit: '',
    hints: ['분자는 그중 몇 개인지인 거지.', '색칠한 조각 수를 세는 거지.'] },
  { q: '1/8은 전체를 똑같이 몇 조각으로 나눈 것일까?', answer: 8, unit: '조각',
    hints: ['분모를 보는 거지.', '아래에 있는 숫자인 거지.'] },
];

export default {
  id: 's1-w07',
  conceptId: 'math-frac-01',
  review: REVIEW,
  // 암호는 화면 코드에 두지 않고 지문(SHA-256)만 둔다. 실제 암호: tests/clue-answers.json, 서버는 clue_keys 표
  clue: { id: 's1-w07', hash: '30c6841b47d11ea34ac2cee64705eaeb9b38019ba6c748f21599cc5e8762c7da', ask: '영상에서 피자 가게 간판에 적힌 암호는?' },
  stage: {
    episode: '7회차',
    title: '2층 피자 가게의 분수',
    host: 'kkam',
    shuffle: true, // 나열형 문제의 보기를 할 때마다 섞음
    intro: { line: '2층에 온 걸 환영하는 거지. 오늘은 피자를 나눠 볼 거야.', start: '피자 가게 들어가기' },
    rounds: ROUNDS,
    bonus: BONUS,
    result: {
      clear: '2층 첫 번째 방, 통과인 거지.',
      findClue: '영상 마지막, 간판의 네 글자를 입력하는 거지.',
    },
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

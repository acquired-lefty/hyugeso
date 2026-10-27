// 6회차: 중간 미션 — 매점 메뉴판 (수학 3학년 덧셈·뺄셈·곱셈·나눗셈 + 가격 이야기)
// 합계 구하기 → 거스름돈 담기(천 원 지폐·백 원 동전) → 나눠 내기 → (숨은 주문) 동전 테두리 톱니
// 진행 캐릭터: 자판남 (5~6회차). 클리어하면 휴게소 위층이 열린다 (app.js의 FLOOR2_STAGE, 허브 해금 연출)
// 영상 암호와 같거나 비슷한 표현(층·열쇠)은 화면·해설·힌트·해금 문구에 쓰지 않는다.
// 사실 확인: 동전 테두리 톱니는 금·은 동전 가장자리를 깎아 내는 것을 막으려고 생김
//   https://www.wikitree.co.kr/articles/1136833
// 화폐는 실제 도안이 아닌 단순한 그림(css .box-bill / .box-coin)
import { mountStage } from './engine.js';

// 화면 공통 가격표
const PRICE = { 컵라면: 1500, 주먹밥: 1200, 우유: 900 };
const won = (n) => `${n.toLocaleString('ko-KR')}원`;
const MENU_LINE = Object.entries(PRICE).map(([k, v]) => `${k} ${won(v)}`).join(' · ');

// 라운드 1: 합계 (숫자 버튼)
const sum = (a, b) => ({
  kind: 'fill',
  ask: `메뉴판: ${MENU_LINE}`,
  eq: `${a} + ${b} = □원`,
  eqLabel: `${a} 하나와 ${b} 하나는 모두 얼마`,
  answer: PRICE[a] + PRICE[b],
  max: 9999,
  okText: `${won(PRICE[a] + PRICE[b])}.`,
  msgs: { big: '음… 너무 많습니다만.', small: '음… 조금 모자랍니다만.' },
  hints: [
    '고른 것들의 가격을 모두 더합니다만.',
    '천 원끼리, 백 원끼리 따로 더해 보십시오. 1,500은 천 원 하나와 백 원 다섯 개입니다만.',
  ],
});

// 라운드 2: 거스름돈 (1회차 상자 방식을 천 원·백 원으로)
const change = (paid, cost, hint2) => ({
  kind: 'boxes',
  money: true,
  boxes: [1000, 100],
  names: { 1000: '천 원 지폐', 100: '백 원 동전' },
  art: { 1000: 'bill', 100: 'coin' },
  target: paid - cost,
  item: '거스름돈',
  unit: '원',
  cards: [
    { cls: 'recipe', tag: '낸 돈', line: '손님이 낸 돈', big: won(paid) },
    { cls: 'slip', tag: '산 것', line: '물건값', big: won(cost) },
  ],
  ask: '거스름돈을 지폐와 동전으로 담아 줘.',
  cartNote: '담은 돈을 누르면 하나씩 빠져요.',
  send: '거스름돈 주기',
  noLaugh: true,
  okText: `쉬이익— Perfect. 거스름돈 ${won(paid - cost)}.`,
  msgs: { empty: '돈부터 담아.', over: '음… 너무 많이 줬어.', under: '음… 조금 모자라.' },
  hints: ['낸 돈에서 물건값을 빼는 겁니다만.', hint2],
});

const ROUNDS = [
  {
    who: 'ddal',
    line: '손님 주문입니다만. 모두 얼마입니까?',
    steps: [sum('컵라면', '우유'), sum('주먹밥', '우유'), sum('컵라면', '주먹밥')],
  },
  {
    who: 'tipo',
    line: '내가 5,000원 냈어. 2,400원어치 샀으니까… 거스름돈 줘.',
    steps: [
      change(5000, 2400, '5,000에서 2,000을 먼저 빼고, 남은 3,000에서 400을 더 빼 보십시오.'),
      change(3000, 2100, '3,000에서 2,000을 먼저 빼고, 남은 1,000에서 100을 더 빼 보십시오.'),
    ],
  },
  {
    who: 'kkam',
    line: '주먹밥 세 개, 3,600원을 셋이 똑같이 나눠 내면 한 사람은 얼마인 거지?',
    steps: [{
      kind: 'choice',
      ask: '3,600원을 셋이 똑같이 나눠 내면 한 사람은?',
      choices: ['1,000원', '1,200원', '1,800원'],
      answer: 1,
      explain: '맞는 거지. 3,600 ÷ 3 = 1,200. 한 사람에 주먹밥 하나 값인 거지.',
      hints: [
        '3회차에서 배운 나눗셈입니다만.',
        '1,200원짜리를 셋이 하나씩 먹은 겁니다만.',
      ],
    }],
  },
];

const BONUS = {
  offer: '오늘 계산은 끝입니다만… 동전 하나를 더 살펴보시겠습니까?',
  who: 'ddal',
  line: '…숨은 주문입니다만. 옛날 동전 테두리에는 톱니가 새겨져 있었습니다만.',
  steps: [{
    kind: 'choice',
    ask: '옛날 동전 테두리에 톱니를 새긴 까닭은 무엇입니까?',
    choices: ['테두리를 몰래 깎아 내는 것을 막으려고', '예쁘게 보이려고', '굴러가지 않게 하려고'],
    answer: 0,
    noLaugh: true,
    explain: '딸깍, 딸깍. 영상을 잘 보셨습니다만.',
    hints: [
      '옛날 동전은 진짜 금과 은으로 만들었습니다만.',
      '톱니가 있으면 깎은 자국이 바로 보입니다만.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 (수학 회차: 숫자 답, 진행 캐릭터 자판남이 힌트)
const REVIEW = [
  { q: '1,500 + 900 = ?', answer: 2400, unit: '원',
    hints: ['천끼리, 백끼리 따로 더하면 됩니다만.', '1,000 + (500 + 900)을 해 보시면 됩니다만.'] },
  { q: '5,000 − 2,400 = ?', answer: 2600, unit: '원',
    hints: ['낸 돈에서 물건값을 빼는 겁니다만.', '5,000 − 2,000 − 400을 해 보시면 됩니다만.'] },
  { q: '1,200 × 3 = ?', answer: 3600, unit: '원',
    hints: ['같은 것을 여러 개 사면 곱하는 겁니다만.', '1,000 × 3 + 200 × 3을 해 보시면 됩니다만.'] },
  { q: '3,600 ÷ 3 = ?', answer: 1200, unit: '원',
    hints: ['똑같이 나누는 겁니다만.', '3,000 ÷ 3 + 600 ÷ 3을 해 보시면 됩니다만.'] },
];

export default {
  id: 's1-w06',
  conceptId: 'math-money-01',
  review: REVIEW,
  // 암호는 화면 코드에 두지 않고 지문(SHA-256)만 둔다. 실제 암호: tests/clue-answers.json, 서버는 clue_keys 표
  clue: { id: 's1-w06', hash: '3486a22993cd6e5a96f04a35a670dad2b423d1302a6bc2aab2c1903931a022e9', ask: '영상에서 메뉴판 뒷면에 적힌 암호는?' },
  stage: {
    episode: '6회차',
    title: '중간 미션: 매점 메뉴판',
    host: 'ddal',
    shuffle: true, // 나열형 문제의 보기를 할 때마다 섞음
    intro: { line: '중간 미션입니다만. 오늘은 제가 매점 계산을 맡겼습니다. 잘 부탁드립니다.', start: '계산대 열기' },
    rounds: ROUNDS,
    bonus: BONUS,
    result: {
      clear: '중간 미션 완료입니다만. 계산대를 맡겨도 되겠습니다.',
      findClue: '영상 마지막, 메뉴판 뒷면의 네 글자를 입력해 주십시오.',
    },
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

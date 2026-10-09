// 1회차: 휴게소 첫날, 레시피 3배로! (수학 3-2 곱셈)
// 레시피 1판의 양 × 주문 수만큼, 창고에서 100·10·1 단위 상자를 골라 담는다.
import { mountStage } from './engine.js';

const STAGE = {
  episode: '1회차',
  title: '레시피 3배로!',
  host: 'kkam',
  intro: {
    line: '어서 와. 오늘은 주문 준비인 거지. 레시피에 적힌 양에 주문 수를 곱해서, 창고에서 딱 맞게 꺼내 오면 되는 거지.',
    start: '창고 들어가기',
  },
  rounds: [
    {
      who: 'kkam', label: '주문 1 / 3', line: '첫 손님이야. 팬케이크 4판 주문인 거지.',
      steps: [{ kind: 'boxes', dish: '팬케이크', dishUnit: '판', item: '달걀', unit: '개', per: 3, times: 4, boxes: [10, 1],
        hints: ['1판에 3개. 4판이면 3을 4번 더하는 거지.', '3, 6, 9… 하나만 더 세어 보는 거지.'] }],
    },
    {
      who: 'tipo', label: '주문 2 / 3', line: '쿠키는 내 담당. 3판. 대충은 안 돼. 정확하게.',
      steps: [{ kind: 'boxes', dish: '쿠키', dishUnit: '판', item: '초코칩', unit: '개', per: 24, times: 3, boxes: [10, 1],
        hints: ['24를 3번 더하는 거지.', '20×3 하고, 4×3 하고, 둘을 더하는 거지.'] }],
    },
    {
      who: 'ddal', label: '주문 3 / 3', line: '단체 손님입니다만. 젤리 화채 3그릇.',
      steps: [{ kind: 'boxes', dish: '젤리 화채', dishUnit: '그릇', item: '젤리', unit: '개', per: 128, times: 3, boxes: [100, 10, 1],
        hints: ['128을 3번 더하는 거지.', '100×3, 20×3, 8×3을 따로 구해서 더하는 거지.'] }],
    },
  ],
  bonus: {
    offerWho: 'ddal',
    offer: '오늘 주문은 끝입니다만… 아직 하나 남았습니다만. 조금 어렵습니다만.',
    who: 'ddal', line: '…숨은 주문이 있습니다만. 호떡 15접시. 한 접시에 12개.',
    steps: [{ kind: 'boxes', dish: '호떡', dishUnit: '접시', item: '호떡', unit: '개', per: 12, times: 15, boxes: [100, 10, 1],
      hints: ['12를 15번 더하면 너무 길지. 15를 10과 5로 나누는 거지.', '12×10은 120, 12×5는 60. 이제 더하는 거지.'] }],
  },
};

// 2주 후 복습 퀴즈 문제 (하나를 골라 출제, 숫자로 답함)
const REVIEW = [
  { q: '쿠키 1봉지에 쿠키가 8개. 손님이 6봉지를 주문했어. 쿠키는 모두 몇 개?', answer: 48, unit: '개',
    hints: ['같은 수를 여러 번 더하는 건 곱셈인 거지.', '8을 6번 더하거나, 8×6을 떠올려 보는 거지.'] },
  { q: '주스 1병에 오렌지가 4개 들어가. 9병을 만들려면 오렌지는 몇 개?', answer: 36, unit: '개',
    hints: ['1병에 4개씩, 9병. 4를 9번 더하는 거지.', '4×9. 4단을 끝까지 외워 보는 거지.'] },
  { q: '호떡 1접시에 호떡이 14개. 5접시면 호떡은 모두 몇 개?', answer: 70, unit: '개',
    hints: ['14를 10과 4로 나눠서 생각하는 거지.', '10×5 하고, 4×5 하고, 둘을 더하는 거지.'] },
  { q: '젤리 1통에 젤리가 125개. 3통이면 젤리는 모두 몇 개?', answer: 375, unit: '개',
    hints: ['백, 십, 일 자리로 나눠서 곱하는 거지.', '100×3, 20×3, 5×3을 따로 구해서 더하는 거지.'] },
];

export default {
  id: 's1-w01',
  conceptId: 'math-mul-01',
  review: REVIEW,
  clue: { id: 's1-w01', answer: '빠른덧셈', ask: '영상에서 규리사가 알려 준 창고 암호는?' },
  stage: STAGE,
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

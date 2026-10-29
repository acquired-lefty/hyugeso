// 9회차: 2층 식재료 창고의 저울 (수학 3-2 들이와 무게)
// 들이·무게 카드 나누기 → L·mL 바꾸기(숫자 버튼) → 우유 1 L와 설탕 1 kg 양팔저울 → (숨은 주문) 1 kg의 첫 기준
// 진행 캐릭터: 티포 (9~10회차). 무대: 2층 옛 푸드코트 뒤쪽 식재료 창고 — stages/index.js의 place: 'floor2'
// 영상 암호와 같거나 비슷한 표현은 화면·해설·힌트에 쓰지 않는다 (숨은 주문은 "물"이라는 말만 씀).
// 사실 확인: 1 L = 1000 mL, 1 kg = 1000 g, 1 t = 1000 kg / 우유 1 L ≈ 1.03 kg / 1 kg의 첫 기준은 물 1 L(1795년 프랑스)
//   https://books.lib.uoguelph.ca (우유 밀도) , https://www.itc.gov.hk (킬로그램의 역사)
import { mountStage } from './engine.js';

// 양팔저울 (왼쪽 우유팩, 오른쪽 설탕 봉지). 정답 뒤 .tilt-left로 우유 쪽이 내려감 (css)
const BALANCE = `<svg viewBox="0 0 240 150" class="exp-art balance-art" role="img" aria-label="양팔저울 왼쪽에 우유팩, 오른쪽에 설탕 봉지">
  <path d="M120 34v96M96 138h48" stroke="#7A5A2E" stroke-width="6" stroke-linecap="round"/>
  <g class="beam">
    <rect x="30" y="30" width="180" height="8" rx="4" fill="#C9A574" stroke="#7A5A2E" stroke-width="2"/>
  </g>
  <circle cx="120" cy="34" r="6" fill="#7A5A2E"/>
  <g class="pan-left">
    <path d="M40 38l-14 46M40 38l14 46" stroke="#7A5A2E" stroke-width="1.5"/>
    <path d="M18 84h44l-6 8H24z" fill="#C9A574" stroke="#7A5A2E" stroke-width="2"/>
    <path d="M30 84V58l10-8 10 8v26z" fill="#FBF6EC" stroke="#3B57A6" stroke-width="2"/>
    <path d="M30 58h20" stroke="#3B57A6" stroke-width="2"/>
    <text x="40" y="76" text-anchor="middle" font-size="10" font-weight="700" fill="#3B57A6">우유</text>
  </g>
  <g class="pan-right">
    <path d="M200 38l-14 46M200 38l14 46" stroke="#7A5A2E" stroke-width="1.5"/>
    <path d="M178 84h44l-6 8h-32z" fill="#C9A574" stroke="#7A5A2E" stroke-width="2"/>
    <path d="M186 84q-2-14 2-22l4-4h16l4 4q4 8 2 22z" fill="#FFFFFF" stroke="#8A8A8A" stroke-width="2"/>
    <text x="200" y="77" text-anchor="middle" font-size="10" font-weight="700" fill="#555">설탕</text>
  </g>
</svg>`;

const ROUNDS = [
  {
    who: 'tipo',
    line: '카드에 적힌 양을 보고, 들이인지 무게인지 나눠 줘.',
    steps: [{
      kind: 'sort',
      bins: [{ key: 'volume', name: '들이' }, { key: 'weight', name: '무게' }],
      ask: '카드마다 들이인지 무게인지 골라 줘.',
      okText: '',
      items: [
        ['물병의 물 500 mL', 'volume'], ['욕조의 물 200 L', 'volume'], ['주스 1 L', 'volume'],
        ['강아지 5 kg', 'weight'], ['연필 6 g', 'weight'], ['쌀 10 kg', 'weight'], ['물탱크에 담긴 물 1 t', 'weight'],
      ],
      hints: [
        '담을 수 있는 양은 들이, 무거운 정도는 무게야.',
        'L, mL가 붙으면 들이, kg, g, t이 붙으면 무게. 단위만 봐.',
      ],
    }],
  },
  {
    who: 'kkam',
    line: '계량컵에 2 L 300 mL가 들어 있는 거지. 몇 mL인지 눌러 줘.',
    steps: [{
      kind: 'fill',
      ask: '2 L 300 mL는 몇 mL인 거지?',
      eq: '2 L 300 mL = □ mL',
      eqLabel: '2리터 300밀리리터는 몇 밀리리터',
      answer: 2300,
      max: 9999,
      okText: '맞는 거지. 2300 mL.',
      msgs: { big: '음… 너무 큰 거지.', small: '음… 너무 작은 거지.' },
      hints: [
        '1 L는 1000 mL야.',
        '2 L는 2000 mL. 거기에 300 mL를 더해 봐.',
      ],
    }],
  },
  {
    who: 'ddal',
    line: '우유 1 L와 설탕 1 kg을 양팔저울에 올렸습니다만. 어느 쪽이 내려갔겠습니까?',
    steps: [{
      kind: 'choice',
      art: BALANCE,
      artOk: 'tilt-left',
      ask: '어느 쪽이 내려갔을까?',
      choices: ['우유', '설탕', '똑같아서 수평'],
      answer: 0,
      explain: '통을 빼면 우유 1 L는 약 1 kg 30 g입니다만.',
      hints: [
        '숫자가 같아도 들이와 무게는 달라.',
        '우유 1 L는 1 kg보다 조금 더 무거워.',
      ],
    }],
  },
];

const BONUS = {
  offer: '오늘 주문은 끝. …그런데 저울에 얽힌 옛날 이야기가 하나 있어.',
  who: 'tipo',
  line: '약 230년 전 프랑스에서 1 kg을 처음 정할 때, 무엇을 기준으로 정했을까?',
  steps: [{
    kind: 'choice',
    ask: '1 kg을 처음 정할 때 기준은?',
    choices: ['물', '쇠', '모래'],
    answer: 0,
    noLaugh: true,
    explain: 'Perfect. 그 뒤에는 금속 추, 지금은 변하지 않는 과학 숫자로 1 kg을 정해.',
    hints: [
      '부엌에서 매일 쓰는 거야.',
      '마시는 거야. 계량컵에 가득 담아서 쟀지.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 (수학 회차: 숫자 답, 진행 캐릭터 티포가 힌트)
const REVIEW = [
  { q: '1 L = □ mL', answer: 1000, unit: 'mL',
    hints: ['리터는 밀리리터의 천 배야.', '1 뒤에 0이 세 개.'] },
  { q: '3 kg = □ g', answer: 3000, unit: 'g',
    hints: ['1 kg = 1000 g이야.', '1000을 세 번 더해 봐.'] },
  { q: '1 kg 500 g = □ g', answer: 1500, unit: 'g',
    hints: ['1 kg을 g으로 바꿔 봐.', '1000 + 500. Okay?'] },
  { q: '2 t = □ kg', answer: 2000, unit: 'kg',
    hints: ['1 t = 1000 kg이야.', '1000 + 1000.'] },
];

export default {
  id: 's1-w09',
  conceptId: 'math-measure-01',
  review: REVIEW,
  // 암호는 화면 코드에 두지 않고 지문(SHA-256)만 둔다. 실제 암호: tests/clue-answers.json, 서버는 clue_keys 표
  clue: { id: 's1-w09', hash: 'fce3bf10cd7a6891aa9389ab901b0d88e80915b43543629ebd0f3cda5af3bd5b', ask: '영상에서 창고 벽 작은 칠판에 나타난 암호는?' },
  stage: {
    episode: '9회차',
    title: '2층 식재료 창고의 저울',
    host: 'tipo',
    shuffle: true, // 나열형 문제의 보기를 할 때마다 섞음
    intro: { line: '2층 창고 문이 드디어 열렸어. 오늘은 저울 앞에서 문제를 풀 거야. Okay?', start: '창고 들어가기' },
    rounds: ROUNDS,
    bonus: BONUS,
    result: {
      clear: '저울 앞에서도 침착하네. 음… not bad.',
      findClue: '영상 마지막, 창고 칠판에 나타난 네 글자를 입력해.',
    },
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

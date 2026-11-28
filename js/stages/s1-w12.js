// 12회차: 지하 방의 번호 자물쇠 (시즌1 피날레, 통합 복습: 나눗셈의 나머지·소리의 높낮이·분수의 크기)
// 지하 문의 둥근 놋쇠 번호 자물쇠(숫자 바퀴 3칸). 라운드를 하나 풀 때마다 그 라운드 정답 숫자가 한 칸씩 채워지고(engine의 wheels),
// 세 칸이 다 차면 문이 열림 → (숨은 주문) 숫자 바퀴 2개 자물쇠의 번호 수. 클리어하면 휴게소 지하(옛 주인 관리실)가 열림 (app.js의 BASEMENT_STAGE)
// 진행 캐릭터: 자판남 (11~12회차). 영상은 일부러 다른 수(14÷4, 3·5·8 피자, 5번 컵, 번호 2-3-5)를 쓰고, 게임은 17÷5, 2·4·6 케이크, 번호 2-2-6
// 예전 설계(모은 단서 12개로 자물쇠 12칸 열기, locks.js)는 이 회차 자신의 단서가 필요해 열 수 없으므로 쓰지 않는다.
// 영상 암호와 같거나 비슷한 표현은 화면·해설·힌트·제목에 쓰지 않는다. 암호를 맞힌 뒤의 안내(app.js DOOR_MAP)에만 나온다.
// 사실 확인: 나머지는 나누는 수보다 작다 — https://mathcentral.uregina.ca/QQ/database/QQ.09.07/alfred1.html
//   물을 채운 병을 두드리면 물이 많을수록 낮은 소리 — https://van.physics.illinois.edu/ask/listing/2051
import { mountStage } from './engine.js';
import { pizzaSvg } from './pizza.js';
import w03 from './s1-w03.js';
import w04 from './s1-w04.js';
import w07 from './s1-w07.js';

// 라운드 1: 쿠키 17개와 접시 5개
const COOKIES = (() => {
  const cookie = (x, y) => `<g transform="translate(${x} ${y})"><circle r="9" fill="#C9A574" stroke="#7A5A2E" stroke-width="1.5"/><circle cx="-3" cy="-2" r="1.6" fill="#5A3A22"/><circle cx="3" cy="2" r="1.6" fill="#5A3A22"/><circle cx="2" cy="-4" r="1.2" fill="#5A3A22"/></g>`;
  const list = Array.from({ length: 17 }, (_, i) => cookie(22 + (i % 9) * 27, i < 9 ? 18 : 42)).join('');
  const plates = Array.from({ length: 5 }, (_, i) => `<ellipse cx="${34 + i * 48}" cy="86" rx="20" ry="8" fill="#FBF6EC" stroke="#3B57A6" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 0 260 100" class="exp-art" role="img" aria-label="쿠키 17개와 빈 접시 5개">${list}${plates}</svg>`;
})();

// 라운드 2: 보기마다 병 그림 (물 높이만 다름, 같은 병)
const bottle = (n, water) => `<svg viewBox="0 0 30 50" class="bottle" aria-hidden="true">
  <path d="M11 2h8v10l7 6v26a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V18l7-6z" fill="#EAF6F3"/>
  <path d="M5 ${48 - water}h20v${water - 4}a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#5C9DB8"/>
  <path d="M11 2h8v10l7 6v26a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V18l7-6z" fill="none" stroke="#1A1F33" stroke-width="2" stroke-linejoin="round"/>
  <text x="15" y="30" text-anchor="middle" font-size="10" font-weight="700" fill="#1A1F33">${n}</text>
</svg>`;

// 라운드 3: 같은 케이크를 2·4·6조각으로 똑같이 나누고, 한 조각씩 색칠
const CAKES = `<div class="cake-row" role="img" aria-label="같은 크기 케이크 세 개를 2조각, 4조각, 6조각으로 나누고 한 조각씩 색칠함">${
  [2, 4, 6].map((n) => `<figure>${pizzaSvg({ cuts: n, shade: [0], cls: 'pizza cake', label: `${n}조각 케이크` })}<figcaption>${n}조각</figcaption></figure>`).join('')}</div>`;

// 숨은 주문: 숫자 바퀴 2개 자물쇠
const LOCK2 = `<svg viewBox="0 0 120 110" class="exp-art lock2-art" role="img" aria-label="숫자 바퀴가 두 개인 작은 자물쇠">
  <path d="M38 50V30a22 22 0 0 1 44 0v20" fill="none" stroke="#8A6A33" stroke-width="9"/>
  <rect x="22" y="46" width="76" height="58" rx="12" fill="#C9A24A" stroke="#7A5A2E" stroke-width="2.5"/>
  ${[0, 1].map((k) => `<g transform="translate(${38 + k * 26} 54)"><rect width="18" height="42" rx="3" fill="#FBF6EC" stroke="#1A1F33" stroke-width="1.5"/>
    <text x="9" y="11" text-anchor="middle" font-size="9" fill="#A89A80">9</text><text x="9" y="26" text-anchor="middle" font-size="13" font-weight="700" fill="#1A1F33">0</text><text x="9" y="39" text-anchor="middle" font-size="9" fill="#A89A80">1</text></g>`).join('')}
</svg>`;

// 결과 화면 구석: 조이스틱 표시가 있는 놋쇠 열쇠 꼬리표 (글자 없음, 시즌2 오락실 떡밥)
const KEY_TAG = `<svg viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="9" cy="9" r="6" fill="none" stroke="#7A5A2E" stroke-width="2.5"/>
  <path d="M13 13l4 4" stroke="#7A5A2E" stroke-width="2"/>
  <path d="M15 17l8-4 14 14-10 10-14-14z" fill="#C9A24A" stroke="#7A5A2E" stroke-width="2" stroke-linejoin="round"/>
  <g transform="rotate(45 27 26)"><rect x="21" y="29" width="12" height="4" rx="1.5" fill="#1C2747"/><path d="M27 29v-7" stroke="#1C2747" stroke-width="2"/><circle cx="27" cy="21" r="2.6" fill="#E5658F"/></g>
</svg>`;

const ROUNDS = [
  {
    who: 'tipo',
    line: '쿠키 17개를 5명이 똑같이 나눠 먹을 거야. 몇 개가 남을까?',
    steps: [{
      kind: 'choice',
      art: COOKIES,
      ask: '쿠키 17개를 5명이 똑같이 나누면 몇 개가 남을까?',
      choices: ['2개', '3개', '7개'],
      answer: 0,
      wrongMsg: '음… 한 사람에게 몇 개씩 줄 수 있는지 먼저 봐.',
      explain: '나머지는 나누는 수보다 항상 작아.',
      hints: [
        '나눌 수 있는 만큼 나누고, 남은 것이 나머지입니다만.',
        '5명에게 3개씩 주면 15개입니다만. 17에서 15를 빼 보십시오.',
      ],
    }],
  },
  {
    who: 'kkam',
    line: '숟가락으로 병을 두드리는 거지. 가장 낮은 소리가 나는 병은?',
    steps: [{
      kind: 'choice',
      ask: '숟가락으로 두드렸을 때 가장 낮은 소리가 나는 병은?',
      choices: ['1번 (물 조금)', '2번 (물 가득)', '3번 (물 반)'],
      choiceArt: [bottle(1, 10), bottle(2, 30), bottle(3, 19)],
      answer: 1,
      wrongMsg: '음… 물이 많으면 병이 더 천천히 떨리는 거지.',
      explain: '맞는 거지. 물이 많을수록 낮은 소리, 적을수록 높은 소리인 거지.',
      hints: [
        '영상에서는 물이 적을수록 높은 소리였습니다만.',
        '낮은 소리는 그 반대입니다만.',
      ],
    }],
  },
  {
    who: 'ddal',
    line: '같은 케이크를 똑같이 나눴습니다. 한 조각이 가장 작은 것은 몇 조각으로 나눈 케이크입니까?',
    steps: [{
      kind: 'choice',
      art: CAKES,
      ask: '한 조각이 가장 작은 케이크는?',
      choices: ['2조각', '4조각', '6조각'],
      answer: 2,
      wrongMsg: '음… 많이 나눌수록 한 조각이 어떻게 되는지 떠올려 보십시오.',
      explain: '번호 2-2-6, 문이 열립니다만.',
      hints: [
        '많이 나눌수록 한 조각은 작아집니다만.',
        '가장 많이 나눈 케이크를 찾으십시오.',
      ],
    }],
  },
];

const BONUS = {
  offer: '문은 열렸습니다만… 자물쇠 문제가 하나 더 남아 있습니다만.',
  who: 'ddal',
  line: '숫자 바퀴가 두 개(0~9)만 있는 자물쇠도 있습니다. 번호는 모두 몇 가지입니까?',
  steps: [{
    kind: 'choice',
    art: LOCK2,
    ask: '숫자 바퀴 두 개 자물쇠의 번호는 모두 몇 가지?',
    choices: ['20가지', '99가지', '100가지'],
    answer: 2,
    wrongMsg: '음… 00부터 하나씩 세어 보십시오.',
    explain: '바퀴가 하나 늘 때마다 번호는 10배로 늘어납니다.',
    hints: [
      '00부터 시작합니다만.',
      '00부터 99까지 세십시오. 바퀴 세 개는 1,000가지였습니다만.',
    ],
  }],
};

// 2주 후 복습 퀴즈 (통합 복습: 3지선다, 진행 캐릭터 자판남이 힌트)
const REVIEW = [
  { q: '사탕 11개를 3명이 똑같이 나누면 몇 개가 남을까?', choices: ['2개', '3개', '1개'], answer: 0,
    hints: ['3개씩 주면 9개입니다만.', '11 빼기 9입니다만.'] },
  { q: '1/2, 1/3, 1/10 중에서 가장 큰 것은?', choices: ['1/2', '1/3', '1/10'], answer: 0,
    hints: ['적게 나눌수록 한 조각이 큽니다만.', '둘로 나눈 것이 가장 큰 조각입니다만.'] },
  { q: '물이 든 컵을 숟가락으로 두드릴 때, 물을 더 부으면 소리는?', choices: ['낮아진다', '높아진다', '그대로다'], answer: 0,
    hints: ['물이 많으면 천천히 떨립니다만.', '천천히 떨리면 낮은 소리입니다만.'] },
  { q: '숫자 바퀴(0~9)가 3개인 자물쇠의 번호는 모두 몇 가지?', choices: ['1,000가지', '30가지', '999가지'], answer: 0,
    hints: ['000부터 999까지입니다만.', '10 × 10 × 10입니다만.'] },
];

export default {
  id: 's1-w12',
  // 복습 예약용 개념 ID (회차마다 하나여야 복습 문제를 찾을 수 있어 새 ID 유지). 라운드가 다룬 개념은 concepts
  conceptId: 'math-final-01',
  concepts: [w03.conceptId, w04.conceptId, w07.conceptId],
  review: REVIEW,
  // 암호는 화면 코드에 두지 않고 지문(SHA-256)만 둔다. 실제 암호: tests/clue-answers.json, 서버는 clue_keys 표
  clue: { id: 's1-w12', hash: 'eabcc76bb1dcc891476b054d805c49c4fd3be3026c03b9a25654b35bcd32c250', ask: '영상 끝부분, 벽 지도 첫 번째 칸에 떠오른 암호는?' },
  stage: {
    episode: '12회차',
    title: '지하 방의 번호 자물쇠',
    host: 'ddal',
    shuffle: true, // 나열형 문제의 보기를 할 때마다 섞음
    wheels: [2, 2, 6], // 라운드 1·2·3 정답 숫자
    intro: { line: '지하 방 문에 번호 자물쇠가 있습니다. 번호는 배운 것 안에 있습니다만.', start: '번호 찾기' },
    rounds: ROUNDS,
    bonus: BONUS,
    result: {
      clear: '시즌1, 모두 정확했습니다만.',
      findClue: '영상 끝부분, 벽 지도 첫 번째 칸에 떠오른 네 글자를 입력하십시오.',
      egg: { art: KEY_TAG, label: '조이스틱 표시가 있는 놋쇠 열쇠 꼬리표', line: '오락실 문은 시즌2 첫 회에 열립니다만.' },
      seasonBoard: true, // 결과 화면에 시즌1 회차 클리어 표시 1~12
    },
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

// 11회차: 옛 푸드코트의 판매 장부 (수학 3~4학년군 자료와 가능성: 표·막대그래프)
// 바를 정 표시 세기 → 장부를 세어 표 채우기 → 막대그래프 비교 → (숨은 주문) 나라마다 다른 다섯 묶음 표시
// 진행 캐릭터: 자판남 (11~12회차). 무대: 2층 옛 푸드코트 사무실(낡은 판매 장부가 든 책상 서랍)·호두과자 가게
//   — stages/index.js의 place: 'floor2'
// 영상 암호와 같거나 비슷한 표현은 화면·해설·힌트·제목에 쓰지 않는다 ('한눈에' 한 단어는 써도 됨).
// 사실 확인: 다섯 묶음 표시 — 한·중·일 正, 영미권 세로줄 4개 + 사선, 프랑스·남미 네모 + 대각선
//   https://www.digmandarin.com (“正”, the Chinese Tally Mark). 장부·간식 수는 가상의 자료.
import { mountStage } from './engine.js';

// 正 획 순서: 위 가로 → 가운데 세로 → 오른쪽 짧은 가로 → 왼쪽 세로 → 아래 가로
const ZHENG = [[4, 4, 36, 4], [20, 4, 20, 36], [20, 20, 32, 20], [9, 20, 9, 36], [2, 36, 38, 36]];
// 正 표시 n획을 (x, y)에 그림. animate면 획이 하나씩 그어짐 (css .tally-art, 동작 줄이기면 바로 다 보임)
const zheng = (x, y, n, delay0 = 0, animate = true) => ZHENG.slice(0, n).map(([x1, y1, x2, y2], k) =>
  `<line class="${animate ? 'stroke' : ''}" pathLength="1" x1="${x + x1}" y1="${y + y1}" x2="${x + x2}" y2="${y + y2}"${animate ? ` style="animation-delay:${(delay0 + k) * 0.35}s"` : ' stroke="#1A1F33" stroke-width="5" stroke-linecap="round"'}/>`).join('');

// 라운드 1: 장부 칸 (正 두 개 + 두 획: 丅 모양)
const LEDGER_TALLY = `<svg viewBox="0 0 220 80" class="exp-art tally-art" role="img" aria-label="장부 칸에 바를 정 표시 두 개와 획 두 개가 그어져 있음">
  <rect x="2" y="2" width="216" height="76" rx="6" fill="#F3E6C8" stroke="#8A6A33" stroke-width="2"/>
  <text x="12" y="22" font-size="12" font-weight="700" fill="#8A6A33">호두과자</text>
  ${zheng(20, 32, 5, 0)}${zheng(80, 32, 5, 5)}${zheng(140, 32, 2, 10)}
</svg>`;

// 라운드 3: 간식 막대그래프 (세로 한 칸 = 1개)
const BAR = (() => {
  const data = [['핫도그', 6], ['감자', 8], ['어묵', 4]];
  const unit = 12; const base = 120; const left = 30;
  const grid = Array.from({ length: 9 }, (_, i) => `<line x1="${left}" y1="${base - i * unit}" x2="230" y2="${base - i * unit}" stroke="#D9CFBB" stroke-width="1"/>
    <text x="${left - 6}" y="${base - i * unit + 4}" text-anchor="end" font-size="9" fill="#555">${i}</text>`).join('');
  const bars = data.map(([name, v], i) => {
    const x = left + 20 + i * 62;
    return `<rect x="${x}" y="${base - v * unit}" width="36" height="${v * unit}" fill="${['#F2A93B', '#8ED8C9', '#E5658F'][i]}" stroke="#1A1F33" stroke-width="1.5"/>
      <text x="${x + 18}" y="${base + 16}" text-anchor="middle" font-size="12" font-weight="700" fill="#1A1F33">${name}</text>`;
  }).join('');
  return `<svg viewBox="0 0 240 145" class="exp-art" role="img" aria-label="간식 막대그래프: 핫도그, 감자, 어묵. 세로 한 칸은 1개">
    ${grid}<line x1="${left}" y1="${base}" x2="230" y2="${base}" stroke="#1A1F33" stroke-width="2"/><line x1="${left}" y1="${base}" x2="${left}" y2="${base - 8 * unit - 4}" stroke="#1A1F33" stroke-width="2"/>
    ${bars}<text x="236" y="10" text-anchor="end" font-size="9" fill="#555">(개)</text>
  </svg>`;
})();

// 숨은 주문 보기 그림: 다섯 묶음 표시 세 가지
const FIVE = {
  gate: `<svg viewBox="0 0 48 36"><g stroke="#1A1F33" stroke-width="3" stroke-linecap="round"><path d="M10 6v24M18 6v24M26 6v24M34 6v24M4 26l36-16"/></g></svg>`,
  zheng: `<svg viewBox="0 0 48 36"><g transform="translate(5 -2) scale(.95)">${zheng(0, 0, 5, 0, false)}</g></svg>`,
  box: `<svg viewBox="0 0 48 36"><g stroke="#1A1F33" stroke-width="3" stroke-linecap="round" fill="none"><rect x="10" y="5" width="26" height="26"/><path d="M10 31L36 5"/></g></svg>`,
};

// 결과 화면 구석: 가운데 구멍 뚫린 놋쇠 동전 (글자 없음, 12회차 떡밥)
const COIN = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#C9A24A" stroke="#7A5A2E" stroke-width="2"/><circle cx="20" cy="20" r="12" fill="none" stroke="#E2C27A" stroke-width="1.5"/><rect x="16" y="16" width="8" height="8" fill="#FBF6EC" stroke="#7A5A2E" stroke-width="1.5"/></svg>`;

const ROUNDS = [
  {
    who: 'ddal',
    line: '장부에 바를 정 표시가 이렇게 있습니다. 몇 개가 팔린 것입니까?',
    steps: [{
      kind: 'choice',
      art: LEDGER_TALLY,
      ask: '호두과자는 몇 개가 팔린 것일까?',
      choices: ['12개', '7개', '10개'],
      answer: 0,
      wrongMsg: '음… 완성된 正 하나가 몇인지 떠올려 보십시오.',
      explain: '다섯씩 묶으면 큰 수도 빠르게 셀 수 있습니다만.',
      hints: [
        '正 한 개는 다섯입니다만.',
        '다섯, 다섯, 그리고 남은 획 두 개를 더하십시오.',
      ],
    }],
  },
  {
    who: 'kkam',
    line: '음료 장부 열두 줄을 세어서 표에 적는 거지.',
    steps: [{
      kind: 'table',
      ask: '음료 장부 (위에서부터 한 줄씩)',
      rows: ['식혜', '커피', '식혜', '주스', '식혜', '커피', '주스', '식혜', '커피', '식혜', '주스', '커피'],
      cols: [{ label: '식혜', answer: 5 }, { label: '커피', answer: 4 }, { label: '주스', answer: 3 }, { label: '합계', answer: 12 }],
      okText: '맞는 거지.',
      msgs: { big: '너무 많은 거지.', small: '모자란 거지.', tail: '한 줄씩 세면서 표시를 해 보는 거지.' },
      hints: [
        '식혜만 먼저 세고, 다음에 커피를 세십시오.',
        '세 개를 다 더한 수가 열두 줄과 같아야 합니다만.',
      ],
    }],
  },
  {
    who: 'tipo',
    line: '간식 막대그래프야. 핫도그는 어묵보다 몇 개 더 팔렸을까?',
    steps: [{
      kind: 'choice',
      art: BAR,
      ask: '핫도그는 어묵보다 몇 개 더 팔렸을까?',
      choices: ['2개', '4개', '6개'],
      answer: 0,
      wrongMsg: '음… 두 막대의 칸 수 차이를 세 봐.',
      explain: '막대그래프는 많고 적음을 한 번에 보여 줘.',
      hints: [
        '막대 끝에서 옆으로 선을 그어 보십시오.',
        '여섯 빼기 넷입니다만.',
      ],
    }],
  },
];

const BONUS = {
  offer: '장부 정리는 끝났습니다만… 다른 나라의 세는 표시도 하나 보시겠습니까?',
  who: 'ddal',
  line: '영국이나 미국에서 다섯을 셀 때 쓰는 표시는 무엇입니까?',
  steps: [{
    kind: 'choice',
    ask: '영국이나 미국에서 쓰는 다섯 묶음 표시는?',
    choices: ['세로줄 4개에 사선', '바를 정(正)', '네모에 대각선'],
    choiceArt: [FIVE.gate, FIVE.zheng, FIVE.box],
    answer: 0,
    explain: '모양은 달라도 다섯씩 묶는 건 같습니다만.',
    hints: [
      '우리나라는 바를 정을 씁니다만.',
      '네모에 대각선은 프랑스나 남아메리카에서 씁니다만.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 — 대표님 결정으로 이 회차는 수학이지만 3지선다 (reviewChoices)
const REVIEW = [
  { q: '正 세 개는 모두 몇일까?', choices: ['15', '3', '12'], answer: 0,
    hints: ['正 하나는 5입니다만.', '5를 세 번 더해 보십시오.'] },
  { q: '여러 자료의 많고 적음을 한눈에 비교하기 가장 좋은 것은?', choices: ['막대그래프', '순서대로 적은 장부', '긴 글'], answer: 0,
    hints: ['막대 길이로 비교할 수 있습니다만.', '장부는 하나하나 다 세어 봐야 합니다만.'] },
  { q: '막대그래프에서 세로 한 칸이 1개일 때, 7칸 막대와 3칸 막대의 차이는?', choices: ['4', '10', '3'], answer: 0,
    hints: ['칸 수의 차이를 봅니다만.', '7 빼기 3입니다만.'] },
  { q: '표의 좋은 점은?', choices: ['정확한 수를 알 수 있다', '그림이 예쁘다', '색이 많다'], answer: 0,
    hints: ['표에는 숫자가 적혀 있습니다만.', '그래프는 비교, 표는 정확한 수입니다만.'] },
];

export default {
  id: 's1-w11',
  conceptId: 'math-data-01',
  review: REVIEW,
  reviewChoices: true,
  // 암호는 화면 코드에 두지 않고 지문(SHA-256)만 둔다. 실제 암호: tests/clue-answers.json, 서버는 clue_keys 표
  clue: { id: 's1-w11', hash: 'd84827ab4318e0bc29778661f2efb0f586574e98cba2a8aa786063a356ba545d', ask: '영상 끝부분, 장부 뒷표지 안쪽에 드러난 암호는?' },
  stage: {
    episode: '11회차',
    title: '옛 푸드코트의 판매 장부',
    host: 'ddal',
    shuffle: true, // 나열형 문제의 보기를 할 때마다 섞음 (라운드 2 장부 목록은 정해진 순서 그대로)
    intro: { line: '사무실 서랍에서 낡은 판매 장부를 찾았습니다. 정리는 정확하게 해야 합니다만.', start: '장부 펼치기' },
    rounds: ROUNDS,
    bonus: BONUS,
    result: {
      clear: '자료 정리 실력, 정확합니다만.',
      findClue: '영상 끝부분, 장부 뒷표지 안쪽에 드러난 네 글자를 입력하십시오.',
      egg: { art: COIN, label: '구멍 뚫린 놋쇠 동전', line: '휴게소에서 쓰는 돈은 아닙니다만…' },
    },
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

// 5회차: 둥근 뚜껑의 비밀 (수학 3학년 원)
// 원 속 반지름 고르기 → 반지름·지름 빈칸 → 네모·둥근 뚜껑 중 빠지는 것 → (숨은 주문) 통영 맨홀 뚜껑 그림
// 진행 캐릭터: 자판남 (5~6회차)
// 사실 확인: 정사각형은 한 변보다 대각선이 길어 네모 뚜껑은 대각선 방향으로 구멍에 빠질 수 있다.
//   https://koreascience.kr/article/JAKO200545940486972.pdf
import { mountStage } from './engine.js';

// 중심 점이 있는 원과 선 6개 (선이나 번호를 눌러도 고를 수 있음)
const CIRCLE_ART = `<svg viewBox="0 0 240 240" class="exp-art" role="img" aria-label="중심 점이 있는 원과 번호가 붙은 선 여섯 개">
  <circle cx="120" cy="120" r="90" fill="#fff" stroke="#7A5A2E" stroke-width="4"/>
  <g data-pick="0"><line class="hit" x1="120" y1="120" x2="120" y2="30"/><line class="ln" x1="120" y1="120" x2="120" y2="30"/><circle class="tag" cx="134" cy="64.2" r="12"/><text x="134" y="69.2" text-anchor="middle" font-size="15" font-weight="700">1</text></g>
  <g data-pick="1"><line class="hit" x1="120" y1="120" x2="204.6" y2="150.8"/><line class="ln" x1="120" y1="120" x2="204.6" y2="150.8"/><circle class="tag" cx="167.7" cy="152.3" r="12"/><text x="167.7" y="157.3" text-anchor="middle" font-size="15" font-weight="700">2</text></g>
  <g data-pick="2"><line class="hit" x1="120" y1="120" x2="51.1" y2="177.9"/><line class="ln" x1="120" y1="120" x2="51.1" y2="177.9"/><circle class="tag" cx="68.3" cy="145.2" r="12"/><text x="68.3" y="150.2" text-anchor="middle" font-size="15" font-weight="700">3</text></g>
  <g data-pick="3"><line class="hit" x1="68.4" y1="46.3" x2="171.6" y2="193.7"/><line class="ln" x1="68.4" y1="46.3" x2="171.6" y2="193.7"/><circle class="tag" cx="139.5" cy="172.2" r="12"/><text x="139.5" y="177.2" text-anchor="middle" font-size="15" font-weight="700">4</text></g>
  <g data-pick="4"><line class="hit" x1="165" y1="42.1" x2="208.6" y2="104.4"/><line class="ln" x1="165" y1="42.1" x2="208.6" y2="104.4"/><circle class="tag" cx="198.3" cy="65.2" r="12"/><text x="198.3" y="70.2" text-anchor="middle" font-size="15" font-weight="700">5</text></g>
  <g data-pick="5"><line class="hit" x1="120" y1="120" x2="115.6" y2="169.8"/><line class="ln" x1="120" y1="120" x2="115.6" y2="169.8"/><circle class="tag" cx="102.8" cy="156.1" r="12"/><text x="102.8" y="161.1" text-anchor="middle" font-size="15" font-weight="700">6</text></g>
  <circle cx="120" cy="120" r="5" fill="#E5658F" pointer-events="none"/>
  <text x="128" y="112" font-size="13" fill="#1A1F33" pointer-events="none">중심</text>
</svg>`;

// 네모 뚜껑·둥근 뚜껑과 각각의 구멍 (설명용)
const LID_ART = `<svg viewBox="0 0 260 130" class="exp-art" role="img" aria-label="네모 구멍 위의 네모 뚜껑과 둥근 구멍 위의 둥근 뚜껑">
  <rect x="22" y="22" width="86" height="86" rx="4" fill="#3B57A6" opacity=".25"/>
  <rect x="30" y="30" width="70" height="70" fill="#1C2747"/>
  <path d="M30 100 L100 30" stroke="#F2A93B" stroke-width="3" stroke-dasharray="6 5"/>
  <circle cx="190" cy="65" r="44" fill="#3B57A6" opacity=".25"/>
  <circle cx="190" cy="65" r="36" fill="#1C2747"/>
  <text x="65" y="126" text-anchor="middle" font-size="13" fill="#1A1F33">네모 뚜껑</text>
  <text x="190" y="126" text-anchor="middle" font-size="13" fill="#1A1F33">둥근 뚜껑</text>
</svg>`;

// 반지름·지름 빈칸 (숫자 버튼)
const size = (eq, answer, okText) => ({
  kind: 'fill', ask: '뚜껑 치수의 빈칸을 채워 주십시오.', eq, answer, max: 99, okText,
  msgs: { big: '음… 너무 큰 거지.', small: '음… 조금 작은 거지.' },
  hints: [
    '지름은 반지름의 두 배입니다만.',
    '지름은 반지름을 두 번 더하고, 반지름은 지름을 반으로 나누면 됩니다만.',
  ],
});

const ROUNDS = [
  {
    who: 'ddal',
    line: '원 안에 선이 6개 있습니다만. 반지름을 모두 골라 주십시오.',
    steps: [{
      kind: 'pick',
      art: CIRCLE_ART,
      ask: '반지름을 모두 골라 주십시오. (그림 속 선이나 번호를 눌러도 됩니다)',
      items: [['선 ①', true], ['선 ②', true], ['선 ③', true], ['선 ④', false], ['선 ⑤', false], ['선 ⑥', false]],
      okText: '',
      msgs: {
        many: '음… 반지름이 아닌 선도 골랐습니다만.',
        few: '음… 반지름이 더 있습니다만.',
        swap: '음… 개수는 맞습니다만, 바꿔야 할 선이 있습니다만.',
      },
      hints: [
        '반지름은 중심에서 원 위까지입니다.',
        '두 가지를 보십시오. 중심에서 시작하는가, 원 위에서 끝나는가.',
      ],
    }],
  },
  {
    who: 'kkam',
    line: '뚜껑 치수를 재는 거지. 빈칸을 채워 줘.',
    steps: [
      size('반지름 3cm → 지름 □cm', 6, '맞는 거지. 지름 6cm.'),
      size('반지름 7cm → 지름 □cm', 14, '맞는 거지. 지름 14cm.'),
      size('지름 10cm → 반지름 □cm', 5, '맞는 거지. 반지름 5cm.'),
    ],
  },
  {
    who: 'tipo',
    line: '두 뚜껑 모두 구멍보다 조금 커. 어느 쪽이 구멍으로 빠질 수 있을까?',
    steps: [{
      kind: 'choice',
      art: LID_ART,
      ask: '구멍으로 빠질 수 있는 뚜껑은?',
      choices: ['네모 뚜껑', '둥근 뚜껑', '둘 다 안 빠짐'],
      answer: 0,
      noLaugh: true,
      explain: '쉬이익— Perfect. 둥근 뚜껑은 어느 방향으로 재도 지름이 같아서 빠지지 않아.',
      hints: [
        '뚜껑을 세워서 비스듬히 넣는다고 생각해 보십시오.',
        '네모 구멍은 한 변보다 대각선이 더 깁니다만.',
      ],
    }],
  },
];

const BONUS = {
  offer: '뚜껑 검사는 끝났습니다만… 다른 동네 뚜껑 이야기가 하나 남았습니다만.',
  who: 'ddal',
  line: '…숨은 주문입니다만. 영상에서 동네마다 맨홀 뚜껑 그림이 다르다는 걸 보셨습니다만.',
  steps: [{
    kind: 'choice',
    ask: '영상에 나온 통영의 맨홀 뚜껑에는 무엇이 그려져 있습니까?',
    choices: ['거북선', '호랑이', '학'],
    answer: 0,
    noLaugh: true,
    explain: '딸깍, 딸깍. 영상을 잘 보셨습니다만.',
    hints: [
      '통영은 바다 도시입니다만.',
      '이순신 장군과 관련이 있습니다만.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 (수학 회차: 숫자 답, 진행 캐릭터 자판남이 힌트)
const REVIEW = [
  { q: '반지름이 5cm인 원의 지름은?', answer: 10, unit: 'cm',
    hints: ['지름은 반지름의 두 배입니다만.', '5 + 5를 해 보시면 됩니다만.'] },
  { q: '지름이 12cm인 원의 반지름은?', answer: 6, unit: 'cm',
    hints: ['반지름은 지름의 반입니다만.', '12를 똑같이 둘로 나눠 보시면 됩니다만.'] },
  { q: '컴퍼스를 4cm 벌려 그린 원의 지름은?', answer: 8, unit: 'cm',
    hints: ['컴퍼스를 벌린 만큼이 반지름입니다만.', '4의 두 배를 구해 보시면 됩니다만.'] },
];

export default {
  id: 's1-w05',
  conceptId: 'math-circle-01',
  review: REVIEW,
  // 암호는 화면 코드에 두지 않고 지문(SHA-256)만 둔다. 실제 암호: tests/clue-answers.json, 서버는 clue_keys 표
  clue: { id: 's1-w05', hash: '074ddc5a338d7e8b3455f1fbdcbd9b5bcc0c94041b18b6933550056f97479513', ask: '영상에서 휴게소 뚜껑 가장자리에 적힌 암호는?' },
  stage: {
    episode: '5회차',
    title: '둥근 뚜껑의 비밀',
    host: 'ddal',
    intro: { line: '주차장 맨홀에 오신 걸 환영합니다만. 오늘은 제가 안내합니다.', start: '뚜껑 열기' },
    rounds: ROUNDS,
    bonus: BONUS,
    result: {
      clear: '뚜껑 검사 완료입니다만. 딸깍, 딸깍.',
      findClue: '영상 속 뚜껑 가장자리에 적힌 네 글자를 입력해 주십시오.',
    },
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

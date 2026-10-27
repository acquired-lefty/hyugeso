// 8회차: 옥상의 작은 손님 (과학 3학년 동물의 생활)
// 사는 곳에 맞게 동물 나누기 → 사막에서 살기 좋은 특징 고르기 → 낙타 혹 속 → (숨은 주문) 사막여우가 움직이는 때
// 진행 캐릭터: 규리사 (7~8회차). 무대: 2층에서 이어지는 옥상 정원(사막 화단) — stages/index.js의 place: 'floor2'
// 영상 암호와 같거나 비슷한 표현은 화면·해설·힌트에 쓰지 않는다 ("사막여우"는 사용 가능).
// 사실 확인: 낙타 혹은 지방 저장(물 아님). 사막여우는 밤에 활동하고 먹이에서 물을 대부분 얻음
//   https://www.internetgeography.net/topics/how-have-animals-adapted-to-the-desert
//   https://indianapublicmedia.org/amomentofscience/the-camels-unique-physiology.php
//   ("물을 피에 저장"은 자료마다 달라서, 해설은 "물은 혹이 아니라 몸속에"로 넓게 씀)
import { mountStage } from './engine.js';
import { ANIMAL_ART } from './animals.js';

const HOMES = [
  { key: 'land', name: '땅' },
  { key: 'water', name: '물' },
  { key: 'desert', name: '사막' },
];
const animal = (name, home) => [name, home, ANIMAL_ART[name]];

const ROUNDS = [
  {
    who: 'kkam',
    line: '동물들을 사는 곳에 맞게 나눠 주는 거지.',
    steps: [{
      kind: 'sort',
      bins: HOMES,
      ask: '동물마다 사는 곳(땅, 물, 사막)을 골라 주는 거지.',
      okText: '맞는 거지.',
      items: [
        animal('두더지', 'land'), animal('붕어', 'water'), animal('낙타', 'desert'),
        animal('개미', 'land'), animal('고등어', 'water'), animal('사막여우', 'desert'),
      ],
      hints: [
        '동물은 사는 곳에 맞는 생김새를 가진 거지.',
        '지느러미가 있으면 물, 흙 속에 굴을 파고 지내면 땅, 더위와 마른 땅에 강하면 사막인 거지.',
      ],
    }],
  },
  {
    who: 'kkam',
    line: '사막에서 살아남기 좋은 특징을 모두 골라 줘.',
    steps: [{
      kind: 'pick',
      ask: '사막에서 살아남기 좋은 특징을 모두 골라 주는 거지.',
      items: [
        ['큰 귀로 몸의 열 내보내기', true], ['넓고 평평한 발', true], ['긴 속눈썹', true],
        ['서늘한 밤에 활동하기', true], ['아가미로 숨쉬기', false], ['지느러미로 헤엄치기', false],
      ],
      okText: '사막 박사인 거지.',
      msgs: {
        many: '음… 물속에서 필요한 것도 골랐어.',
        few: '음… 아직 더 있는 거지.',
        swap: '음… 개수는 맞는데, 바꿔야 할 게 있는 거지.',
      },
      hints: [
        '사막은 덥고, 물이 적고, 모래가 많은 곳인 거지.',
        '아가미와 지느러미는 물에 사는 동물에게 필요한 거지.',
      ],
    }],
  },
  {
    who: 'kkam',
    line: '낙타 등의 혹 속에는 무엇이 들어 있을까?',
    steps: [{
      kind: 'choice',
      ask: '낙타 등의 혹 속에는 무엇이 들어 있을까?',
      choices: ['물', '지방', '공기'],
      answer: 1,
      noLaugh: true,
      explain: '맞아. 물이 아니라 지방인 거지. 물은 혹이 아니라 몸속에 담기고, 낙타는 한 번에 물을 아주 많이 마실 수 있는 거지.',
      hints: [
        '많은 사람이 물이라고 착각하는 거지.',
        '먹을 것이 없을 때 힘을 내는 저장 창고인 거지.',
      ],
    }],
  },
];

const BONUS = {
  offer: '손님 이야기가 하나 더 남은 거지.',
  who: 'kkam',
  line: '사막여우는 주로 언제 움직일까?',
  steps: [{
    kind: 'choice',
    ask: '사막여우는 주로 언제 움직일까?',
    choices: ['뜨거운 낮', '서늘한 밤', '하루 종일'],
    answer: 1,
    noLaugh: true,
    explain: '푸흡. 그래서 밤에 만난 거지. 사막여우는 먹이에서 물을 대부분 얻어서, 물을 조금만 마셔도 괜찮은 거지.',
    hints: [
      '낮에는 너무 더운 거지.',
      '영상에서 여우가 휴게소에 나타난 때를 떠올려 보는 거지.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 (과학 회차: 3지선다, 진행 캐릭터 규리사가 힌트)
const REVIEW = [
  { q: '사막여우의 큰 귀가 하는 일은?', choices: ['몸의 열 내보내기', '물 저장하기', '먹이 모으기'], answer: 0,
    hints: ['사막은 아주 더운 곳인 거지.', '큰 귀로 몸의 뜨거운 기운을 밖으로 보내는 거지.'] },
  { q: '낙타의 넓고 평평한 발이 좋은 점은?', choices: ['모래에 잘 빠지지 않는다', '빨리 헤엄친다', '나무를 탄다'], answer: 0,
    hints: ['사막 바닥은 모래인 거지.', '발이 넓으면 몸무게가 넓게 나뉘는 거지.'] },
  { q: '낙타 혹 속에 든 것은?', choices: ['물', '지방', '모래'], answer: 1,
    hints: ['많은 사람이 착각하는 문제인 거지.', '먹을 것이 없을 때 힘을 내는 저장 창고인 거지.'] },
  { q: '사막여우가 물을 조금만 마셔도 괜찮은 까닭은?', choices: ['먹이에서 물을 대부분 얻어서', '혹에 물을 담아 두어서', '귀에 물을 담아 두어서'], answer: 0,
    hints: ['사막여우에게는 혹이 없는 거지.', '먹는 것 속에도 물이 들어 있는 거지.'] },
];

export default {
  id: 's1-w08',
  conceptId: 'sci-animal-01',
  review: REVIEW,
  // 암호는 화면 코드에 두지 않고 지문(SHA-256)만 둔다. 실제 암호: tests/clue-answers.json, 서버는 clue_keys 표
  clue: { id: 's1-w08', hash: 'a49d78328818f2280a5d6693cad1411ad045a751102be2a8682000b3d53b07a7', ask: '영상에서 사막 화단의 큰 화분에 적힌 암호는?' },
  stage: {
    episode: '8회차',
    title: '옥상의 작은 손님',
    host: 'kkam',
    intro: { line: '옥상에 작은 손님이 온 거지. 놀라지 않게 조용히 들어와.', start: '옥상 정원 나가기' },
    rounds: ROUNDS,
    bonus: BONUS,
    result: {
      clear: '작은 손님도 편히 자고 있는 거지.',
      findClue: '영상 마지막, 큰 화분에 나타난 네 글자를 입력해.',
    },
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

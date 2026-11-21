// 10회차: 옥상 화단의 갈라진 바위 (과학 3~4학년군 땅의 변화 [4과11-01])
// 얼어붙는 물과 바위 틈 → 흐르는 물이 하는 일 3칸 나누기 → 강 위쪽·아래쪽 돌 → (숨은 주문) 그랜드 캐니언
// 진행 캐릭터: 티포 (9~10회차). 무대: 옥상 정원의 흙 화단·갈라진 큰 바위·계단실 지붕 빗물 홈통 (비가 막 그친 밤)
//   — stages/index.js의 place: 'rooftop'
// 영상 암호와 같거나 비슷한 표현은 화면·해설·힌트·제목에 쓰지 않는다 (빗물·물길·홈통은 따로 써도 됨).
// 사실 확인: 물은 얼면 부피가 약 9% 커짐 / 그랜드 캐니언 약 600만 년·깊이 약 1.6 km / 흙 1 cm에 길게는 약 1000년
//   https://open.maricopa.edu (Physical Geology 6.1) , https://www.nps.gov/grca , https://www.fao.org (FAO 사무총장 연설)
import { mountStage } from './engine.js';

// 들어가기 장면: 비 그친 밤 옥상 흙 화단 (갈라진 바위와 틈의 풀, 홈통, 물길, 각설탕 7개 든 통, 작은 돌, 반쯤 묻힌 놋쇠 열쇠)
const SCENE = `<svg viewBox="0 0 360 190" class="exp-art" role="img" aria-label="비가 그친 밤, 옥상 흙 화단과 갈라진 바위, 빗물 홈통, 물길, 각설탕 통, 작은 돌, 반쯤 묻힌 열쇠">
  <rect width="360" height="190" rx="10" fill="#1C2747"/>
  <circle cx="40" cy="26" r="1.5" fill="#FBF6EC"/><circle cx="120" cy="16" r="1.2" fill="#FBF6EC"/><circle cx="210" cy="30" r="1.5" fill="#FBF6EC"/>
  <rect x="268" y="40" width="80" height="70" fill="#27345C" stroke="#0F1630" stroke-width="2"/>
  <path d="M262 40h92" stroke="#33427A" stroke-width="6"/>
  <path d="M300 43v60q0 10-10 12h-14" fill="none" stroke="#8A93B8" stroke-width="5" stroke-linecap="round"/>
  <path d="M272 118q-2 8 1 14" stroke="#8ED8C9" stroke-width="2" stroke-dasharray="3 3"/>
  <path d="M10 120q170-14 340 0v62H10z" fill="#6E4A2E" stroke="#3A2A22" stroke-width="2"/>
  <path d="M270 132q-60 10-110 20t-140 18" fill="none" stroke="#3E2A1A" stroke-width="9" stroke-linecap="round"/>
  <path d="M270 132q-60 10-110 20t-140 18" fill="none" stroke="#5C9DB8" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  <g transform="translate(150 146) rotate(-12)">
    <rect x="-7" y="-3" width="14" height="6" rx="3" fill="#C9A24A" stroke="#7A5A2E" stroke-width="1.2"/>
    <rect x="-1" y="-1" width="13" height="2" fill="#C9A24A"/><rect x="8" y="1" width="2" height="3" fill="#C9A24A"/>
    <circle cx="-11" cy="0" r="5" fill="none" stroke="#C9A24A" stroke-width="1.6"/>
    <circle cx="-11" cy="0" r="2" fill="#FBF6EC" stroke="#7A5A2E" stroke-width=".8"/>
  </g>
  <path d="M30 120l14-34 34-6 22 16 6 24z" fill="#8A8F99" stroke="#3A2A22" stroke-width="2"/>
  <path d="M62 82l-4 16 6 10-3 12" fill="none" stroke="#3A2A22" stroke-width="2.5"/>
  <path d="M60 98l-6-8M61 98l5-9M60 98l1-10" stroke="#5FA35A" stroke-width="2" stroke-linecap="round"/>
  <rect x="196" y="94" width="40" height="34" rx="4" fill="#DDEEF5" fill-opacity=".55" stroke="#8A93B8" stroke-width="2"/>
  <rect x="194" y="88" width="44" height="7" rx="2" fill="#8A93B8"/>
  <g fill="#FBF6EC" stroke="#C9A574" stroke-width=".8">
    <rect x="200" y="117" width="8" height="8"/><rect x="209" y="117" width="8" height="8"/><rect x="218" y="117" width="8" height="8"/><rect x="227" y="117" width="7" height="8"/>
    <rect x="204" y="108" width="8" height="8"/><rect x="213" y="108" width="8" height="8"/><rect x="222" y="108" width="8" height="8"/>
  </g>
  <ellipse cx="248" cy="126" rx="7" ry="5" fill="#9AA0A8" stroke="#3A2A22" stroke-width="1.5"/>
</svg>`;

// 라운드 1: 틈에 물이 찬 바위
const CRACK = `<svg viewBox="0 0 200 130" class="exp-art" role="img" aria-label="갈라진 틈에 물이 차 있는 바위">
  <path d="M20 118l18-70 40-22 50 8 40 30 12 54z" fill="#9AA0A8" stroke="#3A2A22" stroke-width="3"/>
  <path d="M96 30l-8 30 10 22-8 36" fill="none" stroke="#3A2A22" stroke-width="5"/>
  <path d="M93 62l5 20-5 30" fill="none" stroke="#5C9DB8" stroke-width="4"/>
  <path d="M92 34l-6-10M93 34l4-11" stroke="#5FA35A" stroke-width="2.5" stroke-linecap="round"/>
  <text x="150" y="20" font-size="13" fill="#3B57A6">추운 밤</text>
</svg>`;

// 라운드 3: 강 위쪽(산)과 아래쪽(바다)
const RIVER = `<svg viewBox="0 0 260 130" class="exp-art" role="img" aria-label="산에서 바다로 흐르는 강, 왼쪽이 강 위쪽, 오른쪽이 강 아래쪽">
  <path d="M0 70l40-54 40 54z" fill="#6E8A5A" stroke="#3A2A22" stroke-width="2"/>
  <path d="M30 70q40 20 100 24t130 10v26H0V70z" fill="#C9B48A"/>
  <path d="M40 72q40 18 100 22t120 8" fill="none" stroke="#5C9DB8" stroke-width="10" stroke-linecap="round"/>
  <path d="M215 104h45v26h-45z" fill="#5C9DB8" opacity=".6"/>
  <text x="34" y="120" text-anchor="middle" font-size="12" fill="#1A1F33">강 위쪽</text>
  <text x="208" y="124" text-anchor="middle" font-size="12" fill="#1A1F33">강 아래쪽</text>
  <text x="236" y="98" text-anchor="middle" font-size="11" fill="#1A1F33">바다</text>
</svg>`;

// 숨은 주문 정답 뒤: 물길이 흙을 깎고(홈이 깊어짐) 끝에 쌓이는 짧은 연출 (css .carve, 동작 줄이기면 바로 끝 모습)
const STREAM = `<svg viewBox="0 0 260 120" class="exp-art stream-art" role="img" aria-label="비탈진 흙 화단을 흐르는 물길과 끝에 쌓인 흙">
  <path d="M0 30q130 30 260 60v30H0z" fill="#6E4A2E" stroke="#3A2A22" stroke-width="2"/>
  <path class="groove" d="M10 34q120 26 200 46l2 6q-90-18-202-44z" fill="#3E2A1A"/>
  <path class="flow" d="M12 36q120 26 196 46" fill="none" stroke="#8ED8C9" stroke-width="4" stroke-linecap="round"/>
  <path class="deposit" d="M200 92q20-16 46 0z" fill="#C9A574" stroke="#7A5A2E" stroke-width="1.5"/>
</svg>`;

const ROUNDS = [
  {
    who: 'tipo',
    line: '바위 틈에 물이 스며들었어. 추운 밤에 이 물이 얼면 틈은 어떻게 될까?',
    steps: [{
      kind: 'choice',
      art: CRACK,
      ask: '틈에 찬 물이 얼면 틈은 어떻게 될까?',
      choices: ['틈이 더 벌어진다', '틈이 꼭 붙는다', '바위가 녹는다'],
      answer: 0,
      wrongMsg: '음… 물이 얼면 부피가 어떻게 되는지 떠올려 봐.',
      explain: '얼었다 녹았다를 오래 되풀이하면 바위가 쪼개져.',
      hints: [
        '물은 얼면 부피가 조금 커져.',
        '커진 얼음이 양쪽 벽을 밀어.',
      ],
    }],
  },
  {
    who: 'kkam',
    line: '흐르는 물이 하는 일을 세 칸에 나눠 주는 거지.',
    steps: [{
      kind: 'sort',
      bins: [{ key: 'erode', name: '깎기' }, { key: 'carry', name: '옮기기' }, { key: 'settle', name: '쌓기' }],
      ask: '흐르는 물이 하는 일을 깎기, 옮기기, 쌓기 중에 골라 주는 거지.',
      okText: '맞는 거지.',
      items: [
        ['물이 화단 흙을 파서 물길을 만든다', 'erode'], ['강물이 바위를 조금씩 깎는다', 'erode'],
        ['흙탕물이 흙 알갱이를 싣고 간다', 'carry'], ['강물이 모래를 바다 쪽으로 나른다', 'carry'],
        ['물살이 느린 곳에 고운 흙이 쌓인다', 'settle'], ['강 아래쪽 강가에 모래밭이 생긴다', 'settle'],
      ],
      hints: [
        '깎으면 침식, 옮기면 운반, 쌓으면 퇴적이야.',
        '"쌓인다", "생긴다"는 물살이 느려진 곳 이야기야.',
      ],
    }],
  },
  {
    who: 'ddal',
    line: '크고 모난 바위가 많은 곳을 골라 주십시오. 저는 이미 알고 있습니다만.',
    steps: [{
      kind: 'choice',
      art: RIVER,
      ask: '크고 모난 바위가 많은 곳은?',
      choices: ['강 위쪽(산 쪽)', '강 아래쪽(바다 쪽)', '둘 다 똑같음'],
      answer: 0,
      wrongMsg: '음… 물살이 센 곳과 느린 곳을 생각해 보십시오.',
      explain: '옥상 물길도 위쪽엔 자갈, 아래쪽엔 고운 흙이 쌓였습니다만.',
      hints: [
        '무거운 돌은 물살이 센 곳에 남아.',
        '강 아래쪽에는 모래와 고운 흙이 많아.',
      ],
    }],
  },
];

const BONUS = {
  offer: '오늘 주문은 끝. …그런데 아주 큰 골짜기 이야기가 하나 남았어.',
  who: 'tipo',
  line: '미국의 그랜드 캐니언은 깊이가 약 1.6 km야. 이 골짜기를 깎아 만든 건 뭘까?',
  steps: [{
    kind: 'choice',
    art: STREAM,
    artOk: 'carve',
    ask: '그랜드 캐니언을 깎아 만든 것은?',
    choices: ['강물', '바람', '사람이 판 땅굴'],
    answer: 0,
    noLaugh: true,
    explain: 'Perfect. 깎여 나간 흙은 금방 다시 생기지 않아. 흙 1 cm가 생기는 데는 길게는 1000년이 걸리기도 해.',
    hints: [
      '골짜기 바닥에 콜로라도강이 흘러.',
      '약 600만 년 동안 조금씩 깎았지.',
    ],
  }],
};

// 2주 후 복습 퀴즈 문제 (과학 회차: 3지선다, 진행 캐릭터 티포가 힌트)
const REVIEW = [
  { q: '바위가 부서져 흙이 되기까지 걸리는 시간은?', choices: ['아주 오랜 시간', '하루', '한 시간'], answer: 0,
    hints: ['흙 1 cm에 길게는 1000년이야.', '하루 만에는 안 돼.'] },
  { q: '흐르는 물이 흙을 실어 나르는 일은?', choices: ['운반', '침식', '퇴적'], answer: 0,
    hints: ['옮기는 일이야.', '깎기는 침식, 쌓기는 퇴적.'] },
  { q: '강 아래쪽(바다 쪽)에 많은 것은?', choices: ['모래와 고운 흙', '크고 모난 바위', '얼음'], answer: 0,
    hints: ['물살이 느려지는 곳이야.', '가벼운 알갱이가 쌓여.'] },
  { q: '바위 틈을 넓히는 것이 아닌 것은?', choices: ['햇빛 그림자', '얼어붙는 물', '자라는 식물 뿌리'], answer: 0,
    hints: ['영상의 두 범인을 떠올려 봐.', '물과 뿌리. Okay?'] },
];

export default {
  id: 's1-w10',
  conceptId: 'sci-land-01',
  review: REVIEW,
  // 암호는 화면 코드에 두지 않고 지문(SHA-256)만 둔다. 실제 암호: tests/clue-answers.json, 서버는 clue_keys 표
  clue: { id: 's1-w10', hash: 'ebf64a4660c182a32342b23a981fc16bb1bcf400893f7091b29a20c93705d72f', ask: '영상 끝부분, 젖은 화단 흙 위에 새겨진 암호는?' },
  stage: {
    episode: '10회차',
    title: '옥상 화단의 갈라진 바위',
    host: 'tipo',
    shuffle: true, // 나열형 문제의 보기를 할 때마다 섞음
    intro: {
      line: '옥상 화단에 갈라진 바위가 있어. 단단한 바위가 어떻게 부서졌는지 같이 알아보자. Okay?',
      start: '옥상으로 나가기',
      art: SCENE,
    },
    rounds: ROUNDS,
    bonus: BONUS,
    result: {
      clear: '바위 탐정 실력, 음… not bad.',
      findClue: '영상 끝부분, 화단 흙 위에 새겨진 네 글자를 입력해.',
    },
  },
  mount(root, ctx) { mountStage(root, this.stage, ctx); },
};

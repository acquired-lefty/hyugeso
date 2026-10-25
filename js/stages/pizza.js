// 피자 그림 (SVG). 조각 수·크기·색칠을 데이터로 바꿔 그린다. (7회차 분수)
// cuts: 숫자면 똑같이 n조각, 배열이면 조각마다 크기 비율 (예: [2, 1] → 한쪽이 큰 2조각)
// shade: 색칠할 조각 번호 배열 (0부터, 12시 방향에서 시계 방향)
// label: 화면 읽기 프로그램용 설명 (정답을 드러내지 않게 적는다)
export function pizzaSvg({ cuts, shade = [], label = '피자 그림' }) {
  const parts = typeof cuts === 'number' ? Array.from({ length: cuts }, () => 1) : cuts;
  const total = parts.reduce((a, b) => a + b, 0);
  const R = 44;
  const C = 50;
  const pt = (t) => {
    const a = 2 * Math.PI * t - Math.PI / 2;
    return [(C + R * Math.cos(a)).toFixed(2), (C + R * Math.sin(a)).toFixed(2)];
  };
  let start = 0;
  const slices = parts.map((p, i) => {
    const end = start + p / total;
    const [x1, y1] = pt(start);
    const [x2, y2] = pt(end);
    const large = end - start > 0.5 ? 1 : 0;
    start = end;
    return `<path d="M${C} ${C}L${x1} ${y1}A${R} ${R} 0 ${large} 1 ${x2} ${y2}Z" class="slice ${shade.includes(i) ? 'is-shaded' : ''}"/>`;
  });
  return `<svg viewBox="0 0 100 100" class="pizza" role="img" aria-label="${label}">
    <circle cx="${C}" cy="${C}" r="${R + 4}" class="crust"/>
    ${slices.join('')}
  </svg>`;
}

// 효과음 재생: 휴대폰(특히 아이폰)은 화면을 누른 뒤에만 소리를 낼 수 있어서, 반드시 버튼을 눌렀을 때 play()를 부른다.
// 소리 파일은 assets/sounds/회차/ 에 두고, 출처·이용 조건은 assets/sounds/SOURCES.md에 적는다.
let current = null;

export function stopSound() {
  if (!current) return;
  current.pause();
  current = null;
}

// 재생이 끝나면 onEnd, 파일을 못 불러오거나 재생이 막히면 onError
export function playSound(src, { onEnd, onError } = {}) {
  stopSound();
  const audio = new Audio(src);
  current = audio;
  audio.addEventListener('ended', () => { if (current === audio) current = null; onEnd?.(); });
  audio.addEventListener('error', () => { if (current === audio) current = null; onError?.(); });
  audio.play().catch(() => { if (current === audio) current = null; onError?.(); });
  return audio;
}

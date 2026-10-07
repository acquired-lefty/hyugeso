// 회차 연계 유튜브 영상: 주소에서 영상 ID를 뽑아 개인정보 보호 모드(youtube-nocookie) 주소로 바꿈
// 받는 주소 예: https://www.youtube.com/watch?v=ID, https://youtu.be/ID, https://www.youtube.com/shorts/ID
export function youtubeId(url) {
  if (!url) return null;
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  let id = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = u.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/);
      if (m) id = m[2];
    }
  }
  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
}

export const embedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
export const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;

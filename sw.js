// 새 버전이 올라가면 바로 보이게 하는 서비스 워커
// GitHub Pages는 파일을 10분 동안 브라우저에 저장해 두라고 알려서, 고친 회차가 늦게 보일 수 있다.
// 이 워커는 같은 사이트의 파일(html·js·css 등)을 받을 때마다 서버에 "바뀌었는지" 먼저 물어본다(cache: 'no-cache').
// 같은 탭 새로고침에도 적용되도록 돌려주는 파일에 'Cache-Control: no-cache'를 붙인다.
// 바뀌지 않았으면 서버가 "그대로"라고만 답해서 느려지지 않는다. 인터넷이 끊기면 평소처럼 저장된 파일을 쓴다.
// 다른 사이트(Supabase, 유튜브, 글꼴 등)에는 손대지 않는다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    let res;
    try { res = await fetch(req, { cache: 'no-cache' }); } catch { return fetch(req); }
    if (!res.ok || res.type === 'opaque') return res;
    // 브라우저가 같은 탭에서 새로고침할 때도 저장된 파일을 다시 확인하게 "no-cache"로 바꿔 돌려줌
    const headers = new Headers(res.headers);
    headers.set('Cache-Control', 'no-cache');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  })());
});

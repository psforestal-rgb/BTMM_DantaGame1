const CACHE_NAME = "danta-cruce-v3-mobile";
const PATCHED_INDEX_KEY = "./__danta_patched_index_v3__.html";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

const DESKTOP_MOBILE_FRAME_CSS = `
  /* BTMM_MOBILE_FRAME_V3: conserva la experiencia de smartphone en PC y laptop. */
  @media (min-width:900px) and (orientation:landscape){
    html,body{
      background:radial-gradient(circle at center,#203c2b 0%,#101915 50%,#070b09 100%);
    }
    #app{
      inset:50% auto auto 50%;
      width:min(94vw,1180px,calc(94vh * 1.863636));
      height:auto;
      aspect-ratio:820 / 440;
      transform:translate(-50%,-50%);
      border:10px solid #0d1511;
      border-radius:30px;
      overflow:hidden;
      box-shadow:0 28px 70px rgba(0,0,0,.62),0 0 0 1px rgba(255,255,255,.08);
    }
    #game{
      width:100%!important;
      height:100%!important;
    }
  }
`;

function patchIndexHtml(source) {
  let html = source;

  if (!html.includes("BTMM_MOBILE_FRAME_V3")) {
    html = html.replace("</style>", `${DESKTOP_MOBILE_FRAME_CSS}\n</style>`);
  }

  if (!html.includes("TAPIR_VISUAL_SCALE=64")) {
    html = html.replace(
      "const W=820,H=440; canvas.width=W; canvas.height=H;",
      "const W=820,H=440; canvas.width=W; canvas.height=H;\nconst TAPIR_VISUAL_SCALE=64; // cuerpo visible cercano al doble del diámetro de la sombra"
    );
  }

  html = html.replaceAll("this.r*7.0", "this.r*TAPIR_VISUAL_SCALE");

  html = html.replace(
    "g.beginPath(); g.ellipse(0,s*0.15,s*2.2,s*0.7,0,0,TAU); g.fill(); g.restore();",
    "g.beginPath(); g.ellipse(0,s*0.12,s*0.75,s*0.24,0,0,TAU); g.fill(); g.restore();"
  );

  return html;
}

function htmlResponse(html, sourceResponse) {
  const headers = new Headers(sourceResponse ? sourceResponse.headers : undefined);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-cache, no-store, must-revalidate");
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");

  return new Response(html, {
    status: 200,
    statusText: "OK",
    headers
  });
}

async function servePatchedIndex() {
  const indexUrl = new URL("./index.html", self.registration.scope);

  try {
    const networkResponse = await fetch(indexUrl.href, { cache: "no-store" });
    if (!networkResponse.ok) throw new Error(`HTTP ${networkResponse.status}`);

    const source = await networkResponse.text();
    const patched = htmlResponse(patchIndexHtml(source), networkResponse);
    const cache = await caches.open(CACHE_NAME);
    await cache.put(PATCHED_INDEX_KEY, patched.clone());
    return patched;
  } catch (error) {
    const cachedPatched = await caches.match(PATCHED_INDEX_KEY);
    if (cachedPatched) return cachedPatched;

    const cachedSource = await caches.match("./index.html");
    if (cachedSource) {
      const source = await cachedSource.text();
      return htmlResponse(patchIndexHtml(source), cachedSource);
    }

    return new Response("No fue posible cargar el juego sin conexión.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();

    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(clients.map(client => client.navigate(client.url).catch(() => null)));
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isGameDocument = url.origin === self.location.origin &&
    (event.request.mode === "navigate" || url.pathname.endsWith("/index.html"));

  if (isGameDocument) {
    event.respondWith(servePatchedIndex());
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

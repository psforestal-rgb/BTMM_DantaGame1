const RELEASE_ID = "2026.07.06.4";
const CACHE_NAME = `danta-cruce-${RELEASE_ID}`;
const PATCHED_INDEX_KEY = `./__danta_patched_index_${RELEASE_ID}.html`;
const STATIC_ASSETS = [
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

const ORIGINAL_SW_REGISTRATION = 'if("serviceWorker" in navigator){ window.addEventListener("load",()=>{ navigator.serviceWorker.register("./sw.js").catch(()=>{}); }); }';

const FORCED_SW_REGISTRATION = `if("serviceWorker" in navigator){
  window.addEventListener("load",async()=>{
    const releaseId="${RELEASE_ID}";
    const reloadKey="danta-release-reloaded-"+releaseId;
    let registration=null;
    let reloading=false;

    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(reloading) return;
      if(sessionStorage.getItem(reloadKey)==="1") return;
      reloading=true;
      sessionStorage.setItem(reloadKey,"1");
      window.location.reload();
    });

    try{
      registration=await navigator.serviceWorker.register(
        "./sw.js?v="+encodeURIComponent(releaseId),
        {updateViaCache:"none"}
      );
      await registration.update();

      const checkForUpdate=()=>registration&&registration.update().catch(()=>{});
      window.addEventListener("focus",checkForUpdate);
      document.addEventListener("visibilitychange",()=>{
        if(!document.hidden) checkForUpdate();
      });
      window.setInterval(checkForUpdate,5*60*1000);
    }catch(error){
      console.warn("No fue posible comprobar la versión más reciente del juego.",error);
    }
  });
}`;

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

  if (html.includes(ORIGINAL_SW_REGISTRATION)) {
    html = html.replace(ORIGINAL_SW_REGISTRATION, FORCED_SW_REGISTRATION);
  }

  html = html.replace(
    "</head>",
    `<meta name="danta-release" content="${RELEASE_ID}">\n</head>`
  );

  return html;
}

function htmlResponse(html, sourceResponse) {
  const headers = new Headers(sourceResponse ? sourceResponse.headers : undefined);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-store, no-cache, must-revalidate, max-age=0");
  headers.set("pragma", "no-cache");
  headers.set("expires", "0");
  headers.set("x-danta-release", RELEASE_ID);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");

  return new Response(html, {
    status: 200,
    statusText: "OK",
    headers
  });
}

async function fetchFresh(url) {
  const freshUrl = new URL(url);
  freshUrl.searchParams.set("v", RELEASE_ID);
  return fetch(freshUrl.href, {
    cache: "reload",
    credentials: "same-origin",
    redirect: "follow"
  });
}

async function servePatchedIndex() {
  const indexUrl = new URL("./index.html", self.registration.scope);

  try {
    const networkResponse = await fetchFresh(indexUrl);
    if (!networkResponse.ok) throw new Error(`HTTP ${networkResponse.status}`);

    const source = await networkResponse.text();
    const patched = htmlResponse(patchIndexHtml(source), networkResponse);
    const cache = await caches.open(CACHE_NAME);
    await cache.put(PATCHED_INDEX_KEY, patched.clone());
    return patched;
  } catch (error) {
    const cachedPatched = await caches.match(PATCHED_INDEX_KEY);
    if (cachedPatched) return cachedPatched;

    return new Response("No fue posible cargar el juego sin conexión.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
}

async function cacheStaticAssets() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(STATIC_ASSETS.map(async asset => {
    try {
      const assetUrl = new URL(asset, self.registration.scope);
      const response = await fetchFresh(assetUrl);
      if (response.ok) await cache.put(asset, response);
    } catch (error) {
      // La aplicación sigue disponible aunque falle un recurso accesorio.
    }
  }));

  try {
    await servePatchedIndex();
  } catch (error) {
    // El índice se intentará nuevamente en la primera navegación.
  }
}

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    await cacheStaticAssets();
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();

    const clients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    await Promise.all(clients.map(client =>
      client.postMessage({ type: "DANTA_NEW_RELEASE", releaseId: RELEASE_ID })
    ));
  })());
});

self.addEventListener("message", event => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "GET_RELEASE" && event.source) {
    event.source.postMessage({
      type: "DANTA_RELEASE",
      releaseId: RELEASE_ID
    });
  }
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isGameDocument = sameOrigin &&
    (event.request.mode === "navigate" || url.pathname.endsWith("/index.html"));

  if (isGameDocument) {
    event.respondWith(servePatchedIndex());
    return;
  }

  if (sameOrigin) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: "reload" });
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw error;
      }
    })());
  }
});

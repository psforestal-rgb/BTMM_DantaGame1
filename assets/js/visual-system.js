(() => {
  "use strict";

  if (window.BTMMVisual) return;

  const config = window.BTMM_VISUAL_CONFIG || {};
  const renderers = new Map();
  let installed = false;
  let originalDrawTapir3D = null;

  const api = {
    config,
    register(name, renderer) {
      if (typeof name !== "string" || typeof renderer !== "function") {
        throw new TypeError("BTMMVisual.register requiere un nombre y una función de renderizado.");
      }
      renderers.set(name, renderer);
      document.dispatchEvent(new CustomEvent("btmm:renderer-registered", { detail: { name } }));
      return renderer;
    },
    unregister(name) {
      return renderers.delete(name);
    },
    has(name) {
      return renderers.has(name);
    },
    get(name) {
      return renderers.get(name);
    },
    list() {
      return Array.from(renderers.keys());
    },
    install,
    getOriginalTapirRenderer() {
      return originalDrawTapir3D;
    }
  };

  window.BTMMVisual = api;

  function applyThemeClass() {
    const themeClass = config.themeClass || "btmm-theme-kawaii";
    document.documentElement.classList.add(themeClass);
    document.body?.classList.add(themeClass);
  }

  function install() {
    applyThemeClass();
    if (installed) return true;

    const baseRenderer = window.drawTapir3D;
    if (typeof baseRenderer !== "function") return false;

    originalDrawTapir3D = baseRenderer;

    const routedRenderer = function routedTapirRenderer(g, x, y, size, face, options = {}) {
      const rendererName = options?.calf ? "tapir.calf" : "tapir.adult";
      const renderer = renderers.get(rendererName);

      if (renderer) {
        return renderer(g, x, y, size, face, options, {
          original: originalDrawTapir3D,
          config,
          visual: api
        });
      }

      return originalDrawTapir3D(g, x, y, size, face, options);
    };

    window.drawTapir3D = routedRenderer;
    try {
      drawTapir3D = routedRenderer;
    } catch (_) {
      // window.drawTapir3D es suficiente en navegadores modernos.
    }

    installed = true;
    document.dispatchEvent(new CustomEvent("btmm:visual-ready", {
      detail: { theme: config.theme, renderers: api.list() }
    }));
    return true;
  }

  const attemptInstall = () => {
    if (!install()) requestAnimationFrame(attemptInstall);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attemptInstall, { once: true });
  } else {
    attemptInstall();
  }
})();

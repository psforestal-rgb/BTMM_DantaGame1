(() => {
  "use strict";

  window.BTMM_VISUAL_CONFIG = {
    release: "2026.07.06.6",
    theme: "kawaii-forest-v1",
    themeClass: "btmm-theme-kawaii",
    renderers: {
      adultTapir: true,
      calfTapir: false,
      plants: false,
      vehicles: false,
      hunters: false,
      environment: false
    },
    accessibility: {
      minimumContrast: 4.5,
      reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
    },
    palette: {
      ink: "#342a28",
      cocoa: "#716258",
      cocoaLight: "#a18f82",
      cream: "#ead9c6",
      blush: "#eaa9a8",
      leaf: "#65a96d",
      leafDark: "#3d7650",
      amber: "#f3b85f",
      sky: "#b9d9ca"
    }
  };
})();

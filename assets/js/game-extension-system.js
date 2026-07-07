(() => {
  "use strict";

  if (window.BTMMGameExtensions) return;

  const extensions = new Map();

  window.BTMMGameExtensions = {
    register(name, extension) {
      if (typeof name !== "string" || !extension || typeof extension !== "object") {
        throw new TypeError("La extensión debe tener un nombre y una configuración válida.");
      }
      extensions.set(name, { enabled: true, ...extension });
      document.dispatchEvent(new CustomEvent("btmm:extension-registered", { detail: { name } }));
      return extensions.get(name);
    },
    get(name) {
      return extensions.get(name);
    },
    enable(name) {
      const extension = extensions.get(name);
      if (!extension) return false;
      extension.enabled = true;
      extension.start?.();
      return true;
    },
    disable(name) {
      const extension = extensions.get(name);
      if (!extension) return false;
      extension.enabled = false;
      extension.stop?.();
      return true;
    },
    list() {
      return Array.from(extensions.entries()).map(([name, extension]) => ({
        name,
        enabled: extension.enabled,
        description: extension.description || ""
      }));
    }
  };
})();

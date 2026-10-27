/**
 * Chula OS — safe application launch
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;

  function isOnline() {
    if (C.Tizen && C.Tizen.isTizen && typeof C.Tizen.getNetworkConnected === "function") {
      return C.Tizen.getNetworkConnected();
    }
    return navigator.onLine !== false;
  }

  function sanitizeUrl(raw) {
    if (!raw || typeof raw !== "string") return null;
    let url;
    try {
      url = new URL(raw.trim());
    } catch (_) {
      return null;
    }
    if (!C.CONFIG.allowedUrlProtocols.includes(url.protocol)) return null;
    // Block dangerous schemes already excluded; block credentials in URL
    if (url.username || url.password) return null;
    return url.href;
  }

  const Launcher = {
    isOnline,

    /**
     * @param {string} appId
     * @returns {Promise<{ok:boolean, message?:string, action?:string}>}
     */
    async launch(appId) {
      const app = C.Registry.get(appId);
      if (!app) {
        return { ok: false, message: "Application not found." };
      }

      if (app.requiresOnline && !isOnline()) {
        return {
          ok: false,
          message: `${app.name} needs an internet connection. Check your network and try again.`,
        };
      }

      C.Storage.pushRecent(app.id);

      if (app.launch === "route") {
        C.Router.go(app.route || "home");
        return { ok: true, action: "route" };
      }

      if (app.launch === "iptv") {
        const configured = sanitizeUrl(C.Storage.get().iptvUrl);
        if (!configured) {
          C.Router.go("settings", { section: "apps", notice: "iptv" });
          return {
            ok: false,
            message:
              "IPTV is not configured. Add a legitimate HTTPS player URL in Settings → Applications.",
          };
        }
        return this._openExternal(app, configured);
      }

      if (app.launch === "url") {
        const href = sanitizeUrl(app.url);
        if (!href) {
          return { ok: false, message: `${app.name} has an invalid destination.` };
        }
        return this._openExternal(app, href);
      }

      return { ok: false, message: "This application cannot be launched." };
    },

    async _openExternal(app, href) {
      if (C.UI && C.UI.showLaunchOverlay) {
        await C.UI.showLaunchOverlay(app.name);
      }

      // Remember return context for when the user comes back via history / app resume
      try {
        sessionStorage.setItem(
          "chulaos.return",
          JSON.stringify({ view: "home", at: Date.now(), app: app.id })
        );
      } catch (_) {}

      // Samsung Tizen: prefer ApplicationControl / native app IDs
      if (C.Tizen && C.Tizen.isTizen) {
        const tizenResult = await C.Tizen.openUrl(href, app);
        if (C.UI) C.UI.hideOverlay();
        return tizenResult;
      }

      // Browser / PWA: same-tab navigation (popup blockers are common on TV browsers)
      try {
        window.location.assign(href);
        return { ok: true, action: "navigate" };
      } catch (err) {
        console.error("[ChulaOS] launch failed", err);
        if (C.UI) C.UI.hideOverlay();
        return {
          ok: false,
          message: `Could not open ${app.name}. Your browser blocked the navigation.`,
        };
      }
    },
  };

  C.Launcher = Launcher;
})(typeof window !== "undefined" ? window : globalThis);

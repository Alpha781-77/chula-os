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
        if (app.trust === "caution") {
          const ok =
            C.UI && typeof C.UI.confirmCautionLaunch === "function"
              ? await C.UI.confirmCautionLaunch(app)
              : false;
          if (!ok) {
            return { ok: false, message: "Cancelled — stayed in Chula OS." };
          }
        }
        return this._openExternal(app, href);
      }

      return { ok: false, message: "This application cannot be launched." };
    },

    async _openExternal(app, href) {
      // Caution destinations: never attempt native-app ID matching
      const caution = app.trust === "caution";

      if (C.UI && C.UI.showLaunchOverlay) {
        await C.UI.showLaunchOverlay(app.name);
      }

      // Mark outbound launch so resume can restore Home (never auto-reopens the external app)
      try {
        sessionStorage.setItem(
          "chulaos.return",
          JSON.stringify({ view: "home", at: Date.now(), app: app.id })
        );
      } catch (_) {}

      if (C.Tizen && C.Tizen.isTizen) {
        if (!caution) {
          try {
            if (typeof C.Tizen.resolveNativeApp === "function") {
              const resolved = await C.Tizen.resolveNativeApp(app);
              if (resolved && resolved.id) {
                const native = await C.Tizen.launchAppId(resolved.id);
                if (native.ok) {
                  if (C.UI) C.UI.hideOverlay();
                  return native;
                }
              }
            }
          } catch (err) {
            console.warn("[ChulaOS] native resolve/launch error", err);
          }
        }

        // AppControl VIEW — Tizen browser may follow its own redirects; Chula cannot intercept them
        const tizenResult = await C.Tizen.openUrl(href, app, { skipNative: true });
        if (C.UI) C.UI.hideOverlay();
        if (!tizenResult.ok) {
          return {
            ok: false,
            message:
              tizenResult.message ||
              `${app.name} could not be opened. Try again from Chula OS, or use Apps to return.`,
          };
        }
        return tizenResult;
      }

      // Browser / PWA: same-tab navigation
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

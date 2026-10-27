/**
 * Chula OS — Samsung Tizen TV bridge
 * No-ops on browsers / PWA. On Tizen: remote keys, app discovery, native launch, safe exit.
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS || (global.ChulaOS = {});

  const KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13,
    BACK: 10009, // Samsung Tizen Back
    EXIT: 10182, // long-press Back / Exit on some remotes
    MEDIA_PLAY_PAUSE: 10252,
    COLOR_RED: 403,
    COLOR_GREEN: 404,
    COLOR_YELLOW: 405,
    COLOR_BLUE: 406,
  };

  /**
   * Alias / fallback application IDs — NOT confirmed for every firmware/region.
   * Discovery prefers an ID that is actually present in getAppsInfo().
   */
  const NATIVE_APP_ID_ALIASES = {
    youtube: ["9Ur5IzDKqV.TizenYouTube"],
    netflix: ["org.tizen.netflix-app"],
    browser: ["org.tizen.browser"],
  };

  function normalizeName(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  const TizenBridge = {
    KEY,
    isTizen: false,
    ready: false,
    _appsCache: null,
    _appsCacheAt: 0,
    _cacheMs: 60 * 1000,
    _resumeBound: false,
    _resumeLastAt: 0,

    init() {
      this.isTizen =
        typeof global.tizen !== "undefined" &&
        !!(global.tizen && global.tizen.application);

      if (!this.isTizen) {
        this.ready = true;
        return;
      }

      document.documentElement.classList.add("is-tizen");
      this._registerKeys();
      this._bindResumeHandlers();
      this.ready = true;
      // Warm installed-app cache (best effort; never blocks UI)
      this.refreshInstalledApps().catch(() => {});
      console.info("[ChulaOS] Tizen bridge active");
    },

    _registerKeys() {
      try {
        if (!tizen.tvinputdevice) return;
        const extras = [
          "MediaPlayPause",
          "ColorF0Red",
          "ColorF1Green",
          "ColorF2Yellow",
          "ColorF3Blue",
          "ChannelUp",
          "ChannelDown",
        ];
        if (typeof tizen.tvinputdevice.registerKeyBatch === "function") {
          try {
            tizen.tvinputdevice.registerKeyBatch(extras);
          } catch (_) {
            extras.forEach((name) => {
              try {
                tizen.tvinputdevice.registerKey(name);
              } catch (__) {}
            });
          }
        } else {
          extras.forEach((name) => {
            try {
              tizen.tvinputdevice.registerKey(name);
            } catch (_) {}
          });
        }
      } catch (err) {
        console.warn("[ChulaOS] tvinputdevice register failed", err);
      }
    },

    /**
     * Resume Chula OS UI after returning from another app (no reload loop,
     * never auto-launches an external app).
     */
    _bindResumeHandlers() {
      if (this._resumeBound) return;
      this._resumeBound = true;

      const onVisible = () => {
        if (typeof document !== "undefined" && document.hidden) return;
        const now = Date.now();
        if (now - this._resumeLastAt < 900) return;
        this._resumeLastAt = now;

        let returning = false;
        try {
          returning = !!sessionStorage.getItem("chulaos.return");
          if (returning) sessionStorage.removeItem("chulaos.return");
        } catch (_) {}

        if (!returning) return;

        try {
          if (C.Boot && typeof C.Boot.hideImmediate === "function") {
            C.Boot.hideImmediate();
          }
          if (C.Router && typeof C.Router.go === "function") {
            C.Router.go("home", {}, { replace: true });
          }
          if (C.UI && typeof C.UI.toast === "function") {
            C.UI.toast("Welcome back", { tone: "ok" });
          }
        } catch (err) {
          console.warn("[ChulaOS] resume UI restore failed", err);
        }

        // Refresh discovery so IDs stay current after returning
        this.refreshInstalledApps().catch(() => {});
      };

      document.addEventListener("visibilitychange", onVisible);
      global.addEventListener("pageshow", onVisible);
    },

    /**
     * @returns {Promise<Array<{id:string,name:string,version?:string,show?:boolean}>>}
     */
    refreshInstalledApps() {
      return new Promise((resolve) => {
        if (!this.isTizen || !tizen.application || typeof tizen.application.getAppsInfo !== "function") {
          this._appsCache = [];
          this._appsCacheAt = Date.now();
          resolve([]);
          return;
        }
        try {
          tizen.application.getAppsInfo(
            (list) => {
              const apps = (list || [])
                .filter((a) => a && a.id)
                .map((a) => ({
                  id: String(a.id),
                  name: String(a.name || ""),
                  version: a.version ? String(a.version) : "",
                  show: a.show !== false,
                }));
              this._appsCache = apps;
              this._appsCacheAt = Date.now();
              resolve(apps);
            },
            (err) => {
              console.warn("[ChulaOS] getAppsInfo failed", err);
              this._appsCache = this._appsCache || [];
              this._appsCacheAt = Date.now();
              resolve(this._appsCache);
            }
          );
        } catch (err) {
          console.warn("[ChulaOS] getAppsInfo unavailable", err);
          this._appsCache = [];
          this._appsCacheAt = Date.now();
          resolve([]);
        }
      });
    },

    /**
     * @param {boolean} [force]
     * @returns {Promise<Array>}
     */
    getInstalledApps(force) {
      if (
        !force &&
        this._appsCache &&
        Date.now() - this._appsCacheAt < this._cacheMs
      ) {
        return Promise.resolve(this._appsCache);
      }
      return this.refreshInstalledApps();
    },

    /**
     * Match a registry entry to an installed Tizen application.
     * Prefer verified installed IDs over aliases; never invent an ID as confirmed.
     * @param {object} appMeta registry entry
     * @returns {Promise<{id:string,name:string,match:'installed-id'|'alias'|'name'}|null>}
     */
    async resolveNativeApp(appMeta) {
      if (!appMeta || !this.isTizen) return null;
      const apps = await this.getInstalledApps();
      if (!apps.length) return null;

      const byId = new Map(apps.map((a) => [a.id, a]));

      // 1) Explicit registry field if present and installed
      const explicit = appMeta.tizenAppId;
      if (explicit && byId.has(explicit)) {
        const hit = byId.get(explicit);
        return { id: hit.id, name: hit.name, match: "installed-id" };
      }

      // 2) Alias list — only if that ID is actually installed
      const aliases =
        (appMeta.tizenAppIdAliases && appMeta.tizenAppIdAliases.slice()) ||
        NATIVE_APP_ID_ALIASES[appMeta.id] ||
        [];
      for (let i = 0; i < aliases.length; i++) {
        const id = aliases[i];
        if (id && byId.has(id)) {
          const hit = byId.get(id);
          return { id: hit.id, name: hit.name, match: "alias" };
        }
      }

      // 3) Safe name matching (exact normalized; optional allow-list of names)
      const candidates = [appMeta.name]
        .concat(appMeta.matchNames || [])
        .filter(Boolean)
        .map(normalizeName);

      if (!candidates.length) return null;

      for (let i = 0; i < apps.length; i++) {
        const a = apps[i];
        if (a.show === false) continue;
        const n = normalizeName(a.name);
        if (!n) continue;
        if (candidates.indexOf(n) !== -1) {
          return { id: a.id, name: a.name, match: "name" };
        }
      }

      return null;
    },

    /**
     * Launch an installed application by Tizen application ID.
     * @param {string} appId
     * @returns {Promise<{ok:boolean,action?:string,message?:string}>}
     */
    launchAppId(appId) {
      return new Promise((resolve) => {
        if (!this.isTizen) {
          resolve({ ok: false, message: "Not running on Tizen." });
          return;
        }
        if (!appId) {
          resolve({ ok: false, message: "No application ID to launch." });
          return;
        }
        try {
          tizen.application.launch(
            appId,
            () => resolve({ ok: true, action: "native-app", appId: appId }),
            (err) => {
              const msg =
                (err && (err.message || err.name)) || "launch failed";
              resolve({
                ok: false,
                message:
                  "Could not open the installed TV app (" +
                  msg +
                  "). It may be unavailable or blocked on this firmware.",
              });
            }
          );
        } catch (err) {
          resolve({
            ok: false,
            message:
              "Native app launch is not available on this firmware. Try Smart Hub or the HTTPS fallback.",
          });
        }
      });
    },

    /**
     * Open an HTTPS URL via native app (resolved) → ApplicationControl VIEW.
     * @param {string} url
     * @param {object} [appMeta]
     * @param {{skipNative?:boolean}} [opts] skipNative when caller already tried launchAppId
     */
    openUrl(url, appMeta, opts) {
      opts = opts || {};
      return new Promise((resolve) => {
        if (!this.isTizen) {
          resolve({ ok: false, message: "Not running on Tizen." });
          return;
        }

        const tryControl = () => {
          try {
            const control = new tizen.ApplicationControl(
              "http://tizen.org/appcontrol/operation/view",
              url,
              null,
              null
            );
            tizen.application.launchAppControl(
              control,
              null,
              () => resolve({ ok: true, action: "appcontrol" }),
              (err) => {
                console.warn("[ChulaOS] AppControl failed", err);
                resolve({
                  ok: false,
                  message:
                    "This TV could not open the streaming site from Chula OS. Open the official app from Smart Hub, or try again when the browser/app is installed.",
                });
              }
            );
          } catch (err) {
            resolve({
              ok: false,
              message:
                "External launch is not available on this firmware. Use Smart Hub for that service.",
            });
          }
        };

        if (opts.skipNative) {
          tryControl();
          return;
        }

        this.resolveNativeApp(appMeta)
          .then((resolved) => {
            if (!resolved) {
              tryControl();
              return;
            }
            this.launchAppId(resolved.id).then((result) => {
              if (result.ok) resolve(result);
              else tryControl();
            });
          })
          .catch(() => tryControl());
      });
    },

    getNetworkConnected() {
      try {
        if (typeof webapis !== "undefined" && webapis.network) {
          return !!webapis.network.isConnectedToGateway();
        }
      } catch (_) {}
      return navigator.onLine !== false;
    },

    getModelHint() {
      try {
        if (typeof webapis !== "undefined" && webapis.productinfo) {
          return {
            model: webapis.productinfo.getModel(),
            firmware: webapis.productinfo.getFirmware(),
          };
        }
      } catch (_) {}
      return null;
    },

    exitApp() {
      try {
        const app = tizen.application.getCurrentApplication();
        app.exit();
      } catch (err) {
        console.warn("[ChulaOS] exit failed", err);
      }
    },
  };

  C.Tizen = TizenBridge;
})(typeof window !== "undefined" ? window : globalThis);

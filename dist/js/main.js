/**
 * Chula OS — application shell
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;
  let lastKeyAt = 0;
  let lastKey = "";

  const App = {
    init() {
      C.Storage.load();
      C.UI.init();
      C.Boot.init();
      C.Home.init();
      C.Library.init();
      C.Settings.init();
      C.Router.init();
      this._bindKeys();
      this._exposeApi();
      this._start();
    },

    _start() {
      const params = new URLSearchParams(location.search);
      const forceBoot =
        params.get("boot") === "1" || location.hash === "#demo";
      const prefs = C.Storage.get();

      // Returning from an external app via history
      try {
        const ret = sessionStorage.getItem("chulaos.return");
        if (ret && !forceBoot) {
          sessionStorage.removeItem("chulaos.return");
          C.Boot.hideImmediate();
          C.Router.go("home", {}, { replace: true });
          C.UI.toast("Welcome back", { tone: "ok" });
          this._maybeFirstRun();
          return;
        }
      } catch (_) {}

      if (forceBoot) {
        this.replayBoot();
        return;
      }

      // Preference: skip cinematic boot and open home directly
      if (prefs.skipBoot) {
        C.Boot.hideImmediate();
        C.Router.go("home", {}, { replace: true });
        this._maybeFirstRun();
        return;
      }

      // Normal cold start: play boot once, then home
      C.Home.hide();
      C.Boot.start(() => {
        C.Router.go("home", {}, { replace: true });
        this._maybeFirstRun();
      });
    },

    _maybeFirstRun() {
      const prefs = C.Storage.get();
      if (prefs.firstRunDone) return;
      C.Storage.set({ firstRunDone: true });
      setTimeout(() => {
        C.UI.toast(
          "Tip: ↑↓←→ navigate · Enter open · Esc back · F favorite in All Apps",
          { ms: 5200 }
        );
      }, 600);
    },

    replayBoot() {
      if (C.Boot.isRunning()) return;
      // Hide other views during boot
      ["home", "library", "settings"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          el.hidden = true;
          el.classList.remove("is-visible");
        }
      });
      C.Boot.start(() => {
        C.Router.go("home", {}, { replace: true });
      });
    },

    _bindKeys() {
      document.addEventListener(
        "keydown",
        (e) => {
          // Debounce repeated remote keys (except arrows for hold-to-scroll feel on arrows we allow but throttle activate)
          const now = Date.now();
          const isActivate = e.key === "Enter" || e.key === " ";
          if (
            isActivate &&
            e.key === lastKey &&
            now - lastKeyAt < 320 &&
            !e.repeat
          ) {
            /* allow */
          }
          if (isActivate && e.repeat) {
            e.preventDefault();
            return;
          }
          lastKey = e.key;
          lastKeyAt = now;

          // Demo replay only with Ctrl/Cmd+Shift+R to avoid accidental restarts on TV
          if (
            (e.key === "r" || e.key === "R") &&
            e.shiftKey &&
            (e.metaKey || e.ctrlKey) &&
            !C.Boot.isRunning()
          ) {
            e.preventDefault();
            this.replayBoot();
            return;
          }

          if (C.Boot.isRunning()) return;

          const view = C.Router.view;
          if (view === "home" && C.Home) C.Home.handleKey(e);
          else if (view === "library" && C.Library) C.Library.handleKey(e);
          else if (view === "settings" && C.Settings) C.Settings.handleKey(e);
        },
        true
      );
    },

    _exposeApi() {
      C.App = this;
      global.ChulaOS = C;
    },
  };

  C.App = App;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => App.init());
  } else {
    App.init();
  }
})(typeof window !== "undefined" ? window : globalThis);

/**
 * Chula OS — view router (home | library | settings)
 * Boot runs once per session unless forced; not on every navigation.
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;

  const Router = {
    view: "boot",
    history: [],
    _params: {},

    init() {
      window.addEventListener("hashchange", () => this._fromHash());
    },

    _fromHash() {
      const hash = (location.hash || "").replace(/^#/, "");
      if (!hash || hash === "demo") return;
      const [view, query] = hash.split("?");
      const params = {};
      if (query) {
        query.split("&").forEach((pair) => {
          const [k, v] = pair.split("=");
          if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
        });
      }
      if (["home", "library", "settings"].includes(view)) {
        this.go(view, params, { silentHash: true });
      }
    },

    go(view, params, opts) {
      opts = opts || {};
      const prev = this.view;
      if (prev && prev !== "boot" && prev !== view && !opts.replace) {
        this.history.push({ view: prev, params: this._params });
      }
      this.view = view;
      this._params = params || {};

      if (!opts.silentHash && view !== "boot") {
        const q = Object.keys(this._params)
          .map(
            (k) =>
              encodeURIComponent(k) + "=" + encodeURIComponent(this._params[k])
          )
          .join("&");
        const nextHash = q ? view + "?" + q : view;
        if ((location.hash || "").replace(/^#/, "") !== nextHash) {
          history.replaceState(null, "", "#" + nextHash);
        }
      }

      this._render();
    },

    back() {
      if (this.history.length) {
        const prev = this.history.pop();
        this.view = prev.view;
        this._params = prev.params || {};
        history.replaceState(null, "", "#" + this.view);
        this._render();
        return true;
      }
      if (this.view !== "home") {
        this.go("home", {}, { replace: true });
        return true;
      }
      return false;
    },

    params() {
      return this._params;
    },

    _render() {
      const views = {
        home: document.getElementById("home"),
        library: document.getElementById("library"),
        settings: document.getElementById("settings"),
      };
      Object.keys(views).forEach((key) => {
        const el = views[key];
        if (!el) return;
        const on = key === this.view;
        el.hidden = !on;
        el.setAttribute("aria-hidden", on ? "false" : "true");
        el.classList.toggle("is-visible", on);
      });

      if (this.view === "home" && C.Home) C.Home.onEnter();
      if (this.view === "library" && C.Library) C.Library.onEnter(this._params);
      if (this.view === "settings" && C.Settings) C.Settings.onEnter(this._params);

      if (C.UI) C.UI.hideOverlay();
    },
  };

  C.Router = Router;
})(typeof window !== "undefined" ? window : globalThis);

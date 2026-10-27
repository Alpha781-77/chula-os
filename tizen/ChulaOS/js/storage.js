/**
 * Chula OS — persistent preferences (localStorage)
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;
  const KEY = () => C.CONFIG.storageKey;

  const DEFAULTS = {
    firstRunDone: false,
    skipBoot: false,
    hour12: false,
    reducedMotion: false,
    largeText: false,
    uiSounds: false,
    wallpaper: "photo", // photo | illustration | dim
    iptvUrl: "",
    favorites: ["youtube", "netflix", "stremio"],
    hiddenApps: [],
    recent: [],
    homeFocusIndex: 0,
  };

  function safeParse(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  const Storage = {
    defaults: DEFAULTS,

    load() {
      const parsed = safeParse(localStorage.getItem(KEY()));
      const data = Object.assign({}, DEFAULTS, parsed || {});
      if (!Array.isArray(data.favorites)) data.favorites = DEFAULTS.favorites.slice();
      if (!Array.isArray(data.hiddenApps)) data.hiddenApps = [];
      if (!Array.isArray(data.recent)) data.recent = [];
      if (typeof data.iptvUrl !== "string") data.iptvUrl = "";
      this._cache = data;
      return data;
    },

    get() {
      return this._cache || this.load();
    },

    set(partial) {
      const next = Object.assign({}, this.get(), partial);
      this._cache = next;
      try {
        localStorage.setItem(KEY(), JSON.stringify(next));
      } catch (err) {
        console.warn("[ChulaOS] storage write failed", err);
      }
      return next;
    },

    pushRecent(appId) {
      const prefs = this.get();
      const recent = [appId].concat(prefs.recent.filter((id) => id !== appId));
      return this.set({ recent: recent.slice(0, C.CONFIG.recentLimit) });
    },

    toggleFavorite(appId) {
      const prefs = this.get();
      const has = prefs.favorites.includes(appId);
      const favorites = has
        ? prefs.favorites.filter((id) => id !== appId)
        : prefs.favorites.concat(appId);
      return this.set({ favorites });
    },

    isFavorite(appId) {
      return this.get().favorites.includes(appId);
    },

    reset() {
      this._cache = Object.assign({}, DEFAULTS);
      try {
        localStorage.removeItem(KEY());
      } catch (_) {}
      return this._cache;
    },
  };

  C.Storage = Storage;
})(typeof window !== "undefined" ? window : globalThis);

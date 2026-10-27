/**
 * Chula OS — shared UI helpers (toast, overlays, prefs apply)
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;

  const UI = {
    toastTimer: null,
    _toastHideTimer: null,

    init() {
      this.toastEl = document.getElementById("toast");
      this.overlayEl = document.getElementById("overlay");
      this.applyPreferences();
      window.addEventListener("online", () =>
        this.toast("Back online", { tone: "ok" })
      );
      window.addEventListener("offline", () =>
        this.toast("Offline — launcher works; streaming apps need internet", {
          tone: "warn",
        })
      );
    },

    applyPreferences() {
      const prefs = C.Storage.get();
      document.documentElement.classList.toggle("large-text", !!prefs.largeText);
      document.documentElement.classList.toggle(
        "reduced-motion",
        !!prefs.reducedMotion
      );
      document.documentElement.dataset.wallpaper = prefs.wallpaper || "photo";
      const stage = document.getElementById("stage");
      if (stage) {
        stage.dataset.wallpaper = prefs.wallpaper || "photo";
      }
    },

    toast(message, opts) {
      if (!this.toastEl) return;
      const tone = (opts && opts.tone) || "info";
      this.toastEl.textContent = message;
      this.toastEl.dataset.tone = tone;
      this.toastEl.hidden = false;
      requestAnimationFrame(() => this.toastEl.classList.add("is-shown"));
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(
        () => this.hideToast(),
        (opts && opts.ms) || C.CONFIG.toastMs
      );
    },

    hideToast() {
      if (!this.toastEl) return;
      this.toastEl.classList.remove("is-shown");
      if (this.toastTimer) {
        clearTimeout(this.toastTimer);
        this.toastTimer = null;
      }
      if (this._toastHideTimer) clearTimeout(this._toastHideTimer);
      this._toastHideTimer = setTimeout(() => {
        this._toastHideTimer = null;
        if (this.toastEl && !this.toastEl.classList.contains("is-shown")) {
          this.toastEl.hidden = true;
          this.toastEl.textContent = "";
        }
      }, 400);
    },

    showLaunchOverlay(name) {
      return new Promise((resolve) => {
        if (!this.overlayEl) {
          resolve();
          return;
        }
        this.overlayEl.innerHTML =
          '<div class="overlay__card glass">' +
          '<div class="overlay__spinner" aria-hidden="true"></div>' +
          "<p class=\"overlay__title\">Opening " +
          this.escape(name) +
          "</p>" +
          '<p class="overlay__sub">Use your remote Back button to return to Chula OS</p>' +
          "</div>";
        this.overlayEl.hidden = false;
        this.overlayEl.classList.add("is-shown");
        setTimeout(resolve, C.CONFIG.launchDelayMs);
      });
    },

    hideOverlay() {
      if (!this.overlayEl) return;
      this.overlayEl.classList.remove("is-shown");
      this.overlayEl.hidden = true;
      this.overlayEl.innerHTML = "";
    },

    escape(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    },

    playClick() {
      if (!C.Storage.get().uiSounds) return;
      try {
        const ctx = this._audio || new (window.AudioContext || window.webkitAudioContext)();
        this._audio = ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 660;
        g.gain.value = 0.03;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.05);
      } catch (_) {}
    },
  };

  C.UI = UI;
})(typeof window !== "undefined" ? window : globalThis);

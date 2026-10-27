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

    /**
     * Caution external destinations — user must confirm. Default focus = stay in Chula OS.
     * No auto-redirect loops; does not suppress browser warnings.
     * @returns {Promise<boolean>} true if user continues
     */
    confirmCautionLaunch(app) {
      return new Promise((resolve) => {
        if (!this.overlayEl) {
          resolve(false);
          return;
        }
        const name = (app && app.name) || "this site";
        this.overlayEl.innerHTML =
          '<div class="overlay__card glass overlay__card--caution" role="dialog" aria-modal="true" aria-labelledby="caution-title">' +
          '<p class="overlay__eyebrow">External · not trusted</p>' +
          '<p class="overlay__title" id="caution-title">' +
          this.escape(name) +
          "</p>" +
          '<p class="overlay__sub">Security tools may flag this destination. Chula OS cannot detect or block redirects, ads, or downloads inside the TV browser. Browser warnings are not suppressed.</p>' +
          '<p class="overlay__sub">Back returns to Chula OS if the app is still running. Prefer Apps → Chula OS if not.</p>' +
          '<div class="overlay__actions">' +
          '<button type="button" class="btn glass overlay__btn is-focused" data-caution="cancel">Stay in Chula OS</button>' +
          '<button type="button" class="btn glass overlay__btn" data-caution="continue">Continue anyway</button>' +
          "</div></div>";
        this.overlayEl.hidden = false;
        this.overlayEl.classList.add("is-shown");

        const buttons = Array.from(
          this.overlayEl.querySelectorAll("[data-caution]")
        );
        let focusIdx = 0; // safer default: cancel

        const sync = () => {
          buttons.forEach((b, i) => {
            b.classList.toggle("is-focused", i === focusIdx);
            b.tabIndex = i === focusIdx ? 0 : -1;
          });
          if (buttons[focusIdx]) buttons[focusIdx].focus({ preventScroll: true });
        };

        const finish = (ok) => {
          document.removeEventListener("keydown", onKey, true);
          buttons.forEach((b) => b.removeEventListener("click", onClick));
          this.hideOverlay();
          resolve(!!ok);
        };

        const onClick = (e) => {
          const act = e.currentTarget.getAttribute("data-caution");
          finish(act === "continue");
        };

        const onKey = (e) => {
          const code = e.keyCode;
          if (
            e.key === "Escape" ||
            e.key === "Backspace" ||
            e.key === "BrowserBack" ||
            code === 10009 ||
            code === 10182
          ) {
            e.preventDefault();
            e.stopPropagation();
            finish(false);
            return;
          }
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            focusIdx = (focusIdx + buttons.length - 1) % buttons.length;
            sync();
            return;
          }
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            focusIdx = (focusIdx + 1) % buttons.length;
            sync();
            return;
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            const act = buttons[focusIdx]
              ? buttons[focusIdx].getAttribute("data-caution")
              : "cancel";
            finish(act === "continue");
          }
        };

        buttons.forEach((b) => b.addEventListener("click", onClick));
        document.addEventListener("keydown", onKey, true);
        sync();
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

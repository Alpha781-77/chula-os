/**
 * Chula OS — cinematic boot sequence (branding only here)
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;
  const PARTICLE_COUNT = 18;

  const Boot = {
    el: null,
    _timer: null,
    _running: false,
    _sessionPlayed: false,

    init() {
      this.el = document.getElementById("boot");
      this._spawnParticles();
    },

    _spawnParticles() {
      const layer = document.getElementById("boot-particles");
      if (!layer || layer.childElementCount) return;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = document.createElement("span");
        p.className = "boot__particle";
        p.style.left = `${6 + Math.random() * 88}%`;
        p.style.top = `${12 + Math.random() * 76}%`;
        p.style.animationDelay = `${Math.random() * 3.5}s`;
        frag.appendChild(p);
      }
      layer.appendChild(frag);
    },

    reset() {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
      this._running = false;
      if (!this.el) return;
      this.el.hidden = false;
      this.el.inert = false;
      this.el.setAttribute("aria-hidden", "false");
      this.el.classList.remove("is-ready", "is-loading", "is-exiting");
      void this.el.offsetWidth;
    },

    hideImmediate() {
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
      this._running = false;
      if (!this.el) return;
      this.el.hidden = true;
      this.el.inert = true;
      this.el.setAttribute("aria-hidden", "true");
      this.el.classList.remove("is-ready", "is-loading", "is-exiting");
    },

    /**
     * @param {() => void} onComplete
     */
    start(onComplete) {
      this.reset();
      this._running = true;
      this._sessionPlayed = true;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!this._running || !this.el) return;
          this.el.classList.add("is-ready", "is-loading");
        });
      });

      this._timer = setTimeout(() => {
        if (!this._running || !this.el) return;
        if (typeof onComplete === "function") onComplete();
        this.el.classList.add("is-exiting");

        this._timer = setTimeout(() => {
          if (!this.el) return;
          this.el.hidden = true;
          this.el.inert = true;
          this.el.setAttribute("aria-hidden", "true");
          this.el.classList.remove("is-ready", "is-loading", "is-exiting");
          this._running = false;
          this._timer = null;
        }, C.CONFIG.bootExitMs);
      }, C.CONFIG.bootMs);
    },

    isRunning() {
      return this._running;
    },

    didPlayThisSession() {
      return this._sessionPlayed;
    },
  };

  C.Boot = Boot;
})(typeof window !== "undefined" ? window : globalThis);

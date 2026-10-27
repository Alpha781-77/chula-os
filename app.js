/**
 * Chula OS — browser prototype (premium smart-TV UI)
 * Boot and home logic are separate modules.
 * No network calls at runtime. No firmware control.
 */

(function () {
  "use strict";

  /* ============================================================
   * Demo mechanism — replay the startup sequence
   * ------------------------------------------------------------
   *   • Press  R
   *   • Open with ?boot=1 or #demo
   *   • Console: ChulaOS.replayBoot()
   * ============================================================ */

  const BOOT_TOTAL_MS = 6800;
  const BOOT_EXIT_MS = 1150;
  const TOAST_MS = 2400;
  /** Single horizontal streaming row */
  const TILE_COLS = 8;
  const PARTICLE_COUNT = 18;

  /* ---------- Boot module ---------- */
  const Boot = {
    el: null,
    _timer: null,
    _running: false,

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

    /**
     * @param {() => void} onComplete
     */
    start(onComplete) {
      this.reset();
      this._running = true;

      // Double rAF ensures the reset reflow commits before animations start
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!this._running || !this.el) return;
          this.el.classList.add("is-ready", "is-loading");
        });
      });

      this._timer = setTimeout(() => {
        if (!this._running || !this.el) return;
        // Reveal home under the boot fade for a crossfade transition
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
        }, BOOT_EXIT_MS);
      }, BOOT_TOTAL_MS);
    },

    isRunning() {
      return this._running;
    },
  };

  /* ---------- Home module ---------- */
  const Home = {
    el: null,
    tiles: [],
    statusBtns: [],
    /** @type {'tiles' | 'status'} */
    zone: "tiles",
    focusIndex: 0,
    toastEl: null,
    toastTimer: null,
    _toastHideTimer: null,
    clockTimer: null,

    init() {
      this.el = document.getElementById("home");
      this.tiles = Array.from(document.querySelectorAll(".tile"));
      this.statusBtns = Array.from(document.querySelectorAll(".status__btn"));
      this.toastEl = document.getElementById("toast");
      this._bindItems();
    },

    _bindItems() {
      this.tiles.forEach((tile, i) => {
        tile.addEventListener("click", () => {
          this.zone = "tiles";
          this.setFocus(i);
          this.activate();
        });
        tile.addEventListener("focus", () => {
          this.zone = "tiles";
          this.focusIndex = i;
          this._syncFocusClasses();
        });
      });

      this.statusBtns.forEach((btn, i) => {
        btn.addEventListener("click", () => {
          this.zone = "status";
          this.setFocus(i);
          this.activate();
        });
        btn.addEventListener("focus", () => {
          this.zone = "status";
          this.focusIndex = i;
          this._syncFocusClasses();
        });
      });
    },

    show() {
      if (!this.el) return;
      this.el.hidden = false;
      this.el.setAttribute("aria-hidden", "false");
      this.el.classList.add("is-visible");
      this.updateGreeting();
      this.updateClock();
      this.startClock();
      this.zone = "tiles";
      this.setFocus(0);
    },

    hide() {
      if (!this.el) return;
      this.el.hidden = true;
      this.el.setAttribute("aria-hidden", "true");
      this.el.classList.remove("is-visible");
      this.stopClock();
      this.hideToast();
      this._clearFocusClasses();
    },

    _items() {
      return this.zone === "status" ? this.statusBtns : this.tiles;
    },

    setFocus(index) {
      const items = this._items();
      if (!items.length) return;
      const max = items.length - 1;
      this.focusIndex = Math.max(0, Math.min(index, max));
      this._syncFocusClasses();
      const el = items[this.focusIndex];
      if (el) el.focus({ preventScroll: true });
    },

    _syncFocusClasses() {
      this.tiles.forEach((tile, i) => {
        const on = this.zone === "tiles" && i === this.focusIndex;
        tile.classList.toggle("is-focused", on);
        tile.tabIndex = on ? 0 : -1;
      });
      this.statusBtns.forEach((btn, i) => {
        const on = this.zone === "status" && i === this.focusIndex;
        btn.classList.toggle("is-focused", on);
        btn.tabIndex = on ? 0 : -1;
      });
    },

    _clearFocusClasses() {
      this.tiles.forEach((tile) => {
        tile.classList.remove("is-focused");
        tile.tabIndex = -1;
      });
      this.statusBtns.forEach((btn) => {
        btn.classList.remove("is-focused");
        btn.tabIndex = -1;
      });
    },

    move(dx, dy) {
      if (this.zone === "status") {
        if (dy > 0) {
          // Drop into the streaming row — spread status icons across tiles
          this.zone = "tiles";
          const statusMap = [0, 2, 5, 7];
          this.setFocus(statusMap[this.focusIndex] ?? 0);
          return;
        }
        if (dy < 0) return;
        const len = this.statusBtns.length;
        this.setFocus((this.focusIndex + dx + len) % len);
        return;
      }

      // Single horizontal row of tiles
      const count = this.tiles.length;
      if (dy < 0) {
        this.zone = "status";
        const statusCount = this.statusBtns.length;
        const mapped = Math.round(
          (this.focusIndex / Math.max(count - 1, 1)) * (statusCount - 1)
        );
        this.setFocus(mapped);
        return;
      }
      if (dy > 0) return;

      this.setFocus((this.focusIndex + dx + count) % count);
    },

    activate() {
      if (this.zone === "status") {
        const btn = this.statusBtns[this.focusIndex];
        if (!btn) return;
        const label = btn.dataset.label || "Item";
        this.showToast(
          `${label} — prototype control (not connected to system settings)`
        );
        return;
      }

      const tile = this.tiles[this.focusIndex];
      if (!tile) return;
      const label = tile.dataset.label || "Item";
      this.showToast(
        `${label} — prototype tile (not connected to a real app)`
      );
    },

    showToast(message) {
      if (!this.toastEl) return;
      this.toastEl.textContent = message;
      this.toastEl.hidden = false;
      requestAnimationFrame(() => {
        this.toastEl.classList.add("is-shown");
      });
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.hideToast(), TOAST_MS);
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

    updateGreeting() {
      const el = document.getElementById("greeting");
      if (!el) return;
      const hour = new Date().getHours();
      let text = "Good evening";
      if (hour < 12) text = "Good morning";
      else if (hour < 18) text = "Good afternoon";
      el.textContent = text;
    },

    updateClock() {
      const timeEl = document.getElementById("clock-time");
      const dateEl = document.getElementById("clock-date");
      if (!timeEl || !dateEl) return;

      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      timeEl.setAttribute("datetime", now.toISOString());
      dateEl.textContent = now.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    },

    startClock() {
      this.stopClock();
      this.clockTimer = setInterval(() => this.updateClock(), 1000);
    },

    stopClock() {
      if (this.clockTimer) {
        clearInterval(this.clockTimer);
        this.clockTimer = null;
      }
    },

    /**
     * @param {KeyboardEvent} e
     * @returns {boolean}
     */
    handleKey(e) {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          this.move(-1, 0);
          return true;
        case "ArrowRight":
          e.preventDefault();
          this.move(1, 0);
          return true;
        case "ArrowUp":
          e.preventDefault();
          this.move(0, -1);
          return true;
        case "ArrowDown":
          e.preventDefault();
          this.move(0, 1);
          return true;
        case "Enter":
        case " ":
          e.preventDefault();
          this.activate();
          return true;
        case "Escape":
        case "Backspace":
          e.preventDefault();
          this.hideToast();
          if (this.zone === "status") {
            this.zone = "tiles";
            this.setFocus(0);
          } else {
            this.setFocus(this.focusIndex);
          }
          return true;
        default:
          return false;
      }
    },
  };

  /* ---------- App shell ---------- */
  const App = {
    init() {
      Boot.init();
      Home.init();
      this._bindGlobalKeys();
      this._exposeDemoApi();

      if (this._shouldForceBoot()) {
        this.replayBoot();
      } else {
        this.runBoot();
      }
    },

    _shouldForceBoot() {
      const params = new URLSearchParams(window.location.search);
      if (params.get("boot") === "1") return true;
      if (window.location.hash === "#demo") return true;
      return false;
    },

    runBoot() {
      Home.hide();
      Boot.start(() => Home.show());
    },

    replayBoot() {
      Home.hide();
      Boot.start(() => Home.show());
    },

    _bindGlobalKeys() {
      document.addEventListener("keydown", (e) => {
        if (
          (e.key === "r" || e.key === "R") &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey &&
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLTextAreaElement)
        ) {
          if (!Boot.isRunning()) {
            e.preventDefault();
            this.replayBoot();
          }
          return;
        }

        if (Boot.isRunning()) return;
        if (Home.el && !Home.el.hidden) {
          Home.handleKey(e);
        }
      });
    },

    _exposeDemoApi() {
      window.ChulaOS = {
        replayBoot: () => this.replayBoot(),
        Boot,
        Home,
      };
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => App.init());
  } else {
    App.init();
  }
})();

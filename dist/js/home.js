/**
 * Chula OS — home screen
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;

  const Home = {
    el: null,
    tiles: [],
    statusBtns: [],
    zone: "tiles",
    focusIndex: 0,
    clockTimer: null,
    _built: false,

    init() {
      this.el = document.getElementById("home");
      this.statusBtns = Array.from(document.querySelectorAll(".status__btn"));
      this._bindStatus();
      this.renderTiles();
    },

    renderTiles() {
      const row = document.getElementById("home-tiles");
      if (!row) return;
      const apps = C.Registry.homeTiles();
      row.innerHTML = apps
        .map(
          (app) =>
            `<button type="button" class="tile glass" data-tile="${app.id}" data-label="${C.UI.escape(app.name)}" aria-label="${C.UI.escape(app.name)}">` +
            `<span class="tile__icon" aria-hidden="true">${app.icon}</span>` +
            `<span class="tile__label">${C.UI.escape(app.name)}</span>` +
            `</button>`
        )
        .join("");
      this.tiles = Array.from(row.querySelectorAll(".tile"));
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
      this._built = true;
    },

    _bindStatus() {
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

    onEnter() {
      if (!this._built) this.renderTiles();
      this.updateGreeting();
      this.updateClock();
      this.startClock();
      this.updateNetworkBadge();
      const saved = C.Storage.get().homeFocusIndex || 0;
      this.zone = "tiles";
      this.setFocus(Math.min(saved, Math.max(this.tiles.length - 1, 0)));
    },

    show() {
      if (!this.el) return;
      C.Router.go("home", {}, { replace: true });
    },

    hide() {
      this.stopClock();
      if (this.el) {
        this.el.hidden = true;
        this.el.setAttribute("aria-hidden", "true");
        this.el.classList.remove("is-visible");
      }
      this._clearFocusClasses();
    },

    _items() {
      return this.zone === "status" ? this.statusBtns : this.tiles;
    },

    setFocus(index) {
      const items = this._items();
      if (!items.length) return;
      this.focusIndex = Math.max(0, Math.min(index, items.length - 1));
      this._syncFocusClasses();
      const el = items[this.focusIndex];
      if (el) el.focus({ preventScroll: true });
      if (this.zone === "tiles") {
        C.Storage.set({ homeFocusIndex: this.focusIndex });
      }
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
      this.tiles.forEach((t) => {
        t.classList.remove("is-focused");
        t.tabIndex = -1;
      });
      this.statusBtns.forEach((b) => {
        b.classList.remove("is-focused");
        b.tabIndex = -1;
      });
    },

    move(dx, dy) {
      if (this.zone === "status") {
        if (dy > 0) {
          this.zone = "tiles";
          const map = [0, 2, 5, Math.max(this.tiles.length - 1, 0)];
          this.setFocus(map[this.focusIndex] ?? 0);
          return;
        }
        if (dy < 0) return;
        const len = this.statusBtns.length;
        this.setFocus((this.focusIndex + dx + len) % len);
        return;
      }

      const count = this.tiles.length;
      if (!count) return;
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

    async activate() {
      C.UI.playClick();
      if (this.zone === "status") {
        const btn = this.statusBtns[this.focusIndex];
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === "settings") {
          C.Router.go("settings");
          return;
        }
        if (action === "search") {
          C.Router.go("library", { focusSearch: "1" });
          return;
        }
        if (action === "wifi") {
          const online = C.Launcher.isOnline();
          C.UI.toast(
            online
              ? "Network: online (Wi-Fi/Ethernet is managed by your TV or device OS)"
              : "Network: offline — reconnect in your device system settings",
            { tone: online ? "ok" : "warn" }
          );
          return;
        }
        if (action === "bluetooth") {
          C.UI.toast(
            "Bluetooth is controlled by your TV or device operating system — open system settings on the device.",
            { tone: "info" }
          );
          return;
        }
        return;
      }

      const tile = this.tiles[this.focusIndex];
      if (!tile) return;
      const id = tile.dataset.tile;
      const result = await C.Launcher.launch(id);
      if (!result.ok) {
        C.UI.toast(result.message || "Unable to open", { tone: "warn" });
      }
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
      const prefs = C.Storage.get();
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: !!prefs.hour12,
      });
      timeEl.setAttribute("datetime", now.toISOString());
      dateEl.textContent = now.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    },

    updateNetworkBadge() {
      const badge = document.getElementById("net-badge");
      if (!badge) return;
      const on = C.Launcher.isOnline();
      badge.textContent = on ? "Online" : "Offline";
      badge.dataset.state = on ? "online" : "offline";
      badge.hidden = false;
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
        case "BrowserBack":
          e.preventDefault();
          C.UI.hideToast();
          if (this.zone === "status") {
            this.zone = "tiles";
            this.setFocus(0);
          } else {
            this.setFocus(this.focusIndex);
          }
          return true;
        case "Home":
        case "BrowserHome":
          e.preventDefault();
          this.zone = "tiles";
          this.setFocus(0);
          return true;
        default:
          return false;
      }
    },
  };

  C.Home = Home;
})(typeof window !== "undefined" ? window : globalThis);

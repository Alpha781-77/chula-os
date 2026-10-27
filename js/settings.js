/**
 * Chula OS — settings (launcher prefs vs OS-managed hardware)
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;

  const SECTIONS = [
    { id: "network", label: "Network" },
    { id: "display", label: "Display" },
    { id: "sound", label: "Sound" },
    { id: "apps", label: "Applications" },
    { id: "startup", label: "Startup" },
    { id: "datetime", label: "Date & time" },
    { id: "accessibility", label: "Accessibility" },
    { id: "about", label: "About" },
  ];

  const Settings = {
    el: null,
    section: "network",
    focusables: [],
    focusIndex: 0,
    _ready: false,

    init() {
      this.el = document.getElementById("settings");
      if (!this.el) return;
      this.nav = document.getElementById("settings-nav");
      this.panel = document.getElementById("settings-panel");
      this.backBtn = document.getElementById("settings-back");
      if (this.backBtn) {
        this.backBtn.addEventListener("click", () => C.Router.go("home"));
      }
      this._ready = true;
    },

    onEnter(params) {
      if (!this._ready) this.init();
      this.section = (params && params.section) || "network";
      this.renderNav();
      this.renderPanel();
      if (params && params.notice === "iptv") {
        C.UI.toast("Configure your IPTV player URL below", { tone: "info" });
      }
      this._rebuildFocusables();
      this.setFocus(0);
    },

    renderNav() {
      if (!this.nav) return;
      this.nav.innerHTML = SECTIONS.map(
        (s) =>
          `<button type="button" class="settings-nav__item${s.id === this.section ? " is-active" : ""}" data-section="${s.id}">${s.label}</button>`
      ).join("");
      this.nav.querySelectorAll(".settings-nav__item").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.section = btn.dataset.section;
          this.renderNav();
          this.renderPanel();
          this._rebuildFocusables();
          this.setFocus(0);
        });
      });
    },

    renderPanel() {
      if (!this.panel) return;
      const prefs = C.Storage.get();
      const online = C.Launcher.isOnline();
      let html = "";

      switch (this.section) {
        case "network":
          html =
            `<h2 class="settings-title">Network</h2>` +
            `<p class="settings-lead">Connection status is reported by this browser. Wi-Fi credentials and adapters are managed by your TV or device OS.</p>` +
            `<div class="settings-card glass"><div class="settings-row"><span>Status</span><strong data-online="${online}">${online ? "Online" : "Offline"}</strong></div>` +
            `<div class="settings-row"><span>Type</span><span>${this._connectionType()}</span></div></div>` +
            `<p class="settings-note">To change Wi-Fi networks, open your device’s system network settings.</p>`;
          break;
        case "display":
          html =
            `<h2 class="settings-title">Display & wallpaper</h2>` +
            `<p class="settings-lead">These options affect Chula OS only — not your TV panel brightness or picture mode.</p>` +
            this._selectRow("wallpaper", "Wallpaper", prefs.wallpaper, [
              ["photo", "Cinematic photo"],
              ["illustration", "Illustration fallback"],
              ["dim", "Dimmed photo"],
            ]);
          break;
        case "sound":
          html =
            `<h2 class="settings-title">Sound</h2>` +
            `<p class="settings-lead">Optional UI click sounds. System volume and audio output remain OS-controlled.</p>` +
            this._toggleRow("uiSounds", "UI click sounds", prefs.uiSounds);
          break;
        case "apps":
          html =
            `<h2 class="settings-title">Applications</h2>` +
            `<p class="settings-lead">IPTV opens a URL you provide. Chula OS does not host or redistribute streams.</p>` +
            `<label class="settings-field"><span>IPTV player URL (https)</span>` +
            `<input id="iptv-url" class="settings-input" type="url" inputmode="url" placeholder="https://…" value="${C.UI.escape(prefs.iptvUrl)}" /></label>` +
            `<button type="button" class="btn glass" id="iptv-save">Save IPTV URL</button>` +
            `<p class="settings-note">Favorites: press <kbd>F</kbd> on an app in All Apps. Recent apps are remembered on this device.</p>`;
          break;
        case "startup":
          html =
            `<h2 class="settings-title">Startup</h2>` +
            this._toggleRow("skipBoot", "Skip boot animation after first launch this session", prefs.skipBoot) +
            `<button type="button" class="btn glass" id="replay-boot">Replay boot animation now</button>` +
            `<button type="button" class="btn glass" id="reset-firstrun">Show first-run tips again</button>` +
            `<p class="settings-note">On Samsung Tizen, Chula OS is a normal app. It cannot replace Smart Hub or intercept the TV Home button. Open Chula OS from Apps after using other services. Background keep-alive is currently disabled in the Tizen package (trade-off: cleaner exits; resume depends on the TV keeping the app in memory).</p>`;
          break;
        case "datetime":
          html =
            `<h2 class="settings-title">Date & time</h2>` +
            `<p class="settings-lead">Clock format for the Chula OS home screen. Device clock sync is OS-managed.</p>` +
            this._toggleRow("hour12", "12-hour clock", prefs.hour12);
          break;
        case "accessibility":
          html =
            `<h2 class="settings-title">Accessibility</h2>` +
            this._toggleRow("largeText", "Larger text", prefs.largeText) +
            this._toggleRow("reducedMotion", "Reduce motion", prefs.reducedMotion);
          break;
        case "about":
        default:
          html =
            `<h2 class="settings-title">About Chula OS</h2>` +
            `<div class="settings-card glass about-card">` +
            `<p class="about-name">Chula OS</p>` +
            `<p class="about-origin">${C.CONFIG.origin}</p>` +
            `<div class="settings-row"><span>Version</span><span>${C.CONFIG.version}</span></div>` +
            `<div class="settings-row"><span>Build</span><span>${C.CONFIG.build}</span></div>` +
            `<div class="settings-row"><span>Platform</span><span>${
              C.Tizen && C.Tizen.isTizen
                ? "Samsung Tizen TV app"
                : "Web TV launcher (PWA)"
            }</span></div>` +
            (C.Tizen && C.Tizen.isTizen && C.Tizen.getModelHint
              ? (() => {
                  const m = C.Tizen.getModelHint();
                  return m
                    ? `<div class="settings-row"><span>TV model</span><span>${C.UI.escape(
                        m.model || "—"
                      )}</span></div>`
                    : "";
                })()
              : "") +
            `<p class="settings-note">Chula OS is a Smart TV home launcher. It does not replace Samsung Smart Hub or TV firmware. On Tizen it installs as a normal .wgt application. See docs/tizen/LAUNCHER_CAPABILITIES.md for supported vs unsupported behavior.</p>` +
            `</div>` +
            `<button type="button" class="btn glass btn--danger" id="reset-prefs">Reset all Chula OS preferences</button>`;
          break;
      }

      this.panel.innerHTML = html;
      this._bindPanel();
    },

    _connectionType() {
      const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!c) return "Unknown (browser does not expose type)";
      return c.effectiveType || c.type || "Unknown";
    },

    _toggleRow(key, label, value) {
      return (
        `<label class="settings-toggle glass">` +
        `<span>${label}</span>` +
        `<input type="checkbox" data-pref="${key}" ${value ? "checked" : ""} />` +
        `</label>`
      );
    },

    _selectRow(key, label, value, options) {
      const opts = options
        .map(
          ([v, t]) =>
            `<option value="${v}"${v === value ? " selected" : ""}>${t}</option>`
        )
        .join("");
      return (
        `<label class="settings-field"><span>${label}</span>` +
        `<select class="settings-input" data-pref="${key}">${opts}</select></label>`
      );
    },

    _bindPanel() {
      this.panel.querySelectorAll("[data-pref]").forEach((el) => {
        const key = el.getAttribute("data-pref");
        const apply = () => {
          const val = el.type === "checkbox" ? el.checked : el.value;
          C.Storage.set({ [key]: val });
          C.UI.applyPreferences();
          if (key === "hour12" && C.Home) C.Home.updateClock();
          C.UI.toast("Preference saved");
        };
        el.addEventListener("change", apply);
      });

      const iptvSave = document.getElementById("iptv-save");
      if (iptvSave) {
        iptvSave.addEventListener("click", () => {
          const input = document.getElementById("iptv-url");
          const raw = input ? input.value.trim() : "";
          if (raw) {
            try {
              const u = new URL(raw);
              if (!["https:", "http:"].includes(u.protocol)) throw new Error("bad");
            } catch (_) {
              C.UI.toast("Enter a valid http(s) URL", { tone: "warn" });
              return;
            }
          }
          C.Storage.set({ iptvUrl: raw });
          C.UI.toast(raw ? "IPTV URL saved" : "IPTV URL cleared", { tone: "ok" });
        });
      }

      const replay = document.getElementById("replay-boot");
      if (replay) {
        replay.addEventListener("click", () => {
          if (C.App && C.App.replayBoot) C.App.replayBoot();
        });
      }

      const first = document.getElementById("reset-firstrun");
      if (first) {
        first.addEventListener("click", () => {
          C.Storage.set({ firstRunDone: false });
          C.UI.toast("First-run tips will show on next home visit");
        });
      }

      const reset = document.getElementById("reset-prefs");
      if (reset) {
        reset.addEventListener("click", () => {
          C.Storage.reset();
          C.UI.applyPreferences();
          this.renderPanel();
          this._rebuildFocusables();
          C.UI.toast("Preferences reset", { tone: "ok" });
        });
      }
    },

    _rebuildFocusables() {
      const list = [];
      if (this.backBtn) list.push(this.backBtn);
      if (this.nav) list.push(...this.nav.querySelectorAll(".settings-nav__item"));
      if (this.panel) {
        list.push(
          ...this.panel.querySelectorAll(
            "button, input, select, .settings-toggle, .settings-input"
          )
        );
      }
      this.focusables = Array.from(list);
    },

    setFocus(index) {
      if (!this.focusables.length) return;
      this.focusIndex = Math.max(0, Math.min(index, this.focusables.length - 1));
      this.focusables.forEach((el, i) => {
        el.classList.toggle("is-focused", i === this.focusIndex);
        if ("tabIndex" in el) el.tabIndex = i === this.focusIndex ? 0 : -1;
      });
      const el = this.focusables[this.focusIndex];
      if (el && typeof el.focus === "function") el.focus({ preventScroll: true });
    },

    move(dx, dy) {
      const navItems = Array.from(
        this.nav ? this.nav.querySelectorAll(".settings-nav__item") : []
      );
      const el = this.focusables[this.focusIndex];
      const inNav = navItems.includes(el);

      if (inNav) {
        if (dx > 0) {
          // enter panel
          const panelFirst = this.focusables.find(
            (f) => f !== this.backBtn && !navItems.includes(f)
          );
          if (panelFirst) this.setFocus(this.focusables.indexOf(panelFirst));
          return;
        }
        const idx = navItems.indexOf(el);
        if (dy) {
          const next = Math.max(0, Math.min(navItems.length - 1, idx + dy));
          this.setFocus(this.focusables.indexOf(navItems[next]));
          if (navItems[next]) {
            this.section = navItems[next].dataset.section;
            this.renderNav();
            this.renderPanel();
            this._rebuildFocusables();
            this.setFocus(this.focusables.indexOf(
              this.nav.querySelector(`[data-section="${this.section}"]`)
            ));
          }
          return;
        }
        if (dx < 0 && this.backBtn) {
          this.setFocus(this.focusables.indexOf(this.backBtn));
        }
        return;
      }

      if (dx < 0 && navItems.length) {
        const active = this.nav.querySelector(".settings-nav__item.is-active") || navItems[0];
        this.setFocus(this.focusables.indexOf(active));
        return;
      }

      this.setFocus(this.focusIndex + (dy || dx));
    },

    _activate() {
      const el = this.focusables[this.focusIndex];
      if (!el) return;
      if (el === this.backBtn) {
        C.Router.go("home");
        return;
      }
      if (el.dataset && el.dataset.section) {
        this.section = el.dataset.section;
        this.renderNav();
        this.renderPanel();
        this._rebuildFocusables();
        return;
      }
      if (el.tagName === "BUTTON") el.click();
      else if (el.tagName === "INPUT" && el.type === "checkbox") {
        el.checked = !el.checked;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else if (el.tagName === "INPUT" || el.tagName === "SELECT") {
        el.focus();
      } else if (el.classList.contains("settings-toggle")) {
        const input = el.querySelector("input");
        if (input) {
          input.checked = !input.checked;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    },

    handleKey(e) {
      const typing =
        e.target &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") &&
        e.target.type !== "checkbox";

      if (typing && !["Escape", "ArrowDown", "ArrowUp"].includes(e.key)) {
        return false;
      }

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
          if (!typing) {
            e.preventDefault();
            this._activate();
            return true;
          }
          return false;
        case "Escape":
        case "Backspace":
        case "BrowserBack":
          e.preventDefault();
          C.Router.go("home", {}, { replace: true });
          return true;
        case "Home":
        case "BrowserHome":
          e.preventDefault();
          C.Router.go("home");
          return true;
        default:
          return false;
      }
    },
  };

  C.Settings = Settings;
})(typeof window !== "undefined" ? window : globalThis);

/**
 * Chula OS — Entertainment hub (Movies & TV, Football & Sports, External)
 * Reuses Registry + Launcher; does not duplicate launch logic.
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;
  const COLS = () => Math.max(2, Math.min(4, C.CONFIG.libraryCols || 4));

  const Entertainment = {
    el: null,
    focusables: [],
    focusIndex: 0,
    _ready: false,
    _cards: [],

    init() {
      this.el = document.getElementById("entertainment");
      if (!this.el) return;
      this.backBtn = document.getElementById("entertainment-back");
      this.body = document.getElementById("entertainment-body");
      if (this.backBtn) {
        this.backBtn.addEventListener("click", () =>
          C.Router.go("home", {}, { replace: true })
        );
      }
      this._ready = true;
    },

    onEnter() {
      if (!this._ready) this.init();
      this.render();
      this.focusIndex = 0;
      this._rebuildFocusables();
      // Prefer first service card over Back when available
      const firstCard = this._cards[0];
      if (firstCard) {
        this.setFocus(this.focusables.indexOf(firstCard));
      } else {
        this.setFocus(0);
      }
    },

    render() {
      if (!this.body) return;
      const sections = C.Registry.entertainmentSections || [];
      const html = sections
        .map((sec) => {
          const apps = C.Registry.byCategory(sec.id);
          if (!apps.length) return "";
          const cards = apps
            .map((app) => {
              const caution =
                app.trust === "caution"
                  ? '<span class="app-card__caution" aria-label="Caution">Caution</span>'
                  : "";
              const note = app.hubNote
                ? `<span class="app-card__meta">${C.UI.escape(app.hubNote)}</span>`
                : `<span class="app-card__meta">${C.UI.escape(app.category)}</span>`;
              const cardClass =
                "app-card glass hub-card" +
                (app.trust === "caution" ? " app-card--caution" : "");
              return (
                `<button type="button" class="${cardClass}" data-app="${app.id}" data-label="${C.UI.escape(app.name)}" aria-label="${C.UI.escape(app.name)}">` +
                caution +
                `<span class="app-card__icon" aria-hidden="true">${app.icon}</span>` +
                `<span class="app-card__name">${C.UI.escape(app.name)}</span>` +
                note +
                `</button>`
              );
            })
            .join("");
          return (
            `<section class="hub-section" data-section="${C.UI.escape(sec.id)}" aria-labelledby="hub-${C.UI.escape(sec.id)}">` +
            `<div class="hub-section__head">` +
            `<h3 class="hub-section__title" id="hub-${C.UI.escape(sec.id)}">${C.UI.escape(sec.title)}</h3>` +
            `<p class="hub-section__blurb">${C.UI.escape(sec.blurb)}</p>` +
            `</div>` +
            `<div class="hub-row" role="list">${cards}</div>` +
            `</section>`
          );
        })
        .join("");

      this.body.innerHTML =
        html ||
        '<p class="empty-state">No entertainment services are available.</p>';

      this._cards = Array.from(this.body.querySelectorAll(".hub-card"));
      this._cards.forEach((card) => {
        card.addEventListener("click", () => this._open(card.dataset.app));
      });
      this._rebuildFocusables();
    },

    _rebuildFocusables() {
      const list = [];
      if (this.backBtn) list.push(this.backBtn);
      list.push(...this._cards);
      this.focusables = list;
    },

    setFocus(index) {
      if (!this.focusables.length) return;
      this.focusIndex = Math.max(0, Math.min(index, this.focusables.length - 1));
      this._syncFocus();
      const el = this.focusables[this.focusIndex];
      if (el) {
        el.focus({ preventScroll: true });
        if (el.scrollIntoView) {
          el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        }
      }
    },

    _syncFocus() {
      this.focusables.forEach((el, i) => {
        el.classList.toggle("is-focused", i === this.focusIndex);
        el.tabIndex = i === this.focusIndex ? 0 : -1;
      });
    },

    async _open(appId) {
      C.UI.playClick();
      const result = await C.Launcher.launch(appId);
      if (!result.ok) {
        C.UI.toast(result.message || "Unable to open", { tone: "warn" });
      }
    },

    _activate() {
      const el = this.focusables[this.focusIndex];
      if (!el) return;
      if (el === this.backBtn) {
        C.Router.go("home", {}, { replace: true });
        return;
      }
      if (el.dataset && el.dataset.app) {
        this._open(el.dataset.app);
      }
    },

    move(dx, dy) {
      const el = this.focusables[this.focusIndex];
      if (!el) return;

      if (el === this.backBtn) {
        if (dy > 0 && this._cards.length) {
          this.setFocus(this.focusables.indexOf(this._cards[0]));
        } else if (dx) {
          /* stay on back */
        }
        return;
      }

      const cards = this._cards;
      const idx = cards.indexOf(el);
      if (idx < 0) return;

      const cols = COLS();
      // Group cards by section for vertical jumps
      const sections = Array.from(
        this.body ? this.body.querySelectorAll(".hub-section") : []
      );
      let sectionCards = cards;
      let localIndex = idx;
      let sectionEl = null;
      for (const sec of sections) {
        const inSec = Array.from(sec.querySelectorAll(".hub-card"));
        const li = inSec.indexOf(el);
        if (li >= 0) {
          sectionCards = inSec;
          localIndex = li;
          sectionEl = sec;
          break;
        }
      }

      if (dx) {
        const nextLocal = localIndex + dx;
        if (nextLocal >= 0 && nextLocal < sectionCards.length) {
          this.setFocus(this.focusables.indexOf(sectionCards[nextLocal]));
          return;
        }
        // Cross into adjacent section horizontally at edges: wrap within section
        return;
      }

      if (dy < 0) {
        if (!sectionEl) {
          this.setFocus(this.focusables.indexOf(this.backBtn));
          return;
        }
        const secIdx = sections.indexOf(sectionEl);
        if (secIdx <= 0) {
          this.setFocus(this.focusables.indexOf(this.backBtn));
          return;
        }
        const prevCards = Array.from(
          sections[secIdx - 1].querySelectorAll(".hub-card")
        );
        if (!prevCards.length) {
          this.setFocus(this.focusables.indexOf(this.backBtn));
          return;
        }
        const target = prevCards[Math.min(localIndex, prevCards.length - 1)];
        this.setFocus(this.focusables.indexOf(target));
        return;
      }

      if (dy > 0) {
        if (!sectionEl) return;
        const secIdx = sections.indexOf(sectionEl);
        if (secIdx < 0 || secIdx >= sections.length - 1) return;
        const nextCards = Array.from(
          sections[secIdx + 1].querySelectorAll(".hub-card")
        );
        if (!nextCards.length) return;
        const target = nextCards[Math.min(localIndex, nextCards.length - 1)];
        this.setFocus(this.focusables.indexOf(target));
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
          this._activate();
          return true;
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

  C.Entertainment = Entertainment;
})(typeof window !== "undefined" ? window : globalThis);

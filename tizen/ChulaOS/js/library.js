/**
 * Chula OS — All Apps library (search, categories, recent, favorites)
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;
  const COLS = () => C.CONFIG.libraryCols;

  const Library = {
    el: null,
    focusables: [],
    focusIndex: 0,
    category: "All",
    query: "",
    _ready: false,

    init() {
      this.el = document.getElementById("library");
      if (!this.el) return;
      this.grid = document.getElementById("library-grid");
      this.cats = document.getElementById("library-cats");
      this.search = document.getElementById("library-search");
      this.empty = document.getElementById("library-empty");
      this.backBtn = document.getElementById("library-back");

      if (this.backBtn) {
        this.backBtn.addEventListener("click", () => C.Router.go("home"));
      }
      if (this.search) {
        this.search.addEventListener("input", () => {
          this.query = this.search.value;
          this.renderGrid();
        });
      }
      this._ready = true;
    },

    onEnter(params) {
      if (!this._ready) this.init();
      this.category = "All";
      this.query = "";
      if (this.search) this.search.value = "";
      this.renderCategories();
      this.renderGrid();
      if (params && params.focusSearch === "1" && this.search) {
        this.search.focus();
        this.focusIndex = this.focusables.indexOf(this.search);
        this._syncFocus();
      } else {
        this.focusIndex = 0;
        this._rebuildFocusables();
        this.setFocus(0);
      }
    },

    renderCategories() {
      if (!this.cats) return;
      const cats = C.Registry.categories();
      this.cats.innerHTML = cats
        .map(
          (c) =>
            `<button type="button" class="chip${c === this.category ? " is-active" : ""}" data-cat="${C.UI.escape(c)}">${C.UI.escape(c)}</button>`
        )
        .join("");
      this.cats.querySelectorAll(".chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          this.category = chip.dataset.cat;
          this.renderCategories();
          this.renderGrid();
          this._rebuildFocusables();
          this.setFocus(Math.max(0, this.focusables.indexOf(chip)));
        });
      });
    },

    renderGrid() {
      if (!this.grid) return;
      const apps = C.Registry.search(this.query, this.category);
      if (!apps.length) {
        this.grid.innerHTML = "";
        if (this.empty) this.empty.hidden = false;
      } else {
        if (this.empty) this.empty.hidden = true;
        this.grid.innerHTML = apps
          .map((app) => {
            const fav = C.Storage.isFavorite(app.id)
              ? '<span class="app-card__fav" aria-label="Favorite">★</span>'
              : "";
            const caution =
              app.trust === "caution"
                ? '<span class="app-card__caution" aria-label="Caution">Caution</span>'
                : "";
            const cardClass =
              "app-card glass" + (app.trust === "caution" ? " app-card--caution" : "");
            return (
              `<button type="button" class="${cardClass}" data-app="${app.id}" data-label="${C.UI.escape(app.name)}">` +
              `<span class="app-card__icon" aria-hidden="true">${app.icon}</span>` +
              `<span class="app-card__name">${C.UI.escape(app.name)}</span>` +
              `<span class="app-card__meta">${C.UI.escape(app.category)}</span>` +
              caution +
              fav +
              `</button>`
            );
          })
          .join("");
        this.grid.querySelectorAll(".app-card").forEach((card) => {
          card.addEventListener("click", () => this._open(card.dataset.app));
          card.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            C.Storage.toggleFavorite(card.dataset.app);
            this.renderGrid();
            this._rebuildFocusables();
            C.UI.toast("Favorites updated");
          });
        });
      }
      this._rebuildFocusables();
    },

    _rebuildFocusables() {
      const list = [];
      if (this.backBtn) list.push(this.backBtn);
      if (this.search) list.push(this.search);
      if (this.cats) list.push(...this.cats.querySelectorAll(".chip"));
      if (this.grid) list.push(...this.grid.querySelectorAll(".app-card"));
      this.focusables = list;
    },

    setFocus(index) {
      if (!this.focusables.length) return;
      this.focusIndex = Math.max(0, Math.min(index, this.focusables.length - 1));
      this._syncFocus();
      const el = this.focusables[this.focusIndex];
      if (el) el.focus({ preventScroll: true });
    },

    _syncFocus() {
      this.focusables.forEach((el, i) => {
        el.classList.toggle("is-focused", i === this.focusIndex);
        if (el.tagName === "BUTTON" || el.tagName === "INPUT") {
          el.tabIndex = i === this.focusIndex ? 0 : -1;
        }
      });
    },

    async _open(appId) {
      C.UI.playClick();
      const result = await C.Launcher.launch(appId);
      if (!result.ok) C.UI.toast(result.message || "Unable to open", { tone: "warn" });
    },

    _activate() {
      const el = this.focusables[this.focusIndex];
      if (!el) return;
      if (el === this.backBtn) {
        C.Router.go("home");
        return;
      }
      if (el === this.search) {
        this.search.focus();
        return;
      }
      if (el.dataset && el.dataset.cat) {
        this.category = el.dataset.cat;
        this.renderCategories();
        this.renderGrid();
        this._rebuildFocusables();
        return;
      }
      if (el.dataset && el.dataset.app) {
        this._open(el.dataset.app);
      }
    },

    move(dx, dy) {
      const el = this.focusables[this.focusIndex];
      if (!el) return;

      // Grid movement among app cards
      const cards = Array.from(this.grid ? this.grid.querySelectorAll(".app-card") : []);
      const cardIndex = cards.indexOf(el);
      if (cardIndex >= 0 && (dx || dy)) {
        const cols = COLS();
        let col = cardIndex % cols;
        let row = Math.floor(cardIndex / cols);
        const rows = Math.ceil(cards.length / cols);

        if (dy < 0 && row === 0) {
          // jump to chips / search / back
          const chips = Array.from(this.cats ? this.cats.querySelectorAll(".chip") : []);
          if (chips.length) {
            this.setFocus(this.focusables.indexOf(chips[Math.min(col, chips.length - 1)]));
          } else if (this.search) {
            this.setFocus(this.focusables.indexOf(this.search));
          }
          return;
        }

        col = Math.max(0, Math.min(cols - 1, col + dx));
        row = Math.max(0, Math.min(rows - 1, row + dy));
        let next = row * cols + col;
        if (next >= cards.length) next = cards.length - 1;
        this.setFocus(this.focusables.indexOf(cards[next]));
        return;
      }

      // Linear among chrome
      if (dx) {
        this.setFocus(this.focusIndex + dx);
        return;
      }
      if (dy > 0) {
        if (cards.length) this.setFocus(this.focusables.indexOf(cards[0]));
        else this.setFocus(this.focusIndex + 1);
      } else if (dy < 0) {
        this.setFocus(this.focusIndex - 1);
      }
    },

    handleKey(e) {
      const typing =
        e.target === this.search ||
        (e.target && e.target.tagName === "INPUT");

      if (typing && !["ArrowDown", "ArrowUp", "Escape", "Enter"].includes(e.key)) {
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
          e.preventDefault();
          this._activate();
          return true;
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
          if (typing && this.search && this.search.value) {
            this.search.value = "";
            this.query = "";
            this.renderGrid();
            return true;
          }
          e.preventDefault();
          C.Router.go("home", {}, { replace: true });
          return true;
        case "Home":
        case "BrowserHome":
          e.preventDefault();
          C.Router.go("home");
          return true;
        case "f":
        case "F":
          if (!typing && !e.metaKey && !e.ctrlKey) {
            const el = this.focusables[this.focusIndex];
            if (el && el.dataset && el.dataset.app) {
              e.preventDefault();
              C.Storage.toggleFavorite(el.dataset.app);
              this.renderGrid();
              this._rebuildFocusables();
              C.UI.toast("Favorites updated");
              return true;
            }
          }
          return false;
        default:
          return false;
      }
    },
  };

  C.Library = Library;
})(typeof window !== "undefined" ? window : globalThis);

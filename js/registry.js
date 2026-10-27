/**
 * Chula OS — centralized application registry
 * Launch methods are legitimate web destinations or user-configured URLs.
 * No proprietary packages, DRM bypass, or unauthorized streams.
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS;

  const ICONS = {
    stremio:
      '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="2"/><path d="M20 16l14 8-14 8V16z" fill="currentColor"/></svg>',
    youtube:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="6" stroke="currentColor" stroke-width="2"/><path d="M21 18l12 6-12 6V18z" fill="currentColor"/></svg>',
    netflix:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="8" width="28" height="32" rx="3" stroke="currentColor" stroke-width="2"/><path d="M18 12v24M30 12v24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    disney:
      '<svg viewBox="0 0 48 48" fill="none"><path d="M8 30c6-10 26-10 32 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 22c4-6 16-6 20 0M18 16c2.5-3.5 9.5-3.5 12 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="34" r="2" fill="currentColor"/></svg>',
    prime:
      '<svg viewBox="0 0 48 48" fill="none"><path d="M10 28c8 8 20 8 28 0" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M16 18h16M20 14v12M28 14v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    appletv:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" stroke-width="2"/><path d="M24 8v4M18 40h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 20c0-2 1.5-3.5 3.5-3.5S28 18.5 28 20.5 25 26 24 28c-1-2-4-5.5-4-8z" fill="currentColor"/></svg>',
    iptv:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="10" width="36" height="24" rx="3" stroke="currentColor" stroke-width="2"/><path d="M16 42h16M24 34v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 18h8M14 24h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    allapps:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="10" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="28" y="10" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="10" y="28" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="28" y="28" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/></svg>',
    settings:
      '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2"/><path d="M24 8v4M24 36v4M8 24h4M36 24h4M12.5 12.5l2.8 2.8M32.7 32.7l2.8 2.8M12.5 35.5l2.8-2.8M32.7 15.3l2.8-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    browser:
      '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2"/><path d="M8 24h32M24 8c4 5 6 10 6 16s-2 11-6 16c-4-5-6-10-6-16s2-11 6-16z" stroke="currentColor" stroke-width="2"/></svg>',
  };

  /**
   * @typedef {Object} AppEntry
   * @property {string} id
   * @property {string} name
   * @property {string} category
   * @property {string} icon
   * @property {'url'|'route'|'iptv'|'system'} launch
   * @property {string} [url]
   * @property {string} [androidIntent]
   * @property {string} [route]
   * @property {boolean} homeTile
   * @property {string} description
   * @property {boolean} [requiresConfig]
   * @property {boolean} [requiresOnline]
   */

  /** @type {AppEntry[]} */
  const APPS = [
    {
      id: "stremio",
      name: "Stremio",
      category: "Streaming",
      icon: ICONS.stremio,
      launch: "url",
      url: "https://web.stremio.com/",
      homeTile: true,
      requiresOnline: true,
      description: "Open the official Stremio web app in your browser.",
    },
    {
      id: "youtube",
      name: "YouTube",
      category: "Streaming",
      icon: ICONS.youtube,
      launch: "url",
      url: "https://www.youtube.com/tv",
      androidIntent: "https://www.youtube.com/tv",
      homeTile: true,
      requiresOnline: true,
      description: "Open YouTube TV in your browser. A Google account may be required.",
    },
    {
      id: "netflix",
      name: "Netflix",
      category: "Streaming",
      icon: ICONS.netflix,
      launch: "url",
      url: "https://www.netflix.com/",
      homeTile: true,
      requiresOnline: true,
      description: "Open Netflix. Requires an active Netflix subscription and internet.",
    },
    {
      id: "disney",
      name: "Disney+",
      category: "Streaming",
      icon: ICONS.disney,
      launch: "url",
      url: "https://www.disneyplus.com/",
      homeTile: true,
      requiresOnline: true,
      description: "Open Disney+. Requires a Disney+ subscription and internet.",
    },
    {
      id: "prime",
      name: "Prime Video",
      category: "Streaming",
      icon: ICONS.prime,
      launch: "url",
      url: "https://www.primevideo.com/",
      homeTile: true,
      requiresOnline: true,
      description: "Open Amazon Prime Video. Requires an Amazon account and internet.",
    },
    {
      id: "appletv",
      name: "Apple TV",
      category: "Streaming",
      icon: ICONS.appletv,
      launch: "url",
      url: "https://tv.apple.com/",
      homeTile: true,
      requiresOnline: true,
      description: "Open Apple TV+. Requires an Apple account and internet.",
    },
    {
      id: "iptv",
      name: "IPTV",
      category: "Live TV",
      icon: ICONS.iptv,
      launch: "iptv",
      homeTile: true,
      requiresConfig: true,
      requiresOnline: true,
      description:
        "Opens your configured IPTV web player URL. Configure a legitimate HTTPS URL in Settings. Chula OS does not provide streams or playlists.",
    },
    {
      id: "allapps",
      name: "All Apps",
      category: "System",
      icon: ICONS.allapps,
      launch: "route",
      route: "library",
      homeTile: true,
      requiresOnline: false,
      description: "Browse the full Chula OS application library.",
    },
    {
      id: "settings",
      name: "Settings",
      category: "System",
      icon: ICONS.settings,
      launch: "route",
      route: "settings",
      homeTile: false,
      requiresOnline: false,
      description: "Chula OS preferences and about information.",
    },
    {
      id: "browser",
      name: "Web Browser",
      category: "Tools",
      icon: ICONS.browser,
      launch: "url",
      url: "https://www.wikipedia.org/",
      homeTile: false,
      requiresOnline: true,
      description: "Open a simple starting page in the system browser.",
    },
  ];

  const Registry = {
    icons: ICONS,

    all() {
      return APPS.slice();
    },

    get(id) {
      return APPS.find((a) => a.id === id) || null;
    },

    homeTiles() {
      const hidden = new Set(C.Storage.get().hiddenApps || []);
      return APPS.filter((a) => a.homeTile && !hidden.has(a.id));
    },

    categories() {
      const set = new Set(APPS.map((a) => a.category));
      return ["All", "Recent", "Favorites"].concat(
        Array.from(set).sort()
      );
    },

    search(query, category) {
      const q = (query || "").trim().toLowerCase();
      const prefs = C.Storage.get();
      const hidden = new Set(prefs.hiddenApps || []);
      let list = APPS.filter((a) => !hidden.has(a.id));

      if (category === "Recent") {
        list = prefs.recent
          .map((id) => this.get(id))
          .filter(Boolean)
          .filter((a) => !hidden.has(a.id));
      } else if (category === "Favorites") {
        list = prefs.favorites
          .map((id) => this.get(id))
          .filter(Boolean)
          .filter((a) => !hidden.has(a.id));
      } else if (category && category !== "All") {
        list = list.filter((a) => a.category === category);
      }

      if (q) {
        list = list.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q)
        );
      }
      return list;
    },
  };

  C.Registry = Registry;
})(typeof window !== "undefined" ? window : globalThis);

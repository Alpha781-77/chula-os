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
    plex:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="10" width="32" height="28" rx="4" stroke="currentColor" stroke-width="2"/><path d="M18 16l14 8-14 8V16z" fill="currentColor"/></svg>',
    dstv:
      '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2"/><path d="M16 28c2.5-6 13.5-6 16 0M20 20c1.2-2.5 6.8-2.5 8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="24" cy="18" r="2.5" fill="currentColor"/></svg>',
    iptv:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="10" width="36" height="24" rx="3" stroke="currentColor" stroke-width="2"/><path d="M16 42h16M24 34v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 18h8M14 24h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    entertainment:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="6" y="14" width="36" height="22" rx="3" stroke="currentColor" stroke-width="2"/><path d="M14 40h20M24 36v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 22h8M14 28h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    allapps:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="10" y="10" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="28" y="10" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="10" y="28" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><rect x="28" y="28" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/></svg>',
    settings:
      '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="6" stroke="currentColor" stroke-width="2"/><path d="M24 8v4M24 36v4M8 24h4M36 24h4M12.5 12.5l2.8 2.8M32.7 32.7l2.8 2.8M12.5 35.5l2.8-2.8M32.7 15.3l2.8-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    browser:
      '<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="16" stroke="currentColor" stroke-width="2"/><path d="M8 24h32M24 8c4 5 6 10 6 16s-2 11-6 16c-4-5-6-10-6-16s2-11 6-16z" stroke="currentColor" stroke-width="2"/></svg>',
    cinejoy:
      '<svg viewBox="0 0 48 48" fill="none"><rect x="8" y="12" width="32" height="24" rx="3" stroke="currentColor" stroke-width="2"/><path d="M14 12v24M34 12v24M8 20h32M8 28h32" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="24" r="5" stroke="currentColor" stroke-width="2"/></svg>',
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
   * @property {string} [hubNote] Short line shown in Entertainment hub cards
   * @property {boolean} [requiresConfig]
   * @property {boolean} [requiresOnline]
   * @property {string} [tizenAppId] Confirmed ID only when verified on device
   * @property {string[]} [tizenAppIdAliases] Unverified fallbacks — used only if installed
   * @property {string[]} [matchNames] Extra display names for safe exact matching
   * @property {'normal'|'caution'} [trust] caution = optional external HTTPS; not trusted/native
   */

  /** @type {AppEntry[]} */
  const APPS = [
    {
      id: "entertainment",
      name: "Entertainment",
      category: "System",
      icon: ICONS.entertainment,
      launch: "route",
      route: "entertainment",
      homeTile: true,
      requiresOnline: false,
      description: "Movies, sports, and external websites in one remote-friendly hub.",
    },
    {
      id: "youtube",
      name: "YouTube",
      category: "Movies & TV",
      icon: ICONS.youtube,
      launch: "url",
      url: "https://www.youtube.com/tv",
      androidIntent: "https://www.youtube.com/tv",
      // Alias only — used if getAppsInfo shows this ID installed
      tizenAppIdAliases: ["9Ur5IzDKqV.TizenYouTube"],
      matchNames: ["YouTube", "YouTube TV"],
      homeTile: false,
      requiresOnline: true,
      hubNote: "Native app if installed · else YouTube TV site",
      description:
        "Launches the installed YouTube TV app when discovered on this TV; otherwise opens the official YouTube TV HTTPS page. A Google account may be required.",
    },
    {
      id: "netflix",
      name: "Netflix",
      category: "Movies & TV",
      icon: ICONS.netflix,
      launch: "url",
      url: "https://www.netflix.com/",
      tizenAppIdAliases: ["org.tizen.netflix-app"],
      matchNames: ["Netflix"],
      homeTile: false,
      requiresOnline: true,
      hubNote: "Native app if installed · else official site",
      description: "Open Netflix. Requires an active Netflix subscription and internet.",
    },
    {
      id: "disney",
      name: "Disney+",
      category: "Movies & TV",
      icon: ICONS.disney,
      launch: "url",
      url: "https://www.disneyplus.com/",
      matchNames: ["Disney+", "Disney Plus"],
      homeTile: false,
      requiresOnline: true,
      hubNote: "Native app if installed · else official site",
      description: "Open Disney+. Requires a Disney+ subscription and internet.",
    },
    {
      id: "prime",
      name: "Prime Video",
      category: "Movies & TV",
      icon: ICONS.prime,
      launch: "url",
      url: "https://www.primevideo.com/",
      matchNames: ["Prime Video", "Amazon Prime Video"],
      homeTile: false,
      requiresOnline: true,
      hubNote: "Native app if installed · else official site",
      description: "Open Amazon Prime Video. Requires an Amazon account and internet.",
    },
    {
      id: "appletv",
      name: "Apple TV",
      category: "Movies & TV",
      icon: ICONS.appletv,
      launch: "url",
      url: "https://tv.apple.com/",
      matchNames: ["Apple TV", "Apple TV+", "AppleTV"],
      homeTile: false,
      requiresOnline: true,
      hubNote: "Native app if installed · else official site",
      description: "Open Apple TV+. Requires an Apple account and internet.",
    },
    {
      id: "stremio",
      name: "Stremio",
      category: "Movies & TV",
      icon: ICONS.stremio,
      launch: "url",
      url: "https://web.stremio.com/",
      homeTile: false,
      requiresOnline: true,
      hubNote: "Official Stremio web app",
      description: "Open the official Stremio web app in your browser.",
    },
    {
      id: "plex",
      name: "Plex",
      category: "Movies & TV",
      icon: ICONS.plex,
      launch: "url",
      // Official Plex site — website is not the full Samsung TV app experience
      url: "https://www.plex.tv/",
      matchNames: ["Plex"],
      homeTile: false,
      requiresOnline: true,
      hubNote: "Samsung TV app if installed · else plex.tv (not full TV app)",
      description:
        "Launches the installed Plex Samsung TV app when discovered on this set. Otherwise opens the official Plex website (plex.tv). The website is not the full native Samsung TV experience — install Plex from Samsung Apps for the complete TV client. A Plex account may be required.",
    },
    {
      id: "dstv",
      name: "DStv Stream",
      category: "Football & Sports",
      icon: ICONS.dstv,
      launch: "url",
      url: "https://www.dstv.com/en-ke/",
      matchNames: ["DStv", "DStv Stream", "SuperSport", "DStv Streaming"],
      homeTile: false,
      requiresOnline: true,
      hubNote: "Official DStv Kenya site · native only if installed",
      description:
        "Opens the official DStv Kenya website. If a DStv / DStv Stream / SuperSport app is installed and identified on this TV, that native app is preferred. Opening the website does not guarantee live SuperSport or other streams will play in the TV browser — a DStv subscription and compatible player/app are required.",
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
      tizenAppIdAliases: ["org.tizen.browser"],
      matchNames: ["Internet", "Browser", "Web Browser"],
      homeTile: false,
      requiresOnline: true,
      description: "Open a simple starting page in the system browser.",
    },
    {
      id: "cinejoy",
      name: "Cinejoy",
      category: "External Websites",
      icon: ICONS.cinejoy,
      launch: "url",
      url: "https://cinejoy.pk/",
      homeTile: false,
      requiresOnline: true,
      trust: "caution",
      hubNote: "Caution · confirm before open",
      description:
        "Optional external HTTPS site (not a trusted/native Chula app). Security tools may flag cinejoy.pk. Chula OS cannot control redirects or ads inside the TV browser. Opens only after you confirm.",
    },
  ];

  /** Ordered Entertainment hub sections (category id → display). */
  const ENTERTAINMENT_SECTIONS = [
    {
      id: "Movies & TV",
      title: "Movies & TV",
      blurb: "Streaming apps and official sites. Native launch when the TV app is installed.",
    },
    {
      id: "Football & Sports",
      title: "Football & Sports",
      blurb: "Official sports and subscription destinations. Live play needs the right app and account.",
    },
    {
      id: "External Websites",
      title: "External Websites",
      blurb: "Unverified external HTTPS links. Caution entries ask before leaving Chula OS.",
    },
  ];

  const Registry = {
    icons: ICONS,
    entertainmentSections: ENTERTAINMENT_SECTIONS,

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

    byCategory(category) {
      const hidden = new Set(C.Storage.get().hiddenApps || []);
      return APPS.filter((a) => a.category === category && !hidden.has(a.id));
    },

    categories() {
      const set = new Set(APPS.map((a) => a.category));
      return ["All", "Recent", "Favorites"].concat(Array.from(set).sort());
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

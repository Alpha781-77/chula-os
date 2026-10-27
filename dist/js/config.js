/**
 * Chula OS — product configuration
 */
(function (global) {
  "use strict";

  global.ChulaOS = global.ChulaOS || {};

  global.ChulaOS.CONFIG = Object.freeze({
    name: "Chula OS",
    version: "1.0.0",
    build: "2026.10.27",
    platform: "web-tv-launcher",
    origin: "Proudly made in Kenya 🇰🇪",
    storageKey: "chulaos.prefs.v1",
    recentLimit: 12,
    bootMs: 6800,
    bootExitMs: 1150,
    toastMs: 2800,
    launchDelayMs: 700,
    homeTileCols: 8,
    libraryCols: 4,
    allowedUrlProtocols: Object.freeze(["https:", "http:"]),
  });
})(typeof window !== "undefined" ? window : globalThis);

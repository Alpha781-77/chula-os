/**
 * Chula OS — Samsung Tizen TV bridge
 * No-ops on browsers / PWA. On Tizen: remote keys, safe exit, URL launch.
 */
(function (global) {
  "use strict";

  const C = global.ChulaOS || (global.ChulaOS = {});

  const KEY = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ENTER: 13,
    BACK: 10009, // Samsung Tizen Back
    EXIT: 10182, // long-press Back / Exit on some remotes
    MEDIA_PLAY_PAUSE: 10252,
    COLOR_RED: 403,
    COLOR_GREEN: 404,
    COLOR_YELLOW: 405,
    COLOR_BLUE: 406,
  };

  // Known installed-app IDs vary by region/year — best-effort only
  const NATIVE_APP_IDS = {
    youtube: [
      "9Ur5IzDKqV.TizenYouTube",
      "org.tizen.browser",
    ],
    netflix: ["org.tizen.netflix-app"],
    // Others intentionally omitted when unreliable across U6000F firmware variants
  };

  const TizenBridge = {
    KEY,
    isTizen: false,
    ready: false,

    init() {
      this.isTizen =
        typeof global.tizen !== "undefined" &&
        !!(global.tizen && global.tizen.application);

      if (!this.isTizen) {
        this.ready = true;
        return;
      }

      document.documentElement.classList.add("is-tizen");
      this._registerKeys();
      this.ready = true;
      console.info("[ChulaOS] Tizen bridge active");
    },

    _registerKeys() {
      try {
        if (!tizen.tvinputdevice) return;
        // Mandatory keys are automatic; register useful extras when present
        const extras = [
          "MediaPlayPause",
          "ColorF0Red",
          "ColorF1Green",
          "ColorF2Yellow",
          "ColorF3Blue",
          "ChannelUp",
          "ChannelDown",
        ];
        if (typeof tizen.tvinputdevice.registerKeyBatch === "function") {
          try {
            tizen.tvinputdevice.registerKeyBatch(extras);
          } catch (_) {
            extras.forEach((name) => {
              try {
                tizen.tvinputdevice.registerKey(name);
              } catch (__) {}
            });
          }
        } else {
          extras.forEach((name) => {
            try {
              tizen.tvinputdevice.registerKey(name);
            } catch (_) {}
          });
        }
      } catch (err) {
        console.warn("[ChulaOS] tvinputdevice register failed", err);
      }
    },

    /**
     * Open an HTTPS URL via Tizen ApplicationControl (preferred on TV).
     */
    openUrl(url, appMeta) {
      return new Promise((resolve) => {
        if (!this.isTizen) {
          resolve({ ok: false, message: "Not running on Tizen." });
          return;
        }

        const tryNative = () => {
          const ids = (appMeta && NATIVE_APP_IDS[appMeta.id]) || [];
          const next = (i) => {
            if (i >= ids.length) {
              tryControl();
              return;
            }
            try {
              tizen.application.launch(
                ids[i],
                () => resolve({ ok: true, action: "native-app" }),
                () => next(i + 1)
              );
            } catch (_) {
              next(i + 1);
            }
          };
          next(0);
        };

        const tryControl = () => {
          try {
            const control = new tizen.ApplicationControl(
              "http://tizen.org/appcontrol/operation/view",
              url,
              null,
              null
            );
            tizen.application.launchAppControl(
              control,
              null,
              () => resolve({ ok: true, action: "appcontrol" }),
              (err) => {
                console.warn("[ChulaOS] AppControl failed", err);
                resolve({
                  ok: false,
                  message:
                    "This TV could not open the streaming site from Chula OS. Open the official app from Smart Hub, or try again when the browser/app is installed.",
                });
              }
            );
          } catch (err) {
            resolve({
              ok: false,
              message:
                "External launch is not available on this firmware. Use Smart Hub for that service.",
            });
          }
        };

        tryNative();
      });
    },

    getNetworkConnected() {
      try {
        if (typeof webapis !== "undefined" && webapis.network) {
          return !!webapis.network.isConnectedToGateway();
        }
      } catch (_) {}
      return navigator.onLine !== false;
    },

    getModelHint() {
      try {
        if (typeof webapis !== "undefined" && webapis.productinfo) {
          return {
            model: webapis.productinfo.getModel(),
            firmware: webapis.productinfo.getFirmware(),
          };
        }
      } catch (_) {}
      return null;
    },

    exitApp() {
      try {
        const app = tizen.application.getCurrentApplication();
        app.exit();
      } catch (err) {
        console.warn("[ChulaOS] exit failed", err);
      }
    },
  };

  C.Tizen = TizenBridge;
})(typeof window !== "undefined" ? window : globalThis);

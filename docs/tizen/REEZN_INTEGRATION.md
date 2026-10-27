# Reezn / R Player — Chula OS integration status

**Status:** Research complete; **integration not implemented** (blocked on official binary / identity).

Full notes:

- [`research/reezn/IDENTITY_AND_BLOCKER.md`](../../research/reezn/IDENTITY_AND_BLOCKER.md) — product identity, DNS/Play findings, why no APK was downloaded  
- [`research/reezn/FEASIBILITY_TIZEN.md`](../../research/reezn/FEASIBILITY_TIZEN.md) — Tizen port routes A/B/C and limitations  

The `research/` directory is **gitignored** and must never be packaged into the `.wgt` (sync/package scripts only copy the Tizen web tree under `tizen/ChulaOS/`).

When you provide a confirmed official APK or HTTPS web URL, integration can proceed under the existing launcher architecture without replacing Smart Hub or changing certificates.

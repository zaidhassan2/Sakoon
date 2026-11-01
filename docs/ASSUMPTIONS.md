# Assumptions & Technical Notes

1. **Helplines Dataset (`public/data/helplines.json`)**:
   - Because no external `helplines.json` attachment was present in the initial workspace file tree, `public/data/helplines.json` was created following the exact specified schema (`countries -> emergency, lines[], directory, lastVerified`) with `PK` (Pakistan) as the default country (`1122`, Umang Pakistan, Taskeen, Rozan), additional country entries (`GB`, `US`, `IN`, `CA`), `directory.url: "https://findahelpline.com"`, and archived entries with `"show": false` to verify that `show=false` entries never render.
2. **Safe Exit Destination (`Clear and leave`)**:
   - Configured in `public/js/config.js` as `safeExitUrl: "https://www.google.com"` and executed via `window.location.replace(...)` after wiping both `sessionStorage` and `localStorage`.
3. **Self-Hosted Open Font License Fonts (`public/fonts/`)**:
   - Subsetted `.woff2` files for `Figtree` (Latin), `Newsreader` (Latin), and `Noto Naskh Arabic` (Arabic/Urdu script) are self-hosted in `/public/fonts/` with `font-display: swap` and system font fallbacks so zero external CDN requests are made at runtime.
4. **First-Load Payload Budget**:
   - Excluding self-hosted `.woff2` font files, the entire initial HTML + CSS + ES module JavaScript + `helplines.json` payload is ~62 KB uncompressed (~18 KB gzipped), well under the `<= 150 KB` budget.

## Backend implementation (2026-10-31, Asia/Karachi)

- Deployment cleanup (2026-11-01): removed the unused React/Vite starter and its dependencies. `npm run dev` uses `scripts/server.mjs` with the real API. Browser mock mode is removed; fixtures live under `tests/fixtures/`.
- No real provider key is configured. Live model quality, free account access, and account-specific quotas remain unverified. Official Groq/Gemini model/API/rate-limit pages were consulted; links are in README and adapter comments. Public Gemini rate-limit docs direct owners to their active project quota, rather than promising a fixed universal free quota.
- Free-only operation requires free-tier accounts with billing disabled. The application cannot enforce account billing settings. Upstash is optional, explicitly interpreting its requested adapter as an exception to the no-database/no-third-party constraint. Only quota counters are stored.
- Crisis templates are used for all final crisis responses, providing predictable fallback text even on successful model calls. Earlier crisis follows the explicit elevated-floor contract. Stateless bounded history cannot preserve risk indefinitely.
- The system prompt is approximately 900 tokens based on its 3,335 characters; an exact model-specific token count needs live usage or a matching tokenizer. The capped 350 output tokens include reasoning and may truncate JSON, especially with Urdu; evaluation must quantify this before release.
- `vercel.json` selects static `public` plus root API functions without a build. Actual Vercel deployment is not verified. The Hobby maximum was checked in official documentation; chat uses 30 seconds.
- Native-speaker/clinician review, real-provider evaluation and frontend help-resource verification remain outstanding. Existing frontend helpline assumptions above are inherited, not verified by backend work.

# Sukoon backend

Node ES-module Vercel functions serving the static frontend in `public/`. The app uses Node built-ins and browser APIs with no npm dependencies. `npm run dev` starts the real API and frontend. The unused React/Vite starter and browser mock-chat mode have been removed; mock fixtures are test-only.

## Setup from zero

1. Install Node.js 22.x. Run `npm ci` to verify the dependency-free lockfile. `npm run lint` checks JavaScript syntax; `npm run build` copies the static frontend into `dist/` for artifact checks. Vercel serves `public/` directly and needs no build step.
2. Copy `.env.example` to `.env`. Obtain a free Groq key from [Groq Console](https://console.groq.com/keys), or a Gemini key from [AI Studio](https://aistudio.google.com/apikey). Keep billing disabled for a free-only deployment. Do not put keys in frontend files or variables starting with `VITE_`.
3. Set `GROQ_API_KEY`, keep `LLM_PROVIDER=groq` and `LLM_MODEL=openai/gpt-oss-120b`. Set a random `RATE_LIMIT_SECRET` using the command in `.env.example`. Never commit `.env`.
4. Run `npm run dev`; open `http://localhost:3000`. `GET /api/health` works without a key. Ordinary chat returns 503 without a working provider; detected crisis messages still receive a supportive 200 fallback.
5. Run `npm test`, `npm run contract-check`, then `npm run eval`. Evaluation prints responses to bundled synthetic fixtures only and takes about nineteen minutes at its default quota-safe pacing. Do not use it for real conversations. Missing credentials exit with code 2 rather than pretending evaluation passed.

## Deploy on Vercel Hobby

Create a GitHub repository and push the project without secrets. Import it into Vercel on the Hobby plan. Use the repository root, Framework Preset **Other**, Node 22, no build command, and output directory `public` as configured in `vercel.json`. Vercel discovers root `api/*.js` functions. Set the `.env.example` variables in Project Settings → Environment Variables, with `ALLOWED_ORIGIN=https://your-exact-domain` (no trailing slash); redeploy. Check `/api/health`, an ordinary synthetic message, and a synthetic crisis message after deployment. No deployment was performed as part of this implementation.

The chat function uses a 30-second maximum, with at most twenty seconds of provider work and a short optional limiter call. The [Vercel limits documentation](https://vercel.com/docs/functions/limitations) currently permits up to 300 seconds on Hobby with Fluid Compute. CSP restricts resources to self; the frontend fonts are already self-hosted. Hosting/platform rejection before a function executes cannot be converted into an application crisis fallback.

## Providers and quotas

Both adapters implement `generate({ system, messages, maxTokens, signal }) -> { text, usage }`. A single shared twenty-second budget allows one retry for timeout/5xx, never 429 or other 4xx. History is limited to twelve messages and output to 350 tokens, including reasoning. GPT-OSS reasoning effort is low. The system prompt includes the tone and safety rules; provider usage reports the actual token count.

Groq default `openai/gpt-oss-120b` is listed in the [current model catalogue](https://console.groq.com/docs/models). Its documented free limits at verification were 30 requests/minute, 1,000/day, 8,000 tokens/minute and 200,000/day; [account limits](https://console.groq.com/docs/rate-limits) take precedence. API format follows [OpenAI compatibility](https://console.groq.com/docs/openai), with [low reasoning effort](https://console.groq.com/docs/reasoning). The application request cap is not a token quota guarantee.

To compare Gemini, set `LLM_PROVIDER=gemini`, `LLM_MODEL=gemini-3.8-flash`, and `GEMINI_API_KEY`, then restart/redeploy and rerun evaluation. This model is listed in the [current Gemini catalogue](https://ai.google.dev/gemini-api/docs/models). The adapter uses [generateContent REST](https://ai.google.dev/api/generate-content), structured JSON and low thinking. Check [pricing/free eligibility](https://ai.google.dev/gemini-api/docs/pricing) and [your active project limits](https://ai.google.dev/gemini-api/docs/rate-limits); exact account quotas could not be verified without credentials. New projects should not assume older Gemini 2.5 access. Model changes need fresh evaluation; arbitrary models may reject reasoning/JSON parameters.

`EVAL_URL=https://your-domain/api/chat npm run eval` targets an existing endpoint. `EVAL_DELAY_MS` changes fixture pacing, but lowering it may hit application/provider quotas. The 36 fixtures check shape, length, formatting, banned phrases, minimum risk and heuristic language matching. Human review is still needed for empathy, clinical safety, subtle language, and diagnosis/medication claims.

## Privacy and rate limits

No conversation database, cookies, analytics, content logs or persistent transcripts are added. The provider receives the submitted conversation window. Runtime logs contain numeric input/output token counts only. No raw IP is stored; a daily HMAC-derived client key indexes quota counters. The default memory adapter is best effort per warm serverless instance: cold starts and horizontal scaling reset/distribute counters, so its global cap is not deployment-wide enforcement.

An optional Upstash REST adapter is used only when both Upstash variables and `RATE_LIMIT_SECRET` are set. It stores only hashed client/global counters with expiry, and checks/increments atomically. This is an explicit exception to the otherwise no-database/no-third-party-call requirement, requested for shared quota control. [Upstash's free plan](https://upstash.com/pricing/redis) currently lists 250 MB, 10 GB monthly bandwidth and 500K monthly commands. Leave the variables blank for strictly provider-only networking. If configured Redis fails, ordinary traffic fails closed with 500; crisis fallback remains available. Rate limits are fixed windows: twenty per ten minutes, one hundred per UTC day, eight hundred globally per UTC day by default.

Before launch, read the chosen provider's CURRENT data-use terms: [Groq data policy](https://console.groq.com/docs/your-data), [Gemini terms](https://ai.google.dev/gemini-api/terms), and [Gemini pricing/data-use table](https://ai.google.dev/gemini-api/docs/pricing). Some free tiers may use inputs to improve models. Tell users honestly that their text goes to the selected provider and what that provider retains/uses. Backend non-storage is not a promise of provider confidentiality. Review frontend storage and disclosures separately; this change does not modify them.

## Maintenance

To add a module, create `lib/modules/overthinking.js` exporting `id`, `systemPrompt`, and `fallbackTemplates` (`en`, `roman`, `ur`), then add its import/entry to the registry. Validation uses the registry automatically. Add module fixtures before enabling it in the frontend.

To rotate keys, create a replacement in the provider console, update Vercel environment variables and local `.env`, redeploy/restart, verify a synthetic request, then revoke the old key. Rotate `RATE_LIMIT_SECRET` similarly; this resets client quota identities. Never paste keys in chat or logs.

Read `docs/safety.md`, `docs/ASSUMPTIONS.md`, and `docs/test-results.md` for review boundaries and actual validation results.

## Response language

Replies and quick replies default to Roman Urdu (Urdu in Latin letters), including English greetings and crisis fallback messages, as requested by the owner. Input safety detection still covers English, Roman Urdu and Urdu script. API keys and enum values remain unchanged.

## Conversational tone

Roman Urdu replies use a familiar, respectful and emotionally attentive tone. The companion listens before suggesting an optional step, adapts to interests and preferences explicitly shared in the submitted history, and respects requests to vent or skip exercises. It does not infer hidden personality traits, invent memories, claim human feelings, or encourage exclusive attachment. Personalization lasts only within the supplied twelve-message window; no new storage is added.
# Sakoon

# Actual verification results

Run on 2026-10-31 (Asia/Karachi), Node v22.23.3. No real API credentials were available. No deployment or clinical validation is claimed.

## Unit tests

Command: `npm test`

```text
> node --test tests/*.test.js
ok 1 - tests/backend.test.js
# tests 1
# pass 1
# fail 0
```

This environment's isolated Node runner reports a file-level aggregate. Also ran `node tests/backend.test.js` to expose individual `node:test` results:

```text
1..32
# tests 32
# suites 0
# pass 32
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

Coverage includes validation, multilingual/indirect/negated/quoted/third-party detection, cumulative risk, output sanitation and contract shape, prompt-leak guard, memory quotas and daily hash rotation, atomic Redis request shape, provider adapters, retry deadlines, provider 429/503/timeouts, limiter failures, crisis fallbacks, CORS and privacy log checks. Upstash and LLM calls are mocked in these tests.

## HTTP contract checks

Command: `node scripts/contract-check.mjs`

Initial sandbox run could not bind a loopback socket (`listen EPERM`). Rerun with approved local-network execution succeeded, and a final rerun after safety changes also succeeded:

```text
Contract checks: 28 passed, 0 failed (local HTTP, mocked provider).
```

Checks use real local HTTP requests, both endpoints, input errors, CORS/preflight, response shapes, sanitization, ordinary provider errors and crisis fallbacks, limiter failure/denial, malformed model output and cumulative risk. They do not verify hosted Vercel behaviour or live provider quality.

## Real-provider evaluation

Command: `node --env-file-if-exists=.env scripts/eval.mjs`

```text
.env not found. Continuing without it.
BLOCKED: real-provider evaluation requires GROQ_API_KEY or EVAL_URL. 36 synthetic fixtures prepared; 0 evaluated. No mock results substituted.
```

Exit code 2. Set a free-provider key in local `.env` or set `EVAL_URL` for an already configured endpoint and rerun. Both provider/model combinations still need evaluation. The runner prints only responses to bundled synthetic fixtures and returns nonzero on failed automatic checks. Heuristic language checks can need human adjudication.

## Installation and deployment

Initial `npm install --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=15000` failed with `EAI_AGAIN` resolving the configured registry in the network-restricted sandbox. A network-enabled retry reached the registry but progressed slowly through the inherited frontend dependency graph; it was interrupted (exit 130), so installation is not verified. No new backend dependencies were added. The backend has no third-party runtime dependency; all checks above execute without installation.

No Vercel deploy, real Redis call, browser visual QA or clinician/native Urdu review was performed. Frontend files were not edited.

## Conversational tone follow-up

After updating the Roman Urdu tone instructions, `npm test` passed and direct `node:test` execution reported 32 passed, zero failed. Three synthetic requests through the local endpoint returned HTTP 200, source model, and heuristic Roman Urdu matches. The venting fixture returned no exercise; the drawing-interest fixture referenced that shared interest. No response content was logged. These spot checks do not substitute for the full 36-fixture evaluation or human tone/safety review.

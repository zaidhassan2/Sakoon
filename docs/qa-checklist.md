# Sukoon — QA Verification Checklist

Every item below was executed and verified against the running application in headless Chromium (`playwright-cli`) and via automated Node unit tests (`npx --yes tsx --test docs/logic-and-contrast.test.js`).

## 1. Viewport & Responsive Layout Matrix

| Viewport | Tested Scenarios | Result |
| :--- | :--- | :--- |
| **360 × 640** (Small Android) | Welcome screen initial load (`scrollHeight === 640`, `clientHeight === 640`, `scrollWidth === 360`). Zero vertical or horizontal scroll; Help button, 3 honest statements, Continue, and How this works all visible above the fold. | **PASS** |
| **360 × 800** (Budget Mobile) | Welcome screen (`.playwright-cli/r1-welcome-360x800.png`), Chat empty state, Help bottom sheet, Breathing exercise. All touch targets >= 44×44px, composer send button 48×48px. | **PASS** |
| **390 × 844** (Standard Mobile) | Chat conversation with Urdu script (`dir="auto"`), Crisis Care Card (`crisis-test`), Rate Limit inline error (`limit-test`), Dark theme empty state (`.playwright-cli/r1-empty-dark-390x844.png`). | **PASS** |
| **768 × 1024** (Tablet) | Centred dialog sheets (`max-width: 560px`), Dark theme + Largest text-size setting (`.playwright-cli/r1-dark-768x1024.png`), zero horizontal overflow (`scrollWidth: 768 === clientWidth: 768`). | **PASS** |
| **1280 × 800** (Desktop) | Chat column constrained to `max-inline-size: 720px` centred on warm paper background (`.playwright-cli/r1-chat-1280x800.png`); `Enter` sends message, `Shift+Enter` inserts newline. | **PASS** |

## 2. Accessibility, Themes & Environmental Conditions

| Check | How It Was Tested | Result |
| :--- | :--- | :--- |
| **Light & Dark Themes** | Verified System default, explicit Light (`data-theme="light"`), and explicit Dark (`data-theme="dark"`) via Options menu and programmatic contrast script (`docs/logic-and-contrast.test.js`). | **PASS** |
| **200% Zoom & Text Size (3 Steps)** | Tested `Standard`, `Larger` (`1.12x`), and `Largest` (`1.24x`) text sizes and 360px/768px widths; verified `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (no horizontal scroll). | **PASS** |
| **Keyboard-Only Navigation** | Verified `Skip to main content` link, `Tab` / `Shift+Tab` focus trap inside Help / How this works / Options sheets, and `Escape` key closing the active sheet and returning focus to the exact trigger button (`button "How this works" [active]`). | **PASS** |
| **Reduced Motion** | Tested both `@media (prefers-reduced-motion: reduce)` and the in-app Motion override (`Reduce`). Confirmed ambient background drift stops, message fade-in is disabled, and the breathing circle does not scale (`transform: scale(1)` with text & countdown only). | **PASS** |
| **Offline Mode & Service Worker** | Registered `/sw.js` (precaches shell, `.woff2` fonts, `/data/helplines.json`, and exercises; never caches `/api/*`). Dispatched `offline` event and verified the calm offline banner (`"You're offline. Exercises and help options still work."`) and offline exercises. | **PASS** |
| **Slow / Throttled Network** | Tested `slow-test` (2.5s latency); verified that the 3-dot typing indicator (`"Taking a moment"` SR text) appears only after `400ms` and that the composer textarea remains enabled while waiting. | **PASS** |

## 3. Mock API & Safety Scenarios (`?mock=1` & `/api/chat`)

| Scenario Trigger | Expected Behaviour | Verified Result |
| :--- | :--- | :--- |
| **Normal reply** | Returns plain-text reply, `suggestedExercise: "breathing"` dismissible card, and up to 3 quick-reply chips. | **PASS** |
| **Low energy (`low-energy-test`)** | `state: "low_energy"` renders at most 1 quick-reply chip, adds extra spacing, and hides the exercise card unless requested. Never displays `"low_energy"` in UI. | **PASS** |
| **Suggested exercises** | Tested `breathing`, `grounding` (`grounding-test`), and `brain_dump` (`brain-dump-test`) cards; tapping opens the exercise, `×` dismisses the card. Never auto-starts. | **PASS** |
| **Elevated safety (`elevated-test`)** | Renders quiet inline note under reply: *"If things feel heavy, there are people you can talk to."* + `[See support options]`. | **PASS** |
| **Crisis safety (`crisis-test`)** | Returns HTTP 200; renders warm amber Care Card (`#FFF1E3` / `#2A2118`, never red) with `tel:` buttons from `helplines.json` (`1122`, Umang, Taskeen, Rozan), *"I'll keep talking with you here."*, softly emphasises header `"Get help now"` button for rest of session, and keeps composer enabled. | **PASS** |
| **Rate limited (`limit-test`)** | HTTP 429 keeps the user's message with calm inline notice: *"Lots of people are here right now. You can try again in a minute, or breathe here while you wait."* + `[Breathing]` + `[Try again]`. | **PASS** |
| **Provider unavailable (`down-test`)** | HTTP 503 keeps the user's message with calm inline notice: *"I can't reach the server right now. The exercises still work, and help is always one tap away."* + `[Breathing]` + `[Try again]`. | **PASS** |
| **Roman Urdu (`roman-urdu-test`)** | Replies in natural Roman Urdu with Roman Urdu quick-reply chips (`Bohat thakan hai`, `Saans ki mashq`, `Bas sun lein`). | **PASS** |
| **Urdu script (`urdu-test`)** | Replies in Urdu script rendered with `Noto Naskh Arabic` and `dir="auto"` right-to-left alignment inside the bubble. | **PASS** |
| **Helplines filtering (`show=false`)** | Verified that `pk-unverified-legacy` (`0800-00000`, `show: false`) and `gb-inactive` (`show: false`) never render in the Help sheet or Care Card. | **PASS** |

# Sukoon — Trauma-Informed Design Notes

## 1. Core Design Philosophy: "Quiet Luxury Meets Warm Paper"

People opening Sukoon are often exhausted, overwhelmed, late at night on a budget Android phone, or worried about someone looking over their shoulder. Every visual, typographic, and interaction choice is designed to **remove cognitive load** and **restore a sense of agency**.

---

## 2. Design Tokens & Why Each Supports Low-Energy Users

### A. Colour Tokens (`css/styles.css`)

| Token | Light ("Warm Paper") | Dark ("Night Sanctuary") | Why It Supports Low-Energy / Stressed Users |
| :--- | :--- | :--- | :--- |
| `--color-bg` | `#F6F3EE` | `#0F1514` | Avoids clinical pure `#FFFFFF` glare and harsh `#000000` OLED halation/smearing late at night. Feels like an unbleached paper journal. |
| `--color-surface` | `#FCFBF8` | `#172120` | Soft elevation without stark white/black contrast shocks. Distinguishes assistant cards and sheets gently. |
| `--color-text` | `#1F2A2E` | `#E8EFED` | Deep slate-charcoal (Light) and mist-ivory (Dark) deliver >12:1 contrast for effortless reading with tired eyes, without harsh black-on-white vibration. |
| `--color-muted` | `#526167` | `#9FB0AC` | Secondary hints and timestamps remain clearly legible (>5.4:1 contrast) because "calm" must never mean squinting at faint grey text. |
| `--color-primary` | `#2D665F` | `#84C7BA` | Grounded botanical sage-teal. Avoids hospital blue and gamified neon purple/green. Tested to exceed 4.5:1 both as text on warm paper and against button text. |
| `--color-primary-soft` | `#DCEBE7` | `#1F3330` | Used for the breathing circle, gentle exercise highlights, and selected chips—provides clear non-colour-alone state feedback (`aria-pressed` + 2px border). |
| `--color-user-bubble` | `#EFE7DA` | `#24302D` | Warm sand/stone tone makes the user's own words feel held in a private journal rather than an instant-messaging app. |
| `--color-care-bg` | `#FFF1E3` | `#2A2118` | Warm amber-honey tint for the Crisis Care Card and persistent Help button. Communicates warmth and human care without alarming saturated red. |
| `--color-care-border` | `#B3773B` | `#C4925A` | Exceeds 3:1 non-text UI contrast against `--color-care-bg` so crisis support boundaries are immediately scannable. |
| `--color-care-text` | `#4A2F12` | `#F7E6D4` | High-contrast warm espresso/cream (>9.5:1) so helpline names and hours are effortless to read in distress. |

### B. Typography & Multilingual Support

- **Headings (`--font-serif`)**: Self-hosted `Newsreader` (with `Noto Naskh Arabic` and `Georgia` fallback). A humane editorial serif slows down reading cadence and signals a reflective space rather than a productivity tool.
- **Body & Controls (`--font-sans`)**: Self-hosted `Figtree` + `Noto Naskh Arabic` subset `.woff2` files (`font-display: swap`). Clean open counters keep Roman Urdu, English, and Urdu script legible at small sizes.
- **Generous Line-Height (`1.65` UI / `1.75` message bubbles)** & `dir="auto"`: Urdu script requires vertical breathing room for ascenders, diacritics, and Nastaliq/Naskh ligatures. Using `dir="auto"` on every message bubble and input allows seamless code-switching between English, Roman Urdu, and Urdu script within the same conversation.
- **Fluid Sizing + 3-Step Text Size Control**: Base size scales with `clamp(1.0625rem, 1.02rem + 0.25vw, 1.125rem)` multiplied by `--font-scale` (`1`, `1.12`, `1.24`), supporting both browser 200% zoom and in-app text scaling with zero horizontal scroll.

### C. Spatial Rhythm, Motion & Restrained Delight

- **One Primary Action Per View**:
  - Welcome screen fits within `360x640` with zero scrolling, presenting three honest statements and one primary `"Continue"` button.
  - Empty chat asks *"How are you feeling right now?"* (inviting self-reflection rather than transactional *"How can I help?"*), paired with 3 tap-to-send chips and *"I'd rather not type, guide me"* for users too exhausted to type.
- **State-Responsive Restraint (`resolveStateUiEmphasis`)**:
  - When the backend signals `low_energy`, the UI reduces cognitive load to **at most one quick-reply chip**, adds extra vertical breathing room, and suppresses the exercise card unless the user asked for one.
  - When `overwhelmed` or `anxious`, the suggested exercise card is softly emphasised.
  - When `angry`, a gentle pause (`Breathing`) is offered.
  - The internal `state` classification is **never** displayed to the user.
- **Honouring Reduced Motion**:
  - Both OS-level `prefers-reduced-motion: reduce` and the in-app Motion menu setting disable the background gradient drift, message fade-in, and the breathing circle scale transform—falling back to calm text (`Breathe in` / `Breathe out`) and countdown seconds only.
- **Trauma-Informed Safety & Privacy**:
  - The composer is **never** locked or disabled during a crisis response or while waiting for a reply.
  - Conversation state lives exclusively in `sessionStorage`. `"Clear and leave"` wipes both `sessionStorage` and `localStorage` and replaces history with a neutral site in one tap without a confirmation barrier.

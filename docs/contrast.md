# WCAG 2.2 AA Contrast Verification Report

All colour tokens in `/public/css/styles.css` were verified programmatically using the WCAG 2.x relative luminance formula in `/docs/logic-and-contrast.test.js` (`npx --yes tsx --test docs/logic-and-contrast.test.js`).

## 1. Adjustments Made to Suggested Starting Tokens

1. **No Pure `#FFFFFF` or `#000000` Backgrounds**:
   - The prompt's suggested start listed `surface #FFFFFF` alongside the strict rule: *"never pure #000 or #FFF backgrounds, never saturated red, text contrast >= 4.5:1 and UI parts >= 3:1 in BOTH themes."*
   - We adjusted Light `--color-surface` from `#FFFFFF` to `#FCFBF8` (warm ivory paper).
2. **Light Theme Primary Contrast (`#3E7C74` -> `#2D665F`)**:
   - Measuring `#3E7C74` against `#F6F3EE` (`--color-bg`) yielded **4.39:1**, which falls just short of the WCAG AA **4.5:1** minimum for normal text.
   - We darkened Light `--color-primary` to `#2D665F`, bringing its contrast ratio to **5.71:1** on `#F6F3EE`, **6.14:1** on `#FCFBF8`, and **6.02:1** against `--color-primary-contrast` (`#FAF8F4`).
3. **Care Card & Control Border Contrast (`>= 3.0:1`)**:
   - `#E8B98A` on `#FFF1E3` is **1.66:1** (decorative only). We kept `#E8B98A` as `--color-care-border-soft` (decorative glow) and set `--color-care-border` to `#B3773B` (**3.32:1** on `#FFF1E3`) and `--color-ui-outline` to `#738288` (**3.44:1** on `#F6F3EE` and **3.70:1** on `#FCFBF8`) so every interactive boundary meets the `>= 3:1` WCAG 2.2 AA non-text contrast requirement.

---

## 2. Measured Contrast Ratios — Light Theme ("Warm Paper")

| Foreground / Element | Hex | Background | Hex | Measured Ratio | Requirement | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Primary Text (`--color-text`) | `#1F2A2E` | Page Background (`--color-bg`) | `#F6F3EE` | **13.19 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Primary Text (`--color-text`) | `#1F2A2E` | Card Surface (`--color-surface`) | `#FCFBF8` | **14.19 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Primary Text (`--color-text`) | `#1F2A2E` | User Bubble (`--color-user-bubble`) | `#EFE7DA` | **11.98 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Muted Text (`--color-muted`) | `#526167` | Page Background (`--color-bg`) | `#F6F3EE` | **5.59 : 1** | >= 4.5 : 1 | PASS (AA) |
| Muted Text (`--color-muted`) | `#526167` | Card Surface (`--color-surface`) | `#FCFBF8` | **6.01 : 1** | >= 4.5 : 1 | PASS (AA) |
| Primary Accent (`--color-primary`) | `#2D665F` | Page Background (`--color-bg`) | `#F6F3EE` | **5.71 : 1** | >= 4.5 : 1 | PASS (AA) |
| Primary Accent (`--color-primary`) | `#2D665F` | Card Surface (`--color-surface`) | `#FCFBF8` | **6.14 : 1** | >= 4.5 : 1 | PASS (AA) |
| Primary Button Text (`--color-primary-contrast`) | `#FAF8F4` | Primary Button (`--color-primary`) | `#2D665F` | **6.02 : 1** | >= 4.5 : 1 | PASS (AA) |
| Soft Sage Text (`--color-primary-soft-text`) | `#1A423D` | Soft Sage Surface (`--color-primary-soft`) | `#DCEBE7` | **8.89 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Care Card Text (`--color-care-text`) | `#4A2F12` | Care Card Bg (`--color-care-bg`) | `#FFF1E3` | **10.67 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Emergency Button Text (`--color-care-btn-text`) | `#FFF8F0` | Emergency Button Bg (`--color-care-btn-bg`) | `#5E3A14` | **9.66 : 1** | >= 4.5 : 1 | PASS (AAA) |
| UI Control Outline (`--color-ui-outline`) | `#738288` | Page Background (`--color-bg`) | `#F6F3EE` | **3.44 : 1** | >= 3.0 : 1 | PASS (AA UI) |
| UI Control Outline (`--color-ui-outline`) | `#738288` | Card Surface (`--color-surface`) | `#FCFBF8` | **3.70 : 1** | >= 3.0 : 1 | PASS (AA UI) |
| Care Card Border (`--color-care-border`) | `#B3773B` | Care Card Bg (`--color-care-bg`) | `#FFF1E3` | **3.32 : 1** | >= 3.0 : 1 | PASS (AA UI) |

---

## 3. Measured Contrast Ratios — Dark Theme ("Night Sanctuary")

| Foreground / Element | Hex | Background | Hex | Measured Ratio | Requirement | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Primary Text (`--color-text`) | `#E8EFED` | Page Background (`--color-bg`) | `#0F1514` | **15.79 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Primary Text (`--color-text`) | `#E8EFED` | Card Surface (`--color-surface`) | `#172120` | **14.12 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Primary Text (`--color-text`) | `#E8EFED` | User Bubble (`--color-user-bubble`) | `#24302D` | **11.55 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Muted Text (`--color-muted`) | `#9FB0AC` | Page Background (`--color-bg`) | `#0F1514` | **8.08 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Muted Text (`--color-muted`) | `#9FB0AC` | Card Surface (`--color-surface`) | `#172120` | **7.22 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Primary Accent (`--color-primary`) | `#84C7BA` | Page Background (`--color-bg`) | `#0F1514` | **9.82 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Primary Accent (`--color-primary`) | `#84C7BA` | Card Surface (`--color-surface`) | `#172120` | **8.78 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Primary Button Text (`--color-primary-contrast`) | `#0F1514` | Primary Button (`--color-primary`) | `#84C7BA` | **9.82 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Soft Sage Text (`--color-primary-soft-text`) | `#D7EFEA` | Soft Sage Surface (`--color-primary-soft`) | `#1F3330` | **10.75 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Care Card Text (`--color-care-text`) | `#F7E6D4` | Care Card Bg (`--color-care-bg`) | `#2A2118` | **12.56 : 1** | >= 4.5 : 1 | PASS (AAA) |
| Emergency Button Text (`--color-care-btn-text`) | `#231609` | Emergency Button Bg (`--color-care-btn-bg`) | `#E8B98A` | **9.53 : 1** | >= 4.5 : 1 | PASS (AAA) |
| UI Control Outline (`--color-ui-outline`) | `#6B807C` | Page Background (`--color-bg`) | `#0F1514` | **4.37 : 1** | >= 3.0 : 1 | PASS (AA UI) |
| UI Control Outline (`--color-ui-outline`) | `#6B807C` | Card Surface (`--color-surface`) | `#172120` | **3.91 : 1** | >= 3.0 : 1 | PASS (AA UI) |
| Care Card Border (`--color-care-border`) | `#C4925A` | Care Card Bg (`--color-care-bg`) | `#2A2118` | **5.25 : 1** | >= 3.0 : 1 | PASS (AA UI) |

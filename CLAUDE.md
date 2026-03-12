# CURRENT ACTION REQUIRED:
Read the "Project Intelligence" below. Your ONLY job right now is to update `src/index.css` and `src/styles.js` to perfectly match these new design rules. 

CRITICAL CONSTRAINTS:
1. DO NOT change `App.jsx`, Firebase logic, state management, or component structures. 
2. ONLY update the CSS variables in `index.css` and the styling objects in `styles.js`.
3. Do not add any new external libraries. 
4. Stop and ask me if you feel you need to modify a `.jsx` file to achieve these styles.

# 돈줄 (Donjul) — Project Intelligence

## What This App Is
A premium personal finance tracker. The name means "money line" in Korean.
Target user: Korean diaspora aged 22–35 living abroad, plus anyone who wants a cleaner alternative to Mint/YNAB.
Core philosophy: **financial tracking should feel calm, rewarding, and personal — not like corporate software.**

---

## Tech Stack
- React 18 + Vite (no TypeScript)
- Firebase Firestore (real-time sync) + Firebase Auth
- Inline styles via `S` object in `src/styles.js`
- CSS variables in `src/index.css`
- Geist + Geist Mono fonts
- No external state library — useState + custom dispatch

---

## Brand Identity

### Logo
The app logo is an illustrated coin caterpillar with a leaf. We already have this logo. It is **warm, round, organic, and illustrated**.
The UI must match this character. Do not fight it.

### Three Brand Words
1. **Calm** — no guilt language, no red alerts for normal spending, breathing room
2. **Considered** — nothing is there by accident, every element is intentional
3. **Alive** — the Garden, Harvest, confetti moments make money feel rewarding
---

## Design System

### Design Direction
**Warm Organic Finance** — premium but friendly. Think Revolut meets an illustrated app.
NOT cold minimal fintech. NOT playful kids app. The middle ground.

### Color Tokens (Dark Mode — Default)
All colors are sampled from or inspired by the logo's coin gold and leaf green palette.

```
--c-bg:              #0E0D09   /* warm amber-black, NOT cold green-black */
--c-card:            #171610   /* warm dark surface */
--c-nav:             #131209
--c-sub:             #131209
--c-text:            #F0EDE4   /* warm off-white */
--c-muted:           #6B6A5A   /* warm grey, NO blue cast */
--c-dim:             #918F80
--c-accent:          #F2C430   /* coin gold — sampled from logo */
--c-green:           #6CC44A   /* leaf green — sampled from logo */
--c-forest:          #2D6B2E   /* dark outline green from logo */
--c-red:             #FF6B6B
--c-border:          #272518   /* warm border, not green-tinted */
--c-input-bg:        #1C1B12
--c-input-border:    #302E1E
--c-btn-sm-bg:       #272518
--c-btn-sm-text:     #918F80
--c-accent-faint:    rgba(242, 196, 48, 0.15)
--c-accent-subtle:   rgba(242, 196, 48, 0.07)
--c-danger-bg:       #2A1010
--c-danger-text:     #FF6B6B
--c-overlay:         rgba(0, 0, 0, 0.65)
```

### Color Tokens (Light Mode)
Light mode uses warm cream/parchment — NOT cold grey-white.

```
--c-bg:              #F5F2E8
--c-card:            #FDFCF6
--c-nav:             #FDFCF6
--c-sub:             #EDE9DA
--c-text:            #1C1A12
--c-muted:           #7A7564
--c-dim:             #9A9585
--c-accent:          #C49A0A   /* darker gold for legibility on light */
--c-green:           #3A8A28
--c-forest:          #2D6B2E
--c-red:             #DC2626
--c-border:          #DDD8C4
--c-input-bg:        #EDE9DA
--c-input-border:    #CCC8B0
--c-btn-sm-bg:       #E4DFC8
--c-btn-sm-text:     #6A6555
--c-accent-faint:    rgba(196, 154, 10, 0.15)
--c-accent-subtle:   rgba(196, 154, 10, 0.07)
--c-danger-bg:       #FEE2E2
--c-danger-text:     #DC2626
--c-overlay:         rgba(0, 0, 0, 0.4)
```

### Border Radius Tokens
Rounder corners throughout — echoes the circular coins in the logo.

```
--r-sm:    10px   /* inputs, small elements */
--r-md:    16px   /* medium cards */
--r-lg:    22px   /* main cards */
--r-xl:    28px   /* modals */
--r-pill:  9999px /* progress bars, badges */
```

### Shadow Tokens
Warm-tinted shadows — not neutral grey. Cards glow faintly gold on hover.

```
--shadow-card:   0 1px 4px rgba(0,0,0,0.35), 0 0 0 1px rgba(242,196,48,0.03)
--shadow-modal:  0 28px 64px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.25), 0 0 0 1px rgba(242,196,48,0.06)
--shadow-hover:  0 4px 16px rgba(242,196,48,0.08), 0 1px 4px rgba(0,0,0,0.3)
```

### Typography
- **Geist** — UI labels, headings, buttons
- **Geist Mono** — all numbers, financial values, dates, code
- Never mix in system fonts or fallbacks for key UI elements

### Key Style Rules

**Cards**
- Border radius: `var(--r-lg)` (22px)
- Shadow: `var(--shadow-card)`
- On hover (interactive cards): `var(--shadow-hover)` + border-color `rgba(242,196,48,0.15)`

**Buttons (primary)**
- Background: `var(--c-accent)` (gold)
- Text color: `#0E0D09` (dark, NOT white — dark text reads better on gold)
- Border radius: 12px
- Font weight: 700

**Progress Bars**
- Height: 10px (not 6px — more weight feels substantial)
- Border radius: `var(--r-pill)`

**Nav Wordmark (돈줄)**
- Gradient: `linear-gradient(90deg, var(--c-accent) 0%, var(--c-green) 100%)`
- Applied via `-webkit-background-clip: text`
- This directly mirrors the logo's two dominant colors

**Muted Text**
- Always use `var(--c-muted)` (#6B6A5A in dark)
- Never use a color with a blue cast for secondary text — it breaks the warm palette

**Modals**
- Border radius: `var(--r-xl)` (28px)
- Shadow: `var(--shadow-modal)`

---

## Component Conventions

### S Object (styles.js)
All styles live in the `S` object in `src/styles.js`.
When adding new styles, follow the existing pattern — add to `S`, use CSS variable tokens.
Never hardcode hex values in component files — always reference `var(--c-*)` tokens.

### Adding New Cards
```jsx
<div style={{...S.card}}>
  <div style={S.cardTitle}>SECTION TITLE</div>
  {/* content */}
</div>
```

### Adding New Buttons
```jsx
<button style={S.btn('primary')}>Action</button>  // gold, dark text
<button style={S.btn('ghost')}>Cancel</button>     // transparent
<button style={S.btn('danger')}>Delete</button>    // red
<button style={S.btn('sm')}>Small</button>         // small variant
```

### Financial Values
Always use `Geist Mono` font for any number that represents money.
Always use `formatMoney()` from `src/utils/helpers.js` for display.
Positive values: `var(--c-green)` (#6CC44A)
Negative values: `var(--c-red)` (#FF6B6B)
Neutral/income values: `var(--c-accent)` (#F2C430)

---

## Features Reference

| Tab | Purpose |
|-----|---------|
| Dashboard | Monthly overview, stat cards, goal progress, upcoming months |
| Monthly | Cash flow table, planned vs actual, per-transaction logging |
| Goals | Savings targets, linked accounts, harvest button |
| Garden | Trophy room for completed goals, money tree SVG, lifetime wealth |
| Accounts | Balance editor, floor/sweep logic, multi-account management |
| Settings | Income, bills, categories, account config |

### The Harvest Flow (signature feature — treat with care)
When a goal reaches 100%:
1. A glowing "Harvest" button appears on the goal card
2. Tapping triggers react-confetti
3. A fruit emoji badge is assigned to the goal
4. The goal moves to the Garden tab permanently
This is the most emotionally resonant feature. Any changes here should preserve the celebratory feel.

---

## What NOT To Do

- ❌ Don't add blue to the palette — this app is warm green + gold only
- ❌ Don't make backgrounds colder (no pure blacks, no blue-tinted darks)
- ❌ Don't use guilt or alarm language in copy ("Warning", "You overspent", "Alert")
- ❌ Don't reduce border radius — roundness is intentional and tied to the logo
- ❌ Don't hardcode colors in component files — use CSS variable tokens
- ❌ Don't use white text on gold buttons — use `#0E0D09` (dark) for contrast
- ❌ Don't change the Harvest flow without preserving confetti + fruit badge
- ❌ Don't add external state libraries — keep useState + dispatch pattern

## What TO Do

- ✅ Keep all financial numbers in Geist Mono
- ✅ Use `var(--c-accent)` (gold) for primary CTAs and key highlights
- ✅ Use `var(--c-green)` (leaf green) for positive values and growth indicators
- ✅ Keep card hover states — subtle gold glow makes the UI feel alive
- ✅ Preserve the bilingual (EN/KO) toggle — it's a core differentiator
- ✅ Maintain mobile-first responsiveness — bottom nav on mobile is intentional
- ✅ Keep the grain texture overlay in index.css — adds organic warmth at 0.025 opacity

---

## File Map

```
src/
├── App.jsx              # Root, auth, reducer, routing
├── styles.js            # ALL styles — S object with CSS variable tokens
├── index.css            # CSS variables, theme tokens, mobile classes
├── components/
│   ├── Dashboard.jsx
│   ├── MonthlyView.jsx
│   ├── Accounts.jsx
│   ├── Goals.jsx
│   ├── Garden.jsx
│   ├── MoneyTreeSVG.jsx  # Don't modify — geometric SVG illustration
│   ├── Settings.jsx
│   ├── SplashScreen.jsx
│   └── shared.jsx        # StatCard, ProgressBar, Modal, TxModal
├── lib/
│   └── firebase.js       # Firebase init, debounced save()
└── utils/
    ├── helpers.js         # formatMoney, getMonthlyIncome, buildDefault
    └── translations.js    # EN/KO strings, t_() lookup
```
# Current Task: Dashboard Localization & Goal Text Layout

There are two final polish items to fix regarding localization and CSS text wrapping.

### 1. Fix Account Types on Dashboard (`src/components/Dashboard.jsx`)
- In the Dashboard component, locate the `accounts.map` loop that renders the `StatCard` for each account.
- Currently, it passes the raw string: `sub={a.type}`. 
- Update this to use the translation function: `sub={t(a.type + "Type")}` so it correctly renders "예금", "저축", etc., in Korean mode.

### 2. Fix Text Wrapping in Goals (`src/components/Goals.jsx`)
- Locate the `<div>` containing the goal progress subtext: `현재 {fmt(g.saved)} · 남은 금액 {fmt(remaining)}`.
- The text is currently wrapping awkwardly across multiple lines because the flex container is being squeezed.
- Apply the following inline CSS properties to that specific `<div>` to force it onto a single line gracefully:
  - `whiteSpace: "nowrap"`
  - `overflow: "hidden"`
  - `textOverflow: "ellipsis"`
- Also, make sure the parent `<div>` holding the goal name and this subtext has `minWidth: 0` so the ellipsis can properly trigger without pushing the percentage/edit buttons off the screen.

### 3. STRICT PRESERVATION
- **CRITICAL:** Do NOT alter the Toss-style UI, layout, or colors.
- Do NOT break the existing Firebase syncing or logic.
- Run `npm run build` to verify the components compile correctly.
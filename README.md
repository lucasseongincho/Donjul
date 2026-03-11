<div align="center">

# 돈줄 · Donjul

**A premium personal finance tracker built for clarity, speed, and calm.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Private](https://img.shields.io/badge/repo-private-lightgrey?style=flat-square)]()

<br />

</div>

---

## Overview

**돈줄** (pronounced *don-jul*, meaning "money line" in Korean) is a minimalist, full-stack personal finance app designed around the philosophy that your financial dashboard should feel as premium as the apps you love. It keeps you on top of monthly cash flow, savings progress, and account balances — with real-time sync across every device you own.

---

## Features

- 📊 **Monthly Cash Flow** — Track planned vs. actual spending across fixed bills and personal categories, with per-transaction logging and a running surplus/deficit.
- 🎯 **Savings Goals** — Create savings targets and optionally link them to a bank account. The goal card auto-updates as your real balance changes.
- 🧺 **Goal Harvesting** — When a savings goal hits 100%, a glowing "Harvest" button appears. One tap triggers a confetti celebration, assigns a fruit badge, and moves the goal into your Garden — permanently memorializing your win.
- 🌱 **Garden Tab** — A dedicated trophy room for completed goals. See your lifetime wealth grown at a glance, browse harvested goals displayed as fruit-badged cards beneath a geometric money tree.
- 🏦 **Multi-Account Dashboard** — Manage checking, savings, credit, and investment accounts. Set a floor amount and get sweep reminders when the balance exceeds it.
- 🔄 **Live Firebase Sync** — All data is persisted to Firestore in real time. Open the app on your phone or laptop — it's always up to date.
- 🗺️ **Interactive Product Tour** — A first-run guided tour walks new users through every major feature using react-joyride.
- 🌐 **Full Korean Localization** — Every string, number format, and date label is available in English and Korean (한국어), switchable at any time from Settings.
- 🌙 **Dark & Light Mode** — System-aware theming with a clean toggle. No eye strain, ever.
- 🔐 **Auth Flexibility** — Sign in with Google or create a standard email/password account. Firebase Auth handles the rest.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 (Vite, no TypeScript) |
| Styling | Inline styles via `S` object + CSS variables, Geist & Geist Mono fonts (dark/light theme) |
| Backend / DB | Firebase Firestore (real-time sync) |
| Auth | Firebase Authentication (Google OAuth + Email/Password) |
| Hosting | Firebase Hosting (deployed from `dist/`) |
| Build Tool | Vite 5 |
| State | `useState` + custom `dispatch` — no external state library |
| Animations | react-confetti, react-joyride |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Firestore** and **Authentication** enabled

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Create `src/lib/firebase.js` (or update the existing one) with your Firebase project credentials:

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deployment

```bash
npm run build
firebase deploy
```

Requires the [Firebase CLI](https://firebase.google.com/docs/cli) to be installed and authenticated. The `firebase.json` is already configured to serve from `dist/`.

---

## Project Structure

```
Donjul/
├── src/
│   ├── App.jsx                  # Root component, auth, reducer, routing
│   ├── styles.js                # Centralized inline style system (S object)
│   ├── index.css                # Global CSS variables, dark/light themes, responsive classes
│   ├── components/
│   │   ├── Dashboard.jsx        # Overview, stat cards, goal progress, upcoming months
│   │   ├── MonthlyView.jsx      # Cash flow table, transactions, custom rows
│   │   ├── Accounts.jsx         # Balance editor, floor/sweep logic
│   │   ├── Goals.jsx            # Savings goals, linked accounts, harvest button
│   │   ├── Garden.jsx           # Trophy room — harvested goals, lifetime wealth stat
│   │   ├── MoneyTreeSVG.jsx     # Geometric SVG money tree illustration
│   │   ├── Settings.jsx         # Accounts, income, bills, categories management
│   │   ├── SplashScreen.jsx     # Animated launch screen
│   │   └── shared.jsx           # StatCard, ProgressBar, Modal, TxModal
│   ├── lib/
│   │   └── firebase.js          # Firebase init, auth, db, debounced save()
│   └── utils/
│       ├── helpers.js           # formatMoney, getMonthlyIncome, buildDefault, ...
│       └── translations.js      # EN/KO translation strings + t_() lookup
├── public/
│   ├── favicon/
│   └── manifest.json
├── index.html
├── vite.config.js
└── firebase.json
```

---

## Firestore Data Shape

User data is stored under `user_data/{uid}` as a single JSON-stringified `data` field containing:

```json
{
  "goals": [],
  "harvested_goals": [],
  "accounts": [],
  "months": {},
  "settings": {}
}
```

`harvested_goals` is an array of completed goal objects, each enriched with a `fruit` emoji badge assigned at harvest time.

---

## License

MIT — free to use, fork, and build on.

---

<div align="center">
  <sub>Built with focus and a lot of ☕</sub>
</div>

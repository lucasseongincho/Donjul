<div align="center">

# 돈줄 · Donjul

**A premium personal finance tracker built for clarity, speed, and calm.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

<br />

![App Screenshot](./public/screenshot.png)

</div>

---

## Overview

**돈줄** (pronounced *don-jul*, meaning "money line" in Korean) is a minimalist, full-stack personal finance app designed around the philosophy that your financial dashboard should feel as premium as the apps you love. Built with a Toss-inspired UI, it keeps you on top of monthly cash flow, savings progress, and account balances — with real-time sync across every device you own.

---

## Features

- 📊 **Monthly Cash Flow** — Track planned vs. actual spending across fixed bills and personal categories, with per-transaction logging and a running surplus/deficit.
- 🎯 **Linked Savings Goals** — Create savings targets and optionally link them directly to a bank account. The goal card auto-updates as your real balance changes.
- 🏦 **Multi-Account Dashboard** — Manage checking, savings, credit, and investment accounts. Set a floor amount and get sweep reminders when the balance exceeds it.
- 🔄 **Live Firebase Sync** — All data is persisted to Firestore in real time. Open the app on your phone or laptop — it's always up to date.
- 🌐 **Full Korean Localization** — Every string, number format, and date label is available in English and Korean (한국어), switchable at any time from Settings.
- 🌙 **Dark & Light Mode** — System-aware theming with a clean toggle. No eye strain, ever.
- 🔐 **Auth Flexibility** — Sign in with Google or create a standard email/password account. Firebase Auth handles the rest.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 (Vite, no TypeScript) |
| Styling | Inline styles via `S` object + CSS variables, Geist & Geist Mono fonts |
| Backend / DB | Firebase Firestore (real-time sync) |
| Auth | Firebase Authentication (Google OAuth + Email/Password) |
| Hosting | Firebase Hosting (deployed from `dist/`) |
| Build Tool | Vite 5 |
| State | `useState` + custom `dispatch` + `reducer` — no external state library |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Firestore** and **Authentication** enabled

### 1. Clone the repo

```bash
git clone https://github.com/lucasseongincho/Donjul.git
cd Donjul
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

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

### 4. Start the dev server

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
│   │   ├── Goals.jsx            # Savings goals with linked account support
│   │   ├── Settings.jsx         # Accounts, income, bills, categories management
│   │   ├── SplashScreen.jsx     # Animated launch screen
│   │   └── shared.jsx           # StatCard, ProgressBar, Modal
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

## License

MIT — free to use, fork, and build on.

---

<div align="center">
  <sub>Built with focus and a lot of ☕ &nbsp;·&nbsp; <a href="https://github.com/lucasseongincho/Donjul">github.com/lucasseongincho/Donjul</a></sub>
</div>

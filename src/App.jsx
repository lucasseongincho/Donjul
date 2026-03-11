import { useState, useEffect, useCallback, useRef } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut, GoogleAuthProvider
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, save } from './lib/firebase.js';
import { S } from './styles.js';
import { buildDefault, loadSaved } from './utils/helpers.js';
import { t_ } from './utils/translations.js';
import SplashScreen from './components/SplashScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import MonthlyView from './components/MonthlyView.jsx';
import Accounts from './components/Accounts.jsx';
import Goals from './components/Goals.jsx';
import Settings from './components/Settings.jsx';
import Garden from './components/Garden.jsx';
import TourGuide from './components/TourGuide.jsx';

function reducer(state, action) {
  switch (action.type) {
    case "ADD_ACCOUNT": return { ...state, accounts: [...state.accounts, action.account] };
    case "EDIT_ACCOUNT": return { ...state, accounts: state.accounts.map(a => a.id === action.account.id ? action.account : a) };
    case "DEL_ACCOUNT": return { ...state, accounts: state.accounts.filter(a => a.id !== action.id) };
    case "SET_BALANCE": return { ...state, accounts: state.accounts.map(a => a.id === action.id ? { ...a, balance: action.balance } : a) };
    case "ADD_INCOME": return { ...state, incomeSources: [...state.incomeSources, action.source] };
    case "EDIT_INCOME": return { ...state, incomeSources: state.incomeSources.map(s => s.id === action.source.id ? action.source : s) };
    case "DEL_INCOME": return { ...state, incomeSources: state.incomeSources.filter(s => s.id !== action.id) };
    case "ADD_BILL": return { ...state, fixedBills: [...state.fixedBills, action.bill] };
    case "EDIT_BILL": return { ...state, fixedBills: state.fixedBills.map(b => b.id === action.bill.id ? action.bill : b) };
    case "DEL_BILL": return { ...state, fixedBills: state.fixedBills.filter(b => b.id !== action.id) };
    case "ADD_CATEGORY": return { ...state, personalCategories: [...state.personalCategories, action.category] };
    case "EDIT_CATEGORY": return { ...state, personalCategories: state.personalCategories.map(c => c.id === action.category.id ? action.category : c) };
    case "DEL_CATEGORY": return { ...state, personalCategories: state.personalCategories.filter(c => c.id !== action.id) };
    case "UPDATE_GOAL": return { ...state, goals: state.goals.map(g => g.id === action.id ? { ...g, [action.field]: action.val } : g) };
    case "DELETE_GOAL": return { ...state, goals: state.goals.filter(g => g.id !== action.id) };
    case "ADD_GOAL": return { ...state, goals: [...state.goals, action.goal] };
    case "SET_TX": {
      const m = { ...state.months[action.key], transactions: { ...state.months[action.key]?.transactions, [action.catKey]: action.items } };
      return { ...state, months: { ...state.months, [action.key]: m } };
    }
    case "ADD_CUSTOM_ROW": {
      const m = { ...state.months[action.key], customRows: [...(state.months[action.key]?.customRows || []), action.row] };
      return { ...state, months: { ...state.months, [action.key]: m } };
    }
    case "EDIT_CUSTOM_ROW": {
      const m = { ...state.months[action.key], customRows: (state.months[action.key]?.customRows || []).map(r => r.id === action.row.id ? { ...r, ...action.row } : r) };
      return { ...state, months: { ...state.months, [action.key]: m } };
    }
    case "DEL_CUSTOM_ROW": {
      const m = { ...state.months[action.key], customRows: (state.months[action.key]?.customRows || []).filter(r => r.id !== action.rowId) };
      return { ...state, months: { ...state.months, [action.key]: m } };
    }
    case "HARVEST_GOAL": {
      const goal = state.goals.find(g => g.id === action.id);
      if (!goal) return state;
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.id),
        harvested_goals: [...(state.harvested_goals || []), { ...goal, fruit: action.fruit }],
      };
    }
    case "SET_ONBOARDING_SEEN": return { ...state, hasSeenOnboarding: true };
    default: return state;
  }
}

export default function App() {
  const [state, dispatch_] = useState(buildDefault);
  const [tab, setTab] = useState("dashboard");
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");
  const [currency, setCurrency] = useState(() => localStorage.getItem("currency") || "USD");
  const [loginError, setLoginError] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailMode, setEmailMode] = useState("signin");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginConfirmPassword, setLoginConfirmPassword] = useState("");
  const [tourOpen, setTourOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [dataError, setDataError] = useState(false); // Fix #8
  const { width, height } = useWindowSize();
  const confettiTimerRef = useRef(null); // Fix #7
  const triggerConfetti = useCallback(() => {
    clearTimeout(confettiTimerRef.current);
    setShowConfetti(true);
    confettiTimerRef.current = setTimeout(() => setShowConfetti(false), 5000);
  }, []);
  useEffect(() => () => clearTimeout(confettiTimerRef.current), []); // Fix #7 cleanup
  const firestoreUnsubRef = useRef(() => {});
  const userRef = useRef(user);           // Fix #6: always-current user ref
  const pendingSaveRef = useRef(false);   // Fix #3: tracks in-flight saves
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("currency", currency); }, [currency]);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const dataReady = authReady && (!user || ready);
    if (minTimeElapsed && dataReady) {
      setSplashFading(true);
      const fade = setTimeout(() => setSplashDone(true), 320);
      return () => clearTimeout(fade);
    }
  }, [minTimeElapsed, authReady, user, ready]); // eslint-disable-line

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");
  const t = useCallback((key) => t_(lang, key), [lang]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); if (!u) setEmailModalOpen(false); });
    return unsub;
  }, []);

  const dispatch = useCallback((action) => {
    dispatch_(prev => {
      const next = reducer(prev, action);
      if (userRef.current) {
        pendingSaveRef.current = true; // Fix #3: block stale snapshots during save
        save(userRef.current.uid, next, () => { pendingSaveRef.current = false; });
      }
      return next;
    });
  }, []); // Fix #6: no user dep — uses ref

  useEffect(() => {
    if (!user) return;
    setReady(false);
    let initialized = false;
    const userDoc = doc(db, "user_data", user.uid);
    const fallback = setTimeout(() => {
      if (!initialized) { initialized = true; setReady(true); }
    }, 6000);
    const unsub = onSnapshot(userDoc, (snap) => {
      clearTimeout(fallback);
      if (snap.exists()) {
        // Fix #3: skip echo of our own in-flight save — local state is already current
        if (!pendingSaveRef.current) {
          try {
            dispatch_(loadSaved(JSON.parse(snap.data().data)));
          } catch (e) {
            console.error('Failed to parse Firestore data:', e); // Fix #8: no silent fail
            setDataError(true);
          }
        }
      } else {
        const def = buildDefault();
        dispatch_(def);
        setDoc(doc(db, "user_data", user.uid), { data: JSON.stringify(def) }).catch(() => { });
      }
      if (!initialized) { initialized = true; setReady(true); }
    }, (err) => {
      console.error('Firestore snapshot error:', err);
      clearTimeout(fallback);
      if (!initialized) { initialized = true; setReady(true); }
    });
    firestoreUnsubRef.current = unsub;
    return () => { clearTimeout(fallback); unsub(); firestoreUnsubRef.current = () => {}; };
  }, [user]);

  if (!splashDone) return <SplashScreen fading={splashFading} />;

  const friendlyError = (code) => {
    switch (code) {
      case "auth/invalid-email": return "Invalid email address.";
      case "auth/user-not-found": return "No account found with that email.";
      case "auth/wrong-password": return "Incorrect password.";
      case "auth/email-already-in-use": return "An account with that email already exists.";
      case "auth/weak-password": return "Password must be at least 6 characters.";
      case "auth/invalid-credential": return "Incorrect email or password.";
      default: return "Something went wrong. Please try again.";
    }
  };

  const handleLogin = () => {
    setLoginError("");
    signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      .catch(e => setLoginError(friendlyError(e.code)));
  };

  const handleSignUp = () => {
    setLoginError("");
    if (loginPassword !== loginConfirmPassword) {
      setLoginError(t_("en", "passwordMismatch"));
      return;
    }
    createUserWithEmailAndPassword(auth, loginEmail, loginPassword)
      .catch(e => setLoginError(friendlyError(e.code)));
  };

  const openEmailModal = (mode) => {
    setEmailMode(mode);
    setEmailModalOpen(true);
    setLoginError("");
    setLoginEmail("");
    setLoginPassword("");
    setLoginConfirmPassword("");
  };
  const closeEmailModal = () => {
    setEmailModalOpen(false);
    setLoginError("");
    setLoginEmail("");
    setLoginPassword("");
    setLoginConfirmPassword("");
  };

  if (!user) {
    const inputStyle = {
      display: "block", width: "100%", boxSizing: "border-box",
      background: "var(--c-input-bg)", border: "1.5px solid var(--c-input-border)",
      borderRadius: 8, color: "var(--c-text)", padding: "14px 16px", fontSize: 16,
      fontFamily: "'JetBrains Mono', monospace", outline: "none", marginBottom: 12,
    };
    const bigBtn = (variant) => ({
      display: "block", width: "100%", boxSizing: "border-box",
      padding: "14px", fontSize: 16, minHeight: 48, borderRadius: 8,
      fontFamily: "'Syne'", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em",
      border: "none",
      background: variant === "ghost" ? "var(--c-btn-sm-bg)" : "var(--c-accent)",
      color: variant === "ghost" ? "var(--c-text)" : "var(--c-bg)",
    });
    const overlayStyle = {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 24,
    };
    const modalBoxStyle = {
      background: "var(--c-card)", borderRadius: 16, padding: "28px 24px",
      width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
    };
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            {["en", "ko"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: "5px 12px", fontSize: 12, fontWeight: 700, fontFamily: "'Syne'",
                borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: "0.04em",
                background: lang === l ? "var(--c-accent)" : "var(--c-btn-sm-bg)",
                color: lang === l ? "var(--c-bg)" : "var(--c-muted)",
                marginLeft: 6,
              }}>
                {l === "en" ? "EN" : "한국어"}
              </button>
            ))}
          </div>
          <div style={{ fontWeight: 800, fontSize: 40, color: "var(--c-accent)", letterSpacing: "0.05em", marginBottom: 6 }}>{lang === "ko" ? "돈줄" : "Don Jul"}</div>
          <div style={{ fontSize: 13, color: "var(--c-muted)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 32 }}>{t("signInSub")}</div>

          {!emailModalOpen && loginError && (
            <div style={{ background: "var(--c-danger-bg)", border: "1px solid var(--c-danger-text)", borderRadius: 8, color: "var(--c-danger-text)", fontSize: 14, padding: "10px 14px", marginBottom: 16, textAlign: "left" }}>
              {loginError}
            </div>
          )}

          <button style={{ ...bigBtn(), marginBottom: 12 }} onClick={() => openEmailModal("signin")}>{t("signInWithEmail")}</button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--c-input-border)" }} />
            <span style={{ color: "var(--c-muted)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "var(--c-input-border)" }} />
          </div>

          <button style={bigBtn("ghost")}
            onClick={() => { setLoginError(""); signInWithPopup(auth, new GoogleAuthProvider()).catch(e => setLoginError(friendlyError(e.code))); }}>
            {t("signInBtn")}
          </button>
        </div>

        {emailModalOpen && (
          <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) closeEmailModal(); }}>
            <div style={modalBoxStyle}>
              {/* Toggle */}
              <div style={{ display: "flex", background: "var(--c-sub)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
                {["signin", "signup"].map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setEmailMode(mode); setLoginError(""); setLoginConfirmPassword(""); }}
                    style={{
                      flex: 1, padding: "9px 0", fontSize: 14, fontWeight: 700,
                      fontFamily: "'Syne'", borderRadius: 7, border: "none", cursor: "pointer",
                      letterSpacing: "0.04em",
                      background: emailMode === mode ? "var(--c-accent)" : "transparent",
                      color: emailMode === mode ? "var(--c-bg)" : "var(--c-muted)",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {mode === "signin" ? t("signInTitle") : t("signUpTitle")}
                  </button>
                ))}
              </div>

              {loginError && (
                <div style={{ background: "var(--c-danger-bg)", border: "1px solid var(--c-danger-text)", borderRadius: 8, color: "var(--c-danger-text)", fontSize: 14, padding: "10px 14px", marginBottom: 14, textAlign: "left" }}>
                  {loginError}
                </div>
              )}

              <input
                type="email" placeholder="Email" value={loginEmail}
                onChange={e => { setLoginError(""); setLoginEmail(e.target.value); }}
                onKeyDown={e => e.key === "Enter" && (emailMode === "signin" ? handleLogin() : handleSignUp())}
                style={inputStyle}
              />
              <input
                type="password" placeholder={t("signInTitle") === "Sign In" ? "Password" : t("newPassword")}
                value={loginPassword}
                onChange={e => { setLoginError(""); setLoginPassword(e.target.value); }}
                onKeyDown={e => e.key === "Enter" && (emailMode === "signin" ? handleLogin() : handleSignUp())}
                style={emailMode === "signup" ? inputStyle : { ...inputStyle, marginBottom: 20 }}
              />
              {emailMode === "signup" && (
                <input
                  type="password" placeholder={t("confirmPassword")}
                  value={loginConfirmPassword}
                  onChange={e => { setLoginError(""); setLoginConfirmPassword(e.target.value); }}
                  onKeyDown={e => e.key === "Enter" && handleSignUp()}
                  style={{ ...inputStyle, marginBottom: 20 }}
                />
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button style={{ ...bigBtn(), flex: 1 }} onClick={emailMode === "signin" ? handleLogin : handleSignUp}>
                  {emailMode === "signin" ? t("signInTitle") : t("signUpTitle")}
                </button>
                <button style={{ ...bigBtn("ghost"), flex: 1 }} onClick={closeEmailModal}>{t("cancel")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fix #11: never show a blank screen — show a recoverable loading state
  if (!ready) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
      <div style={{ fontSize: 13, color: "var(--c-muted)", fontFamily: "'Geist Mono'" }}>Loading…</div>
    </div>
  );

  const TABS = [
    { id: "dashboard", label: t("navDashboard") },
    { id: "monthly", label: t("navMonthly") },
    { id: "accounts", label: t("navAccounts") },
    { id: "goals", label: t("navGoals") },
    { id: "garden", label: t("navGarden") },
    { id: "settings", label: t("navSettings") },
  ];

  return (
    <div style={{ ...S.app, wordBreak: lang === "ko" ? "keep-all" : "normal" }}>
      {showConfetti && <Confetti width={width} height={height} recycle={false} style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }} />}
      {dataError && ( // Fix #8: surface Firestore parse errors visibly
        <div style={{ background: "var(--c-danger-bg)", color: "var(--c-danger-text)", borderBottom: "1px solid var(--c-danger-text)", padding: "10px 20px", fontSize: 13, fontFamily: "'Geist Mono'", textAlign: "center" }}>
          {lang === "ko" ? "데이터를 불러오는 데 실패했습니다. 페이지를 새로고침 해주세요." : "Failed to load your data. Please refresh the page."}
          <button onClick={() => window.location.reload()} style={{ marginLeft: 12, background: "none", border: "1px solid var(--c-danger-text)", borderRadius: 6, color: "var(--c-danger-text)", cursor: "pointer", fontSize: 12, padding: "2px 10px" }}>Refresh</button>
        </div>
      )}
      <nav style={S.nav} className="m-nav">
        <div style={S.navBrand} className="m-nav-brand">{lang === "ko" ? "돈줄" : "Don Jul"}</div>
        {TABS.map(tab_ => {
          const tourClass = tab_.id === 'settings' ? ' tour-income-setup' : tab_.id === 'accounts' ? ' tour-add-account' : tab_.id === 'goals' ? ' tour-add-goal' : '';
          return <button key={tab_.id} style={S.navTab(tab === tab_.id)} className={"m-nav-tab" + (tab === tab_.id ? " m-nav-tab-active" : "") + tourClass} onClick={() => setTab(tab_.id)}>{tab_.label}</button>;
        })}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }} className="m-nav-user">
          <span style={{ fontSize: 12, color: "var(--c-muted)", fontFamily: "'JetBrains Mono', monospace" }}>{user.email}</span>
          <button style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, fontFamily: "'Syne'", borderRadius: 6, cursor: "pointer", border: "none", background: "var(--c-btn-sm-bg)", color: "var(--c-btn-sm-text)", letterSpacing: "0.04em" }} onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </nav>
      {tab === "dashboard" && <Dashboard state={state} t={t} lang={lang} currency={currency} />}
      {tab === "monthly" && <MonthlyView state={state} dispatch={dispatch} t={t} lang={lang} currency={currency} />}
      {tab === "accounts" && <Accounts state={state} dispatch={dispatch} t={t} lang={lang} currency={currency} onGoalComplete={() => { setTab("goals"); triggerConfetti(); }} />}
      {tab === "goals" && <Goals state={state} dispatch={dispatch} t={t} lang={lang} currency={currency} triggerConfetti={triggerConfetti} />}
      {tab === "garden" && <Garden state={state} t={t} currency={currency} />}
      {tab === "settings" && <Settings state={state} dispatch={dispatch} theme={theme} toggleTheme={toggleTheme} t={t} lang={lang} setLang={setLang} currency={currency} setCurrency={setCurrency} onBeforeDeleteAccount={() => firestoreUnsubRef.current()} onStartTour={() => setTourOpen(true)} user={user} />}
      {(!state.hasSeenOnboarding || tourOpen) && (
        <TourGuide t={t} onDone={() => { if (!state.hasSeenOnboarding) dispatch({ type: "SET_ONBOARDING_SEEN" }); setTourOpen(false); }} />
      )}
    </div>
  );
}

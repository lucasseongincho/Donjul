import { useState, useRef, useEffect } from 'react';
import { signOut, updatePassword, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase.js';
import { S } from '../styles.js';
import { formatMoney, getMonthlyIncome, newId } from '../utils/helpers.js';
import { Modal } from './shared.jsx';

let deferredPrompt = null;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isChromeOnIOS = isIOS && /CriOS/i.test(navigator.userAgent);

export default function Settings({ state, dispatch, theme, toggleTheme, t, lang, setLang, currency, setCurrency, onBeforeDeleteAccount, onStartTour, user }) {
  const fmt = (n) => formatMoney(n, currency);
  const fmtShort = (n) => formatMoney(n, currency, true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [modalError, setModalError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const pwTimerRef = useRef(null); // Fix #7
  useEffect(() => () => clearTimeout(pwTimerRef.current), []);

  const [canInstall, setCanInstall] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setCanInstall(false);
    deferredPrompt = null;
  };

  // Fix #12: derive from reactive `user` prop, not the non-reactive auth.currentUser
  const isEmailProvider = user?.providerData?.some(p => p.providerId === 'password');

  const handleChangePassword = () => {
    setPwError("");
    setPwSuccess(false);
    if (!newPassword || !confirmNewPassword) { setPwError("Please fill in both fields."); return; }
    if (newPassword !== confirmNewPassword) { setPwError(t("passwordMismatch")); return; }
    updatePassword(auth.currentUser, newPassword)
      .then(() => {
        setPwSuccess(true);
        setNewPassword("");
        setConfirmNewPassword("");
        clearTimeout(pwTimerRef.current);
        pwTimerRef.current = setTimeout(() => { setChangePwOpen(false); setPwSuccess(false); }, 2000);
      })
      .catch(e => {
        if (e.code === "auth/requires-recent-login") {
          setPwError(t("requiresRecentLogin"));
        } else if (e.code === "auth/weak-password") {
          setPwError("Password must be at least 6 characters.");
        } else {
          setPwError("Something went wrong. Please try again.");
        }
      });
  };
  const handleDeleteAccount = async () => {
    setDeleteError("");
    onBeforeDeleteAccount();
    // Fix #1: delete auth FIRST — if it fails, Firestore data is untouched and recoverable.
    // If auth succeeds but Firestore cleanup fails, the orphaned doc is inaccessible anyway.
    try {
      const uid = auth.currentUser.uid;
      await deleteUser(auth.currentUser);
      deleteDoc(doc(db, "user_data", uid)).catch(() => {}); // best-effort cleanup
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        signOut(auth);
      } else {
        setDeleteError("Something went wrong. Please try again.");
      }
    }
  };

  const { accounts, incomeSources, fixedBills, personalCategories } = state;

  const openAdd = (section) => { setModal({ section, item: null }); setForm({}); setModalError(""); };
  const openEdit = (section, item) => { setModal({ section, item }); setForm({ ...item }); setModalError(""); };
  const closeModal = () => { setModal(null); setForm({}); setModalError(""); };
  const setF = (k, v) => { setModalError(""); setForm(p => ({ ...p, [k]: v })); };

  const handleSave = () => {
    const { section, item } = modal;
    if (section === "accounts") {
      if (!form.name?.trim()) { setModalError("Account name is required."); return; }
      const entry = { id: item?.id || newId(), name: form.name || "Account", type: form.type || "checking", balance: parseFloat(form.balance) || 0, floor: parseFloat(form.floor) || 0 };
      dispatch({ type: item ? "EDIT_ACCOUNT" : "ADD_ACCOUNT", account: entry });
    } else if (section === "incomeSources") {
      if (!form.name?.trim()) { setModalError("Source name is required."); return; }
      if (!form.amount || parseFloat(form.amount) <= 0) { setModalError("Amount must be greater than 0."); return; }
      const entry = { id: item?.id || newId(), name: form.name || "Income", amount: parseFloat(form.amount) || 0, frequency: form.frequency || "monthly", anchorDate: form.anchorDate || "", payDay: (form.payDay != null && form.payDay !== "") ? +form.payDay : null };
      dispatch({ type: item ? "EDIT_INCOME" : "ADD_INCOME", source: entry });
    } else if (section === "fixedBills") {
      if (!form.name?.trim()) { setModalError("Bill name is required."); return; }
      if (!form.amount || parseFloat(form.amount) <= 0) { setModalError("Amount must be greater than 0."); return; }
      const entry = { id: item?.id || newId(), name: form.name || "Bill", amount: parseFloat(form.amount) || 0, dueDay: parseInt(form.dueDay) || 0 };
      dispatch({ type: item ? "EDIT_BILL" : "ADD_BILL", bill: entry });
    } else if (section === "personalCategories") {
      if (!form.name?.trim()) { setModalError("Category name is required."); return; }
      if (!form.budget || parseFloat(form.budget) <= 0) { setModalError("Budget must be greater than 0."); return; }
      const entry = { id: item?.id || newId(), name: form.name || "Category", budget: parseFloat(form.budget) || 0 };
      dispatch({ type: item ? "EDIT_CATEGORY" : "ADD_CATEGORY", category: entry });
    }
    closeModal();
  };

  const handleDelete = () => {
    const { section, item } = modal;
    const typeMap = { accounts: "DEL_ACCOUNT", incomeSources: "DEL_INCOME", fixedBills: "DEL_BILL", personalCategories: "DEL_CATEGORY" };
    dispatch({ type: typeMap[section], id: item.id });
    closeModal();
  };

  const Section = ({ title, items, section, renderItem }) => (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={S.cardTitle}>{title}</div>
        <button style={S.btn("sm")} onClick={() => openAdd(section)}>+ Add</button>
      </div>
      {items.length === 0 && <div style={{ fontSize: 12, color: "var(--c-muted)", padding: "8px 0" }}>{t("noneYet")}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--c-sub)", borderRadius: 6, gap: 8 }}>
            <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{renderItem(item)}</span>
            <button style={{ ...S.btn("sm"), flexShrink: 0 }} onClick={() => openEdit(section, item)}>{t("editLabel")}</button>
          </div>
        ))}
      </div>
    </div>
  );

  const FREQ_LABELS = { weekly: "Weekly", biweekly: "Biweekly", semimonthly: "2x/mo", monthly: "Monthly" };

  const renderModal = () => {
    if (!modal) return null;
    const { section, item } = modal;
    const isEdit = !!item;
    let fields = null;

    if (section === "accounts") fields = (
      <>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("accountNameLabel")}</div><input style={S.input} value={form.name || ""} onChange={e => setF("name", e.target.value)} placeholder={t("accountNamePlaceholder")} /></div>
        <div>
          <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("typeLabel")}</div>
          <select style={S.select} value={form.type || "checking"} onChange={e => setF("type", e.target.value)}>
            <option value="checking">{t("checkingType")}</option>
            <option value="savings">{t("savingsType")}</option>
            <option value="credit">{t("creditType")}</option>
            <option value="investment">{t("investmentType")}</option>
          </select>
        </div>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("currentBalanceLabel")}</div><input style={S.input} type="number" step="0.01" value={form.balance || ""} onChange={e => setF("balance", e.target.value)} placeholder="0.00" /></div>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("floorInputLabel")}</div><input style={S.input} type="number" step="0.01" value={form.floor || ""} onChange={e => setF("floor", e.target.value)} placeholder="e.g. 5000" /></div>
      </>
    );
    else if (section === "incomeSources") fields = (
      <>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("sourceNameLabel")}</div><input style={S.input} value={form.name || ""} onChange={e => setF("name", e.target.value)} placeholder={t("sourceNamePlaceholder")} /></div>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("amtPerPaycheck")}</div><input style={S.input} type="number" step="0.01" value={form.amount || ""} onChange={e => setF("amount", e.target.value)} placeholder="0.00" /></div>
        <div>
          <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("frequencyLabel")}</div>
          <select style={S.select} value={form.frequency || "monthly"} onChange={e => setF("frequency", e.target.value)}>
            <option value="weekly">{t("freqWeekly")}</option>
            <option value="biweekly">{t("freqBiweekly")}</option>
            <option value="semimonthly">{t("freqSemi")}</option>
            <option value="monthly">{t("freqMonthly")}</option>
          </select>
        </div>
        {form.frequency === "weekly" && (
          <div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("payDayLabel")}</div>
            <select style={S.select} value={form.payDay ?? ""} onChange={e => setF("payDay", e.target.value !== "" ? +e.target.value : "")}>
              <option value="">{t("selectDay")}</option>
              <option value={1}>{t("monday")}</option>
              <option value={2}>{t("tuesday")}</option>
              <option value={3}>{t("wednesday")}</option>
              <option value={4}>{t("thursday")}</option>
              <option value={5}>{t("friday")}</option>
              <option value={6}>{t("saturday")}</option>
              <option value={0}>{t("sunday")}</option>
            </select>
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 4 }}>{t("weeklyNote")}</div>
          </div>
        )}
        {form.frequency === "biweekly" && (
          <div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("anchorDateLabel")}</div>
            <input style={S.input} type="date" value={form.anchorDate || ""} onChange={e => setF("anchorDate", e.target.value)} />
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 4 }}>{t("biweeklyNote")}</div>
          </div>
        )}
      </>
    );
    else if (section === "fixedBills") fields = (
      <>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("billNameLabel")}</div><input style={S.input} value={form.name || ""} onChange={e => setF("name", e.target.value)} placeholder={t("billNamePlaceholder")} /></div>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("monthlyAmountLabel")}</div><input style={S.input} type="number" step="0.01" value={form.amount || ""} onChange={e => setF("amount", e.target.value)} placeholder="0.00" /></div>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("dueDayLabel")}</div><input style={S.input} type="number" min="1" max="31" value={form.dueDay || ""} onChange={e => setF("dueDay", e.target.value)} placeholder="e.g. 1" /></div>
      </>
    );
    else if (section === "personalCategories") fields = (
      <>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("categoryNameLabel")}</div><input style={S.input} value={form.name || ""} onChange={e => setF("name", e.target.value)} placeholder={t("categoryNamePlaceholder")} /></div>
        <div><div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("monthlyBudgetLabel")}</div><input style={S.input} type="number" step="0.01" value={form.budget || ""} onChange={e => setF("budget", e.target.value)} placeholder="0.00" /></div>
      </>
    );

    const labels = { accounts: t("modalAccount"), incomeSources: t("modalIncome"), fixedBills: t("modalBill"), personalCategories: t("modalCategory") };
    return (
      <Modal title={`${isEdit ? "Edit" : "Add"} ${labels[section]}`} onClose={closeModal}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields}
          {modalError && (
            <div style={{ background: "var(--c-danger-bg)", color: "var(--c-danger-text)", border: "1px solid var(--c-danger-text)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
              {modalError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button style={{ ...S.btn(), flex: 1 }} onClick={handleSave}>{isEdit ? t("saveChanges") : t("addLabel").replace("+ ", "")}</button>
            {isEdit && <button style={S.btn("danger")} onClick={handleDelete}>{t("deleteLabel")}</button>}
            <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={closeModal}>{t("cancel")}</button>
          </div>
        </div>
      </Modal>
    );
  };

  const now2 = new Date();
  const monthlyIncome = getMonthlyIncome(incomeSources, now2.getFullYear(), now2.getMonth() + 1);
  const totalFixed = fixedBills.reduce((s, b) => s + b.amount, 0);
  const totalPersonal = personalCategories.reduce((s, c) => s + c.budget, 0);
  const surplus = monthlyIncome - totalFixed - totalPersonal;

  return (
    <div style={S.page} className="m-page">
      <div style={S.pageTitle}>{t("settingsTitle")}</div>
      <div style={S.pageSub}>{t("settingsSub")}</div>

      {!isStandalone && (
        <div style={{ ...S.card, marginBottom: 24, borderColor: "var(--c-accent-faint)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 32, lineHeight: 1 }}>📲</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--c-text)", marginBottom: 2 }}>{t("installApp")}</div>
              <div style={{ fontSize: 12, color: "var(--c-muted)" }}>{t("installAppSub")}</div>
            </div>
          </div>
          {canInstall ? (
            <button
              style={{ ...S.btn('primary'), width: "100%", animation: "pulseGold 2s ease-in-out infinite" }}
              onClick={handleInstall}
            >
              {t("installAppBtn")}
            </button>
          ) : isIOS ? (
            <button style={{ ...S.btn('primary'), width: "100%" }} onClick={() => setShowIOSGuide(true)}>
              {t("installHowTo")}
            </button>
          ) : (
            <p style={{ fontSize: 13, color: "var(--c-dim)", lineHeight: 1.6, margin: 0 }}>
              {t("installBrowserSub")}
            </p>
          )}
        </div>
      )}

      {/* iOS step-by-step install guide modal */}
      {showIOSGuide && (
        <div style={S.overlay} onClick={() => setShowIOSGuide(false)}>
          <div style={{ ...S.modal, maxWidth: 360, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📲</div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{t("installHowToTitle")}</div>
            <div style={{ fontSize: 13, color: "var(--c-muted)", marginBottom: 24 }}>
              {isChromeOnIOS ? t("installHowToSubChrome") : t("installHowToSubSafari")}
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28, textAlign: "left" }}>
              {(isChromeOnIOS ? [
                { icon: "⋯", label: t("installChromeStep1") },
                { icon: "➕", label: t("installStep2") },
                { icon: "✓",  label: t("installStep3") },
              ] : [
                { icon: "⎙",  label: t("installSafariStep1") },
                { icon: "➕", label: t("installStep2") },
                { icon: "✓",  label: t("installStep3") },
              ]).map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "var(--c-accent-subtle)", border: "1.5px solid var(--c-accent-faint)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, color: "var(--c-accent)", fontWeight: 700,
                  }}>{step.icon}</div>
                  <div style={{ fontSize: 14, color: "var(--c-text)", lineHeight: 1.6, paddingTop: 6 }}>{step.label}</div>
                </div>
              ))}
            </div>

            {/* Animated arrow pointing to where the button lives */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, color: "var(--c-accent)", animation: "bounceDown 1.1s ease-in-out infinite" }}>↓</div>
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 4, letterSpacing: "0.04em" }}>
                {isChromeOnIOS ? t("installArrowChrome") : t("installArrowSafari")}
              </div>
            </div>

            <button style={{ ...S.btn(), width: "100%" }} onClick={() => setShowIOSGuide(false)}>
              {t("installGotIt")}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }} className="m-grid-2col">
        <Section title={t("accountsTitle")} items={accounts} section="accounts"
          renderItem={a => `${a.name} · ${fmtShort(a.balance)} (${a.type})`} />
        <Section title={t("incomeSourcesLabel")} items={incomeSources} section="incomeSources"
          renderItem={s => `${s.name} · ${fmt(s.amount)} ${FREQ_LABELS[s.frequency] || s.frequency}`} />
        <Section title={t("fixedBillsLabel")} items={fixedBills} section="fixedBills"
          renderItem={b => `${b.name} · ${fmt(b.amount)}/mo${b.dueDay ? ` · due ${b.dueDay}th` : ""}`} />
        <Section title={t("personalCatsLabel")} items={personalCategories} section="personalCategories"
          renderItem={c => `${c.name} · ${fmt(c.budget)}/mo`} />
      </div>

      <div style={{ ...S.card, marginBottom: 24 }}>
        <div style={S.cardTitle}>{t("budgetSummary")}</div>
        {/* Fix #2: use stable keys, not translated labels, for sign/format logic */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { key: "income",   label: t("monthlyIncome"),    val: monthlyIncome, color: "var(--c-green)",  sign: "+" },
            { key: "bills",    label: t("fixedBillsLabel"),  val: totalFixed,    color: "var(--c-accent)", sign: "-" },
            { key: "cats",     label: t("personalCatsLabel"),val: totalPersonal, color: "#4ECDC4",          sign: "-" },
            { key: "surplus",  label: t("surplusLabel"),     val: surplus,       color: surplus >= 0 ? "var(--c-green)" : "var(--c-red)" },
          ].map(({ key, label, val, color, sign }) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--c-border)" }}>
              <span style={{ fontSize: 13, color: "var(--c-dim)" }}>{label}</span>
              <span style={{ ...S.mono, color, fontWeight: 600 }}>
                {key === "surplus" ? fmt(val) : sign + fmt(Math.abs(val))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...S.card, marginBottom: 24 }}>
        <div style={S.cardTitle}>{t("appearanceLabel")}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: "var(--c-dim)" }}>{t("colorTheme")}</span>
          <button style={S.btn("sm")} onClick={toggleTheme}>
            {theme === "dark" ? t("lightMode") : t("darkMode")}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: "var(--c-dim)" }}>{t("languageLabel")}</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["en", "ko"].map(l => (
              <button key={l} style={{ ...S.btn(lang === l ? "primary" : "sm") }} onClick={() => setLang(l)}>
                {l === "en" ? "English" : "한국어"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "var(--c-dim)" }}>{t("currencyLabel")}</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["USD", "KRW"].map(c => (
              <button key={c} style={{ ...S.btn(currency === c ? "primary" : "sm") }} onClick={() => setCurrency(c)}>
                {t(c === "USD" ? "currencyUSD" : "currencyKRW")}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: "'Syne'", borderRadius: 6, cursor: "pointer", border: "none", background: "var(--c-btn-sm-bg)", color: "var(--c-btn-sm-text)", letterSpacing: "0.04em" }} onClick={onStartTour}>
          {t("takeTour")}
        </button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {isEmailProvider && (
          <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: "'Syne'", borderRadius: 6, cursor: "pointer", border: "none", background: "var(--c-btn-sm-bg)", color: "var(--c-btn-sm-text)", letterSpacing: "0.04em" }}
            onClick={() => { setChangePwOpen(true); setPwError(""); setPwSuccess(false); setNewPassword(""); setConfirmNewPassword(""); }}>
            {t("changePassword")}
          </button>
        )}
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: "'Syne'", borderRadius: 6, cursor: "pointer", border: "none", background: "var(--c-danger-bg)", color: "var(--c-danger-text)", letterSpacing: "0.04em" }} onClick={() => signOut(auth)}>{t("signOut")}</button>
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: "'Syne'", borderRadius: 6, cursor: "pointer", border: "none", background: "transparent", color: "var(--c-muted)", letterSpacing: "0.04em" }} onClick={() => { setDeleteOpen(true); setDeleteError(""); }}>{t("deleteAccountBtn")}</button>
      </div>

      {renderModal()}

      {deleteOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--c-overlay)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ ...S.modal, maxWidth: 400, textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🥺🍂</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "var(--c-text)", marginBottom: 12, lineHeight: 1.4 }}>{t("deleteAccountPhrase")}</div>
            {deleteError && (
              <div style={{ background: "var(--c-danger-bg)", color: "var(--c-danger-text)", border: "1px solid var(--c-danger-text)", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: "left" }}>
                {deleteError}
              </div>
            )}
            <button
              style={{ width: "100%", padding: "14px", fontSize: 15, fontWeight: 700, fontFamily: "'Geist'", borderRadius: 12, border: "none", cursor: "pointer", background: "var(--c-green)", color: "#fff", marginBottom: 12, letterSpacing: "0.02em" }}
              onClick={() => { setDeleteOpen(false); setDeleteError(""); }}
            >
              {t("deleteAccountStay")}
            </button>
            <button
              style={{ background: "none", border: "none", color: "var(--c-danger-text)", fontSize: 13, cursor: "pointer", fontFamily: "'Geist Mono'", width: "100%", padding: "8px 0" }}
              onClick={handleDeleteAccount}
            >
              {t("deleteAccountConfirm")}
            </button>
          </div>
        </div>
      )}

      {changePwOpen && (
        <Modal title={t("changePassword")} onClose={() => setChangePwOpen(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("newPassword")}</div>
              <input style={S.input} type="password" value={newPassword} onChange={e => { setPwError(""); setNewPassword(e.target.value); }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("confirmNewPassword")}</div>
              <input style={S.input} type="password" value={confirmNewPassword} onChange={e => { setPwError(""); setConfirmNewPassword(e.target.value); }} onKeyDown={e => e.key === "Enter" && handleChangePassword()} />
            </div>
            {pwError && (
              <div style={{ background: "var(--c-danger-bg)", color: "var(--c-danger-text)", border: "1px solid var(--c-danger-text)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div style={{ background: "rgba(80,200,120,0.12)", color: "var(--c-green)", border: "1px solid var(--c-green)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
                {t("passwordChanged")}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button style={{ ...S.btn(), flex: 1 }} onClick={handleChangePassword}>{t("saveChanges")}</button>
              <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={() => setChangePwOpen(false)}>{t("cancel")}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

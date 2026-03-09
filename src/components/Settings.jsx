import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { S } from '../styles.js';
import { formatMoney, getMonthlyIncome, newId } from '../utils/helpers.js';
import { Modal } from './shared.jsx';

export default function Settings({ state, dispatch, theme, toggleTheme, t, lang, setLang, currency, setCurrency }) {
  const fmt = (n) => formatMoney(n, currency);
  const fmtShort = (n) => formatMoney(n, currency, true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [modalError, setModalError] = useState("");
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
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            [t("monthlyIncome"), monthlyIncome, "var(--c-green)"],
            [t("fixedBillsLabel"), totalFixed, "var(--c-accent)"],
            [t("personalCatsLabel"), totalPersonal, "#4ECDC4"],
            [t("surplusLabel"), surplus, surplus >= 0 ? "var(--c-green)" : "var(--c-red)"],
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--c-border)" }}>
              <span style={{ fontSize: 13, color: "var(--c-dim)" }}>{l}</span>
              <span style={{ ...S.mono, color: c, fontWeight: 600 }}>{l === "Surplus" ? fmt(v) : (l === "Monthly Income" ? "+" : "-") + fmt(Math.abs(v))}</span>
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

      <div>
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, fontFamily: "'Syne'", borderRadius: 6, cursor: "pointer", border: "none", background: "var(--c-danger-bg)", color: "var(--c-danger-text)", letterSpacing: "0.04em" }} onClick={() => signOut(auth)}>{t("signOut")}</button>
      </div>

      {renderModal()}
    </div>
  );
}

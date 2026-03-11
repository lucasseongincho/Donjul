import { useState, useEffect, useRef } from 'react';
import { S } from '../styles.js';
import { formatMoney } from '../utils/helpers.js';

export default function Accounts({ state, dispatch, t, lang, currency, onGoalComplete }) {
  const fmt = (n) => formatMoney(n, currency);
  const fmtShort = (n) => formatMoney(n, currency, true);
  const currSymbol = currency === "KRW" ? "₩" : "$";
  const { accounts, goals = [] } = state;
  const [balances, setBalances] = useState(() => Object.fromEntries(accounts.map(a => [a.id, String(a.balance.toFixed(2))])));
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef(null); // Fix #7
  useEffect(() => () => clearTimeout(savedTimerRef.current), []); // Fix #7 cleanup

  // Fix #5: include balance in key so Firestore background updates refresh the inputs
  const accountsKey = accounts.map(a => `${a.id}:${a.balance}`).join(",");
  useEffect(() => {
    setBalances(Object.fromEntries(accounts.map(a => [a.id, String(a.balance.toFixed(2))])));
  }, [accountsKey]); // eslint-disable-line

  const handleSave = () => {
    let goalJustCompleted = false;
    accounts.forEach(a => {
      const val = parseFloat(balances[a.id]);
      if (!isNaN(val)) {
        dispatch({ type: "SET_BALANCE", id: a.id, balance: val });
        goals.forEach(g => {
          if (g.linkedAccountId === a.id && g.target > 0) {
            const wasBelow = (a.balance / g.target) < 1;
            const nowReached = (val / g.target) >= 1;
            if (wasBelow && nowReached) goalJustCompleted = true;
          }
        });
      }
    });
    if (goalJustCompleted) onGoalComplete?.();
    clearTimeout(savedTimerRef.current);
    setSaved(true);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  };

  if (accounts.length === 0) return (
    <div style={S.page} className="m-page">
      <div style={S.pageTitle}>{t("accountsTitle")}</div>
      <div style={S.pageSub}>{t("noAccounts")}</div>
    </div>
  );

  return (
    <div style={S.page} className="m-page">
      <div style={S.pageTitle}>{t("accountsTitle")}</div>
      <div style={S.pageSub}>{t("accountsSub")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }} className="m-grid-2col">
        {accounts.map(a => {
          const floor = a.floor || 0;
          const sweep = Math.max(0, a.balance - floor);
          return (
            <div key={a.id} style={S.card}>
              <div style={S.cardTitle}>{a.name}</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: floor > 0 ? 16 : 0 }}>
                <span style={{ fontSize: 24, fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>{currSymbol}</span>
                <input style={{ ...S.input, fontSize: 20, fontFamily: "'JetBrains Mono'", fontWeight: 600 }}
                  value={balances[a.id] || "0"}
                  onChange={e => setBalances(p => ({ ...p, [a.id]: e.target.value }))} />
              </div>
              {floor > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--c-muted)" }}>{t("floorKeep")}</span>
                    <span style={{ ...S.mono, color: "var(--c-accent)" }}>{fmt(floor)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--c-muted)" }}>{t("aboveFloor")}</span>
                    <span style={{ ...S.mono, color: sweep > 0 ? "var(--c-green)" : "var(--c-muted)" }}>{fmt(sweep)}</span>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 10 }}>{t(a.type + "Type")}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginBottom: 24 }}>
        <button style={S.btn()} onClick={handleSave}>{saved ? t("savedLabel") : t("updateBalances")}</button>
      </div>
      {accounts.filter(a => a.floor > 0 && (a.balance - a.floor) > 50).map(a => (
        <div key={a.id} style={{ ...S.card, borderLeft: "3px solid var(--c-accent)", background: "var(--c-accent-subtle)", marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--c-accent)" }}>{t("sweepReminderTitle")}{a.name}</div>
          <div style={{ fontSize: 13, color: "var(--c-dim)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--c-accent)" }}>{fmt(a.balance - a.floor)}</strong> {t("sweepAbove")} {lang !== "ko" && <>{fmtShort(a.floor)} {t("sweepFloor")} </>}{t("sweepConsider")}
          </div>
        </div>
      ))}
    </div>
  );
}

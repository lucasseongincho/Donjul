import { useState } from 'react';
import { S } from '../styles.js';
import { formatMoney, getMonthlyIncome, getPaycheckBadge, ALL_MONTHS, MNAMES } from '../utils/helpers.js';
import { StatCard, Tag, TxModal, CustomRowModal } from './shared.jsx';

export default function MonthlyView({ state, dispatch, t, lang, currency }) {
  const fmt = (n) => formatMoney(n, currency);
  const fmtShort = (n) => formatMoney(n, currency, true);
  const { incomeSources, fixedBills, personalCategories } = state;
  const now = new Date();
  const [selYr, setSelYr] = useState(now.getFullYear());
  const [selMo, setSelMo] = useState(now.getMonth() + 1);
  const moName = (m) => lang === "ko" ? `${m}월` : MNAMES[m];
  const [txModal, setTxModal] = useState(null);
  const [customModal, setCustomModal] = useState(null);

  const key = `${selYr}-${selMo}`;
  const mdata = state.months[key] || { transactions: {}, customRows: [] };
  const monthlyIncome = getMonthlyIncome(incomeSources, selYr, selMo);
  const getTx = (catKey) => mdata.transactions[catKey] || [];
  const getActual = (catKey) => getTx(catKey).reduce((s, x) => s + x.amt, 0);
  const saveTx = (catKey, items) => { dispatch({ type: "SET_TX", key, catKey, items }); setTxModal(null); };

  const allRows = [
    ...fixedBills.map(b => ({ key: `bill_${b.id}`, label: b.name, planned: b.amount, isFixed: true })),
    ...personalCategories.map(c => ({ key: `cat_${c.id}`, label: c.name, planned: c.budget, isFixed: false })),
  ];

  const totalPlanned = allRows.reduce((s, r) => s + r.planned, 0);
  const totalActual = allRows.reduce((s, r) => s + getActual(r.key), 0);
  const customRows = mdata.customRows || [];
  const customIncome = customRows.filter(r => r.type === "income").reduce((s, r) => s + getActual(`custom_${r.id}`), 0);
  const customExpense = customRows.filter(r => r.type === "expense").reduce((s, r) => s + getActual(`custom_${r.id}`), 0);
  const netIncome = monthlyIncome + customIncome;
  const netExpense = totalActual + customExpense;
  const netSurplus = netIncome - netExpense;

  const addCustomRow = (row) => { dispatch({ type: "ADD_CUSTOM_ROW", key, row }); setCustomModal(null); };
  const delCustomRow = (rowId) => dispatch({ type: "DEL_CUSTOM_ROW", key, rowId });
  const badge = getPaycheckBadge(incomeSources, selYr, selMo);

  return (
    <div style={S.page} className="m-page">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={S.pageTitle}>{t("monthlyTitle")}</div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
          <select style={{ ...S.select, width: "auto", minWidth: 130 }} value={selMo} onChange={e => setSelMo(+e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
              <option key={m} value={m}>{moName(m)}</option>
            ))}
          </select>
          <select style={{ ...S.select, width: "auto", minWidth: 90 }} value={selYr} onChange={e => setSelYr(+e.target.value)}>
            {[...new Set(ALL_MONTHS.map(([y]) => y))].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }} className="m-stat-grid">
        <StatCard label={t("income")} value={fmtShort(netIncome)} accent="var(--c-green)" color="var(--c-green)" />
        <StatCard label={t("plannedSpend")} value={fmtShort(totalPlanned)} accent="var(--c-accent)" />
        <StatCard label={t("actualSpend")} value={fmtShort(netExpense)} accent={netExpense > totalPlanned ? "var(--c-red)" : "#4ECDC4"} color={netExpense > totalPlanned ? "var(--c-red)" : "#4ECDC4"} />
        <StatCard label={t("netSurplus")} value={fmtShort(netSurplus)} accent={netSurplus >= 0 ? "var(--c-green)" : "var(--c-red)"} color={netSurplus >= 0 ? "var(--c-green)" : "var(--c-red)"} />
      </div>

      <div style={{ ...S.card, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={S.cardTitle}>{t("spendingCats")}</div>
          {badge && <span style={{ ...S.pill("var(--c-accent)"), fontSize: 11, fontWeight: 700 }}>⭐ {badge}</span>}
        </div>
        {allRows.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--c-muted)", textAlign: "center", padding: "20px 0" }}>{t("noCats")}</div>
        ) : (
          <div className="m-table-scroll"><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{[t("category"), t("typeCol"), t("planned"), t("actual"), t("diff"), ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {allRows.map(row => {
                const actual = getActual(row.key); const hasActual = actual > 0; const diff = actual - row.planned; const txCount = getTx(row.key).length;
                return (
                  <tr key={row.key} style={{ background: hasActual && diff > 1 ? "#3D151522" : hasActual && diff < -1 ? "#0D2B1A22" : "transparent" }}>
                    <td style={{ ...S.td, fontFamily: "'Geist'", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", minWidth: 130 }}>{row.label}</td>
                    <td style={{ ...S.td, fontSize: 11 }}><Tag color={row.isFixed ? "var(--c-accent)" : "var(--c-green)"}>{row.isFixed ? t("fixedTag") : t("variableTag")}</Tag></td>
                    <td style={{ ...S.td, color: "var(--c-dim)" }}>{fmt(row.planned)}</td>
                    <td style={{ ...S.td, color: hasActual ? (diff > 1 ? "var(--c-red)" : diff < -1 ? "var(--c-green)" : "var(--c-text)") : "var(--c-border)" }}>{hasActual ? fmt(actual) : "—"}</td>
                    <td style={{ ...S.td, color: diff > 1 ? "var(--c-red)" : diff < -1 ? "var(--c-green)" : "var(--c-muted)", fontSize: 12 }}>{hasActual ? (diff > 0 ? "+" : "") + fmt(diff) : "—"}</td>
                    <td style={S.td}><button style={S.btn("sm")} onClick={() => setTxModal({ catKey: row.key, catName: row.label })}>{txCount > 0 ? (lang === "ko" ? `✎ ${txCount}건` : `✎ ${txCount} tx`) : t("addLabel")}</button></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--c-sub)" }}>
                <td colSpan={2} style={{ ...S.td, fontWeight: 700, fontFamily: "'Geist'" }}>{t("totalLabel")}</td>
                <td style={{ ...S.td, color: "var(--c-accent)", fontWeight: 600 }}>{fmt(totalPlanned)}</td>
                <td style={{ ...S.td, color: totalActual > totalPlanned ? "var(--c-red)" : "var(--c-green)", fontWeight: 600 }}>{totalActual > 0 ? fmt(totalActual) : "—"}</td>
                <td style={{ ...S.td, color: "var(--c-muted)" }}>{totalActual > 0 ? (totalActual - totalPlanned > 0 ? "+" : "") + fmt(totalActual - totalPlanned) : "—"}</td>
                <td style={S.td}></td>
              </tr>
            </tfoot>
          </table></div>
        )}
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={S.cardTitle}>{t("customRows")}</div>
          <button style={S.btn("sm")} onClick={() => setCustomModal({})}>{t("addRow")}</button>
        </div>
        {customRows.length === 0 && <div style={{ fontSize: 13, color: "var(--c-muted)", textAlign: "center", padding: "20px 0" }}>{t("noCustomRows")}</div>}
        {customRows.length > 0 && (
          <div className="m-table-scroll"><table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{[t("nameLabel"), t("typeCol"), t("amountLabel"), ""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {customRows.map(row => {
                const txs = getTx(`custom_${row.id}`); const total = txs.reduce((s, x) => s + x.amt, 0);
                return (
                  <tr key={row.id}>
                    <td style={{ ...S.td, fontFamily: "'Geist'", fontWeight: 600, whiteSpace: "nowrap", minWidth: 130 }}>{row.name}</td>
                    <td style={S.td}><Tag color={row.type === "income" ? "var(--c-green)" : "var(--c-red)"}>{row.type === "income" ? t("inTag") : t("outTag")}</Tag></td>
                    <td style={{ ...S.td, color: row.type === "income" ? "var(--c-green)" : "var(--c-red)", fontWeight: 600 }}>{total > 0 ? (row.type === "income" ? "+" : "-") + fmt(total) : "—"}</td>
                    <td style={{ ...S.td, display: "flex", gap: 6 }}>
                      <button style={S.btn("sm")} onClick={() => setTxModal({ catKey: `custom_${row.id}`, catName: row.name })}>{txs.length > 0 ? (lang === "ko" ? `✎ ${txs.length}건` : `✎ ${txs.length} tx`) : t("addLabel")}</button>
                      <button style={S.btn("sm")} onClick={() => setCustomModal(row)}>✎</button>
                      <button style={{ ...S.btn("danger"), padding: "5px 8px", fontSize: 11 }} onClick={() => delCustomRow(row.id)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>

      {txModal && <TxModal catKey={txModal.catKey} catName={txModal.catName} transactions={mdata.transactions[txModal.catKey] || []} onSave={(items) => saveTx(txModal.catKey, items)} onClose={() => setTxModal(null)} t={t} currency={currency} />}
      {customModal !== null && (
        <CustomRowModal row={customModal.id ? customModal : null} t={t}
          onSave={(row) => { if (customModal.id) dispatch({ type: "EDIT_CUSTOM_ROW", key, row }); else addCustomRow(row); setCustomModal(null); }}
          onClose={() => setCustomModal(null)} />
      )}
    </div>
  );
}

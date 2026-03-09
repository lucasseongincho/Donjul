import { useState } from 'react';
import { S } from '../styles.js';
import { formatMoney, newId } from '../utils/helpers.js';

export function ProgressBar({ pct, color = "var(--c-accent)" }) {
  return (
    <div style={S.progressTrack}>
      <div style={{ width: `${Math.min(100, pct)}%`, background: color, height: "100%", borderRadius: 4, transition: "width .4s" }} />
    </div>
  );
}

export function StatCard({ label, value, sub, color, accent }) {
  return (
    <div style={{ ...S.card, borderLeft: `3px solid ${accent || "var(--c-accent)"}` }}>
      <div style={S.cardTitle}>{label}</div>
      <div style={{ ...S.statVal, color: color || "var(--c-text)" }}>{value}</div>
      {sub && <div style={S.statLabel}>{sub}</div>}
    </div>
  );
}

export function Tag({ children, color = "var(--c-accent)" }) {
  return <span style={S.pill(color)}>{children}</span>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
          <button style={{ ...S.btn("ghost"), fontSize: 18, padding: 4 }} onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TxModal({ catKey, catName, transactions, onSave, onClose, t, currency }) {
  const fmtAmt = (n) => formatMoney(n, currency);
  const [items, setItems] = useState(transactions || []);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const add = () => {
    if (!amt || isNaN(+amt)) return;
    setItems(p => [...p, { id: newId(), desc: desc || catName, amt: +amt }]);
    setDesc(""); setAmt("");
  };
  const del = (id) => setItems(p => p.filter(x => x.id !== id));
  const total = items.reduce((s, x) => s + x.amt, 0);
  return (
    <Modal title={`${catName} — ${t("txModalTitle")}`} onClose={onClose}>
      <div style={{ marginBottom: 16, padding: 12, background: "var(--c-sub)", borderRadius: 6, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--c-muted)" }}>{t("txTotal")}</span>
        <span style={{ ...S.mono, fontWeight: 600, color: "var(--c-accent)", fontSize: 16 }}>{fmtAmt(total)}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input style={{ ...S.input, flex: 2 }} placeholder={t("descriptionLabel")} value={desc} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <input style={{ ...S.input, flex: 1 }} placeholder="$0.00" value={amt} onChange={e => setAmt(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button style={S.btn()} onClick={add}>{t("txAddBtn")}</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 260, overflowY: "auto" }}>
        {items.length === 0 && <div style={{ fontSize: 12, color: "var(--c-muted)", textAlign: "center", padding: 20 }}>{t("noTxYet")}</div>}
        {items.map(tx => (
          <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--c-sub)", borderRadius: 6 }}>
            <span style={{ fontSize: 13 }}>{tx.desc}</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ ...S.mono, color: "var(--c-accent)", fontSize: 13 }}>{fmtAmt(tx.amt)}</span>
              <button style={{ ...S.btn("danger"), padding: "2px 8px", fontSize: 11 }} onClick={() => del(tx.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button style={{ ...S.btn(), flex: 1 }} onClick={() => onSave(items)}>{t("save")}</button>
        <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={onClose}>{t("cancel")}</button>
      </div>
    </Modal>
  );
}

export function CustomRowModal({ row, onSave, onClose, t }) {
  const [name, setName] = useState(row?.name || "");
  const [type, setType] = useState(row?.type || "expense");
  return (
    <Modal title={row ? t("editRowTitle") : t("addCustomRowTitle")} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 6, letterSpacing: "0.08em" }}>{t("rowNameLabel")}</div>
          <input style={S.input} placeholder="e.g. Bonus, Side Income, One-off expense..." value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 8, letterSpacing: "0.08em" }}>{t("rowTypeLabel")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["expense", "income"].map(tp => (
              <button key={tp} style={{ ...S.btn(type === tp ? "primary" : "sm"), flex: 1 }} onClick={() => setType(tp)}>{tp === "income" ? t("moneyIn") : t("moneyOut")}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button style={{ ...S.btn(), flex: 1 }} onClick={() => name && onSave({ id: row?.id || newId(), name, type })}>{t("save")}</button>
          <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={onClose}>{t("cancel")}</button>
        </div>
      </div>
    </Modal>
  );
}

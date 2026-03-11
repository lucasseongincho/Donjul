import { useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { S } from '../styles.js';
import { formatMoney, newId } from '../utils/helpers.js';
import { ProgressBar, Modal } from './shared.jsx';

const COLORS = ["#C9A84C", "#4ECDC4", "#88D8B0", "#FF8B94", "#A8E6CF", "#96CEB4", "#45B7D1", "#FF6B6B", "#DDA0DD"];

export default function Goals({ state, dispatch, t, lang, currency }) {
  const fmt = (n) => formatMoney(n, currency);
  const fmtShort = (n) => formatMoney(n, currency, true);
  const { goals, accounts } = state;
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editingPrevPct, setEditingPrevPct] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: "", saved: "", color: "#C9A84C", linkedAccountId: "" });
  const [addError, setAddError] = useState("");

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const updateGoal = (id, field, val) => dispatch({ type: "UPDATE_GOAL", id, field, val });
  const deleteGoal = (id) => dispatch({ type: "DELETE_GOAL", id });
  const addGoal = () => {
    if (!newGoal.name?.trim()) { setAddError(t("goalNamePlaceholder") + " — " + "required."); return; }
    if (!newGoal.target || +newGoal.target <= 0) { setAddError(t("targetAmountLabel") + " must be greater than 0."); return; }
    const savedAmt = +(newGoal.saved) || 0;
    const targetAmt = +newGoal.target;
    dispatch({ type: "ADD_GOAL", goal: { id: newId(), name: newGoal.name, target: targetAmt, saved: savedAmt, color: newGoal.color, linkedAccountId: newGoal.linkedAccountId || "" } });
    if (savedAmt >= targetAmt) triggerConfetti();
    setNewGoal({ name: "", target: "", saved: "", color: "#C9A84C", linkedAccountId: "" }); setAddError(""); setAdding(false);
  };

  return (
    <div style={S.page} className="m-page">
      {showConfetti && <Confetti width={width} height={height} recycle={false} style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={S.pageTitle}>{t("goalsTitle")}</div>
          <div style={S.pageSub}>{t("goalsSub")}</div>
        </div>
        <button style={S.btn()} onClick={() => { setAdding(true); setAddError(""); }}>{t("newGoal")}</button>
      </div>
      {goals.length === 0 && <div style={{ ...S.card, fontSize: 13, color: "var(--c-muted)", textAlign: "center", padding: "40px 20px" }}>{t("noGoals")}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {goals.map(g => {
          const linkedAccount = g.linkedAccountId ? accounts.find(a => a.id === g.linkedAccountId) : null;
          const effectiveSaved = linkedAccount ? linkedAccount.balance : g.saved;
          const pct = g.target ? Math.min(100, (effectiveSaved / g.target) * 100) : 0;
          const remaining = Math.max(0, g.target - effectiveSaved);
          const isEditing = editing === g.id;
          return (
            <div key={g.id} style={{ ...S.card, borderLeft: `3px solid ${g.color}` }}>
              {isEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Goal name — full width */}
                  <input
                    style={{ ...S.input, width: "100%", fontSize: 15, fontWeight: 700 }}
                    value={g.name}
                    onChange={e => updateGoal(g.id, "name", e.target.value)}
                    placeholder={t("goalNamePlaceholder")}
                  />
                  {/* Color picker — stacked below name */}
                  <div>
                    <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 6 }}>{t("pickColorLabel")}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {COLORS.map(c => (
                        <div key={c} onClick={() => updateGoal(g.id, "color", c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: g.color === c ? "2px solid var(--c-text)" : "2px solid transparent" }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("targetLabel")}</div>
                      <input style={S.input} type="number" value={g.target} onChange={e => updateGoal(g.id, "target", +e.target.value)} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("savedSoFarLabel")}</div>
                      <input
                        style={{ ...S.input, opacity: g.linkedAccountId ? 0.4 : 1 }}
                        type="number"
                        value={g.linkedAccountId ? (linkedAccount?.balance ?? g.saved) : g.saved}
                        onChange={e => updateGoal(g.id, "saved", +e.target.value)}
                        disabled={!!g.linkedAccountId}
                      />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 5 }}>{t("linkAccountLabel")}</div>
                    <select
                      style={S.select}
                      value={g.linkedAccountId || ""}
                      onChange={e => updateGoal(g.id, "linkedAccountId", e.target.value)}
                    >
                      <option value="">{t("manualEntryLabel")}</option>
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} — {fmtShort(a.balance)}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={S.btn()} onClick={() => {
                      const newPct = g.target ? Math.min(100, (effectiveSaved / g.target) * 100) : 0;
                      if (newPct >= 100 && editingPrevPct < 100) triggerConfetti();
                      setEditing(null);
                    }}>{t("save")}</button>
                    <button style={S.btn("danger")} onClick={() => { deleteGoal(g.id); setEditing(null); }}>{t("deleteLabel")}</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>{g.name}</div>
                      {linkedAccount && (
                        <div style={{ fontSize: 11, color: "var(--c-accent)", fontWeight: 600, marginBottom: 4, letterSpacing: "0.04em" }}>
                          ⟳ {linkedAccount.name}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: "var(--c-muted)", ...S.mono, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lang === "ko"
                          ? `현재 ${fmt(effectiveSaved)} · 남은 금액 ${fmt(remaining)}`
                          : `${fmt(effectiveSaved)} saved · ${fmt(remaining)} to go`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ ...S.mono, fontSize: 22, fontWeight: 700, color: g.color }}>{pct.toFixed(0)}%</span>
                      <button style={S.btn("sm")} onClick={() => { setEditingPrevPct(pct); setEditing(g.id); }}>{t("editLabel")}</button>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={g.color} />
                  {pct >= 100 && <div style={{ marginTop: 8, fontSize: 12, color: g.color, fontWeight: 600 }}>{t("goalReached")}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {adding && (
        <Modal title={t("newGoalTitle")} onClose={() => { setAdding(false); setAddError(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              style={S.input}
              placeholder={t("goalNamePlaceholder")}
              value={newGoal.name}
              onChange={e => { setAddError(""); setNewGoal({ ...newGoal, name: e.target.value }); }}
            />
            <input
              style={S.input}
              type="number"
              placeholder={t("targetAmountLabel")}
              value={newGoal.target}
              onChange={e => { setAddError(""); setNewGoal({ ...newGoal, target: e.target.value }); }}
            />
            <div>
              <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 6 }}>{t("linkAccountLabel")}</div>
              <select
                style={S.select}
                value={newGoal.linkedAccountId}
                onChange={e => setNewGoal({ ...newGoal, linkedAccountId: e.target.value, saved: "" })}
              >
                <option value="">{t("manualEntryLabel")}</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {fmtShort(a.balance)}</option>
                ))}
              </select>
            </div>
            {!newGoal.linkedAccountId && (
              <input
                style={S.input}
                type="number"
                placeholder={t("alreadySavedLabel")}
                value={newGoal.saved}
                onChange={e => setNewGoal({ ...newGoal, saved: e.target.value })}
              />
            )}
            <div style={{ fontSize: 11, color: "var(--c-muted)" }}>{t("pickColorLabel")}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setNewGoal({ ...newGoal, color: c })} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: newGoal.color === c ? "2px solid var(--c-text)" : "2px solid transparent" }} />
              ))}
            </div>
            {addError && (
              <div style={{ background: "var(--c-danger-bg)", color: "var(--c-danger-text)", border: "1px solid var(--c-danger-text)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
                {addError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={{ ...S.btn(), flex: 1 }} onClick={addGoal}>{t("newGoal")}</button>
              <button style={{ ...S.btn("ghost"), flex: 1 }} onClick={() => { setAdding(false); setAddError(""); }}>{t("cancel")}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

import { S } from '../styles.js';
import { formatMoney, getMonthlyIncome, getPaycheckBadge, ALL_MONTHS, MNAMES } from '../utils/helpers.js';
import { StatCard, ProgressBar } from './shared.jsx';

export default function Dashboard({ state, t, lang, currency }) {
  const fmt = (n) => formatMoney(n, currency);
  const fmtShort = (n) => formatMoney(n, currency, true);
  const { accounts, incomeSources, fixedBills, personalCategories, goals } = state;
  const now = new Date();
  const curYr = now.getFullYear(), curMo = now.getMonth() + 1;
  const monthlyIncome = getMonthlyIncome(incomeSources, curYr, curMo);
  const totalFixed = fixedBills.reduce((s, b) => s + b.amount, 0);
  const totalPersonal = personalCategories.reduce((s, c) => s + c.budget, 0);
  const surplus = monthlyIncome - totalFixed - totalPersonal;
  const upcoming = ALL_MONTHS.filter(([y, m]) => y > curYr || (y === curYr && m >= curMo)).slice(0, 6);
  const isEmpty = accounts.length === 0 && incomeSources.length === 0;
  const badge = getPaycheckBadge(incomeSources, curYr, curMo);
  const moName = (m) => lang === "ko" ? `${m}월` : MNAMES[m];

  return (
    <div style={S.page} className="m-page">
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <div style={S.pageTitle}>{t("dashTitle")}</div>
        {badge && <span style={{ ...S.pill("var(--c-accent)"), fontSize: 11, fontWeight: 700 }}>⭐ {badge}</span>}
      </div>
      <div style={S.pageSub}>{moName(curMo)} {curYr}</div>

      {isEmpty && (
        <div style={{ ...S.card, borderLeft: "3px solid var(--c-accent)", background: "var(--c-accent-subtle)", marginBottom: 28 }}>
          <div style={{ fontWeight: 700, color: "var(--c-accent)", marginBottom: 6 }}>{t("welcomeTitle")}</div>
          <div style={{ fontSize: 13, color: "var(--c-dim)", lineHeight: 1.7 }}>{t("welcomeBody")}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 28 }} className="m-stat-grid">
        {accounts.map(a => (
          <StatCard key={a.id} label={a.name} value={fmtShort(a.balance)} sub={t(a.type + "Type")} accent={a.type === "savings" ? "var(--c-accent)" : "#4ECDC4"} />
        ))}
        <StatCard label={t("monthlyIncome")} value={fmtShort(monthlyIncome)} sub={lang === "ko" ? `${incomeSources.length}개 수입원` : `${incomeSources.length} source${incomeSources.length !== 1 ? "s" : ""}`} accent="var(--c-green)" color="var(--c-green)" />
        <StatCard label={t("plannedSurplus")} value={fmtShort(surplus)} sub={t("incomeMinusPlanned")} accent={surplus >= 0 ? "var(--c-green)" : "var(--c-red)"} color={surplus >= 0 ? "var(--c-green)" : "var(--c-red)"} />
      </div>

      {goals.length > 0 && (
        <div style={{ ...S.card, marginBottom: 28 }}>
          <div style={S.cardTitle}>{t("goalProgress")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {goals.slice(0, 5).map(g => {
              const pct = g.target ? Math.min(100, (g.saved / g.target) * 100) : 0;
              return (
                <div key={g.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</span>
                    <span style={{ ...S.mono, fontSize: 13, color: "var(--c-muted)" }}>{fmtShort(g.saved)} / {fmtShort(g.target)} <span style={{ color: g.color }}>{pct.toFixed(0)}%</span></span>
                  </div>
                  <ProgressBar pct={pct} color={g.color} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={S.card}>
        <div style={S.cardTitle}>{t("upcomingMonths")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
          {upcoming.map(([y, m]) => {
            const isCurrent = y === curYr && m === curMo;
            const moIncome = getMonthlyIncome(incomeSources, y, m);
            const moBadge = getPaycheckBadge(incomeSources, y, m);
            return (
              <div key={`${y}-${m}`} style={{ background: "var(--c-sub)", borderRadius: 6, padding: "10px 12px", border: `1px solid ${isCurrent ? "var(--c-accent)" : "var(--c-border)"}` }}>
                <div style={{ fontSize: 11, color: isCurrent ? "var(--c-accent)" : "var(--c-muted)", fontWeight: 700, marginBottom: 4 }}>{moName(m)} {y}{isCurrent ? " — " + t("nowLabel") : ""}</div>
                <div style={{ fontSize: 12, ...S.mono, color: "var(--c-dim)" }}>{fmtShort(moIncome)}/mo</div>
                {moBadge && <div style={{ fontSize: 10, color: "var(--c-accent)", marginTop: 3, fontWeight: 700 }}>⭐ {moBadge}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

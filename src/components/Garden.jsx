import { S } from '../styles.js';
import MoneyTreeSVG from './MoneyTreeSVG.jsx';
import { formatMoney } from '../utils/helpers.js';

const FRUITS = ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥝", "🍐", "🥥"];

export default function Garden({ state, t, currency }) {
  const fmt = (n) => formatMoney(n, currency);
  const harvested = state.harvested_goals || [];
  const total = harvested.reduce((s, g) => s + (g.target || 0), 0);

  return (
    <div style={S.page} className="m-page">
      <div style={S.pageTitle}>{t("gardenTitle")}</div>
      <div style={S.pageSub}>{t("gardenSub")}</div>

      {/* Tree + lifetime stat */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <MoneyTreeSVG />
        <div style={{ ...S.card, marginTop: 20, padding: "20px 24px" }}>
          <div style={{ ...S.statVal, fontSize: 32 }}>{fmt(total)}</div>
          <div style={{ ...S.statLabel, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {t("lifetimeWealthGrown")}
          </div>
        </div>
      </div>

      {/* Harvested goals grid */}
      {harvested.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🧺</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--c-text)", marginBottom: 8 }}>
            {t("gardenEmptyTitle")}
          </div>
          <div style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.7 }}>
            {t("gardenEmptyBody")}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
          {harvested.map((g, i) => (
            <div key={g.id || i} style={{ ...S.card, textAlign: "center", borderTop: `3px solid ${g.color || "#C9A84C"}` }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>{g.fruit || FRUITS[i % FRUITS.length]}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)", marginBottom: 6 }}>{g.name}</div>
              <div style={{ fontFamily: "'Geist Mono'", fontSize: 15, fontWeight: 600, color: g.color || "var(--c-accent)" }}>
                {fmt(g.target)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

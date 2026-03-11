export const MNAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const newId = () => Math.random().toString(36).slice(2, 9);

export const fmt = (n) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export const fmtShort = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export function formatMoney(amount, currency, short = false) {
  if (amount == null) return "—";
  if (currency === "KRW") {
    return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }
  const dp = short ? 0 : 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: dp, maximumFractionDigits: dp }).format(amount);
}

// Count occurrences of a specific weekday (0=Sun,1=Mon,...,6=Sat) in a month
export function countWeeklyPaydays(dayOfWeek, year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const first = (dayOfWeek - firstDay + 7) % 7 + 1;
  let count = 0;
  for (let d = first; d <= daysInMonth; d += 7) count++;
  return count; // always 4 or 5
}

// Count biweekly paydays in a month by iterating +14 days from an anchor date.
export function countBiweeklyPaydays(anchorDateStr, year, month) {
  if (!anchorDateStr) return null;
  const [ay, am, ad] = anchorDateStr.split("-").map(Number);
  const anchorMs = Date.UTC(ay, am - 1, ad, 12, 0, 0);
  const monthStartMs = Date.UTC(year, month - 1, 1);
  const monthEndMs = Date.UTC(year, month, 1) - 1;
  const step = 14 * 86400000;
  const stepsNeeded = Math.ceil((monthStartMs - anchorMs) / step);
  let d = anchorMs + stepsNeeded * step;
  let count = 0;
  while (d <= monthEndMs) { count++; d += step; }
  return count; // 2 or 3
}

export function getMonthlyIncome(sources, year, month) {
  return sources.reduce((s, src) => {
    let count;
    if (src.frequency === "weekly" && src.payDay != null) {
      count = countWeeklyPaydays(src.payDay, year, month);
    } else if (src.frequency === "biweekly" && src.anchorDate) {
      count = countBiweeklyPaydays(src.anchorDate, year, month) ?? 2;
    } else {
      const mult = { weekly: 4.333, biweekly: 2.167, semimonthly: 2, monthly: 1 };
      count = mult[src.frequency] || 1;
    }
    return s + src.amount * count;
  }, 0);
}

export function getPaycheckBadge(incomeSources, year, month) {
  for (const src of incomeSources) {
    if (src.frequency === "weekly" && src.payDay != null) {
      if (countWeeklyPaydays(src.payDay, year, month) >= 5) return "5-Paycheck Month!";
    } else if (src.frequency === "biweekly" && src.anchorDate) {
      if ((countBiweeklyPaydays(src.anchorDate, year, month) ?? 0) >= 3) return "3-Paycheck Month!";
    }
  }
  return null;
}

export function getMonthRange() {
  const now = new Date();
  const result = [];
  for (let i = -12; i <= 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push([d.getFullYear(), d.getMonth() + 1]);
  }
  return result;
}

export const ALL_MONTHS = getMonthRange();

export function buildDefault() {
  return { accounts: [], incomeSources: [], fixedBills: [], personalCategories: [], goals: [], harvested_goals: [], months: {}, hasSeenOnboarding: false };
}

export function migrateFromOld(saved) {
  const s = saved.settings || {};
  const oldAcc = saved.accounts || {};
  const accounts = [];
  if (oldAcc.td != null) accounts.push({ id: "td", name: "TD Checking", type: "checking", balance: oldAcc.td, floor: 5000 });
  if (oldAcc.co != null) accounts.push({ id: "co", name: "Capital One 360", type: "savings", balance: oldAcc.co, floor: 0 });
  const incomeSources = [];
  if (s.paycheck) incomeSources.push({ id: "paycheck", name: "Paycheck", amount: s.paycheck, frequency: "biweekly" });
  const fixedBills = [];
  if (s.rent) fixedBills.push({ id: "rent", name: "Rent", amount: s.rent, dueDay: 1 });
  if (s.lease) fixedBills.push({ id: "lease", name: "Car Lease", amount: s.lease, dueDay: 1 });
  const insAmt = s.insuranceLow || s.insuranceHigh || 0;
  if (insAmt) fixedBills.push({ id: "insurance", name: "Insurance", amount: insAmt, dueDay: 1 });
  if (s.loan) fixedBills.push({ id: "loan", name: "Student Loan", amount: s.loan, dueDay: 1 });
  if (s.giving) fixedBills.push({ id: "giving", name: "Giving", amount: s.giving, dueDay: 1 });
  const personalCategories = [];
  [["groceries", "Groceries"], ["dining", "Dining Out"], ["gas", "Gas"], ["clothes", "Clothes & Care"], ["dates", "Dates"], ["gifts", "Gifts & Holidays"], ["subs", "Subscriptions"], ["korea", "Korea Fund"]].forEach(([k, label]) => {
    if (s[k]) personalCategories.push({ id: k, name: label, budget: s[k] });
  });
  const billIds = new Set(fixedBills.map(b => b.id));
  const catIds = new Set(personalCategories.map(c => c.id));
  const newMonths = {};
  Object.entries(saved.months || {}).forEach(([mk, md]) => {
    const newTx = {};
    Object.entries(md.transactions || {}).forEach(([k, v]) => {
      if (billIds.has(k)) newTx[`bill_${k}`] = v;
      else if (catIds.has(k)) newTx[`cat_${k}`] = v;
      else newTx[k] = v;
    });
    newMonths[mk] = { ...md, transactions: newTx };
  });
  return { accounts, incomeSources, fixedBills, personalCategories, goals: saved.goals || [], months: newMonths };
}

export function loadSaved(saved) {
  if (!Array.isArray(saved.accounts)) return migrateFromOld(saved);
  const data = { ...buildDefault(), ...saved, months: { ...saved.months } };
  // Existing users who don't have the flag yet — skip onboarding if they already have data
  if (saved.hasSeenOnboarding === undefined && (data.accounts.length > 0 || data.incomeSources.length > 0 || data.goals.length > 0 || (data.harvested_goals || []).length > 0)) {
    data.hasSeenOnboarding = true;
  }
  return data;
}

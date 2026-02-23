export type PeriodFilter = "total" | "current_month" | "last_month";

export function normalizePeriodFilter(input?: string | null): PeriodFilter {
  const value = String(input ?? "").trim().toLowerCase();
  if (value === "current_month") return "current_month";
  if (value === "last_month") return "last_month";
  return "total";
}

export function getPeriodDateRange(period: PeriodFilter, now = new Date()) {
  if (period === "total") return { from: undefined as Date | undefined, to: undefined as Date | undefined };

  if (period === "current_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return { from, to };
  }

  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return { from, to };
}

export function buildCreatedAtWhere(period: PeriodFilter) {
  const { from, to } = getPeriodDateRange(period);
  if (!from || !to) return undefined;
  return { gte: from, lt: to };
}

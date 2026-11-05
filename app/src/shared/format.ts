export function formatAmount(value: string | number | null | undefined): string {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

/**
 * Sum a list of money values.
 *
 * Amounts are stored as Postgres `numeric(12,2)` but arrive as strings, and
 * adding them in JS binary floating point drifts: 0.03 + 0.09 + ... renders as
 * "106.05000000000001". Summing in paise (integer cents) and dividing back
 * keeps the result exact for any realistic ledger size.
 */
export function sumAmounts(
  values: Array<string | number | null | undefined>,
): number {
  const paise = values.reduce<number>((total, value) => {
    const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
    return total + (Number.isFinite(n) ? Math.round(n * 100) : 0);
  }, 0);
  return paise / 100;
}

/** Currency string for a money value, always with exactly two decimals. */
export function formatCurrency(value: string | number | null | undefined): string {
  return `₹${formatAmount(value)}`;
}

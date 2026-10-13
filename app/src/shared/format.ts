export function formatAmount(value: string | number | null | undefined): string {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

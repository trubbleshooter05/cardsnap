export function formatUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) {
    return "—";
  }
  const rounded = Math.round(n);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(rounded);
}

/** For ROI lines, e.g. +$1,200 or −$85 */
export function formatUsdSigned(n: number): string {
  if (Number.isNaN(n)) return "—";
  const rounded = Math.round(Math.abs(n));
  const s = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(rounded);
  if (n > 0) return `+${s}`;
  if (n < 0) return `−${s}`;
  return s;
}

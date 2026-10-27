/**
 * Helper universal para formateo de montos en Quetzales (GTQ).
 * Garantiza formato con 'Q', comas para miles y dos decimales.
 * Ej: 1500 -> "Q 1,500.00"
 */
export function formatQ(amount: number | null | undefined): string {
  const val = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return `Q ${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

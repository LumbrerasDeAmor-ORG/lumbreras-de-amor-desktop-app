// apps/desktop/src/lib/currency.ts
/**
 * Helper universal para estandarizar todos los montos monetarios en Quetzales (Q)
 * con comas para miles y dos posiciones decimales (ej: Q 1,250.00).
 */
export function formatQ(amount: number | null | undefined): string {
  const val = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return `Q ${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

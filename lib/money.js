export function formatMoney(cents, currencySymbol = "€") {
  const v = (cents ?? 0) / 100;
  return `${currencySymbol}${v.toFixed(2)}`;
}

export function calcTotals(items = [], taxRate = 0) {
  const safeItems = Array.isArray(items) ? items : [];

  const subtotalCents = safeItems.reduce(
    (s, it) => s + (Number(it.unitPriceCents || 0) + Number(it.extraPriceCents || 0)) * Number(it.quantity || 0),
    0
  );

  const taxCents = Math.round(subtotalCents * Number(taxRate || 0));
  const totalCents = subtotalCents + taxCents;

  return { subtotalCents, taxCents, totalCents };
}



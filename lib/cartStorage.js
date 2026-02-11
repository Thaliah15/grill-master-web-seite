const KEY = "cart";

function safeParse(raw) {
  try {
    const x = JSON.parse(raw);
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}

export function loadCart() {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  return safeParse(raw);
}

export function saveCart(items) {
  if (typeof window === "undefined") return;
  const safe = Array.isArray(items) ? items : [];
  localStorage.setItem(KEY, JSON.stringify(safe));
}

export function clearCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

/**
 * يدعم extras/options
 * cart item shape:
 * { productId, name, unitPriceCents, quantity, extraPriceCents, selectedOptionsJson }
 */
export function addToCart(product, opts = {}) {
  const cart = loadCart();

  const productId = product?.id;
  if (!productId) return cart;

  const extraPriceCents = Number(opts.extraPriceCents || 0);
  const selectedOptionsJson = opts.options ? JSON.stringify(opts.options) : null;

  // ✅ مفتاح تمييز: نفس المنتج + نفس الخيارات + نفس extra
  const key = `${productId}__${extraPriceCents}__${selectedOptionsJson || ""}`;

  const idx = cart.findIndex((it) => {
    const itKey = `${it.productId}__${Number(it.extraPriceCents || 0)}__${it.selectedOptionsJson || ""}`;
    return itKey === key;
  });

  let next;
  if (idx >= 0) {
    next = cart.map((it, i) =>
      i === idx ? { ...it, quantity: Number(it.quantity || 0) + 1 } : it
    );
  } else {
    next = [
      ...cart,
      {
        productId,
        name: product.name,
        unitPriceCents: Number(product.priceCents || 0),
        quantity: 1,
        extraPriceCents,
        selectedOptionsJson,
      },
    ];
  }

  saveCart(next);
  return next;
}

export function updateQty(productId, quantity, match = {}) {
  const q = Number(quantity);
  const safeQ = Number.isFinite(q) ? q : 0;

  const cart = loadCart();

  // إذا بدك تعديل على عنصر محدد بخياراته
  const extraPriceCents = match.extraPriceCents != null ? Number(match.extraPriceCents) : null;
  const selectedOptionsJson = match.selectedOptionsJson != null ? String(match.selectedOptionsJson) : null;

  const next = cart
    .map((it) => {
      if (it.productId !== productId) return it;

      if (extraPriceCents != null && Number(it.extraPriceCents || 0) !== extraPriceCents) return it;
      if (selectedOptionsJson != null && String(it.selectedOptionsJson || "") !== selectedOptionsJson) return it;

      return { ...it, quantity: safeQ };
    })
    .filter((it) => Number(it.quantity || 0) > 0);

  saveCart(next);
  return next;
}

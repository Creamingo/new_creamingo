const DRAFT_STORAGE_KEY = 'creamingo_midnight_wish_draft';

/**
 * Get current draft items from localStorage
 * @returns {Array}
 */
export function getMidnightWishDraft() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Add a product to the midnight wish draft
 * @param {{ id, name, slug, image_url, base_price, discounted_price }} product
 * @param {{ id, name, weight, price, discounted_price }?} variant
 * @param {number} quantity
 * @returns {Array} updated draft items
 */
export function addToMidnightWishDraft(product, variant = null, quantity = 1) {
  const draft = getMidnightWishDraft();
  const existing = draft.find(
    (i) => i.product_id === product.id && (i.variant_id || null) === (variant?.id || null)
  );
  let next;
  if (existing) {
    next = draft.map((i) =>
      i.product_id === product.id && (i.variant_id || null) === (variant?.id || null)
        ? { ...i, quantity: (i.quantity || 1) + quantity }
        : i
    );
  } else {
    next = [
      ...draft,
      {
        product_id: product.id,
        variant_id: variant?.id || null,
        quantity: quantity,
        product_name: product.name,
        product_slug: product.slug,
        image_url: product.image_url,
        base_price: product.base_price,
        discounted_price: product.discounted_price ?? product.base_price
      }
    ];
  }
  if (typeof window !== 'undefined') {
    if (next.length === 0) localStorage.removeItem(DRAFT_STORAGE_KEY);
    else localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export { DRAFT_STORAGE_KEY };

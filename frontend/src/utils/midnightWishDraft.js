const DRAFT_STORAGE_KEY = 'creamingo_midnight_wish_draft';
const DRAFT_MESSAGE_STORAGE_KEY = 'creamingo_midnight_wish_draft_message';

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
 * @param {{ weight?: string, tier?: string }} [options] optional weight and tier for display
 * @returns {Array} updated draft items
 */
export function addToMidnightWishDraft(product, variant = null, quantity = 1, options = {}) {
  const draft = getMidnightWishDraft();
  const { weight: weightDisplay, tier: tierDisplay } = options;
  const existing = draft.find(
    (i) => i.product_id === product.id && (i.variant_id || null) === (variant?.id || null)
  );
  let next;
  if (existing) {
    next = draft.map((i) =>
      i.product_id === product.id && (i.variant_id || null) === (variant?.id || null)
        ? { ...i, quantity: (i.quantity || 1) + quantity, weight: weightDisplay ?? i.weight, tier: tierDisplay ?? i.tier }
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
        discounted_price: product.discounted_price ?? product.base_price,
        weight: weightDisplay ?? variant?.weight ?? null,
        tier: tierDisplay ?? null
      }
    ];
  }
  if (typeof window !== 'undefined') {
    if (next.length === 0) localStorage.removeItem(DRAFT_STORAGE_KEY);
    else localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

/**
 * Get saved message from draft (for restore on refresh)
 * @returns {string}
 */
export function getMidnightWishDraftMessage() {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(DRAFT_MESSAGE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Save message to draft storage (persists across refresh)
 * @param {string} message
 */
export function setMidnightWishDraftMessage(message) {
  if (typeof window === 'undefined') return;
  try {
    const val = String(message || '').trim();
    if (val) localStorage.setItem(DRAFT_MESSAGE_STORAGE_KEY, val);
    else localStorage.removeItem(DRAFT_MESSAGE_STORAGE_KEY);
  } catch {}
}

export { DRAFT_STORAGE_KEY, DRAFT_MESSAGE_STORAGE_KEY };

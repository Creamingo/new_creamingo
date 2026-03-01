/**
 * Cart recommendation rules for "You May Also Like" section.
 * Controls when to show flowers vs chocolates/sweets vs small desserts,
 * and limits per section based on cart state. All amounts in INR.
 */

/**
 * Get cart total (sum of item totalPrice) for rule evaluation.
 * @param {Array<{ totalPrice?: number }>} cartItems
 * @returns {number}
 */
export function getCartTotal(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;
  return cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
}

/**
 * Whether cart has at least one cake (non-deal main product) for add-ons.
 * @param {Array<{ is_deal_item?: boolean }>} cartItems
 * @returns {boolean}
 */
export function cartHasCake(cartItems) {
  return Array.isArray(cartItems) && cartItems.some((item) => !item.is_deal_item);
}

/**
 * Whether cart already has items from "gift" categories (flowers, sweets, dry fruits).
 * Used to avoid over-pushing gift section when they already bought gifts.
 * @param {Array<{ product?: { category_id?: number; id?: number } }>} cartItems
 * @param {Set<number>} [giftCategoryIds] - category IDs for flowers (27), sweets-dry-fruits (28)
 * @returns {boolean}
 */
export function cartHasGiftItems(cartItems, giftCategoryIds = new Set([27, 28])) {
  if (!Array.isArray(cartItems)) return false;
  return cartItems.some((item) => {
    const id = item.product?.category_id ?? item.product?.id;
    return giftCategoryIds.has(Number(id));
  });
}

// ---------------------------------------------------------------------------
// Section rules: when to show and how many to show
// ---------------------------------------------------------------------------

/** Default category IDs: 27 = flowers, 28 = sweets-dry-fruits (for backend) */
export const GIFT_CATEGORY_IDS = { flowers: 27, sweetsDryFruits: 28 };

/**
 * Rules for "Add-ons" (candles, balloons, toppers).
 * Show only when there's a cake to attach add-ons to.
 */
export const ADDONS_RULES = {
  /** Show section when cart has at least one non-deal item (cake). */
  showWhen: (cartItems) => cartHasCake(cartItems),
  maxItems: 15,
};

/**
 * Rules for "Complete Your Gift" (flowers, chocolates, dry fruits).
 * - Higher cart value → emphasize flowers (gift vibe).
 * - Lower cart value → more sweets/chocolates (affordable add-on).
 * - If cart already has gift items → reduce gift section size.
 */
export const GIFT_RULES = {
  /** Always show gift section when cart has items. */
  showWhen: (cartItems) => Array.isArray(cartItems) && cartItems.length > 0,

  /**
   * Number of flower products to fetch. More when cart total is high (gift occasion).
   * @param {number} cartTotal
   * @param {boolean} alreadyHasGift
   */
  flowersLimit: (cartTotal, alreadyHasGift) => {
    if (alreadyHasGift) return 1;
    if (cartTotal >= 2000) return 4;
    if (cartTotal >= 1000) return 3;
    return 2;
  },

  /**
   * Number of sweets/dry-fruits products to fetch. More when cart is smaller.
   * @param {number} cartTotal
   * @param {boolean} alreadyHasGift
   */
  sweetsLimit: (cartTotal, alreadyHasGift) => {
    if (alreadyHasGift) return 2;
    if (cartTotal >= 2000) return 2;
    if (cartTotal >= 500) return 4;
    return 5;
  },

  /** Max total gift products to show (flowers + sweets combined). */
  totalGiftLimit: 10,
};

/**
 * Rules for "Small Treats for Guests" (pastries, brownies, mini desserts).
 * - Show more when cart total is low (easy add-ons to bump AOV).
 * - Show fewer when cart is already large.
 */
export const SMALL_TREATS_RULES = {
  showWhen: (cartItems) => Array.isArray(cartItems) && cartItems.length > 0,

  /** Fixed limit for small treats. */
  limit: () => 10,
};

// ---------------------------------------------------------------------------
// Resolve which sections to fetch and their limits (for cart page)
// ---------------------------------------------------------------------------

/**
 * Returns config for the cart recommendation sections based on current cart.
 * Three sections only: Add-ons, Gift (flowers/sweets), Small Treats.
 *
 * @param {Array<{ is_deal_item?: boolean; totalPrice?: number; product?: { category_id?: number } }>} cartItems
 * @returns {{
 *   fetchAddOns: boolean;
 *   addOnsLimit: number;
 *   fetchGift: boolean;
 *   flowersLimit: number;
 *   sweetsLimit: number;
 *   totalGiftLimit: number;
 *   fetchSmallTreats: boolean;
 *   smallTreatsLimit: number;
 * }}
 */
export function getRecommendationConfig(cartItems) {
  const cartTotal = getCartTotal(cartItems);
  const hasGift = cartHasGiftItems(cartItems);

  const addOnsShow = ADDONS_RULES.showWhen(cartItems);
  const giftShow = GIFT_RULES.showWhen(cartItems);
  const smallTreatsShow = SMALL_TREATS_RULES.showWhen(cartItems);

  return {
    fetchAddOns: addOnsShow,
    addOnsLimit: ADDONS_RULES.maxItems,

    fetchGift: giftShow,
    flowersLimit: GIFT_RULES.flowersLimit(cartTotal, hasGift),
    sweetsLimit: GIFT_RULES.sweetsLimit(cartTotal, hasGift),
    totalGiftLimit: GIFT_RULES.totalGiftLimit,

    fetchSmallTreats: smallTreatsShow,
    smallTreatsLimit: SMALL_TREATS_RULES.limit(cartTotal),
  };
}

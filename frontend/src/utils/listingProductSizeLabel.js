import {
  resolveProductFormProfileFromProduct,
  isCakeProfile,
} from './productFormProfile';

const SLUG_ALIASES = {
  'cakes-for-any-occasion': 'cakes-for-occasion',
};

const CAKE_SLUGS = new Set([
  'cakes-by-flavor',
  'cakes-for-occasion',
  'kids-cake-collection',
  'crowd-favorite-cakes',
  'love-relationship-cakes',
  'milestone-year-cakes',
]);

const TREATS_SLUG = 'small-treats-desserts';
const FLOWERS_SLUG = 'flowers';
const SWEETS_SLUG = 'sweets-dry-fruits';

function num(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : NaN;
}

function effectiveVariantDiscountedPrice(v) {
  const d = num(v.discounted_price);
  if (Number.isFinite(d)) return d;
  const p = num(v.price);
  const pct = num(v.discount_percent);
  if (Number.isFinite(p) && Number.isFinite(pct) && pct > 0) {
    return p * (1 - pct / 100);
  }
  return p;
}

function listingCardDiscountedPrice(product) {
  return num(product.discountedPrice ?? product.discounted_price);
}

function trimLabel(s) {
  const t = s != null ? String(s).trim() : '';
  return t || null;
}

function normalizeCategorySlug(categorySlug) {
  if (!categorySlug || typeof categorySlug !== 'string') return '';
  const s = categorySlug.trim();
  return SLUG_ALIASES[s] || s;
}

function resolveProfileFromListingSlug(categorySlug) {
  const s = normalizeCategorySlug(categorySlug);
  if (!s) return null;
  if (CAKE_SLUGS.has(s)) return 'cake';
  if (s === TREATS_SLUG) return 'treats';
  if (s === FLOWERS_SLUG) return 'flowers';
  if (s === SWEETS_SLUG) return 'sweets';
  return null;
}

function resolveSizeText(product) {
  const baseW = trimLabel(product.baseWeight ?? product.base_weight);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const cardPrice = listingCardDiscountedPrice(product);

  let matchedVariantWeight = null;
  if (variants.length > 0 && Number.isFinite(cardPrice)) {
    const match = variants.find(
      (v) => Math.abs(effectiveVariantDiscountedPrice(v) - cardPrice) < 0.51
    );
    if (match) matchedVariantWeight = trimLabel(match.weight);
  }

  let label = matchedVariantWeight || baseW;
  if (!label && variants.length > 0) {
    label = trimLabel(variants[0].weight);
  }
  return label;
}

/**
 * Line shown next to listing price: base weight / option label aligned to the displayed (base) price.
 * Cakes: plain weight text. Treats, flowers, sweets: "From …" to signal other packs/sizes on PDP.
 */
export function formatListingSizeForListingCard(product, options = {}) {
  if (!product) return null;

  const label = resolveSizeText(product);
  if (!label) return null;

  const profileFromSlug = resolveProfileFromListingSlug(options.categorySlug);
  const profile = profileFromSlug ?? resolveProductFormProfileFromProduct(product);

  if (isCakeProfile(profile)) {
    return label;
  }
  return `From ${label}`;
}

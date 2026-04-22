/**
 * Mirrors admin-panel product form profiles for storefront PDP behavior.
 */
export const CAKE_CATEGORY_IDS = new Set([19, 20, 21, 22, 23, 24]);
export const NON_CAKE_CATEGORY_IDS = new Set([26, 27, 28]);

export function getProductFormProfile(primaryCategoryId, categoryIds = []) {
  const primary =
    primaryCategoryId != null && Number.isFinite(Number(primaryCategoryId))
      ? Number(primaryCategoryId)
      : categoryIds.length > 0
        ? Number(categoryIds[0])
        : NaN;

  if (!Number.isFinite(primary)) return 'cake';

  if (primary === 26) return 'treats';
  if (primary === 27) return 'flowers';
  if (primary === 28) return 'sweets';

  if (NON_CAKE_CATEGORY_IDS.has(primary)) return 'treats';
  return 'cake';
}

export function isCakeProfile(profile) {
  return profile === 'cake';
}

export function resolvePrimaryCategoryId(product) {
  if (!product) return undefined;
  const raw =
    product.primary_category_id ??
    product.categories?.find((c) => c.is_primary)?.id ??
    product.categories?.[0]?.id ??
    product.category_id;
  return raw != null ? Number(raw) : undefined;
}

export function resolveProductFormProfileFromProduct(product) {
  const ids = Array.isArray(product?.categories)
    ? product.categories.map((c) => Number(c.id)).filter((n) => Number.isFinite(n))
    : [];
  return getProductFormProfile(resolvePrimaryCategoryId(product), ids);
}

/** PDP copy for flower products (variant label = stem tier; product serving = optional presentation line). */
export const FLOWERS_PDP_LABELS = {
  stemTier: 'Stem tier',
  presentationNote: 'Presentation note',
};

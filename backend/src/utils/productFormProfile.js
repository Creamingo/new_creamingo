/**
 * Server-side category profile (keep in sync with admin-panel/src/utils/productFormProfile.ts).
 */
const CAKE_CATEGORY_IDS = new Set([19, 20, 21, 22, 23, 24]);
const NON_CAKE_CATEGORY_IDS = new Set([26, 27, 28]);

function getProductFormProfile(primaryCategoryId, categoryIds = []) {
  const primary =
    primaryCategoryId != null && Number.isFinite(Number(primaryCategoryId))
      ? Number(primaryCategoryId)
      : Array.isArray(categoryIds) && categoryIds.length > 0
        ? Number(categoryIds[0])
        : NaN;

  if (!Number.isFinite(primary)) return 'cake';

  if (primary === 26) return 'treats';
  if (primary === 27) return 'flowers';
  if (primary === 28) return 'sweets';

  if (NON_CAKE_CATEGORY_IDS.has(primary)) return 'treats';
  return 'cake';
}

function isCakeFormProfile(profile) {
  return profile === 'cake';
}

module.exports = {
  CAKE_CATEGORY_IDS,
  NON_CAKE_CATEGORY_IDS,
  getProductFormProfile,
  isCakeFormProfile,
};

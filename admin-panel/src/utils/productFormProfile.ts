/**
 * Maps top-level category IDs to admin/storefront form behavior.
 * Cake categories (19–24): full cake flow. Non-cake (26–28): simplified flow.
 */
export const CAKE_CATEGORY_IDS = new Set([19, 20, 21, 22, 23, 24]);

/** Small Treats Desserts, Flowers, Sweets and Dry Fruits */
export const NON_CAKE_CATEGORY_IDS = new Set([26, 27, 28]);

export type ProductFormProfile = 'cake' | 'treats' | 'flowers' | 'sweets';

export function getProductFormProfile(
  primaryCategoryId: number | undefined | null,
  categoryIds: number[] = []
): ProductFormProfile {
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

export function isCakeFormProfile(profile: ProductFormProfile): boolean {
  return profile === 'cake';
}

export const NON_CAKE_PROFILE_LABELS: Record<
  Exclude<ProductFormProfile, 'cake'>,
  { title: string; hint: string }
> = {
  treats: {
    title: 'Small treats & desserts',
    hint: 'Use option labels like “1 pc”, “Box of 6”, or pack size instead of cake weights.',
  },
  flowers: {
    title: 'Flowers',
    hint: 'Use option labels such as bouquet size or stem count; cake tiers and flavors are hidden.',
  },
  sweets: {
    title: 'Sweets & dry fruits',
    hint: 'Use pack sizes (e.g. 250g, 500g) as option labels; flavor lists for cakes are not used.',
  },
};

/** Safe copy for UI when profile may be typed as ProductFormProfile (cake branch unused in non-cake panels). */
export function getNonCakeProfileCopy(profile: ProductFormProfile): { title: string; hint: string } {
  switch (profile) {
    case 'treats':
      return NON_CAKE_PROFILE_LABELS.treats;
    case 'flowers':
      return NON_CAKE_PROFILE_LABELS.flowers;
    case 'sweets':
      return NON_CAKE_PROFILE_LABELS.sweets;
    default:
      return { title: 'this category', hint: '' };
  }
}

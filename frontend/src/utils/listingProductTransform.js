import { resolveImageUrl } from './imageUrl';

function reviewCountFromProduct(product) {
  const raw =
    product.review_count ??
    product.reviews ??
    product.reviewCount;
  if (raw != null && raw !== '') return raw;
  return Math.floor(Math.random() * 100) + 10;
}

/**
 * Normalizes API product rows into the shape expected by ListingProductCard.
 * Preserves fields needed for listing size/option labels (base weight, variants, categories).
 */
export function toListingProductCardShape(product) {
  const basePrice = product.base_price ?? product.originalPrice;
  const discounted = product.discounted_price ?? product.discountedPrice;
  let discountPct =
    product.discount_percent ??
    product.discount ??
    (discounted != null && basePrice
      ? Math.round(((Number(basePrice) - Number(discounted)) / Number(basePrice)) * 100)
      : 0);
  if (!Number.isFinite(Number(discountPct))) discountPct = 0;

  const bw = product.base_weight ?? product.baseWeight;
  const baseWeight =
    bw != null && String(bw).trim() !== '' ? String(bw).trim() : undefined;

  const variants = Array.isArray(product.variants)
    ? product.variants.map((v) => ({
        id: v.id,
        weight: v.weight,
        price: v.price,
        discount_percent: v.discount_percent,
        discounted_price: v.discounted_price,
      }))
    : undefined;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: resolveImageUrl(product.image_url || product.image),
    originalPrice: basePrice,
    discountedPrice: discounted,
    rating: product.rating ?? 4.5,
    reviews: reviewCountFromProduct(product),
    category: product.category_name || product.category,
    subcategory: product.subcategory_name || product.subcategory,
    subcategory_id: product.subcategory_id ?? product.subcategoryId,
    isTopProduct: product.is_top_product === 1 || product.isTopProduct,
    discount: discountPct,
    baseWeight,
    base_weight: baseWeight,
    category_id: product.category_id,
    categories: product.categories,
    variants,
  };
}

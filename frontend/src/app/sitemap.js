const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.FRONTEND_URL ||
  'http://localhost:3000';

export const revalidate = 3600;

const categorySlugMap = {
  'Pick a Cake by Flavor': 'cakes-by-flavor',
  'Cakes for Any Occasion': 'cakes-for-occasion',
  "Kid's Cake Collection": 'kids-cake-collection',
  'Crowd-Favorite Cakes': 'crowd-favorite-cakes',
  'Love and Relationship Cakes': 'love-relationship-cakes',
  'Cakes for Every Milestone Year': 'milestone-year-cakes',
  'Flowers': 'flowers',
  'Sweets and Dry Fruits': 'sweets-dry-fruits',
  'Small Treats Desserts': 'small-treats-desserts',
};

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');

const toSlug = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/'/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const buildUrl = (baseUrl, path) => `${baseUrl}${path}`;

const fetchJson = async (url) => {
  try {
    const response = await fetch(url, { next: { revalidate } });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Sitemap fetch failed:', error);
    return null;
  }
};

const getCategoriesWithSubcategories = async () => {
  const data = await fetchJson(
    `${API_BASE_URL}/categories?is_active=true&include_subcategories=true`
  );
  return data?.data?.categories || [];
};

const getAllProducts = async () => {
  const products = [];
  let page = 1;
  let totalPages = 1;
  const limit = 100;
  const maxPages = 50;

  while (page <= totalPages && page <= maxPages) {
    const data = await fetchJson(
      `${API_BASE_URL}/products?is_active=true&limit=${limit}&page=${page}`
    );
    const pageProducts = data?.data?.products || [];
    products.push(...pageProducts);

    const pagination = data?.data?.pagination;
    totalPages = pagination?.total_pages || page;
    page += 1;

    if (!pageProducts.length) break;
  }

  return products;
};

export default async function sitemap() {
  const baseUrl = normalizeBaseUrl(DEFAULT_BASE_URL);
  const now = new Date();

  const staticPaths = [
    '',
    '/products',
    '/our-story',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/refund-policy',
    '/shipping',
    '/careers',
    '/franchise',
    '/track-order',
  ];

  const staticUrls = staticPaths.map((path) => ({
    url: buildUrl(baseUrl, path),
    lastModified: now,
    changefreq: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const [categories, products] = await Promise.all([
    getCategoriesWithSubcategories(),
    getAllProducts(),
  ]);

  const categoryUrls = categories
    .filter((category) => category && category.is_active !== false)
    .map((category) => {
      const name = category.name || category.display_name;
      const slug = categorySlugMap[name] || (name ? toSlug(name) : '');
      if (!slug) return null;

      return {
        url: buildUrl(baseUrl, `/category/${slug}`),
        lastModified: new Date(category.updated_at || category.created_at || now),
        changefreq: 'weekly',
        priority: 0.7,
      };
    })
    .filter(Boolean);

  const subcategoryUrls = categories.flatMap((category) => {
    const name = category?.name || category?.display_name;
    const categorySlug = categorySlugMap[name] || (name ? toSlug(name) : '');
    if (!categorySlug) return [];

    const subcategories = Array.isArray(category.subcategories)
      ? category.subcategories
      : [];

    return subcategories
      .filter((subcategory) => subcategory && subcategory.is_active !== false)
      .map((subcategory) => {
        const subName = subcategory.name || subcategory.display_name;
        const subSlug = subcategory.slug || (subName ? toSlug(subName) : '');
        if (!subSlug) return null;

        return {
          url: buildUrl(baseUrl, `/category/${categorySlug}/${subSlug}`),
          lastModified: new Date(
            subcategory.updated_at || subcategory.created_at || now
          ),
          changefreq: 'weekly',
          priority: 0.6,
        };
      })
      .filter(Boolean);
  });

  const productUrls = products
    .filter((product) => product && product.slug)
    .map((product) => ({
      url: buildUrl(baseUrl, `/product/${product.slug}`),
      lastModified: new Date(product.updated_at || product.created_at || now),
      changefreq: 'weekly',
      priority: 0.6,
    }));

  const allUrls = [
    ...staticUrls,
    ...categoryUrls,
    ...subcategoryUrls,
    ...productUrls,
  ];

  const uniqueUrls = new Map();
  allUrls.forEach((entry) => {
    uniqueUrls.set(entry.url, entry);
  });

  return Array.from(uniqueUrls.values());
}

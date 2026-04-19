const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL || BACKEND_BASE_URL;

/**
 * Resolves an image URL from API entities that may expose `image_url`, `image`, or `imageUrl`.
 */
export const resolveEntityImageUrl = (entity) => {
  if (!entity) return null;
  const raw = entity.image_url ?? entity.image ?? entity.imageUrl;
  return resolveImageUrl(raw);
};

export const resolveImageUrl = (value) => {
  if (value == null || value === '') return value;

  const str = typeof value === 'string' ? value : String(value);

  if (str.startsWith('data:')) {
    return str;
  }

  // Full URL pointing at our asset paths: always use backend base so images load correctly (e.g. when API returns wrong host from rewrites)
  if (/^https?:\/\//i.test(str)) {
    const galleryMatch = str.match(/(\/gallery\/[^?#]*)/i);
    const uploadsMatch = str.match(/(\/uploads\/[^?#]*)/i);
    const path = galleryMatch?.[1] || uploadsMatch?.[1];
    if (path) return `${ASSET_BASE_URL}${path}`;
    return str;
  }

  if (str.startsWith('/gallery/')) {
    return `${ASSET_BASE_URL}${str}`;
  }

  if (str.startsWith('/uploads/')) {
    return `${ASSET_BASE_URL}${str}`;
  }

  if (str.startsWith('gallery/')) {
    return `${ASSET_BASE_URL}/${str}`;
  }

  if (str.startsWith('uploads/')) {
    return `${ASSET_BASE_URL}/${str}`;
  }

  return str;
};

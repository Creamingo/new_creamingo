const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL || BACKEND_BASE_URL;

export const resolveImageUrl = (value) => {
  if (!value) return value;

  if (value.startsWith('data:')) {
    return value;
  }

  // Full URL pointing at our asset paths: always use backend base so images load correctly (e.g. when API returns wrong host from rewrites)
  if (/^https?:\/\//i.test(value)) {
    const galleryMatch = value.match(/(\/gallery\/[^?#]*)/i);
    const uploadsMatch = value.match(/(\/uploads\/[^?#]*)/i);
    const path = galleryMatch?.[1] || uploadsMatch?.[1];
    if (path) return `${ASSET_BASE_URL}${path}`;
    return value;
  }

  if (value.startsWith('/gallery/')) {
    return `${ASSET_BASE_URL}${value}`;
  }

  if (value.startsWith('/uploads/')) {
    return `${ASSET_BASE_URL}${value}`;
  }

  if (value.startsWith('gallery/')) {
    return `${ASSET_BASE_URL}/${value}`;
  }

  if (value.startsWith('uploads/')) {
    return `${ASSET_BASE_URL}/${value}`;
  }

  return value;
};

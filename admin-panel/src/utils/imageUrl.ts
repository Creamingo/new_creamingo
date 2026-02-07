const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ASSET_BASE_URL =
  process.env.REACT_APP_ASSET_BASE_URL || API_BASE_URL.replace(/\/api\/?$/, '');

export const resolveImageUrl = (value?: string | null) => {
  if (!value) return value || '';

  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/gallery/')) {
    return `${ASSET_BASE_URL}${value}`;
  }

  if (value.startsWith('gallery/')) {
    return `${ASSET_BASE_URL}/${value}`;
  }

  if (value.startsWith('/uploads/')) {
    return `${ASSET_BASE_URL}${value}`;
  }

  if (value.startsWith('uploads/')) {
    return `${ASSET_BASE_URL}/${value}`;
  }

  return value;
};

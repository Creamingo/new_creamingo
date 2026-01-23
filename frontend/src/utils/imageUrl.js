const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const resolveImageUrl = (value) => {
  if (!value) return value;

  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${value}`;
  }

  return value;
};

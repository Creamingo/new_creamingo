const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const forwardedHost = req?.headers?.['x-forwarded-host'];
  const proto = forwardedProto || req?.protocol;
  const host = forwardedHost || req?.get?.('host');

  if (!proto || !host) {
    return '';
  }

  return `${proto}://${host}`;
};

const normalizeUploadUrl = (value) => {
  if (!value) return value;

  if (value.startsWith('/uploads/')) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    const match = value.match(/\/uploads\/[^?#]+/i);
    if (match) {
      return match[0];
    }
  }

  return value;
};

const buildPublicUrlWithBase = (baseUrl, value) => {
  if (!value) return value;

  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/uploads/')) {
    return baseUrl ? `${baseUrl}${value}` : value;
  }

  return value;
};

const applyUploadUrl = (req, value) => {
  const baseUrl = getBaseUrl(req);
  return buildPublicUrlWithBase(baseUrl, normalizeUploadUrl(value));
};

const mapUploadFields = (req, item, fields) => {
  if (!item) return item;

  const next = { ...item };
  fields.forEach((field) => {
    if (next[field]) {
      next[field] = applyUploadUrl(req, next[field]);
    }
  });
  return next;
};

module.exports = {
  getBaseUrl,
  normalizeUploadUrl,
  buildPublicUrlWithBase,
  applyUploadUrl,
  mapUploadFields
};

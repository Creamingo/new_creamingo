const path = require('path');
const fs = require('fs');

const sanitizeSegment = (value) => {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const getGalleryRoot = () => {
  const galleryDir = process.env.GALLERY_PATH || process.env.UPLOAD_PATH || 'gallery';
  if (path.isAbsolute(galleryDir)) {
    return galleryDir;
  }
  return path.resolve(__dirname, '..', '..', '..', galleryDir);
};

const getGallerySubdir = (type) => {
  const cleaned = sanitizeSegment(type);
  return cleaned || 'misc';
};

const ensureDirExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getGalleryPath = (type) => {
  const root = getGalleryRoot();
  if (!type) return root;
  return path.join(root, getGallerySubdir(type));
};

const getGalleryRelativePath = (type, filename) => {
  const subdir = getGallerySubdir(type);
  return `/gallery/${subdir}/${filename}`;
};

const resolveGalleryFilePath = (type, filenameOrPath) => {
  if (!filenameOrPath) return null;
  const root = getGalleryRoot();
  if (filenameOrPath.startsWith('/gallery/')) {
    return path.join(root, filenameOrPath.replace(/^\/gallery\//, ''));
  }
  if (filenameOrPath.startsWith('gallery/')) {
    return path.join(root, filenameOrPath.replace(/^gallery\//, ''));
  }
  if (filenameOrPath.includes('/')) {
    return path.join(root, filenameOrPath);
  }
  return path.join(root, getGallerySubdir(type), filenameOrPath);
};

module.exports = {
  getUploadPath: getGalleryRoot,
  getGalleryRoot,
  getGalleryPath,
  getGallerySubdir,
  getGalleryRelativePath,
  resolveGalleryFilePath,
  ensureDirExists,
  sanitizeSegment,
};

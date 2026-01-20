const path = require('path');

const getUploadPath = () => {
  const uploadDir = process.env.UPLOAD_PATH || 'uploads';
  if (path.isAbsolute(uploadDir)) {
    return uploadDir;
  }
  return path.resolve(__dirname, '..', '..', uploadDir);
};

module.exports = { getUploadPath };

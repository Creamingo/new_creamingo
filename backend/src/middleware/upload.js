const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure uploads directory exists
const {
  getGalleryPath,
  getGallerySubdir,
  ensureDirExists,
  sanitizeSegment,
  getGalleryRoot,
} = require('../utils/uploadPath');
const resolvedGalleryRoot = getGalleryRoot();

if (!fs.existsSync(resolvedGalleryRoot)) {
  fs.mkdirSync(resolvedGalleryRoot, { recursive: true });
}

const resolveUploadType = (req) => {
  return req.uploadType || req.body?.type || req.query?.type || 'misc';
};

const randomHash = () => {
  const length = Math.floor(Math.random() * 5) + 8; // 8-12 chars
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = resolveUploadType(req);
    const targetDir = getGalleryPath(type);
    ensureDirExists(targetDir);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const extension = path.extname(file.originalname);
    const type = resolveUploadType(req);
    const prefixSource = req.body?.prefix || req.body?.name || req.body?.slug || type || 'file';
    const prefix = sanitizeSegment(prefixSource) || getGallerySubdir(type);
    const hash = randomHash();
    cb(null, `${prefix}-${hash}${extension}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|webm|ogg|avi|mov/;
  const allowedTypes = new RegExp(`(${allowedImageTypes.source}|${allowedVideoTypes.source})`);
  
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image and video files (JPEG, JPG, PNG, GIF, WebP, MP4, WebM, OGG, AVI, MOV) are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'image') => {
  return upload.single(fieldName);
};

// Middleware for multiple files upload
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Middleware for mixed file uploads
const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Error handler for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name in file upload.'
      });
    }
  }
  
  if (error.message.includes('Only image and video files')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError
};

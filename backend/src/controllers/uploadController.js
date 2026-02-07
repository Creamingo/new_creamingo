const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { resizeIconImage } = require('../utils/imageResize');
const { getGalleryRelativePath, resolveGalleryFilePath } = require('../utils/uploadPath');
const { getBaseUrl, buildPublicUrlWithBase } = require('../utils/urlHelpers');

// Upload single file
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const type = req.uploadType || req.body?.type || req.query?.type || 'misc';
    const relativePath = getGalleryRelativePath(type, req.file.filename);
    const baseUrl = getBaseUrl(req);
    const fileUrl = process.env.UPLOAD_RETURN_ABSOLUTE_URL === 'true'
      ? buildPublicUrlWithBase(baseUrl, relativePath)
      : relativePath;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
      url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload single error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload multiple files
const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const type = req.uploadType || req.body?.type || req.query?.type || 'misc';
    const baseUrl = getBaseUrl(req);
    const files = req.files.map(file => {
      const relativePath = getGalleryRelativePath(type, file.filename);
      const url = process.env.UPLOAD_RETURN_ABSOLUTE_URL === 'true'
        ? buildPublicUrlWithBase(baseUrl, relativePath)
        : relativePath;
      return {
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        url
      };
    });

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      data: { files }
    });
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const type = req.query?.type;
    const filePath = resolveGalleryFilePath(type, filename);
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get file info
const getFileInfo = async (req, res) => {
  try {
    const { filename } = req.params;
    const type = req.query?.type;
    const filePath = resolveGalleryFilePath(type, filename);
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file path'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const stats = fs.statSync(filePath);
    const baseUrl = getBaseUrl(req);
    const relativePath = getGalleryRelativePath(type, filename);
    const fileUrl = process.env.UPLOAD_RETURN_ABSOLUTE_URL === 'true'
      ? buildPublicUrlWithBase(baseUrl, relativePath)
      : relativePath;

    res.json({
      success: true,
      data: {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Upload and resize icon image
const uploadIconImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if it's an image file
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed for icon uploads'
      });
    }

    const originalPath = req.file.path;
    const hashLength = Math.floor(Math.random() * 5) + 8;
    const hash = crypto.randomBytes(Math.ceil(hashLength / 2)).toString('hex').slice(0, hashLength);
    const resizedFilename = `icon-${hash}.jpg`;
    const resizedPath = path.join(path.dirname(originalPath), resizedFilename);

    // Resize the image to 64x64 pixels
    await resizeIconImage(originalPath, resizedPath, 64, 85);

    // Delete the original file
    fs.unlinkSync(originalPath);

    const baseUrl = getBaseUrl(req);
    const relativePath = getGalleryRelativePath('icons', resizedFilename);
    const fileUrl = process.env.UPLOAD_RETURN_ABSOLUTE_URL === 'true'
      ? buildPublicUrlWithBase(baseUrl, relativePath)
      : relativePath;

    res.json({
      success: true,
      message: 'Icon image uploaded and resized successfully',
      data: {
        filename: resizedFilename,
        originalname: req.file.originalname,
        size: fs.statSync(resizedPath).size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload icon image error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadIconImage,
  deleteFile,
  getFileInfo
};

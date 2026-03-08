const fs = require('fs');
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

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getFileInfo
};

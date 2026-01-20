const path = require('path');
const fs = require('fs');
const { resizeIconImage } = require('../utils/imageResize');
const { getUploadPath } = require('../utils/uploadPath');
const { getBaseUrl } = require('../utils/urlHelpers');

// Upload single file
const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const baseUrl = getBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

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

    const baseUrl = getBaseUrl(req);
    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: `${baseUrl}/uploads/${file.filename}`
    }));

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
    const filePath = path.join(getUploadPath(), filename);

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
    const filePath = path.join(getUploadPath(), filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const stats = fs.statSync(filePath);
    const baseUrl = getBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/${filename}`;

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
    const resizedFilename = `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const resizedPath = path.join(path.dirname(originalPath), resizedFilename);

    // Resize the image to 64x64 pixels
    await resizeIconImage(originalPath, resizedPath, 64, 85);

    // Delete the original file
    fs.unlinkSync(originalPath);

    const baseUrl = getBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/${resizedFilename}`;

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

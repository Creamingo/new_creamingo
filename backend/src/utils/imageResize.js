const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Resize and optimize icon images
 * @param {string} inputPath - Path to the input image
 * @param {string} outputPath - Path to save the resized image
 * @param {number} size - Target size (width and height) in pixels
 * @param {number} quality - JPEG quality (1-100)
 * @returns {Promise<string>} - Path to the resized image
 */
const resizeIconImage = async (inputPath, outputPath, size = 64, quality = 85) => {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Resize and optimize the image
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
      })
      .jpeg({ quality })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error('Error resizing icon image:', error);
    throw error;
  }
};

/**
 * Resize and optimize category images
 * @param {string} inputPath - Path to the input image
 * @param {string} outputPath - Path to save the resized image
 * @param {number} width - Target width in pixels
 * @param {number} height - Target height in pixels
 * @param {number} quality - JPEG quality (1-100)
 * @returns {Promise<string>} - Path to the resized image
 */
const resizeCategoryImage = async (inputPath, outputPath, width = 300, height = 200, quality = 85) => {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Resize and optimize the image
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error('Error resizing category image:', error);
    throw error;
  }
};

module.exports = {
  resizeIconImage,
  resizeCategoryImage
};

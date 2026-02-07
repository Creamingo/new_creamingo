const { query } = require('../config/db');
const { clearFreeDeliveryThresholdCache } = require('../utils/deliverySettingsCache');

// Get all settings
const getSettings = async (req, res) => {
  try {
    const result = await query('SELECT * FROM settings ORDER BY `key`');

    // Convert array to object for easier access
    const settings = {};
    result.rows.forEach(row => {
      try {
        // Parse JSON values
        settings[row.key] = JSON.parse(row.value);
      } catch (error) {
        // If not JSON, use as string
        settings[row.key] = row.value;
      }
    });

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single setting
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await query(
      'SELECT * FROM settings WHERE `key` = ?',
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: { setting: result.rows[0] }
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const settingsData = req.body;

    const updatedSettings = {};

    for (const [key, value] of Object.entries(settingsData)) {
      // Check if setting exists
      const existingSetting = await query(
        'SELECT id FROM settings WHERE `key` = ?',
        [key]
      );

      if (existingSetting.rows.length > 0) {
        // Update existing setting
        await query(
          'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE `key` = ?',
          [JSON.stringify(value), key]
        );
      } else {
        // Create new setting
        await query(
          'INSERT INTO settings (`key`, value, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [key, JSON.stringify(value)]
        );
      }

      updatedSettings[key] = value;
      
      // Clear cache if free_delivery_threshold is updated
      if (key === 'free_delivery_threshold') {
        clearFreeDeliveryThresholdCache();
      }
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings: updatedSettings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update single setting
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Check if setting exists
    const existingSetting = await query(
      'SELECT id FROM settings WHERE `key` = ?',
      [key]
    );

    if (existingSetting.rows.length > 0) {
      // Update existing setting
      await query(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE `key` = ?',
        [JSON.stringify(value), key]
      );

      const result = await query(
        'SELECT * FROM settings WHERE `key` = ?',
        [key]
      );

      // Clear cache if free_delivery_threshold is updated
      if (key === 'free_delivery_threshold') {
        clearFreeDeliveryThresholdCache();
      }

      res.json({
        success: true,
        message: 'Setting updated successfully',
        data: { setting: result.rows[0] }
      });
    } else {
      // Create new setting
      await query(
        'INSERT INTO settings (`key`, value, created_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [key, JSON.stringify(value)]
      );

      const result = await query(
        'SELECT * FROM settings WHERE `key` = ?',
        [key]
      );

      // Clear cache if free_delivery_threshold is created
      if (key === 'free_delivery_threshold') {
        clearFreeDeliveryThresholdCache();
      }

      res.status(201).json({
        success: true,
        message: 'Setting created successfully',
        data: { setting: result.rows[0] }
      });
    }
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete setting
const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    // Check if setting exists
    const existingSetting = await query(
      'SELECT id FROM settings WHERE `key` = ?',
      [key]
    );

    if (existingSetting.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    await query('DELETE FROM settings WHERE `key` = ?', [key]);

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getSettings,
  getSetting,
  updateSettings,
  updateSetting,
  deleteSetting
};

const { query, get } = require('../config/db');

// Check if a PIN code is available for delivery (public endpoint)
const checkPinCodeAvailability = async (req, res) => {
  try {
    const { pinCode } = req.params;

    // Validate PIN code format
    if (!pinCode || !/^\d{6}$/.test(pinCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN code format. Must be exactly 6 digits.',
        available: false
      });
    }

    // Check if PIN code exists and is active
    const pinCodeData = await get(
      'SELECT pin_code, delivery_charge, locality, status FROM delivery_pin_codes WHERE pin_code = ? AND status = ?',
      [pinCode, 'active']
    );

    if (pinCodeData) {
      // Get product availability statistics for this PIN code
      const productStats = await get(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as available_products
        FROM products
      `);

      const totalProducts = productStats.total_products || 0;
      const availableProducts = productStats.available_products || 0;
      const availabilityPercentage = totalProducts > 0 
        ? Math.round((availableProducts / totalProducts) * 100)
        : 0;

      res.json({
        success: true,
        message: 'Delivery available to this PIN code',
        available: true,
        data: {
          pinCode: pinCodeData.pin_code,
          deliveryCharge: parseFloat(pinCodeData.delivery_charge),
          locality: pinCodeData.locality,
          status: pinCodeData.status,
          productAvailability: {
            totalProducts: totalProducts,
            availableProducts: availableProducts,
            availabilityPercentage: availabilityPercentage
          }
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Delivery not available to this PIN code',
        available: false,
        data: null
      });
    }
  } catch (error) {
    console.error('Error checking PIN code availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking PIN code availability',
      available: false
    });
  }
};

// Get all delivery PIN codes with optional filtering
const getDeliveryPinCodes = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    let sqlQuery = `
      SELECT 
        id,
        pin_code,
        delivery_charge,
        locality,
        status,
        order_index,
        created_at,
        updated_at
      FROM delivery_pin_codes
      WHERE 1=1
    `;
    
    const params = [];

    // Add status filter
    if (status && status !== 'all') {
      sqlQuery += ' AND status = ?';
      params.push(status);
    }

    // Add search filter
    if (search) {
      sqlQuery += ' AND (pin_code LIKE ? OR locality LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Add ordering and pagination
    // Inline limit/offset to avoid MySQL stmt issues
    sqlQuery += ` ORDER BY order_index ASC, created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    const result = await query(sqlQuery, params);
    const pinCodes = result.rows;

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM delivery_pin_codes WHERE 1=1';
    const countParams = [];

    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      countQuery += ' AND (pin_code LIKE ? OR locality LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await get(countQuery, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: {
        pinCodes: pinCodes.map(pc => ({
          id: pc.id.toString(),
          pinCode: pc.pin_code,
          deliveryCharge: parseFloat(pc.delivery_charge),
          locality: pc.locality,
          status: pc.status,
          orderIndex: pc.order_index || 0,
          createdAt: pc.created_at
        })),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Error fetching delivery PIN codes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery PIN codes'
    });
  }
};

// Get delivery PIN code statistics
const getDeliveryPinCodeStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        AVG(delivery_charge) as average_charge
      FROM delivery_pin_codes
    `;

    const stats = await get(statsQuery);

    res.json({
      success: true,
      data: {
        total: stats.total || 0,
        active: stats.active || 0,
        inactive: stats.inactive || 0,
        averageCharge: Math.round((stats.average_charge || 0) * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching delivery PIN code stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery PIN code statistics'
    });
  }
};

// Create a new delivery PIN code
const createDeliveryPinCode = async (req, res) => {
  try {
    const { pinCode, deliveryCharge, locality, status = 'active' } = req.body;

    // Validate required fields
    if (!pinCode || !deliveryCharge || !locality) {
      return res.status(400).json({
        success: false,
        message: 'PIN Code, Delivery Charge, and Locality are required'
      });
    }

    // Validate PIN code format
    if (!/^\d{6}$/.test(pinCode)) {
      return res.status(400).json({
        success: false,
        message: 'PIN Code must be exactly 6 digits'
      });
    }

    // Validate delivery charge
    if (isNaN(deliveryCharge) || deliveryCharge < 0) {
      return res.status(400).json({
        success: false,
        message: 'Delivery Charge must be a valid positive number'
      });
    }

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either active or inactive'
      });
    }

    // Check if PIN code already exists
    const existingPinCode = await get(
      'SELECT id FROM delivery_pin_codes WHERE pin_code = ?',
      [pinCode]
    );

    if (existingPinCode) {
      return res.status(400).json({
        success: false,
        message: 'PIN Code already exists'
      });
    }

    // Get the next order_index
    const maxOrderResult = await get('SELECT MAX(order_index) as max_order FROM delivery_pin_codes');
    const nextOrderIndex = (maxOrderResult.max_order || 0) + 1;

    // Insert new PIN code
    const insertQuery = `
      INSERT INTO delivery_pin_codes (pin_code, delivery_charge, locality, status, order_index)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(insertQuery, [pinCode, deliveryCharge, locality.trim(), status, nextOrderIndex]);

    res.status(201).json({
      success: true,
      message: 'Delivery PIN code created successfully',
      data: {
        id: result.lastID.toString(),
        pinCode,
        deliveryCharge: parseFloat(deliveryCharge),
        locality: locality.trim(),
        status
      }
    });
  } catch (error) {
    console.error('Error creating delivery PIN code:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating delivery PIN code'
    });
  }
};

// Update a delivery PIN code
const updateDeliveryPinCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { pinCode, deliveryCharge, locality, status } = req.body;

    // Validate required fields
    if (!pinCode || !deliveryCharge || !locality) {
      return res.status(400).json({
        success: false,
        message: 'PIN Code, Delivery Charge, and Locality are required'
      });
    }

    // Validate PIN code format
    if (!/^\d{6}$/.test(pinCode)) {
      return res.status(400).json({
        success: false,
        message: 'PIN Code must be exactly 6 digits'
      });
    }

    // Validate delivery charge
    if (isNaN(deliveryCharge) || deliveryCharge < 0) {
      return res.status(400).json({
        success: false,
        message: 'Delivery Charge must be a valid positive number'
      });
    }

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either active or inactive'
      });
    }

    // Check if PIN code already exists (excluding current record)
    const existingPinCode = await get(
      'SELECT id FROM delivery_pin_codes WHERE pin_code = ? AND id != ?',
      [pinCode, id]
    );

    if (existingPinCode) {
      return res.status(400).json({
        success: false,
        message: 'PIN Code already exists'
      });
    }

    // Update PIN code
    const updateQuery = `
      UPDATE delivery_pin_codes 
      SET pin_code = ?, delivery_charge = ?, locality = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const result = await query(updateQuery, [pinCode, deliveryCharge, locality.trim(), status, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery PIN code not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery PIN code updated successfully',
      data: {
        id,
        pinCode,
        deliveryCharge: parseFloat(deliveryCharge),
        locality: locality.trim(),
        status
      }
    });
  } catch (error) {
    console.error('Error updating delivery PIN code:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery PIN code'
    });
  }
};

// Delete a delivery PIN code
const deleteDeliveryPinCode = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM delivery_pin_codes WHERE id = ?';
    const result = await query(deleteQuery, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery PIN code not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery PIN code deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting delivery PIN code:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting delivery PIN code'
    });
  }
};

// Toggle PIN code status
const togglePinCodeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const currentPinCode = await get(
      'SELECT status FROM delivery_pin_codes WHERE id = ?',
      [id]
    );

    if (!currentPinCode) {
      return res.status(404).json({
        success: false,
        message: 'Delivery PIN code not found'
      });
    }

    const newStatus = currentPinCode.status === 'active' ? 'inactive' : 'active';

    // Update status
    const updateQuery = `
      UPDATE delivery_pin_codes 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await query(updateQuery, [newStatus, id]);

    res.json({
      success: true,
      message: 'PIN code status updated successfully',
      data: {
        id,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Error toggling PIN code status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating PIN code status'
    });
  }
};

// Bulk upload PIN codes from CSV
const bulkUploadPinCodes = async (req, res) => {
  try {
    const { csvData } = req.body;

    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({
        success: false,
        message: 'CSV data is required and must be an array'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      try {
        // Validate required fields
        if (!row.pinCode || !row.deliveryCharge || !row.locality) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Validate PIN code format
        if (!/^\d{6}$/.test(row.pinCode)) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: PIN Code must be exactly 6 digits`);
          continue;
        }

        // Validate delivery charge
        const charge = parseFloat(row.deliveryCharge);
        if (isNaN(charge) || charge < 0) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Invalid delivery charge`);
          continue;
        }

        // Validate status
        const status = row.status && ['active', 'inactive'].includes(row.status.toLowerCase()) 
          ? row.status.toLowerCase() 
          : 'active';

        // Check if PIN code already exists
        const existingPinCode = await get(
          'SELECT id FROM delivery_pin_codes WHERE pin_code = ?',
          [row.pinCode]
        );

        if (existingPinCode) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: PIN Code ${row.pinCode} already exists`);
          continue;
        }

        // Insert new PIN code
        await query(
          'INSERT INTO delivery_pin_codes (pin_code, delivery_charge, locality, status) VALUES (?, ?, ?, ?)',
          [row.pinCode, charge, row.locality.trim(), status]
        );

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed. ${results.success} successful, ${results.failed} failed.`,
      data: results
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk upload'
    });
  }
};

// Bulk update order of delivery PIN codes
const updateDeliveryPinCodeOrder = async (req, res) => {
  try {
    const { pinCodeOrders } = req.body;

    if (!pinCodeOrders || !Array.isArray(pinCodeOrders)) {
      return res.status(400).json({
        success: false,
        message: 'PIN code orders array is required'
      });
    }

    // Validate the data structure
    for (const item of pinCodeOrders) {
      if (!item.id || typeof item.orderIndex !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Each item must have id and orderIndex'
        });
      }
    }

    // Update each PIN code's order_index
    for (const item of pinCodeOrders) {
      await query(
        'UPDATE delivery_pin_codes SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [item.orderIndex, item.id]
      );
    }

    res.json({
      success: true,
      message: 'PIN code order updated successfully',
      data: {
        updatedCount: pinCodeOrders.length
      }
    });
  } catch (error) {
    console.error('Error updating PIN code order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating PIN code order'
    });
  }
};

module.exports = {
  checkPinCodeAvailability,
  getDeliveryPinCodes,
  getDeliveryPinCodeStats,
  createDeliveryPinCode,
  updateDeliveryPinCode,
  deleteDeliveryPinCode,
  togglePinCodeStatus,
  bulkUploadPinCodes,
  updateDeliveryPinCodeOrder
};

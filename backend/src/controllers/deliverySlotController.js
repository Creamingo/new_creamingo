const { query } = require('../config/db');

// Get all delivery slots
const getDeliverySlots = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let sqlQuery = `
      SELECT 
        id,
        slot_name,
        start_time,
        end_time,
        max_orders,
        is_active,
        display_order,
        display_order_limit,
        availability_threshold_high,
        availability_threshold_medium,
        created_at,
        updated_at
      FROM delivery_slots
    `;
    
    const params = [];
    
    if (isActive !== undefined) {
      sqlQuery += ' WHERE is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }
    
    sqlQuery += ' ORDER BY start_time ASC, display_order ASC';
    
    const result = await query(sqlQuery, params);
    const slots = result.rows.map(row => ({
      id: row.id,
      slotName: row.slot_name,
      startTime: row.start_time,
      endTime: row.end_time,
      maxOrders: row.max_orders,
      isActive: Boolean(row.is_active),
      displayOrder: row.display_order,
      displayOrderLimit: row.display_order_limit || 10,
      availabilityThresholdHigh: row.availability_threshold_high || 60,
      availabilityThresholdMedium: row.availability_threshold_medium || 85,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error('Error in getDeliverySlots:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get delivery slot by ID
const getDeliverySlotById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sqlQuery = `
      SELECT 
        id,
        slot_name,
        start_time,
        end_time,
        max_orders,
        is_active,
        display_order,
        display_order_limit,
        availability_threshold_high,
        availability_threshold_medium,
        created_at,
        updated_at
      FROM delivery_slots
      WHERE id = ?
    `;
    
    const result = await query(sqlQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }
    
    const slot = result.rows[0];
    const slotData = {
      id: slot.id,
      slotName: slot.slot_name,
      startTime: slot.start_time,
      endTime: slot.end_time,
      maxOrders: slot.max_orders,
      isActive: Boolean(slot.is_active),
      displayOrder: slot.display_order,
      displayOrderLimit: slot.display_order_limit || 10,
      availabilityThresholdHigh: slot.availability_threshold_high || 60,
      availabilityThresholdMedium: slot.availability_threshold_medium || 85,
      createdAt: slot.created_at,
      updatedAt: slot.updated_at
    };

    res.json({
      success: true,
      data: slotData
    });
  } catch (error) {
    console.error('Error in getDeliverySlotById:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new delivery slot
const createDeliverySlot = async (req, res) => {
  try {
    const { 
      slotName, 
      startTime, 
      endTime, 
      isActive, 
      displayOrder
    } = req.body;
    
    // Validate required fields
    if (!slotName || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Slot name, start time, and end time are required'
      });
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Use HH:MM:SS format'
      });
    }
    
    // Check if slot name already exists
    const checkQuery = 'SELECT id FROM delivery_slots WHERE slot_name = ?';
    const checkResult = await query(checkQuery, [slotName]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Slot name already exists'
      });
    }
    
    const sqlQuery = `
      INSERT INTO delivery_slots (
        slot_name, start_time, end_time, max_orders, is_active, display_order,
        display_order_limit, availability_threshold_high, availability_threshold_medium
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      slotName,
      startTime,
      endTime,
      50, // Default max orders (will be managed per date)
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      displayOrder || 0,
      10, // Default display order limit (will be managed per date)
      60, // Default high threshold (will be managed per date)
      85  // Default medium threshold (will be managed per date)
    ];
    
    const result = await query(sqlQuery, params);
    
    // Get the created slot
    const getSlotQuery = `
      SELECT 
        id,
        slot_name,
        start_time,
        end_time,
        max_orders,
        is_active,
        display_order,
        display_order_limit,
        availability_threshold_high,
        availability_threshold_medium,
        created_at,
        updated_at
      FROM delivery_slots
      WHERE id = ?
    `;
    
    const slotResult = await query(getSlotQuery, [result.lastID]);
    const slot = slotResult.rows[0];
    
    const createdSlot = {
      id: slot.id,
      slotName: slot.slot_name,
      startTime: slot.start_time,
      endTime: slot.end_time,
      maxOrders: slot.max_orders,
      isActive: Boolean(slot.is_active),
      displayOrder: slot.display_order,
      displayOrderLimit: slot.display_order_limit || 10,
      availabilityThresholdHigh: slot.availability_threshold_high || 60,
      availabilityThresholdMedium: slot.availability_threshold_medium || 85,
      createdAt: slot.created_at,
      updatedAt: slot.updated_at
    };
    
    res.status(201).json({
      success: true,
      message: 'Delivery slot created successfully',
      data: createdSlot
    });
  } catch (error) {
    console.error('Error in createDeliverySlot:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update delivery slot
const updateDeliverySlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      slotName, 
      startTime, 
      endTime, 
      isActive, 
      displayOrder
    } = req.body;
    
    // Check if slot exists
    const checkQuery = 'SELECT id FROM delivery_slots WHERE id = ?';
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }
    
    // Validate time format if provided
    if (startTime || endTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if ((startTime && !timeRegex.test(startTime)) || (endTime && !timeRegex.test(endTime))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid time format. Use HH:MM:SS format'
        });
      }
    }
    
    // Check if slot name already exists (excluding current slot)
    if (slotName) {
      const nameCheckQuery = 'SELECT id FROM delivery_slots WHERE slot_name = ? AND id != ?';
      const nameCheckResult = await query(nameCheckQuery, [slotName, id]);
      
      if (nameCheckResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Slot name already exists'
        });
      }
    }
    
    // Build dynamic update query
    const updateFields = [];
    const params = [];
    
    if (slotName !== undefined) {
      updateFields.push('slot_name = ?');
      params.push(slotName);
    }
    if (startTime !== undefined) {
      updateFields.push('start_time = ?');
      params.push(startTime);
    }
    if (endTime !== undefined) {
      updateFields.push('end_time = ?');
      params.push(endTime);
    }
    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    if (displayOrder !== undefined) {
      updateFields.push('display_order = ?');
      params.push(displayOrder);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const sqlQuery = `
      UPDATE delivery_slots 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    await query(sqlQuery, params);
    
    // Get the updated slot
    const getSlotQuery = `
      SELECT 
        id,
        slot_name,
        start_time,
        end_time,
        max_orders,
        is_active,
        display_order,
        display_order_limit,
        availability_threshold_high,
        availability_threshold_medium,
        created_at,
        updated_at
      FROM delivery_slots
      WHERE id = ?
    `;
    
    const slotResult = await query(getSlotQuery, [id]);
    const slot = slotResult.rows[0];
    
    const updatedSlot = {
      id: slot.id,
      slotName: slot.slot_name,
      startTime: slot.start_time,
      endTime: slot.end_time,
      maxOrders: slot.max_orders,
      isActive: Boolean(slot.is_active),
      displayOrder: slot.display_order,
      displayOrderLimit: slot.display_order_limit || 10,
      availabilityThresholdHigh: slot.availability_threshold_high || 60,
      availabilityThresholdMedium: slot.availability_threshold_medium || 85,
      createdAt: slot.created_at,
      updatedAt: slot.updated_at
    };
    
    res.json({
      success: true,
      message: 'Delivery slot updated successfully',
      data: updatedSlot
    });
  } catch (error) {
    console.error('Error in updateDeliverySlot:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete delivery slot
const deleteDeliverySlot = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if slot exists
    const checkQuery = 'SELECT id FROM delivery_slots WHERE id = ?';
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }
    
    // Check if slot has any orders
    const ordersQuery = 'SELECT COUNT(*) as count FROM orders WHERE delivery_slot_id = ?';
    const ordersResult = await query(ordersQuery, [id]);
    
    if (ordersResult.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete slot that has associated orders'
      });
    }
    
    // Delete slot availability records first
    await query('DELETE FROM delivery_slot_availability WHERE slot_id = ?', [id]);
    
    // Delete the slot
    await query('DELETE FROM delivery_slots WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Delivery slot deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteDeliverySlot:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle slot status
const toggleSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current status
    const checkQuery = 'SELECT is_active FROM delivery_slots WHERE id = ?';
    const checkResult = await query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }
    
    const currentStatus = checkResult.rows[0].is_active;
    const newStatus = currentStatus ? 0 : 1;
    
    // Update status
    const updateQuery = 'UPDATE delivery_slots SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await query(updateQuery, [newStatus, id]);
    
    res.json({
      success: true,
      message: `Delivery slot ${newStatus ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error in toggleSlotStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get slot availability for a date range
const getSlotAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    // First, get all active delivery slots
    const slotsQuery = `
      SELECT 
        id,
        slot_name,
        start_time,
        end_time,
        max_orders,
        display_order_limit,
        availability_threshold_high,
        availability_threshold_medium
      FROM delivery_slots
      WHERE is_active = 1
      ORDER BY start_time ASC, display_order ASC
    `;
    
    const slotsResult = await query(slotsQuery);
    const allSlots = slotsResult.rows;
    
    // Then, get existing availability data for the date range
    const availabilityQuery = `
      SELECT 
        dsa.id,
        dsa.slot_id,
        dsa.delivery_date,
        dsa.available_orders,
        dsa.is_available,
        dsa.max_orders
      FROM delivery_slot_availability dsa
      WHERE dsa.delivery_date BETWEEN ? AND ?
    `;
    
    const availabilityResult = await query(availabilityQuery, [startDate, endDate]);
    const existingAvailability = availabilityResult.rows;
    
    // Create a map of existing availability data
    const availabilityMap = {};
    existingAvailability.forEach(avail => {
      const key = `${avail.slot_id}-${avail.delivery_date}`;
      availabilityMap[key] = avail;
    });
    
    // Generate dates between startDate and endDate
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    // Create availability data for all slots and dates
    const availability = [];
    
    for (const date of dates) {
      for (const slot of allSlots) {
        const key = `${slot.id}-${date}`;
        const existing = availabilityMap[key];
        
        if (existing) {
          // Use existing availability data
          availability.push({
            id: existing.id,
            slotId: slot.id,
            slotName: slot.slot_name,
            startTime: slot.start_time,
            endTime: slot.end_time,
            deliveryDate: date,
            availableOrders: existing.available_orders,
            isAvailable: Boolean(existing.is_available),
            maxOrders: existing.max_orders !== null ? existing.max_orders : slot.max_orders,
            displayOrderLimit: slot.display_order_limit || 10,
            availabilityThresholdHigh: slot.availability_threshold_high || 60,
            availabilityThresholdMedium: slot.availability_threshold_medium || 85
          });
        } else {
          // Create default availability data
          const defaultAvailableOrders = slot.display_order_limit || 10;
          
          availability.push({
            id: null, // No ID since it doesn't exist in database yet
            slotId: slot.id,
            slotName: slot.slot_name,
            startTime: slot.start_time,
            endTime: slot.end_time,
            deliveryDate: date,
            availableOrders: defaultAvailableOrders,
            isAvailable: true,
            maxOrders: slot.max_orders,
            displayOrderLimit: slot.display_order_limit || 10,
            availabilityThresholdHigh: slot.availability_threshold_high || 60,
            availabilityThresholdMedium: slot.availability_threshold_medium || 85
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error in getSlotAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update slot availability
const updateSlotAvailability = async (req, res) => {
  try {
    const { slotId, deliveryDate, maxOrders, availableOrders, isAvailable } = req.body;
    
    if (!slotId || !deliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Slot ID and delivery date are required'
      });
    }
    
    // Check if slot exists and get max orders
    const slotCheckQuery = 'SELECT id, max_orders FROM delivery_slots WHERE id = ?';
    const slotCheckResult = await query(slotCheckQuery, [slotId]);
    
    if (slotCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }
    
    const slot = slotCheckResult.rows[0];
    
    // Use maxOrders from request if provided, otherwise use slot's default
    const effectiveMaxOrders = maxOrders !== undefined ? maxOrders : slot.max_orders;
    
    // Validate available orders don't exceed max orders
    if (availableOrders !== undefined && availableOrders > effectiveMaxOrders) {
      return res.status(400).json({
        success: false,
        message: `Available orders (${availableOrders}) cannot exceed max orders (${effectiveMaxOrders})`
      });
    }
    
    // Check if availability record exists
    const checkQuery = 'SELECT id FROM delivery_slot_availability WHERE slot_id = ? AND delivery_date = ?';
    const checkResult = await query(checkQuery, [slotId, deliveryDate]);
    
    if (checkResult.rows.length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE delivery_slot_availability 
        SET available_orders = ?, is_available = ?, max_orders = ?, updated_at = CURRENT_TIMESTAMP
        WHERE slot_id = ? AND delivery_date = ?
      `;
      await query(updateQuery, [availableOrders, isAvailable ? 1 : 0, effectiveMaxOrders, slotId, deliveryDate]);
    } else {
      // Create new record
      const insertQuery = `
        INSERT INTO delivery_slot_availability (slot_id, delivery_date, available_orders, is_available, max_orders)
        VALUES (?, ?, ?, ?, ?)
      `;
      await query(insertQuery, [slotId, deliveryDate, availableOrders, isAvailable ? 1 : 0, effectiveMaxOrders]);
    }
    
    res.json({
      success: true,
      message: 'Slot availability updated successfully'
    });
  } catch (error) {
    console.error('Error in updateSlotAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get delivery slot statistics
const getDeliverySlotStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_slots,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_slots,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_slots,
        AVG(max_orders) as avg_max_orders
      FROM delivery_slots
    `;
    
    const result = await query(statsQuery);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      data: {
        totalSlots: stats.total_slots,
        activeSlots: stats.active_slots,
        inactiveSlots: stats.inactive_slots,
        avgMaxOrders: Math.round(stats.avg_max_orders || 0)
      }
    });
  } catch (error) {
    console.error('Error in getDeliverySlotStats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Decrement available orders when an online order is received
const decrementAvailableOrders = async (req, res) => {
  try {
    const { slotId, deliveryDate, quantity = 1 } = req.body;
    
    if (!slotId || !deliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Slot ID and delivery date are required'
      });
    }
    
    // Check if slot exists and get current availability
    const slotQuery = 'SELECT id, max_orders FROM delivery_slots WHERE id = ?';
    const slotResult = await query(slotQuery, [slotId]);
    
    if (slotResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery slot not found'
      });
    }
    
    // Check current availability
    const availabilityQuery = 'SELECT available_orders FROM delivery_slot_availability WHERE slot_id = ? AND delivery_date = ?';
    const availabilityResult = await query(availabilityQuery, [slotId, deliveryDate]);
    
    let currentAvailable = 0;
    if (availabilityResult.rows.length > 0) {
      currentAvailable = availabilityResult.rows[0].available_orders;
    } else {
      // If no availability record exists, create one with default value
      const defaultAvailable = slotResult.rows[0].max_orders;
      const insertQuery = `
        INSERT INTO delivery_slot_availability (slot_id, delivery_date, available_orders, is_available)
        VALUES (?, ?, ?, ?)
      `;
      await query(insertQuery, [slotId, deliveryDate, defaultAvailable, 1]);
      currentAvailable = defaultAvailable;
    }
    
    // Calculate new available orders
    const newAvailable = Math.max(0, currentAvailable - quantity);
    
    // Update availability
    const updateQuery = `
      UPDATE delivery_slot_availability 
      SET available_orders = ?, updated_at = CURRENT_TIMESTAMP
      WHERE slot_id = ? AND delivery_date = ?
    `;
    await query(updateQuery, [newAvailable, slotId, deliveryDate]);
    
    res.json({
      success: true,
      message: `Available orders decremented by ${quantity}`,
      data: {
        slotId,
        deliveryDate,
        previousAvailable: currentAvailable,
        newAvailable,
        quantity
      }
    });
  } catch (error) {
    console.error('Error in decrementAvailableOrders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getDeliverySlots,
  getDeliverySlotById,
  createDeliverySlot,
  updateDeliverySlot,
  deleteDeliverySlot,
  toggleSlotStatus,
  getSlotAvailability,
  updateSlotAvailability,
  getDeliverySlotStats,
  decrementAvailableOrders
};

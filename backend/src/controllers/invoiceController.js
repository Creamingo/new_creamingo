const { query } = require('../config/db');
const PDFDocument = require('pdfkit');

/**
 * Check if an order item is a deal product by comparing price with deal prices
 */
const isDealProduct = async (productId, price) => {
  try {
    const dealResult = await query(`
      SELECT id, deal_title, deal_price
      FROM one_rupee_deals
      WHERE product_id = ? AND is_active = 1
    `, [productId]);
    
    if (dealResult.rows && dealResult.rows.length > 0) {
      // Check if the price matches any deal price (with small tolerance for floating point)
      for (const deal of dealResult.rows) {
        const dealPrice = parseFloat(deal.deal_price);
        const itemPrice = parseFloat(price);
        if (Math.abs(dealPrice - itemPrice) < 0.01) {
          return {
            isDeal: true,
            dealTitle: deal.deal_title,
            dealPrice: dealPrice
          };
        }
      }
    }
    return { isDeal: false };
  } catch (error) {
    console.error('Error checking deal product:', error);
    return { isDeal: false };
  }
};

/**
 * Generate and download invoice for an order
 */
const downloadInvoice = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { orderNumber } = req.params;

    // Verify order belongs to customer
    const orderResult = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.delivery_address,
        o.delivery_date,
        o.delivery_time,
        o.special_instructions,
        o.payment_method,
        o.payment_status,
        o.created_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM orders o
      INNER JOIN customers c ON o.customer_id = c.id
      WHERE o.order_number = ? AND o.customer_id = ?
    `, [orderNumber, customerId]);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission to access it'
      });
    }

    const order = orderResult.rows[0];

    // Get order items with deal information
    // Try with display_name first (for migrated databases), fallback if column doesn't exist
    let itemsResult;
    try {
      itemsResult = await query(`
        SELECT 
          oi.id,
          oi.product_id,
          oi.variant_id,
          oi.quantity,
          oi.price,
          oi.total,
          oi.flavor_id,
          oi.tier,
          oi.cake_message,
          COALESCE(oi.display_name, p.name) as product_name,
          oi.display_name,
          p.name as product_base_name,
          p.base_price as product_base_price,
          p.discounted_price as product_discounted_price,
          pv.name as variant_name,
          pv.weight as variant_weight
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_variants pv ON oi.variant_id = pv.id
        WHERE oi.order_id = ?
        ORDER BY oi.id
      `, [order.id]);
    } catch (error) {
      // Fallback if display_name column doesn't exist (pre-migration)
      if (error.message && error.message.includes('display_name')) {
        itemsResult = await query(`
          SELECT 
            oi.id,
            oi.product_id,
            oi.variant_id,
            oi.quantity,
            oi.price,
            oi.total,
            oi.flavor_id,
            oi.tier,
            oi.cake_message,
            p.name as product_name,
            p.name as product_base_name,
            p.base_price as product_base_price,
            p.discounted_price as product_discounted_price,
            pv.name as variant_name,
            pv.weight as variant_weight
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN product_variants pv ON oi.variant_id = pv.id
          WHERE oi.order_id = ?
          ORDER BY oi.id
        `, [order.id]);
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    const items = itemsResult.rows || [];

    // Get combo items for all order items
    const comboItemsMap = new Map();
    if (items.length > 0) {
      const orderItemIds = items.map(item => item.id);
      const placeholders = orderItemIds.map(() => '?').join(',');
      
      const comboResult = await query(`
        SELECT 
          cs.order_item_id,
          cs.quantity,
          cs.add_on_product_id,
          aop.name as product_name,
          aop.price,
          aop.discounted_price,
          (cs.quantity * COALESCE(aop.discounted_price, aop.price)) as total
        FROM combo_selections cs
        LEFT JOIN add_on_products aop ON cs.add_on_product_id = aop.id
        WHERE cs.order_item_id IN (${placeholders})
        ORDER BY cs.order_item_id, cs.id
      `, orderItemIds);

      if (comboResult.rows && comboResult.rows.length > 0) {
        comboResult.rows.forEach(combo => {
          if (!comboItemsMap.has(combo.order_item_id)) {
            comboItemsMap.set(combo.order_item_id, []);
          }
          comboItemsMap.get(combo.order_item_id).push(combo);
        });
      }
    }

    // Check for deals and enrich items
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const dealInfo = await isDealProduct(item.product_id, item.price);
      return {
        ...item,
        isDeal: dealInfo.isDeal,
        dealTitle: dealInfo.dealTitle,
        dealPrice: dealInfo.dealPrice,
        combos: comboItemsMap.get(item.id) || []
      };
    }));

    // Parse delivery address
    const deliveryAddress = order.delivery_address 
      ? (typeof order.delivery_address === 'string' 
          ? JSON.parse(order.delivery_address) 
          : order.delivery_address)
      : null;

    // Create PDF document with compact margins
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 30, bottom: 30, left: 30, right: 30 }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.order_number}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Color constants - improved palette
    const primaryColor = '#ec4899'; // Pink
    const secondaryColor = '#f43f5e'; // Rose
    const darkGray = '#1f2937'; // Darker for better contrast
    const mediumGray = '#6b7280'; // Medium gray for secondary text
    const lightGray = '#9ca3af'; // Light gray for tertiary text
    const bgColor = '#fef2f2'; // Light pink background
    const borderColor = '#e5e7eb'; // Subtle border color

    // Helper function to check if we need a new page - improved to prevent blank pages
    const checkPageBreak = (requiredHeight) => {
      const bottomMargin = 40;
      const footerHeight = 25;
      const maxY = doc.page.height - bottomMargin - footerHeight;
      const currentY = doc.y;
      if (currentY + requiredHeight > maxY && currentY > 100) { // Only add page if we're past initial content
        doc.addPage();
        return true;
      }
      return false;
    };

    // Clean header with better spacing
    doc.rect(0, 0, doc.page.width, 75)
      .fillColor(bgColor)
      .fill();
    
    doc.fillColor(primaryColor)
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('CREAMINGO', 0, 20, { align: 'center', width: doc.page.width });
    
    doc.fillColor(darkGray)
      .fontSize(11)
      .font('Helvetica')
      .text('INVOICE', 0, 48, { align: 'center', width: doc.page.width });
    
    doc.y = 85;

    // Order info with improved spacing
    const orderInfoY = doc.y;
    doc.rect(30, orderInfoY, doc.page.width - 60, 45)
      .fillColor('#ffffff')
      .fill()
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    
    doc.fillColor(mediumGray || '#6b7280')
      .fontSize(9)
      .font('Helvetica')
      .text('Order #', 40, orderInfoY + 10);
    
    doc.fillColor(primaryColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(order.order_number, 40, orderInfoY + 23);
    
    doc.fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica')
      .text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, doc.page.width - 200, orderInfoY + 10, { width: 170, align: 'right' });
    
    doc.fillColor(mediumGray || '#6b7280')
      .fontSize(8)
      .font('Helvetica')
      .text(order.status.replace(/_/g, ' ').toUpperCase(), doc.page.width - 200, orderInfoY + 25, { width: 170, align: 'right' });
    
    doc.y = orderInfoY + 52;

    // Customer and Delivery info in two columns (compact)
    const infoStartY = doc.y;
    const columnWidth = (doc.page.width - 90) / 2;

    // Customer info
    doc.fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Bill To', 30, infoStartY);
    
    doc.fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica')
      .text(order.customer_name, 30, infoStartY + 12);
    
    let customerInfoHeight = 12;
    if (order.customer_email) {
      doc      .fillColor(mediumGray || '#6b7280')
        .fontSize(8)
        .text(order.customer_email, 30, infoStartY + 24);
      customerInfoHeight += 12;
    }
    if (order.customer_phone) {
      doc      .fillColor(mediumGray || '#6b7280')
        .fontSize(8)
        .text(order.customer_phone, 30, infoStartY + 36);
      customerInfoHeight += 12;
    }

    // Delivery info
    let deliveryInfoHeight = 0;
    if (deliveryAddress) {
      doc.fillColor(darkGray)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Delivery To', 30 + columnWidth + 40, infoStartY);
      
      let deliveryY = infoStartY + 16;
      if (deliveryAddress.street) {
        doc.fillColor(darkGray)
          .fontSize(9)
          .font('Helvetica')
          .text(deliveryAddress.street, 30 + columnWidth + 40, deliveryY, { width: columnWidth });
        deliveryY += 14;
        deliveryInfoHeight += 14;
      }
      if (deliveryAddress.landmark) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(8)
          .font('Helvetica')
          .text(`📍 ${deliveryAddress.landmark}`, 30 + columnWidth + 40, deliveryY, { width: columnWidth });
        deliveryY += 13;
        deliveryInfoHeight += 13;
      }
      if (deliveryAddress.city || deliveryAddress.state) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(8)
          .font('Helvetica')
          .text(`${deliveryAddress.city || ''}${deliveryAddress.city && deliveryAddress.state ? ', ' : ''}${deliveryAddress.state || ''}`, 30 + columnWidth + 40, deliveryY, { width: columnWidth });
        deliveryY += 13;
        deliveryInfoHeight += 13;
      }
      if (deliveryAddress.zip_code) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(8)
          .font('Helvetica')
          .text(`PIN: ${deliveryAddress.zip_code}`, 30 + columnWidth + 40, deliveryY, { width: columnWidth });
        deliveryInfoHeight += 13;
      }
    }

    doc.y = infoStartY + Math.max(customerInfoHeight, deliveryInfoHeight) + 20;

    // Delivery date/time if available
    if (order.delivery_date) {
      doc.fillColor(darkGray)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Delivery:', 30, doc.y);
      doc.fillColor(mediumGray || '#6b7280')
        .fontSize(9)
        .font('Helvetica')
        .text(`${new Date(order.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${order.delivery_time ? ` • ${order.delivery_time}` : ''}`, 100, doc.y);
      doc.y += 18;
    }

    // Items table with modern design
    doc.fillColor(darkGray)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Order Items', 30, doc.y);
    
    doc.y += 12;

    // Table header with improved spacing
    const tableTop = doc.y;
    doc.rect(30, tableTop, doc.page.width - 60, 26)
      .fillColor(primaryColor)
      .fill();
    
    doc.fillColor('#ffffff')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Item', 35, tableTop + 8, { width: 280 });
    doc.text('Qty', 320, tableTop + 8, { width: 35, align: 'center' });
    doc.text('Price', 360, tableTop + 8, { width: 60, align: 'right' });
    doc.text('Total', 425, tableTop + 8, { width: 75, align: 'right' });

    let yPos = tableTop + 32;
    let itemIndex = 0;

    enrichedItems.forEach((item) => {
      // Calculate item height dynamically with better spacing
      let itemHeight = 22; // Base height with improved spacing
      if (item.variant_name || item.tier) itemHeight += 12;
      if (item.cake_message) itemHeight += 15;
      if (item.combos && item.combos.length > 0) {
        itemHeight += item.combos.length * 14;
      }

      // Check if we need a new page
      if (checkPageBreak(itemHeight + 25)) {
        yPos = 30;
        // Redraw header on new page
        doc.rect(30, yPos, doc.page.width - 60, 26)
          .fillColor(primaryColor)
          .fill();
        doc.fillColor('#ffffff')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Item', 35, yPos + 8, { width: 280 });
        doc.text('Qty', 320, yPos + 8, { width: 35, align: 'center' });
        doc.text('Price', 360, yPos + 8, { width: 60, align: 'right' });
        doc.text('Total', 425, yPos + 6, { width: 75, align: 'right' });
        yPos += 32;
      }

      // Alternate row background
      if (itemIndex % 2 === 0) {
        doc.rect(30, yPos - 3, doc.page.width - 60, itemHeight)
          .fillColor('#fef2f2')
          .fill();
      }

      // Product name with Deal badge
      const productName = (item.display_name || item.product_name || item.product_base_name || 'Product');
      
      if (item.isDeal) {
        doc.fillColor(secondaryColor)
          .fontSize(7)
          .font('Helvetica-Bold')
          .text('DEAL', 35, yPos - 1, { width: 45 });
      }

      doc.fillColor(darkGray)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(productName, item.isDeal ? 85 : 35, yPos, { width: 250 });

      // Variant and tier info
      const variantText = item.variant_name 
        ? `${item.variant_name}${item.variant_weight ? ` (${item.variant_weight})` : ''}`
        : '';
      const tierText = item.tier ? ` - ${item.tier}` : '';
      
      if (variantText || tierText) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(7)
          .text(`${variantText}${tierText}`, item.isDeal ? 85 : 35, yPos + 10, { width: 250 });
      }

      // Quantity
      doc.fillColor(darkGray)
        .fontSize(8)
        .text(item.quantity.toString(), 320, yPos + 4, { width: 35, align: 'center' });

      // Price
      const displayPrice = item.isDeal ? item.dealPrice : parseFloat(item.price);
      doc.fillColor(darkGray)
        .fontSize(8)
        .text(`₹${displayPrice.toFixed(2)}`, 360, yPos + 4, { width: 60, align: 'right' });

      // Total
      const itemTotal = parseFloat(item.total || item.price * item.quantity);
      doc.fillColor(darkGray)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`₹${itemTotal.toFixed(2)}`, 425, yPos + 4, { width: 70, align: 'right' });

      yPos += 18;

      // Cake message if available
      if (item.cake_message) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(7)
          .font('Helvetica-Oblique')
          .text(`💬 "${item.cake_message}"`, 40, yPos, { width: 460 });
        yPos += 12;
      }

      // Combo items
      if (item.combos && item.combos.length > 0) {
        item.combos.forEach((combo) => {
          const comboName = combo.product_name || 'Combo Item';
          const comboPrice = parseFloat(combo.discounted_price || combo.price || 0);
          const comboTotal = parseFloat(combo.total || comboPrice * combo.quantity);
          
          doc.fillColor(mediumGray || '#6b7280')
            .fontSize(7)
            .text(`  ➕ ${comboName}`, 50, yPos, { width: 240 });
          doc.text(`×${combo.quantity}`, 320, yPos, { width: 35, align: 'center' });
          doc.text(`₹${comboPrice.toFixed(2)}`, 360, yPos, { width: 60, align: 'right' });
          doc.text(`₹${comboTotal.toFixed(2)}`, 425, yPos, { width: 70, align: 'right' });
          yPos += 12;
        });
      }

      yPos += 5;
      itemIndex++;
    });

    // Total section - ensure it fits on current page
    if (checkPageBreak(50)) {
      yPos = 30;
    }
    
    yPos += 8; // Add space before total section
    
    // Draw line above total with better visibility
    doc.moveTo(30, yPos)
      .lineTo(doc.page.width - 30, yPos)
      .strokeColor(borderColor || '#e5e7eb')
      .lineWidth(1)
      .stroke();
    
    yPos += 12;
    
    // Total amount label with proper spacing
    const totalLabelWidth = 130;
    const totalStartX = doc.page.width - 30 - 100 - totalLabelWidth;
    doc.fillColor(darkGray)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Total Amount:', totalStartX, yPos, { width: totalLabelWidth, align: 'right' });
    
    // Total amount with proper width to ensure full visibility
    const totalAmountText = `₹${parseFloat(order.total_amount).toFixed(2)}`;
    const totalAmountWidth = 100;
    doc.fillColor(primaryColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(totalAmountText, doc.page.width - 30 - totalAmountWidth, yPos + 2, { width: totalAmountWidth, align: 'right' });

    yPos += 24;

    // Payment info with better spacing
    if (checkPageBreak(40)) {
      yPos = 30;
    }
    
    doc.fillColor(darkGray)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Payment:', 30, yPos);
    
    doc.fillColor(mediumGray || '#6b7280')
      .fontSize(9)
      .font('Helvetica')
      .text(`${(order.payment_method || 'N/A').toUpperCase()} • ${(order.payment_status || 'Pending').toUpperCase()}`, 100, yPos);

    yPos += 20;

    // Special instructions with better formatting
    if (order.special_instructions) {
      if (checkPageBreak(35)) {
        yPos = 30;
      }
      doc.fillColor(darkGray)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Note:', 30, yPos);
      doc.fillColor(mediumGray || '#6b7280')
        .fontSize(8)
        .font('Helvetica')
        .text(order.special_instructions, 75, yPos, { width: doc.page.width - 105 });
    }

    // Add footer only to current page (prevents blank pages)
    const addFooter = () => {
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      doc.fontSize(7);
      doc.fillColor(mediumGray || '#6b7280')
        .text('Thank you for your order!', pageWidth / 2, pageHeight - 25, { align: 'center' });
      doc.fontSize(6);
      doc.fillColor(lightGray)
        .text('For queries, contact us at support@creamingo.com', pageWidth / 2, pageHeight - 15, { align: 'center' });
    };

    // Add footer to current page only
    addFooter();

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Generate and download invoice for an order (Admin version - no customer verification)
 */
const downloadInvoiceAdmin = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Verify order exists (admin can access any order)
    const orderResult = await query(`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.total_amount,
        o.delivery_address,
        o.delivery_date,
        o.delivery_time,
        o.special_instructions,
        o.payment_method,
        o.payment_status,
        o.created_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM orders o
      INNER JOIN customers c ON o.customer_id = c.id
      WHERE o.order_number = ?
    `, [orderNumber]);

    if (!orderResult.rows || orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    // Get order items with deal information
    // Try with display_name first (for migrated databases), fallback if column doesn't exist
    let itemsResult;
    try {
      itemsResult = await query(`
        SELECT 
          oi.id,
          oi.product_id,
          oi.variant_id,
          oi.quantity,
          oi.price,
          oi.total,
          oi.flavor_id,
          oi.tier,
          oi.cake_message,
          COALESCE(oi.display_name, p.name) as product_name,
          oi.display_name,
          p.name as product_base_name,
          p.base_price as product_base_price,
          p.discounted_price as product_discounted_price,
          pv.name as variant_name,
          pv.weight as variant_weight
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_variants pv ON oi.variant_id = pv.id
        WHERE oi.order_id = ?
        ORDER BY oi.id
      `, [order.id]);
    } catch (error) {
      // Fallback if display_name column doesn't exist (pre-migration)
      if (error.message && error.message.includes('display_name')) {
        itemsResult = await query(`
          SELECT 
            oi.id,
            oi.product_id,
            oi.variant_id,
            oi.quantity,
            oi.price,
            oi.total,
            oi.flavor_id,
            oi.tier,
            oi.cake_message,
            p.name as product_name,
            p.name as product_base_name,
            p.base_price as product_base_price,
            p.discounted_price as product_discounted_price,
            pv.name as variant_name,
            pv.weight as variant_weight
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          LEFT JOIN product_variants pv ON oi.variant_id = pv.id
          WHERE oi.order_id = ?
          ORDER BY oi.id
        `, [order.id]);
      } else {
        throw error; // Re-throw if it's a different error
      }
    }

    const items = itemsResult.rows || [];

    // Get combo items for all order items
    const comboItemsMap = new Map();
    if (items.length > 0) {
      const orderItemIds = items.map(item => item.id);
      const placeholders = orderItemIds.map(() => '?').join(',');
      
      const comboResult = await query(`
        SELECT 
          cs.order_item_id,
          cs.quantity,
          cs.add_on_product_id,
          aop.name as product_name,
          aop.price,
          aop.discounted_price,
          (cs.quantity * COALESCE(aop.discounted_price, aop.price)) as total
        FROM combo_selections cs
        LEFT JOIN add_on_products aop ON cs.add_on_product_id = aop.id
        WHERE cs.order_item_id IN (${placeholders})
        ORDER BY cs.order_item_id, cs.id
      `, orderItemIds);

      if (comboResult.rows && comboResult.rows.length > 0) {
        comboResult.rows.forEach(combo => {
          if (!comboItemsMap.has(combo.order_item_id)) {
            comboItemsMap.set(combo.order_item_id, []);
          }
          comboItemsMap.get(combo.order_item_id).push(combo);
        });
      }
    }

    // Check for deals and enrich items
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const dealInfo = await isDealProduct(item.product_id, item.price);
      return {
        ...item,
        isDeal: dealInfo.isDeal,
        dealTitle: dealInfo.dealTitle,
        dealPrice: dealInfo.dealPrice,
        combos: comboItemsMap.get(item.id) || []
      };
    }));

    // Parse delivery address
    const deliveryAddress = order.delivery_address
      ? (typeof order.delivery_address === 'string' 
          ? JSON.parse(order.delivery_address) 
          : order.delivery_address)
      : null;

    // Create PDF document with compact margins
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 30, bottom: 30, left: 30, right: 30 }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.order_number}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Color constants
    const primaryColor = '#ec4899'; // Pink
    const secondaryColor = '#f43f5e'; // Rose
    const darkGray = '#1f2937'; // Darker for better contrast
    const lightGray = '#9ca3af';
    const bgColor = '#fef2f2'; // Light pink background
    const borderColor = '#e5e7eb'; // Subtle border color
    const mediumGray = '#6b7280'; // Medium gray for secondary text

    // Helper function to check if we need a new page - improved to prevent blank pages
    const checkPageBreak = (requiredHeight) => {
      const bottomMargin = 40;
      const footerHeight = 25;
      const maxY = doc.page.height - bottomMargin - footerHeight;
      const currentY = doc.y;
      if (currentY + requiredHeight > maxY && currentY > 100) { // Only add page if we're past initial content
        doc.addPage();
        return true;
      }
      return false;
    };

    // Clean header with better spacing
    doc.rect(0, 0, doc.page.width, 75)
      .fillColor(bgColor)
      .fill();
    
    doc.fillColor(primaryColor)
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('CREAMINGO', 0, 20, { align: 'center', width: doc.page.width });
    
    doc.fillColor(darkGray)
      .fontSize(11)
      .font('Helvetica')
      .text('INVOICE', 0, 48, { align: 'center', width: doc.page.width });
    
    doc.y = 85;

    // Order info with improved spacing
    const orderInfoY = doc.y;
    doc.rect(30, orderInfoY, doc.page.width - 60, 45)
      .fillColor('#ffffff')
      .fill()
      .strokeColor(borderColor)
      .lineWidth(1)
      .stroke();
    
    doc.fillColor(mediumGray || '#6b7280')
      .fontSize(9)
      .font('Helvetica')
      .text('Order #', 40, orderInfoY + 10);
    
    doc.fillColor(primaryColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(order.order_number, 40, orderInfoY + 23);
    
    doc.fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica')
      .text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, doc.page.width - 200, orderInfoY + 10, { width: 170, align: 'right' });
    
    doc.fillColor(mediumGray || '#6b7280')
      .fontSize(8)
      .font('Helvetica')
      .text(order.status.replace(/_/g, ' ').toUpperCase(), doc.page.width - 200, orderInfoY + 25, { width: 170, align: 'right' });
    
    doc.y = orderInfoY + 52;

    // Customer and Delivery info in two columns (compact)
    const infoStartY = doc.y;
    const columnWidth = (doc.page.width - 90) / 2;

    // Customer info
    doc.fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Bill To', 30, infoStartY);
    
    doc.fillColor(darkGray)
      .fontSize(9)
      .font('Helvetica')
      .text(order.customer_name, 30, infoStartY + 12);
    
    let customerInfoHeight = 12;
    if (order.customer_email) {
      doc      .fillColor(mediumGray || '#6b7280')
        .fontSize(8)
        .text(order.customer_email, 30, infoStartY + 24);
      customerInfoHeight += 12;
    }
    if (order.customer_phone) {
      doc      .fillColor(mediumGray || '#6b7280')
        .fontSize(8)
        .text(order.customer_phone, 30, infoStartY + 36);
      customerInfoHeight += 12;
    }

    // Delivery info
    let deliveryInfoHeight = 0;
    if (deliveryAddress) {
      doc.fillColor(darkGray)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Delivery To', 30 + columnWidth + 40, infoStartY);
      
      let deliveryY = infoStartY + 16;
      if (deliveryAddress.street) {
        doc.fillColor(darkGray)
          .fontSize(9)
          .font('Helvetica')
          .text(deliveryAddress.street, 30 + columnWidth + 40, deliveryY, { width: columnWidth });
        deliveryY += 14;
        deliveryInfoHeight += 14;
      }
      if (deliveryAddress.landmark) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(8)
          .font('Helvetica')
          .text(`📍 ${deliveryAddress.landmark}`, 30 + columnWidth + 40, deliveryY, { width: columnWidth });
        deliveryY += 13;
        deliveryInfoHeight += 13;
      }
      if (deliveryAddress.city || deliveryAddress.state) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(8)
          .font('Helvetica')
          .text(`${deliveryAddress.city || ''}${deliveryAddress.city && deliveryAddress.state ? ', ' : ''}${deliveryAddress.state || ''}`, 30 + columnWidth + 40, deliveryY, { width: columnWidth });
        deliveryY += 13;
        deliveryInfoHeight += 13;
      }
      if (deliveryAddress.zip_code) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(8)
          .font('Helvetica')
          .text(`PIN: ${deliveryAddress.zip_code}`, 30 + columnWidth + 40, deliveryY, { width: columnWidth });
        deliveryInfoHeight += 13;
      }
    }

    doc.y = infoStartY + Math.max(customerInfoHeight, deliveryInfoHeight) + 20;

    // Delivery date/time if available
    if (order.delivery_date) {
      doc.fillColor(darkGray)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Delivery:', 30, doc.y);
      doc.fillColor(mediumGray || '#6b7280')
        .fontSize(9)
        .font('Helvetica')
        .text(`${new Date(order.delivery_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${order.delivery_time ? ` • ${order.delivery_time}` : ''}`, 100, doc.y);
      doc.y += 18;
    }

    // Items table with modern design
    doc.fillColor(darkGray)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Order Items', 30, doc.y);
    
    doc.y += 12;

    // Table header with improved spacing
    const tableTop = doc.y;
    doc.rect(30, tableTop, doc.page.width - 60, 26)
      .fillColor(primaryColor)
      .fill();
    
    doc.fillColor('#ffffff')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Item', 35, tableTop + 8, { width: 280 });
    doc.text('Qty', 320, tableTop + 8, { width: 35, align: 'center' });
    doc.text('Price', 360, tableTop + 8, { width: 60, align: 'right' });
    doc.text('Total', 425, tableTop + 8, { width: 75, align: 'right' });

    let yPos = tableTop + 32;
    let itemIndex = 0;

    enrichedItems.forEach((item) => {
      // Calculate item height dynamically with better spacing
      let itemHeight = 22; // Base height with improved spacing
      if (item.variant_name || item.tier) itemHeight += 12;
      if (item.cake_message) itemHeight += 15;
      if (item.combos && item.combos.length > 0) {
        itemHeight += item.combos.length * 14;
      }

      // Check if we need a new page
      if (checkPageBreak(itemHeight + 25)) {
        yPos = 30;
        // Redraw header on new page
        doc.rect(30, yPos, doc.page.width - 60, 26)
          .fillColor(primaryColor)
          .fill();
        doc.fillColor('#ffffff')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Item', 35, yPos + 8, { width: 280 });
        doc.text('Qty', 320, yPos + 8, { width: 35, align: 'center' });
        doc.text('Price', 360, yPos + 8, { width: 60, align: 'right' });
        doc.text('Total', 425, yPos + 6, { width: 75, align: 'right' });
        yPos += 32;
      }

      // Alternate row background
      if (itemIndex % 2 === 0) {
        doc.rect(30, yPos - 3, doc.page.width - 60, itemHeight)
          .fillColor('#fef2f2')
          .fill();
      }

      // Product name with Deal badge
      const productName = (item.display_name || item.product_name || item.product_base_name || 'Product');
      
      if (item.isDeal) {
        doc.fillColor(secondaryColor)
          .fontSize(7)
          .font('Helvetica-Bold')
          .text('DEAL', 35, yPos - 1, { width: 45 });
      }

      doc.fillColor(darkGray)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(productName, item.isDeal ? 85 : 35, yPos, { width: 250 });

      // Variant and tier info
      const variantText = item.variant_name 
        ? `${item.variant_name}${item.variant_weight ? ` (${item.variant_weight})` : ''}`
        : '';
      const tierText = item.tier ? ` - ${item.tier}` : '';
      
      if (variantText || tierText) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(7)
          .text(`${variantText}${tierText}`, item.isDeal ? 85 : 35, yPos + 10, { width: 250 });
      }

      // Quantity
      doc.fillColor(darkGray)
        .fontSize(8)
        .text(item.quantity.toString(), 320, yPos + 4, { width: 35, align: 'center' });

      // Price
      const displayPrice = item.isDeal ? item.dealPrice : parseFloat(item.price);
      doc.fillColor(darkGray)
        .fontSize(8)
        .text(`₹${displayPrice.toFixed(2)}`, 360, yPos + 4, { width: 60, align: 'right' });

      // Total
      const itemTotal = parseFloat(item.total || item.price * item.quantity);
      doc.fillColor(darkGray)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(`₹${itemTotal.toFixed(2)}`, 425, yPos + 4, { width: 70, align: 'right' });

      yPos += 18;

      // Cake message if available
      if (item.cake_message) {
        doc.fillColor(mediumGray || '#6b7280')
          .fontSize(7)
          .font('Helvetica-Oblique')
          .text(`💬 "${item.cake_message}"`, 40, yPos, { width: 460 });
        yPos += 12;
      }

      // Combo items
      if (item.combos && item.combos.length > 0) {
        item.combos.forEach((combo) => {
          const comboName = combo.product_name || 'Combo Item';
          const comboPrice = parseFloat(combo.discounted_price || combo.price || 0);
          const comboTotal = parseFloat(combo.total || comboPrice * combo.quantity);
          
          doc.fillColor(mediumGray || '#6b7280')
            .fontSize(7)
            .text(`  ➕ ${comboName}`, 50, yPos, { width: 240 });
          doc.text(`×${combo.quantity}`, 320, yPos, { width: 35, align: 'center' });
          doc.text(`₹${comboPrice.toFixed(2)}`, 360, yPos, { width: 60, align: 'right' });
          doc.text(`₹${comboTotal.toFixed(2)}`, 425, yPos, { width: 70, align: 'right' });
          yPos += 12;
        });
      }

      yPos += 5;
      itemIndex++;
    });

    // Total section - ensure it fits on current page
    if (checkPageBreak(50)) {
      yPos = 30;
    }
    
    yPos += 8; // Add space before total section
    
    // Draw line above total with better visibility
    doc.moveTo(30, yPos)
      .lineTo(doc.page.width - 30, yPos)
      .strokeColor(borderColor || '#e5e7eb')
      .lineWidth(1)
      .stroke();
    
    yPos += 12;
    
    // Total amount label with proper spacing
    const totalLabelWidth = 130;
    const totalStartX = doc.page.width - 30 - 100 - totalLabelWidth;
    doc.fillColor(darkGray)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Total Amount:', totalStartX, yPos, { width: totalLabelWidth, align: 'right' });
    
    // Total amount with proper width to ensure full visibility
    const totalAmountText = `₹${parseFloat(order.total_amount).toFixed(2)}`;
    const totalAmountWidth = 100;
    doc.fillColor(primaryColor)
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(totalAmountText, doc.page.width - 30 - totalAmountWidth, yPos + 2, { width: totalAmountWidth, align: 'right' });

    yPos += 24;

    // Payment info with better spacing
    if (checkPageBreak(40)) {
      yPos = 30;
    }
    
    doc.fillColor(darkGray)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Payment:', 30, yPos);
    
    doc.fillColor(mediumGray || '#6b7280')
      .fontSize(9)
      .font('Helvetica')
      .text(`${(order.payment_method || 'N/A').toUpperCase()} • ${(order.payment_status || 'Pending').toUpperCase()}`, 100, yPos);

    yPos += 20;

    // Special instructions with better formatting
    if (order.special_instructions) {
      if (checkPageBreak(35)) {
        yPos = 30;
      }
      doc.fillColor(darkGray)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Note:', 30, yPos);
      doc.fillColor(mediumGray || '#6b7280')
        .fontSize(8)
        .font('Helvetica')
        .text(order.special_instructions, 75, yPos, { width: doc.page.width - 105 });
    }

    // Add footer only to current page (prevents blank pages)
    const addFooter = () => {
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      doc.fontSize(7);
      doc.fillColor(mediumGray || '#6b7280')
        .text('Thank you for your order!', pageWidth / 2, pageHeight - 25, { align: 'center' });
      doc.fontSize(6);
      doc.fillColor(lightGray)
        .text('For queries, contact us at support@creamingo.com', pageWidth / 2, pageHeight - 15, { align: 'center' });
    };

    // Add footer to current page only
    addFooter();

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  downloadInvoice,
  downloadInvoiceAdmin
};

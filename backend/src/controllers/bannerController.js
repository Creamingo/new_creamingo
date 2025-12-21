const { query } = require('../config/db');

// Get all banners
const getBanners = async (req, res) => {
  try {
    const { is_active } = req.query;

    let whereClause = '';
    let queryParams = [];

    if (is_active !== undefined) {
      whereClause = 'WHERE is_active = ?';
      queryParams.push(is_active === 'true' ? 1 : 0);
    }

    const bannersQuery = `
      SELECT 
        id,
        title,
        subtitle,
        button_text,
        button_url,
        image_url,
        is_active,
        order_index,
        created_at,
        updated_at
      FROM banners
      ${whereClause}
      ORDER BY order_index ASC, created_at DESC
    `;

    const result = await query(bannersQuery, queryParams);

    res.json({
      success: true,
      data: { banners: result.rows }
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single banner
const getBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        id,
        title,
        subtitle,
        button_text,
        button_url,
        image_url,
        is_active,
        order_index,
        created_at,
        updated_at
      FROM banners
      WHERE id = ?
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.json({
      success: true,
      data: { banner: result.rows[0] }
    });
  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create banner
const createBanner = async (req, res) => {
  try {
    const { 
      title, 
      subtitle, 
      button_text, 
      button_url, 
      image_url, 
      is_active = true, 
      order_index = 0 
    } = req.body;

    // Validate required fields
    if (!title || !image_url) {
      return res.status(400).json({
        success: false,
        message: 'Title and image URL are required'
      });
    }

    const result = await query(`
      INSERT INTO banners (title, subtitle, button_text, button_url, image_url, is_active, order_index, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [title, subtitle, button_text, button_url, image_url, is_active ? 1 : 0, order_index]);

    const bannerId = result.lastID;

    // Fetch the created banner
    const bannerResult = await query(`
      SELECT 
        id,
        title,
        subtitle,
        button_text,
        button_url,
        image_url,
        is_active,
        order_index,
        created_at,
        updated_at
      FROM banners
      WHERE id = ?
    `, [bannerId]);

    const banner = bannerResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: { banner }
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if banner exists
    const existingBanner = await query(
      'SELECT id FROM banners WHERE id = ?',
      [id]
    );

    if (existingBanner.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'is_active') {
          updates.push(`${key} = ?`);
          values.push(updateData[key] ? 1 : 0);
        } else {
          updates.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(id);

    const queryText = `
      UPDATE banners 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `;

    await query(queryText, values);

    // Fetch the updated banner
    const bannerResult = await query(`
      SELECT 
        id,
        title,
        subtitle,
        button_text,
        button_url,
        image_url,
        is_active,
        order_index,
        created_at,
        updated_at
      FROM banners
      WHERE id = ?
    `, [id]);

    const banner = bannerResult.rows[0];

    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: { banner }
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete banner
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if banner exists
    const existingBanner = await query(
      'SELECT id FROM banners WHERE id = ?',
      [id]
    );

    if (existingBanner.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    await query('DELETE FROM banners WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle banner status
const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if banner exists
    const existingBanner = await query(
      'SELECT id, is_active FROM banners WHERE id = ?',
      [id]
    );

    if (existingBanner.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    const currentStatus = existingBanner.rows[0].is_active;
    const newStatus = currentStatus ? 0 : 1;

    await query(
      'UPDATE banners SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [newStatus, id]
    );

    // Fetch the updated banner
    const bannerResult = await query(`
      SELECT 
        id,
        title,
        subtitle,
        button_text,
        button_url,
        image_url,
        is_active,
        order_index,
        created_at,
        updated_at
      FROM banners
      WHERE id = ?
    `, [id]);

    const banner = bannerResult.rows[0];

    res.json({
      success: true,
      message: `Banner ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: { banner }
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update banner order (bulk update)
const updateBannerOrder = async (req, res) => {
  try {
    const { banners } = req.body;
    
    if (!Array.isArray(banners)) {
      return res.status(400).json({
        success: false,
        message: 'Banners must be an array'
      });
    }

    // Update each banner's order_index
    for (const banner of banners) {
      if (banner.id && banner.order_index !== undefined) {
        await query(
          'UPDATE banners SET order_index = ?, updated_at = datetime(\'now\') WHERE id = ?',
          [banner.order_index, banner.id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Banner order updated successfully'
    });
  } catch (error) {
    console.error('Update banner order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get banner analytics
const getBannerAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query; // days, default 30

    // Check if banner exists
    const bannerCheck = await query(
      'SELECT id FROM banners WHERE id = ?',
      [id]
    );

    if (bannerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Ensure banner_analytics table exists (create if it doesn't)
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS banner_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          banner_id INTEGER NOT NULL,
          event_type VARCHAR(20) NOT NULL,
          customer_id INTEGER,
          ip_address VARCHAR(45),
          user_agent TEXT,
          referrer_url TEXT,
          revenue DECIMAL(10, 2) DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE
        )
      `);
      
      // Create indexes if they don't exist
      await query(`CREATE INDEX IF NOT EXISTS idx_banner_analytics_banner_id ON banner_analytics(banner_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_banner_analytics_event_type ON banner_analytics(event_type)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_banner_analytics_created_at ON banner_analytics(created_at)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_banner_analytics_banner_event ON banner_analytics(banner_id, event_type)`);
    } catch (tableError) {
      // Table might already exist, continue
      console.log('Banner analytics table check:', tableError.message);
    }

    // Get total views
    let viewsResult;
    try {
      viewsResult = await query(
        `SELECT COUNT(*) as total_views
         FROM banner_analytics
         WHERE banner_id = ? AND event_type = 'view'
         AND created_at >= datetime('now', '-' || ? || ' days')`,
        [id, period]
      );
    } catch (error) {
      console.error('Error fetching views:', error);
      viewsResult = { rows: [{ total_views: 0 }] };
    }

    // Get total clicks
    let clicksResult;
    try {
      clicksResult = await query(
        `SELECT COUNT(*) as total_clicks
         FROM banner_analytics
         WHERE banner_id = ? AND event_type = 'click'
         AND created_at >= datetime('now', '-' || ? || ' days')`,
        [id, period]
      );
    } catch (error) {
      console.error('Error fetching clicks:', error);
      clicksResult = { rows: [{ total_clicks: 0 }] };
    }

    // Get total conversions (if applicable)
    let conversionsResult;
    try {
      conversionsResult = await query(
        `SELECT COUNT(*) as total_conversions,
                COALESCE(SUM(revenue), 0) as total_revenue
         FROM banner_analytics
         WHERE banner_id = ? AND event_type = 'conversion'
         AND created_at >= datetime('now', '-' || ? || ' days')`,
        [id, period]
      );
    } catch (error) {
      console.error('Error fetching conversions:', error);
      conversionsResult = { rows: [{ total_conversions: 0, total_revenue: 0 }] };
    }

    // Get last viewed timestamp
    let lastViewedResult;
    try {
      lastViewedResult = await query(
        `SELECT MAX(created_at) as last_viewed
         FROM banner_analytics
         WHERE banner_id = ? AND event_type = 'view'`,
        [id]
      );
    } catch (error) {
      console.error('Error fetching last viewed:', error);
      lastViewedResult = { rows: [{ last_viewed: null }] };
    }

    // Get trends over time (daily breakdown)
    let trendsResult;
    try {
      trendsResult = await query(
        `SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as views,
          SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as clicks,
          SUM(CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END) as conversions,
          COALESCE(SUM(CASE WHEN event_type = 'conversion' THEN revenue ELSE 0 END), 0) as revenue
         FROM banner_analytics
         WHERE banner_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [id, period]
      );
    } catch (error) {
      console.error('Error fetching trends:', error);
      trendsResult = { rows: [] };
    }

    const views = viewsResult.rows[0]?.total_views || 0;
    const clicks = clicksResult.rows[0]?.total_clicks || 0;
    const conversions = conversionsResult.rows[0]?.total_conversions || 0;
    const revenue = parseFloat(conversionsResult.rows[0]?.total_revenue || 0);
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : '0.00';
    const lastViewed = lastViewedResult.rows[0]?.last_viewed || null;

    // Format trends data
    const trends = (trendsResult.rows || []).map(row => ({
      date: row.date,
      views: parseInt(row.views || 0),
      clicks: parseInt(row.clicks || 0),
      conversions: parseInt(row.conversions || 0),
      revenue: parseFloat(row.revenue || 0),
      ctr: row.views > 0 ? ((row.clicks / row.views) * 100).toFixed(2) : '0.00'
    }));

    res.json({
      success: true,
      data: {
        banner_id: parseInt(id),
        views: parseInt(views),
        clicks: parseInt(clicks),
        ctr: parseFloat(ctr),
        conversions: parseInt(conversions),
        revenue: revenue,
        lastViewed: lastViewed,
        period: parseInt(period),
        trends: trends
      }
    });
  } catch (error) {
    console.error('Get banner analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Track banner view
const trackBannerView = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('user-agent') || '';
    const referrer_url = req.get('referer') || '';

    // Check if banner exists
    const bannerCheck = await query(
      'SELECT id FROM banners WHERE id = ?',
      [id]
    );

    if (bannerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Insert view event
    await query(
      `INSERT INTO banner_analytics (banner_id, event_type, customer_id, ip_address, user_agent, referrer_url, created_at)
       VALUES (?, 'view', ?, ?, ?, ?, datetime('now'))`,
      [id, customer_id || null, ip_address, user_agent, referrer_url]
    );

    res.json({
      success: true,
      message: 'Banner view tracked'
    });
  } catch (error) {
    console.error('Track banner view error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Track banner click
const trackBannerClick = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('user-agent') || '';
    const referrer_url = req.get('referer') || '';

    // Check if banner exists
    const bannerCheck = await query(
      'SELECT id FROM banners WHERE id = ?',
      [id]
    );

    if (bannerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Insert click event
    await query(
      `INSERT INTO banner_analytics (banner_id, event_type, customer_id, ip_address, user_agent, referrer_url, created_at)
       VALUES (?, 'click', ?, ?, ?, ?, datetime('now'))`,
      [id, customer_id || null, ip_address, user_agent, referrer_url]
    );

    res.json({
      success: true,
      message: 'Banner click tracked'
    });
  } catch (error) {
    console.error('Track banner click error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Track banner conversion (e.g., purchase after clicking)
const trackBannerConversion = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id, revenue } = req.body;
    const ip_address = req.ip || (req.connection && req.connection.remoteAddress) || '';
    const user_agent = req.get ? req.get('user-agent') : '';
    const referrer_url = req.get ? req.get('referer') : '';

    // Check if banner exists
    const bannerCheck = await query(
      'SELECT id FROM banners WHERE id = ?',
      [id]
    );

    if (bannerCheck.rows.length === 0) {
      if (res && res.status) {
        return res.status(404).json({
          success: false,
          message: 'Banner not found'
        });
      }
      return; // Silent fail if called internally
    }

    // Insert conversion event
    await query(
      `INSERT INTO banner_analytics (banner_id, event_type, customer_id, ip_address, user_agent, referrer_url, revenue, created_at)
       VALUES (?, 'conversion', ?, ?, ?, ?, ?, datetime('now'))`,
      [id, customer_id || null, ip_address, user_agent, referrer_url, revenue || 0]
    );

    if (res && res.json) {
      res.json({
        success: true,
        message: 'Banner conversion tracked'
      });
    }
  } catch (error) {
    console.error('Track banner conversion error:', error);
    if (res && res.status) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    // Silent fail if called internally
  }
};

module.exports = {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  updateBannerOrder,
  getBannerAnalytics,
  trackBannerView,
  trackBannerClick,
  trackBannerConversion
};

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
// Load environment variables from root .env file
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerAuthRoutes = require('./routes/customerAuthRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const featuredProductRoutes = require('./routes/featuredProductRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const deliveryPinCodeRoutes = require('./routes/deliveryPinCodeRoutes');
const deliverySlotRoutes = require('./routes/deliverySlotRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const weightTierRoutes = require('./routes/weightTierRoutes');
const addOnCategoryRoutes = require('./routes/addOnCategoryRoutes');
const addOnProductRoutes = require('./routes/addOnProductRoutes');
const comboRoutes = require('./routes/comboRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const walletRoutes = require('./routes/walletRoutes');
const deliveryWalletRoutes = require('./routes/deliveryWalletRoutes');
const deliveryTargetTierRoutes = require('./routes/deliveryTargetTierRoutes');
const scratchCardRoutes = require('./routes/scratchCardRoutes');
const referralRoutes = require('./routes/referralRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dealRoutes = require('./routes/dealRoutes');
const schemaHealthRoutes = require('./routes/schemaHealthRoutes');
const { runSchemaHealthCheck } = require('./controllers/schemaHealthController');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5000", "https://images.unsplash.com", "http://localhost:3001"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3001"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

// CORS configuration
// Parse comma-separated origins from .env
const parseOrigins = (originsString) => {
  if (!originsString) {
    // Default to localhost for development if not set
    return process.env.NODE_ENV === 'production' 
      ? [] 
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
  }
  return originsString.split(',').map(origin => origin.trim()).filter(Boolean);
};

const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);
const allowAllOrigins = allowedOrigins.length === 0;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowAllOrigins) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin: ${origin}`);
      console.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma', 'Expires']
};

// Log CORS configuration on startup
console.log(
  '🌐 CORS configured for origins:',
  allowAllOrigins ? 'All origins (CORS_ORIGIN not set)' : allowedOrigins.join(', ')
);
if (allowAllOrigins && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  CORS_ORIGIN is not set in production; all origins are allowed.');
}

app.use(cors(corsOptions));

// Rate limiting disabled (per request)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (gallery) with comprehensive CORS headers
const { getGalleryRoot } = require('./utils/uploadPath');
const staticGalleryPath = getGalleryRoot();

app.use('/gallery', (req, res, next) => {
  // Set comprehensive CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Remove restrictive CORS policy headers that block cross-origin requests
  res.removeHeader('Cross-Origin-Resource-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static(staticGalleryPath, {
  setHeaders: (res, path) => {
    // Additional headers for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Remove restrictive CORS policy headers
    res.removeHeader('Cross-Origin-Resource-Policy');
    res.removeHeader('Cross-Origin-Opener-Policy');
  }
}));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Creamingo API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Creamingo API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Creamingo API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      customerAuth: '/api/customer-auth',
      products: '/api/products',
      categories: '/api/categories',
      subcategories: '/api/subcategories',
      featuredProducts: '/api/featured-products',
      orders: '/api/orders',
      users: '/api/users',
      customers: '/api/customers',
      settings: '/api/settings',
      upload: '/api/upload',
      delivery: '/api/delivery',
      deliveryPinCodes: '/api/delivery-pin-codes',
      deliverySlots: '/api/delivery-slots',
      weightTierMappings: '/api/weight-tier-mappings',
      addOnCategories: '/api/add-on-categories',
      addOnProducts: '/api/add-on-products',
      combos: '/api/combos',
      promoCodes: '/api/promo-codes',
      wallet: '/api/wallet',
      scratchCards: '/api/scratch-cards',
      referrals: '/api/referrals',
      notifications: '/api/notifications',
      deals: '/api/deals'
    },
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/customer-auth', customerAuthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subcategoryRoutes);
app.use('/api/featured-products', featuredProductRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/delivery-pin-codes', deliveryPinCodeRoutes);
app.use('/api/delivery-slots', deliverySlotRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/weight-tier-mappings', weightTierRoutes);
app.use('/api/add-on-categories', addOnCategoryRoutes);
app.use('/api/add-on-products', addOnProductRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/delivery-wallet', deliveryWalletRoutes);
app.use('/api/delivery-target-tiers', deliveryTargetTierRoutes);
app.use('/api/scratch-cards', scratchCardRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/schema-health', schemaHealthRoutes);

// Run schema diagnostics on startup
setImmediate(async () => {
  try {
    const data = await runSchemaHealthCheck();
    if (!data.ok) {
      console.warn('⚠️  Schema health check failed. Missing tables/columns detected.');
      Object.entries(data.tables).forEach(([tableName, info]) => {
        if (!info.exists) {
          console.warn(`- Missing table: ${tableName}`);
          console.warn(`  Expected columns: ${info.missingColumns.join(', ')}`);
          return;
        }
        if (info.missingColumns.length > 0) {
          console.warn(`- Missing columns in ${tableName}: ${info.missingColumns.join(', ')}`);
        }
      });
    } else {
      console.log('✅ Schema health check passed.');
    }
  } catch (error) {
    console.error('Schema health startup check failed:', error);
  }
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

module.exports = app;

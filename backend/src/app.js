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
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes except auth
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for auth routes (they have their own limiter)
  if (req.path.startsWith('/auth') || req.path.startsWith('/customer-auth')) {
    return next();
  }
  return limiter(req, res, next);
});

// More lenient rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
app.use('/api/customer-auth', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (uploads) with comprehensive CORS headers
// Use UPLOAD_PATH environment variable for absolute path support (VPS-ready)
const uploadDir = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
const staticUploadPath = path.isAbsolute(uploadDir) ? uploadDir : path.resolve(__dirname, '../', uploadDir);

app.use('/uploads', (req, res, next) => {
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
}, express.static(staticUploadPath, {
  setHeaders: (res, path) => {
    // Additional headers for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Remove restrictive CORS policy headers
    res.removeHeader('Cross-Origin-Resource-Policy');
    res.removeHeader('Cross-Origin-Opener-Policy');
  }
}));

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

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

module.exports = app;

const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getProductBySlug,
  getRelatedProducts,
  getProductReviews,
  getTestimonials,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
  toggleTopProduct,
  getBestsellers,
  toggleBestseller,
  toggleFeatured,
  toggleActive,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  searchProducts,
  searchProductsByOccasionAndFlavor,
  getSearchAutocomplete,
  // New category management functions
  addProductToCategories,
  removeProductFromCategoryController,
  setPrimaryCategoryController,
  addProductToSubcategories,
  removeProductFromSubcategoryController,
  setPrimarySubcategoryController,
  // Review management functions
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/productController');
const { authMiddleware } = require('../middleware/auth');
const { canManageProducts } = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');

// Public routes (for customer-facing API)
router.get('/', getProducts);
router.get('/top', getTopProducts);
router.get('/bestsellers', getBestsellers);
router.get('/search', searchProducts);
router.get('/search/autocomplete', getSearchAutocomplete);
router.get('/search-by-occasion-flavor', searchProductsByOccasionAndFlavor);
router.get('/testimonials/list', getTestimonials); // Homepage testimonials (public) - must be before /:id
router.get('/slug/:slug', getProductBySlug); // SEO-friendly product URLs
router.get('/:id', getProduct);
router.get('/:id/related', getRelatedProducts); // Related products
router.get('/:id/reviews', getProductReviews); // Product reviews
// Public: submit a new product review (auto set is_approved=false)
router.post('/:id/reviews', require('../controllers/productController').createPublicReview);

// Protected routes (admin only)
router.post('/', authMiddleware, canManageProducts, validate(schemas.createProduct), createProduct);
router.put('/:id', authMiddleware, canManageProducts, validate(schemas.updateProduct), updateProduct);
router.put('/:id/toggle-top', authMiddleware, canManageProducts, toggleTopProduct);
router.put('/:id/toggle-bestseller', authMiddleware, canManageProducts, toggleBestseller);
router.put('/:id/toggle-featured', authMiddleware, canManageProducts, toggleFeatured);
router.put('/:id/toggle-active', authMiddleware, canManageProducts, toggleActive);
router.delete('/:id', authMiddleware, canManageProducts, deleteProduct);

// Product variants routes
router.get('/:id/variants', authMiddleware, canManageProducts, getProductVariants);
router.post('/:id/variants', authMiddleware, canManageProducts, validate(schemas.createVariant), createProductVariant);
router.put('/:id/variants/:variantId', authMiddleware, canManageProducts, validate(schemas.updateVariant), updateProductVariant);
router.delete('/:id/variants/:variantId', authMiddleware, canManageProducts, deleteProductVariant);

// Product category management routes
router.post('/:id/categories', authMiddleware, canManageProducts, addProductToCategories);
router.delete('/:id/categories/:categoryId', authMiddleware, canManageProducts, removeProductFromCategoryController);
router.put('/:id/categories/primary', authMiddleware, canManageProducts, setPrimaryCategoryController);

// Product subcategory management routes
router.post('/:id/subcategories', authMiddleware, canManageProducts, addProductToSubcategories);
router.delete('/:id/subcategories/:subcategoryId', authMiddleware, canManageProducts, removeProductFromSubcategoryController);
router.put('/:id/subcategories/primary', authMiddleware, canManageProducts, setPrimarySubcategoryController);

// Review management routes
router.post('/reviews', authMiddleware, canManageProducts, createReview);
router.patch('/reviews/:reviewId', authMiddleware, canManageProducts, updateReview);
router.delete('/reviews/:reviewId', authMiddleware, canManageProducts, deleteReview);

module.exports = router;

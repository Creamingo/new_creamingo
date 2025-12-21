const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
  getCakeFlavorCategory,
  getOccasionCategories,
  getKidsCakeCollection,
  getCrowdFavoriteCakes,
  getLoveAndRelationshipCakes,
  getCakesForEveryMilestoneYear,
  getFlowers,
  getSweetsAndDryFruits,
  getSmallTreatsDesserts,
  getSubcategoriesByCategorySlug,
  getSubcategoryBySlugs,
  getAllMainCategories
} = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/auth');
const { canManageCategories } = require('../middleware/role');
const { validate, schemas } = require('../middleware/validation');

// Public routes
router.get('/', getCategories);
router.get('/all-main', getAllMainCategories);
router.get('/cakes-by-flavor', getCakeFlavorCategory);
router.get('/cakes-for-occasion', getOccasionCategories);
router.get('/kids-cake-collection', getKidsCakeCollection);
router.get('/crowd-favorite-cakes', getCrowdFavoriteCakes);
router.get('/love-relationship-cakes', getLoveAndRelationshipCakes);
router.get('/milestone-year-cakes', getCakesForEveryMilestoneYear);
router.get('/flowers', getFlowers);
router.get('/sweets-dry-fruits', getSweetsAndDryFruits);
router.get('/small-treats-desserts', getSmallTreatsDesserts);
router.get('/:categorySlug/subcategories', getSubcategoriesByCategorySlug);
router.get('/:categorySlug/:subCategorySlug', getSubcategoryBySlugs);
router.get('/:id', getCategory);

// Protected routes (super admin only)
router.post('/', authMiddleware, canManageCategories, validate(schemas.createCategory), createCategory);
router.put('/:id', authMiddleware, canManageCategories, validate(schemas.updateCategory), updateCategory);
router.put('/order/update', authMiddleware, canManageCategories, updateCategoryOrder);
router.delete('/:id', authMiddleware, canManageCategories, deleteCategory);

module.exports = router;

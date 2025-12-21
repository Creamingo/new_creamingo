import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Edit, Trash2, Package, Star, Award, Loader2, Download, Upload, FileText, Eye, RefreshCw, X, MessageSquare, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { ProductFileUpload } from '../components/ui/ProductFileUpload';
import { MediaPreview } from '../components/ui/MediaPreview';
import RichTextEditor from '../components/ui/RichTextEditor';
import StructuredDescriptionEditor, { StructuredDescriptionEditorRef } from '../components/ui/StructuredDescriptionEditor';
import CategoryGridSelector from '../components/ui/CategoryGridSelector';
import CompactCategoryDisplay from '../components/ui/CompactCategoryDisplay';
import FlavorSelector from '../components/ui/FlavorSelector';
import WeightTierManagement from '../components/ui/WeightTierManagement';
import { Product, Category, Subcategory } from '../types';
import productService from '../services/productService';
import categoryService from '../services/categoryService';
import apiClient from '../services/api';
import { useToastContext } from '../contexts/ToastContext';

// Utility functions from productService
const calculateDiscountedPrice = productService.calculateDiscountedPrice;
const formatCurrency = productService.formatCurrency;

// Helper function to determine file type from URL
const getFileTypeFromUrl = (url: string): 'image' | 'video' => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
  const extension = url.toLowerCase().substring(url.lastIndexOf('.'));
  return videoExtensions.includes(extension) ? 'video' : 'image';
};


// Helper function to render Egg/Eggless icon
const getEgglessIcon = (isEggless: boolean | undefined) => {
  const eggless = isEggless ?? false; // Default to false if undefined
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 border-2 rounded-sm mr-2 ${
        eggless ? 'border-green-600' : 'border-red-600'
      }`}
      title={eggless ? 'Eggless (Vegetarian)' : 'Contains Egg (Non-Vegetarian)'}
    >
      <span 
        className={`block w-2 h-2 rounded-full ${
          eggless ? 'bg-green-600' : 'bg-red-600'
        }`}
      />
    </span>
  );
};

// Modern Rating Component
const ModernRatingComponent = ({ 
  label, 
  emoji, 
  rating, 
  onRatingChange, 
  color = 'pink' 
}: {
  label: string;
  emoji: string;
  rating: number;
  onRatingChange: (rating: number) => void;
  color?: 'pink' | 'blue' | 'green' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    pink: {
      active: 'text-pink-500 bg-pink-50 border-pink-200',
      hover: 'hover:bg-pink-100 hover:border-pink-300',
      star: 'text-pink-400'
    },
    blue: {
      active: 'text-blue-500 bg-blue-50 border-blue-200',
      hover: 'hover:bg-blue-100 hover:border-blue-300',
      star: 'text-blue-400'
    },
    green: {
      active: 'text-green-500 bg-green-50 border-green-200',
      hover: 'hover:bg-green-100 hover:border-green-300',
      star: 'text-green-400'
    },
    purple: {
      active: 'text-purple-500 bg-purple-50 border-purple-200',
      hover: 'hover:bg-purple-100 hover:border-purple-300',
      star: 'text-purple-400'
    },
    orange: {
      active: 'text-orange-500 bg-orange-50 border-orange-200',
      hover: 'hover:bg-orange-100 hover:border-orange-300',
      star: 'text-orange-400'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{emoji}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">({rating}/5)</span>
      </div>
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRatingChange(star)}
            className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
              star <= rating
                ? `${colors.active} shadow-sm`
                : `text-gray-300 border-gray-200 bg-gray-50 ${colors.hover}`
            }`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? `${colors.star} fill-current`
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export const Products: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToastContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [productVariations, setProductVariations] = useState<Array<{weight: string, price: number, discount_percent: number}>>([]);
  const [editProductVariations, setEditProductVariations] = useState<Array<{weight: string, price: number, discount_percent: number}>>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryType, setGalleryType] = useState<'main' | 'gallery'>('main');
  const [selectedMainImage, setSelectedMainImage] = useState<string>('');
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftProducts, setDraftProducts] = useState<Product[]>([]);
  const [showWeightTierModal, setShowWeightTierModal] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [showEditDescriptionPreview, setShowEditDescriptionPreview] = useState(false);
  const descriptionEditorRef = useRef<StructuredDescriptionEditorRef>(null);
  const editDescriptionEditorRef = useRef<StructuredDescriptionEditorRef>(null);
  // Capture structured product details for defaults and backend sync
  const [newProductDetails, setNewProductDetails] = useState<{ version?: string; shape?: string; countryOfOrigin?: string }>({
    version: 'Eggless',
    shape: 'Round',
    countryOfOrigin: 'India'
  });
  const [editProductDetails, setEditProductDetails] = useState<{ version?: string; shape?: string; countryOfOrigin?: string }>({
    version: 'Eggless',
    shape: 'Round',
    countryOfOrigin: 'India'
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importResults, setImportResults] = useState<{success: number, errors: number, total: number}>({success: 0, errors: 0, total: 0});
  const [hasRestoredData, setHasRestoredData] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string | number>>(new Set());
  
  // Review management state
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [selectedProductForReviews, setSelectedProductForReviews] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({
    customer_name: '',
    customer_email: '',
    rating: 5, // Keep overall rating for backward compatibility
    ratings: {
      taste: 5,
      presentation: 5,
      freshness: 5,
      valueForMoney: 5,
      deliveryExperience: 5
    },
    review_title: '',
    review_text: '',
    is_verified_purchase: true,
    is_approved: true
  });
  const [reviewImages, setReviewImages] = useState<string[]>([]);

  // Form state for Add Product
  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '', // Legacy field for backward compatibility
    subcategory_id: '', // Legacy field for backward compatibility
    category_ids: [] as number[], // New multi-category field
    subcategory_ids: [] as number[], // New multi-subcategory field
    primary_category_id: undefined as number | undefined,
    primary_subcategory_id: undefined as number | undefined,
    // Flavor selection fields
    available_flavor_ids: [] as number[],
    primary_flavor_id: undefined as number | undefined,
    base_weight: '',
    base_price: 0,
    discount_percent: 0,
    description: '',
    short_description: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    is_top_product: false,
    is_bestseller: false,
    preparation_time: 0,
    serving_size: '',
    care_storage: '',
    delivery_guidelines: ''
  });

  // Form state for Edit Product
  const [editProduct, setEditProduct] = useState({
    name: '',
    category_id: '', // Legacy field for backward compatibility
    subcategory_id: '', // Legacy field for backward compatibility
    category_ids: [] as number[], // New multi-category field
    subcategory_ids: [] as number[], // New multi-subcategory field
    primary_category_id: undefined as number | undefined,
    primary_subcategory_id: undefined as number | undefined,
    // Flavor selection fields
    available_flavor_ids: [] as number[],
    primary_flavor_id: undefined as number | undefined,
    base_weight: '',
    base_price: 0,
    discount_percent: 0,
    description: '',
    short_description: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    is_top_product: false,
    is_bestseller: false,
    preparation_time: 0,
    serving_size: '',
    care_storage: '',
    delivery_guidelines: ''
  });

  // Reusable function to reset new product form
  const resetNewProductForm = useCallback(() => {
    // Prefilled template for product description
    const descriptionTemplate = `<p>~50 words about the product</p>

<h3>Product Details:</h3>
<ul>
<li><strong>Cake Flavour:</strong> (Editable per product)</li>
<li><strong>Version:</strong> Eggless</li>
<li><strong>Shape:</strong> (Editable per product)</li>
<li><strong>Filling in Layers:</strong> (Editable per product)</li>
<li><strong>Toppings:</strong> (Editable per product)</li>
<li><strong>Net Quantity:</strong> 1 Cake</li>
<li><strong>Country of Origin:</strong> India</li>
</ul>

<h3>Please Note:</h3>
<ul>
<li>Cake stands and cutlery shown in images are for display only and are not included with the cake.</li>
<li>This cake is hand delivered in a good quality cardboard box.</li>
</ul>`;

    // Prefilled template for care & storage
    const careStorageTemplate = `<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">1). Refrigerate:</strong> <span style="color: #6b7280;">Store cream cakes in a refrigerator. Fondant cakes should be kept in an air-conditioned environment. (Use a serrated knife to cut a fondant cake.)</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">2). Temperature:</strong> <span style="color: #6b7280;">Slice and serve the cake at room temperature. Keep away from direct heat.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">3). Consumption:</strong> <span style="color: #6b7280;">Consume the cake within 24 hours for best taste and freshness.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">4). Decorations:</strong> <span style="color: #6b7280;">Some decorations may contain wires, toothpicks, or skewers - please check before serving to children.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 500; color: #1f2937; margin-top: 16px;">Enjoy your Creamingo cake! 🎂</p>`;

    // Prefilled template for delivery guidelines
    const deliveryGuidelinesTemplate = `<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Packaging:</strong> <span style="color: #6b7280;">Every Creamingo cake is hand-delivered in a sturdy, premium-quality box.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Complimentary Items:</strong> <span style="color: #6b7280;">Knives and message tags are included whenever available.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Timing:</strong> <span style="color: #6b7280;">Delivery times are estimates and may vary by product and location.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Perishable Nature:</strong> <span style="color: #6b7280;">Cakes are perishable and will be delivered in a single attempt only.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Substitution Policy:</strong> <span style="color: #6b7280;">In rare cases, designs or flavors may vary slightly based on availability.</span></p>

<p style="margin-bottom: 20px;"></p>`;

    setNewProduct({
      name: '',
      category_id: '', // Legacy field for backward compatibility
      subcategory_id: '', // Legacy field for backward compatibility
      category_ids: [], // New multi-category field
      subcategory_ids: [], // New multi-subcategory field
      primary_category_id: undefined,
      primary_subcategory_id: undefined,
      // Flavor selection fields
      available_flavor_ids: [],
      primary_flavor_id: undefined,
      base_weight: '',
      base_price: 0,
      discount_percent: 0,
      description: descriptionTemplate,
      short_description: '',
      image_url: '',
      is_active: true,
      is_featured: false,
      is_top_product: false,
      is_bestseller: false,
      preparation_time: 0,
      serving_size: '',
      care_storage: careStorageTemplate,
      delivery_guidelines: deliveryGuidelinesTemplate
    });
  }, []);

  const restoreFormData = useCallback(() => {
    if (hasRestoredData) return; // Prevent multiple restores
    
    try {
      const savedData = localStorage.getItem('creamingo_new_product_draft');
      if (savedData) {
        const formData = JSON.parse(savedData);
        const savedTime = new Date(formData.timestamp);
        const now = new Date();
        const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);
        
        // Only restore if saved within last 24 hours
        if (hoursDiff < 24) {
          if (formData.newProduct) {
            setNewProduct(formData.newProduct);
          } else {
            resetNewProductForm();
          }
          setProductVariations(formData.productVariations || []);
          setSelectedMainImage(formData.selectedMainImage || '');
          setSelectedGalleryImages(formData.selectedGalleryImages || []);
          setHasUnsavedChanges(true);
          setHasRestoredData(true);
          
          // Only show notification once per session
          const hasShownRestoreNotification = sessionStorage.getItem('hasShownRestoreNotification');
          if (!hasShownRestoreNotification) {
            showInfo('Form Data Restored', 'Your previous form data has been restored. You can continue where you left off.');
            sessionStorage.setItem('hasShownRestoreNotification', 'true');
          }
        } else {
          // Clear old data and initialize with templates
          localStorage.removeItem('creamingo_new_product_draft');
          resetNewProductForm();
          setHasRestoredData(true);
        }
      } else {
        // No saved data, initialize with templates
        resetNewProductForm();
        setHasRestoredData(true);
      }
    } catch (error) {
      console.error('Error restoring form data:', error);
      localStorage.removeItem('creamingo_new_product_draft');
      // Initialize with templates on error
      resetNewProductForm();
      setHasRestoredData(true);
    }
  }, [showInfo, hasRestoredData, resetNewProductForm]);

  const clearSavedFormData = useCallback(() => {
    localStorage.removeItem('creamingo_new_product_draft');
    setHasUnsavedChanges(false);
    setHasRestoredData(false);
    sessionStorage.removeItem('hasShownRestoreNotification');
  }, []);

  // CSV Export functionality
  const exportToCSV = () => {
    try {
      const csvHeaders = [
        'ID',
        'Name',
        'Description',
        'Category',
        'Subcategory',
        'Base Price',
        'Base Weight',
        'Discount %',
        'Discounted Price',
        'Image URL',
        'Is Active',
        'Is Featured',
        'Is Top Product',
        'Is Bestseller',
        'Allergens',
        'Ingredients',
        'Preparation Time',
        'Servings',
        'Created At',
        'Updated At'
      ];

      const csvData = products.map(product => [
        product.id,
        `"${product.name}"`,
        `"${product.description}"`,
        product.category_name || '',
        product.subcategory_name || '',
        product.base_price,
        product.base_weight,
        product.discount_percent,
        product.discounted_price || calculateDiscountedPrice(product.base_price, product.discount_percent),
        product.image_url,
        product.is_active ? 'Yes' : 'No',
        product.is_featured ? 'Yes' : 'No',
        product.is_top_product ? 'Yes' : 'No',
        product.is_bestseller ? 'Yes' : 'No',
        product.preparation_time || '',
        product.serving_size || '',
        new Date(product.created_at).toLocaleDateString(),
        new Date(product.updated_at).toLocaleDateString()
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Export Successful', `Successfully exported ${products.length} products to CSV.`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showError('Export Failed', 'Failed to export products to CSV. Please try again.');
    }
  };

  const downloadCSVTemplate = () => {
    try {
      const templateHeaders = [
        'Name',
        'Description',
        'Category',
        'Subcategory',
        'Base Price',
        'Base Weight',
        'Discount %',
        'Image URL',
        'Is Active',
        'Is Featured',
        'Is Top Product',
        'Is Bestseller',
        'Allergens',
        'Ingredients',
        'Preparation Time',
        'Servings'
      ];

      const templateData = [
        'Sample Product Name',
        'Sample product description',
        'Cakes',
        'Birthday Cakes',
        '25.99',
        '1kg',
        '10',
        'https://example.com/image.jpg',
        'Yes',
        'No',
        'No',
        'No',
        'gluten, dairy',
        'flour, sugar, eggs',
        '45',
        '8-10 servings'
      ];

      const csvContent = [templateHeaders, templateData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'products_import_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Template Downloaded', 'CSV template has been downloaded successfully.');
    } catch (error) {
      console.error('Error downloading template:', error);
      showError('Download Failed', 'Failed to download CSV template. Please try again.');
    }
  };

  // CSV Import functionality
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showError('Invalid File Type', 'Please select a CSV file.');
        return;
      }
      setImportFile(file);
    }
  };

  const processCSVImport = async () => {
    if (!importFile) return;

    try {
      setImportStatus('processing');
      setImportProgress(0);
      setImportResults({success: 0, errors: 0, total: 0});

      const text = await importFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row.');
      }

      // Parse CSV - headers are not used as we map columns by position
      lines[0].split(',').map(h => h.replace(/"/g, '').trim()); // Header row (unused)
      const dataRows = lines.slice(1);
      
      setImportResults(prev => ({...prev, total: dataRows.length}));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i].split(',').map(cell => cell.replace(/"/g, '').trim());
          
          // Map CSV columns to product data
          const productData = {
            name: row[0] || '',
            description: row[1] || '',
            category_name: row[2] || '',
            subcategory_name: row[3] || '',
            base_price: parseFloat(row[4]) || 0,
            base_weight: row[5] || '',
            discount_percent: parseFloat(row[6]) || 0,
            image_url: row[7] || '',
            is_active: row[8]?.toLowerCase() === 'yes',
            is_featured: row[9]?.toLowerCase() === 'yes',
            is_top_product: row[10]?.toLowerCase() === 'yes',
            is_bestseller: row[11]?.toLowerCase() === 'yes',
            preparation_time: parseInt(row[14]) || 0,
            serving_size: row[15] || ''
          };

          // Find category and subcategory IDs
          const category = categories.find(c => c.name.toLowerCase() === productData.category_name.toLowerCase());
          const subcategory = subcategories.find(s => s.name.toLowerCase() === productData.subcategory_name.toLowerCase() && s.category_id === category?.id);

          if (!category) {
            throw new Error(`Category "${productData.category_name}" not found`);
          }

          const finalProductData = {
            name: productData.name,
            description: productData.description,
            category_id: typeof category.id === 'string' ? parseInt(category.id) : category.id,
            subcategory_id: subcategory?.id ? (typeof subcategory.id === 'string' ? parseInt(subcategory.id) : subcategory.id) : undefined,
            base_price: productData.base_price,
            base_weight: productData.base_weight,
            discount_percent: productData.discount_percent,
            image_url: productData.image_url,
            is_active: productData.is_active,
            is_featured: productData.is_featured,
            // Remove is_top_product and is_bestseller for now as they might not be accepted by the API
            // is_top_product: productData.is_top_product,
            // is_bestseller: productData.is_bestseller,
            preparation_time: productData.preparation_time,
            serving_size: productData.serving_size
          };

          // Create product via API
          const response = await productService.createProduct(finalProductData);
          setProducts(prev => [response.product, ...prev]);
          successCount++;

        } catch (error) {
          console.error(`Error processing row ${i + 1}:`, error);
          errorCount++;
        }

        // Update progress
        const progress = Math.round(((i + 1) / dataRows.length) * 100);
        setImportProgress(progress);
        setImportResults({success: successCount, errors: errorCount, total: dataRows.length});
      }

      setImportStatus('success');
      showSuccess('Import Completed', `Successfully imported ${successCount} products. ${errorCount} products failed to import.`);

    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportStatus('error');
      showError('Import Failed', error instanceof Error ? error.message : 'Failed to import CSV file. Please check the file format.');
    }
  };

  const resetImportModal = () => {
    setImportFile(null);
    setImportProgress(0);
    setImportStatus('idle');
    setImportResults({success: 0, errors: 0, total: 0});
    setShowImportModal(false);
  };


  // Track form changes with debouncing to prevent excessive re-renders
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const hasData = Boolean(newProduct.name || newProduct.description || newProduct.base_price > 0 || 
                     productVariations.length > 0 || selectedMainImage || selectedGalleryImages.length > 0);
      setHasUnsavedChanges(hasData);
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [newProduct, productVariations, selectedMainImage, selectedGalleryImages]);

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load draft products
  const loadDraftProducts = useCallback(async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll simulate with some sample draft products
      const sampleDrafts: Product[] = [
        {
          id: 'draft-1',
          name: 'Chocolate Cake (Draft)',
          description: 'Rich chocolate cake with cream filling',
          category_id: 1,
          subcategory_id: 1,
          base_price: 25.99,
          base_weight: '1kg',
          discount_percent: 10,
          discounted_price: 23.39,
          image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
          is_active: false,
          is_featured: false,
          is_top_product: false,
          is_bestseller: false,
          preparation_time: 45,
          serving_size: '8-10 servings',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category_name: 'Cakes',
          subcategory_name: 'Birthday Cakes'
        },
        {
          id: 'draft-2',
          name: 'Vanilla Cupcakes (Draft)',
          description: 'Delicious vanilla cupcakes with buttercream frosting',
          category_id: 2,
          subcategory_id: 2,
          base_price: 15.99,
          base_weight: '500g',
          discount_percent: 0,
          discounted_price: 15.99,
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
          is_active: false,
          is_featured: false,
          is_top_product: false,
          is_bestseller: false,
          preparation_time: 30,
          serving_size: '6 cupcakes',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          category_name: 'Cupcakes',
          subcategory_name: 'Classic Cupcakes'
        }
      ];
      setDraftProducts(sampleDrafts);
    } catch (error) {
      console.error('Error loading draft products:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load products, categories, and subcategories in parallel
      const [productsResponse, categoriesResponse, subcategoriesResponse] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        categoryService.getCategories(),
        categoryService.getSubcategories()
      ]);

      setProducts(productsResponse.products);
      setCategories(categoriesResponse.categories);
      setSubcategories(subcategoriesResponse.subcategories);
    } catch (err) {
      console.error('Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      showError('Failed to Load Data', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load initial data
  useEffect(() => {
    loadData();
    loadDraftProducts();
    restoreFormData();
  }, [loadData, loadDraftProducts, restoreFormData]);

  const filteredProducts = products.filter(product => {
    // Add null checks to prevent undefined errors
    if (!product || !product.name) return false;
    
    const categoryName = product.category_id 
      ? categories.find(c => c.id === product.category_id)?.name || product.category_name || ''
      : product.category_name || '';
    
    const subcategoryName = product.subcategory_id 
      ? subcategories.find(s => s.id === product.subcategory_id)?.name || product.subcategory_name || ''
      : product.subcategory_name || '';
    
    return (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });


  const handleDeleteProduct = async (productId: string | number) => {
    console.log('=== PRODUCT DELETE FUNCTION CALLED ===');
    console.log('Product ID:', productId);
    console.log('Stack trace:', new Error().stack);
    console.log('=====================================');
    
    if (!window.confirm('Are you sure you want to delete this product?')) {
      console.log('User cancelled product deletion');
      return;
    }

    try {
      setActionLoading(`delete-${productId}`);
      await productService.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      showSuccess('Product Deleted', 'The product has been successfully deleted.');
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product. Please try again.';
      showError('Delete Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteVariation = async (productId: string | number, variantId: string | number, variantName: string) => {
    console.log('=== VARIATION DELETE FUNCTION CALLED ===');
    console.log('Product ID:', productId);
    console.log('Variant ID:', variantId);
    console.log('Variant Name:', variantName);
    console.log('========================================');
    
    if (!window.confirm(`Are you sure you want to delete variation "${variantName}"?`)) {
      console.log('User cancelled variation deletion');
      return;
    }

    try {
      setActionLoading(`delete-variant-${variantId}`);
      await productService.deleteProductVariant(productId, variantId);
      
      // Update the products list to remove the deleted variation
      setProducts(products.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            variants: product.variants?.filter(variant => variant.id !== variantId) || []
          };
        }
        return product;
      }));
      
      showSuccess('Variation Deleted', 'The variation has been successfully deleted.');
    } catch (error) {
      console.error('Error deleting variation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete variation. Please try again.';
      showError('Delete Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddProduct = async () => {
    try {
      setActionLoading('add-product');
      
      // Validate that a main image is uploaded
      if (!selectedMainImage) {
        showError('Validation Error', 'Please upload a main product image before creating the product.');
        setActionLoading(null);
        return;
      }
      
      // Create product data with only the fields that the API accepts
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        short_description: newProduct.short_description,
        // Legacy fields for backward compatibility
        category_id: newProduct.category_ids.length > 0 ? newProduct.category_ids[0] : parseInt(newProduct.category_id),
        // Set legacy subcategory_id to first subcategory (can be flavor or non-flavor)
        subcategory_id: newProduct.subcategory_ids.length > 0 ? newProduct.subcategory_ids[0] : (newProduct.subcategory_id ? parseInt(newProduct.subcategory_id) : undefined),
        // New multi-category fields
        category_ids: newProduct.category_ids.length > 0 ? newProduct.category_ids : (newProduct.category_id ? [parseInt(newProduct.category_id)] : []),
        // Combine base subcategories with flavor subcategories
        subcategory_ids: Array.from(new Set([...(newProduct.subcategory_ids.length > 0 ? newProduct.subcategory_ids : (newProduct.subcategory_id ? [parseInt(newProduct.subcategory_id)] : [])), ...(newProduct.available_flavor_ids || [])])),
        primary_category_id: newProduct.primary_category_id,
        primary_subcategory_id: newProduct.primary_subcategory_id || newProduct.primary_flavor_id,
        base_price: newProduct.base_price,
        base_weight: newProduct.base_weight,
        discount_percent: newProduct.discount_percent,
        image_url: selectedMainImage,
        is_active: Boolean(newProduct.is_active),
        is_featured: Boolean(newProduct.is_featured),
        // Remove is_top_product and is_bestseller for now as they might not be accepted by the API
        // is_top_product: newProduct.is_top_product,
        // is_bestseller: newProduct.is_bestseller,
        preparation_time: newProduct.preparation_time,
        serving_size: newProduct.serving_size || calculateServings(newProduct.base_weight),
        care_storage: newProduct.care_storage,
        delivery_guidelines: newProduct.delivery_guidelines,
        // Map structured details to backend flags/fields
        is_eggless: String(newProductDetails.version || 'Eggless').toLowerCase() === 'eggless',
        shape: newProductDetails.shape || 'Round',
        country_of_origin: newProductDetails.countryOfOrigin || 'India',
        variations: productVariations, // Include product variations
        gallery_images: selectedGalleryImages // Include gallery images
      };

      console.log('Sending product data:', productData); // Debug log
      const response = await productService.createProduct(productData);
      
      // Add the new product to the list
      setProducts(prev => [response.product, ...prev]);
      
      // Clear saved form data and reset form
      clearSavedFormData();
      setShowAddModal(false);
      setProductVariations([]);
      setSelectedMainImage('');
      setSelectedGalleryImages([]);
      resetNewProductForm();
      
      showSuccess('Product Created', `"${response.product.name}" has been successfully created. You can mark it as a Top Product or Bestseller from the product list.`);
    } catch (error) {
      console.error('Error creating product:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to create product. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific validation errors
        if (error.message.includes('Validation Error')) {
          errorMessage = `Validation Error: ${error.message}`;
        } else if (error.message.includes('is not allowed')) {
          errorMessage = `Field Error: ${error.message}`;
        }
      }
      
      showError('Create Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInputChange = useCallback((field: string, value: string | number) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleEditInputChange = useCallback((field: string, value: string | number) => {
    setEditProduct(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handler functions for description editor buttons
  const handleDescriptionPreviewToggle = useCallback(() => {
    setShowDescriptionPreview(!showDescriptionPreview);
  }, [showDescriptionPreview]);

  const handleDescriptionReset = useCallback(() => {
    descriptionEditorRef.current?.reset();
  }, []);

  const handleDescriptionClean = useCallback(() => {
    descriptionEditorRef.current?.clean();
  }, []);

  const handleEditDescriptionPreviewToggle = useCallback(() => {
    setShowEditDescriptionPreview(!showEditDescriptionPreview);
  }, [showEditDescriptionPreview]);

  const handleEditDescriptionReset = useCallback(() => {
    editDescriptionEditorRef.current?.reset();
  }, []);

  const handleEditDescriptionClean = useCallback(() => {
    editDescriptionEditorRef.current?.clean();
  }, []);

  // Handler functions for care & storage reset
  const handleCareStorageReset = useCallback(() => {
    const careStorageTemplate = `<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">1). Refrigerate:</strong> <span style="color: #6b7280;">Store cream cakes in a refrigerator. Fondant cakes should be kept in an air-conditioned environment. (Use a serrated knife to cut a fondant cake.)</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">2). Temperature:</strong> <span style="color: #6b7280;">Slice and serve the cake at room temperature. Keep away from direct heat.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">3). Consumption:</strong> <span style="color: #6b7280;">Consume the cake within 24 hours for best taste and freshness.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">4). Decorations:</strong> <span style="color: #6b7280;">Some decorations may contain wires, toothpicks, or skewers - please check before serving to children.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 500; color: #1f2937; margin-top: 16px;">Enjoy your Creamingo cake! 🎂</p>`;
    
    handleInputChange('care_storage', careStorageTemplate);
  }, [handleInputChange]);

  const handleEditCareStorageReset = useCallback(() => {
    const careStorageTemplate = `<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">1). Refrigerate:</strong> <span style="color: #6b7280;">Store cream cakes in a refrigerator. Fondant cakes should be kept in an air-conditioned environment. (Use a serrated knife to cut a fondant cake.)</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">2). Temperature:</strong> <span style="color: #6b7280;">Slice and serve the cake at room temperature. Keep away from direct heat.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">3). Consumption:</strong> <span style="color: #6b7280;">Consume the cake within 24 hours for best taste and freshness.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><strong style="color: #1f2937;">4). Decorations:</strong> <span style="color: #6b7280;">Some decorations may contain wires, toothpicks, or skewers - please check before serving to children.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 500; color: #1f2937; margin-top: 16px;">Enjoy your Creamingo cake! 🎂</p>`;
    
    handleEditInputChange('care_storage', careStorageTemplate);
  }, [handleEditInputChange]);

  // Handler functions for delivery guidelines reset
  const handleDeliveryGuidelinesReset = useCallback(() => {
    const deliveryGuidelinesTemplate = `<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Packaging:</strong> <span style="color: #6b7280;">Every Creamingo cake is hand-delivered in a sturdy, premium-quality box.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Complimentary Items:</strong> <span style="color: #6b7280;">Knives and message tags are included whenever available.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Timing:</strong> <span style="color: #6b7280;">Delivery times are estimates and may vary by product and location.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Perishable Nature:</strong> <span style="color: #6b7280;">Cakes are perishable and will be delivered in a single attempt only.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Substitution Policy:</strong> <span style="color: #6b7280;">In rare cases, designs or flavors may vary slightly based on availability.</span></p>

<p style="margin-bottom: 20px;"></p>`;
    
    handleInputChange('delivery_guidelines', deliveryGuidelinesTemplate);
  }, [handleInputChange]);

  const handleEditDeliveryGuidelinesReset = useCallback(() => {
    const deliveryGuidelinesTemplate = `<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Packaging:</strong> <span style="color: #6b7280;">Every Creamingo cake is hand-delivered in a sturdy, premium-quality box.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Complimentary Items:</strong> <span style="color: #6b7280;">Knives and message tags are included whenever available.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Timing:</strong> <span style="color: #6b7280;">Delivery times are estimates and may vary by product and location.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Perishable Nature:</strong> <span style="color: #6b7280;">Cakes are perishable and will be delivered in a single attempt only.</span></p>

<p style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin-bottom: 12px;"><span style="color: #6b7280;">•</span> <strong style="color: #1f2937;">Substitution Policy:</strong> <span style="color: #6b7280;">In rare cases, designs or flavors may vary slightly based on availability.</span></p>

<p style="margin-bottom: 20px;"></p>`;
    
    handleEditInputChange('delivery_guidelines', deliveryGuidelinesTemplate);
  }, [handleEditInputChange]);

  // Update edit form when editing product changes
  React.useEffect(() => {
    if (editingProduct) {
      setEditProduct({
        name: editingProduct.name,
        category_id: editingProduct.category_id?.toString() || '', // Legacy field
        subcategory_id: editingProduct.subcategory_id?.toString() || '', // Legacy field
        // New multi-category fields
        category_ids: editingProduct.categories?.map(c => c.id) || [],
        // Include all subcategories (both regular and flavor subcategories)
        subcategory_ids: editingProduct.subcategories?.map(s => Number(s.id)) || [],
        primary_category_id: editingProduct.primary_category_id || editingProduct.categories?.find(c => c.is_primary)?.id,
        primary_subcategory_id: editingProduct.primary_subcategory_id || editingProduct.subcategories?.find(s => s.is_primary)?.id,
        // Flavor selection fields - extract flavor subcategories from all subcategories
        available_flavor_ids: editingProduct.subcategories?.filter(s => 
          [9, 10, 12, 14, 11, 13, 17, 16, 15, 18].includes(Number(s.id))
        ).map(s => Number(s.id)) || [],
        primary_flavor_id: editingProduct.subcategories?.find(s => 
          [9, 10, 12, 14, 11, 13, 17, 16, 15, 18].includes(Number(s.id)) && s.is_primary
        )?.id,
        base_weight: editingProduct.base_weight,
        base_price: editingProduct.base_price,
        discount_percent: editingProduct.discount_percent,
        description: editingProduct.description,
        short_description: editingProduct.short_description || '',
        image_url: editingProduct.image_url || '',
        is_active: Boolean(editingProduct.is_active),
        is_featured: Boolean(editingProduct.is_featured),
        is_top_product: Boolean(editingProduct.is_top_product),
        is_bestseller: Boolean(editingProduct.is_bestseller),
        preparation_time: editingProduct.preparation_time || 0,
        serving_size: editingProduct.serving_size || '',
        care_storage: editingProduct.care_storage || '',
        delivery_guidelines: editingProduct.delivery_guidelines || ''
      });
      
      // Populate variations from the product data
      if (editingProduct.variants && Array.isArray(editingProduct.variants)) {
        const variations = editingProduct.variants.map(variant => ({
          weight: variant.weight,
          price: variant.price,
          discount_percent: variant.discount_percent || 0
        }));
        setEditProductVariations(variations);
      } else {
        setEditProductVariations([]);
      }
      
      // Set the main image for editing
      setSelectedMainImage(editingProduct.image_url || '');
      
      // Populate gallery images from the product data
      if (editingProduct.gallery_images && Array.isArray(editingProduct.gallery_images)) {
        setSelectedGalleryImages(editingProduct.gallery_images);
      } else {
        setSelectedGalleryImages([]);
      }
    }
  }, [editingProduct]);


  const handleAddVariation = () => {
    // Check if we're adding the first variation (no variations exist yet)
    if (productVariations.length === 0) {
      // For the first variation, check if base price fields are filled
      if (newProduct.base_weight && newProduct.base_price > 0) {
        // Auto-populate first variation with doubled values from base row
        const doubledWeight = multiplyWeight(newProduct.base_weight, 2);
        const doubledPrice = newProduct.base_price * 2;
        setProductVariations([...productVariations, { 
          weight: doubledWeight, 
          price: doubledPrice, 
          discount_percent: newProduct.discount_percent 
        }]);
      }
    } else {
      // For subsequent variations, check if the last variation is complete
      const lastVariation = productVariations[productVariations.length - 1];
      if (lastVariation.weight && lastVariation.price > 0) {
        // Use the base row as reference for all variations
        const variationIndex = productVariations.length + 2; // +2 because we're adding the next one (1st is index 2, 2nd is index 3, etc.)
        
        // Calculate new values based on base row multiplied by index
        const multipliedWeight = multiplyWeight(newProduct.base_weight, variationIndex);
        const multipliedPrice = newProduct.base_price * variationIndex;
        
        setProductVariations([...productVariations, { 
          weight: multipliedWeight, 
          price: multipliedPrice, 
          discount_percent: newProduct.discount_percent 
        }]);
      }
    }
  };

  const handleRemoveVariation = (index: number) => {
    console.log('handleRemoveVariation called with index:', index);
    console.log('Current productVariations:', productVariations);
    console.log('productVariations.length:', productVariations.length);
    
    const variation = productVariations[index];
    if (!variation) {
      console.log('No variation found at index:', index);
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete variation "${variation.weight}" (${formatCurrency(variation.price)})?`;
    if (!window.confirm(confirmMessage)) {
      console.log('User cancelled variation deletion');
      return;
    }
    
    console.log('Deleting variation:', variation);
    setProductVariations(productVariations.filter((_, i) => i !== index));
    showSuccess('Variation Deleted', 'The variation has been removed from the product.');
  };

  const handleVariationChange = useCallback((index: number, field: 'weight' | 'price' | 'discount_percent', value: string | number) => {
    setProductVariations(prevVariations => {
      const updatedVariations = [...prevVariations];
      updatedVariations[index] = { ...updatedVariations[index], [field]: value };
      return updatedVariations;
    });
  }, []);

  // Edit form variation management functions
  const handleEditAddVariation = () => {
    // Check if we're adding the first variation (no variations exist yet)
    if (editProductVariations.length === 0) {
      // For the first variation, check if base price fields are filled
      if (editProduct.base_weight && editProduct.base_price > 0) {
        // Auto-populate first variation with doubled values from base row
        const doubledWeight = multiplyWeight(editProduct.base_weight, 2);
        const doubledPrice = editProduct.base_price * 2;
        setEditProductVariations([...editProductVariations, { 
          weight: doubledWeight, 
          price: doubledPrice, 
          discount_percent: editProduct.discount_percent 
        }]);
      }
    } else {
      // For subsequent variations, check if the last variation is complete
      const lastVariation = editProductVariations[editProductVariations.length - 1];
      if (lastVariation.weight && lastVariation.price > 0) {
        // Use the base row as reference for all variations
        const variationIndex = editProductVariations.length + 2; // +2 because we're adding the next one (1st is index 2, 2nd is index 3, etc.)
        
        // Calculate new values based on base row multiplied by index
        const multipliedWeight = multiplyWeight(editProduct.base_weight, variationIndex);
        const multipliedPrice = editProduct.base_price * variationIndex;
        
        setEditProductVariations([...editProductVariations, { 
          weight: multipliedWeight, 
          price: multipliedPrice, 
          discount_percent: editProduct.discount_percent 
        }]);
      }
    }
  };

  const handleEditRemoveVariation = (index: number) => {
    const variation = editProductVariations[index];
    if (!variation) return;
    
    const confirmMessage = `Are you sure you want to delete variation "${variation.weight}" (${formatCurrency(variation.price)})?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setEditProductVariations(editProductVariations.filter((_, i) => i !== index));
    showSuccess('Variation Deleted', 'The variation has been removed from the product.');
  };

  const handleEditVariationChange = useCallback((index: number, field: 'weight' | 'price' | 'discount_percent', value: string | number) => {
    setEditProductVariations(prevVariations => {
      const updatedVariations = [...prevVariations];
      updatedVariations[index] = { ...updatedVariations[index], [field]: value };
      return updatedVariations;
    });
  }, []);

  // Helper function to multiply weight values intelligently
  const multiplyWeight = (weight: string, multiplier: number) => {
    // Extract number and unit from weight string
    const match = weight.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (!match) return weight; // Return original if no match
    
    const [, numberStr, unit] = match;
    const number = parseFloat(numberStr);
    
    if (isNaN(number)) return weight; // Return original if not a valid number
    
    const multipliedNumber = number * multiplier;
    
    // Handle common weight units
    const unitLower = unit.toLowerCase();
    if (unitLower === 'g' || unitLower === 'gram' || unitLower === 'grams' || unitLower === 'gm') {
      if (multipliedNumber >= 1000) {
        // Convert to kg and format nicely
        const kgValue = multipliedNumber / 1000;
        return kgValue % 1 === 0 ? `${kgValue}kg` : `${kgValue}kg`;
      }
      return `${multipliedNumber}g`;
    } else if (unitLower === 'kg' || unitLower === 'kilogram' || unitLower === 'kilograms') {
      return `${multipliedNumber}kg`;
    } else if (unitLower === 'ml' || unitLower === 'milliliter' || unitLower === 'milliliters') {
      if (multipliedNumber >= 1000) {
        const lValue = multipliedNumber / 1000;
        return lValue % 1 === 0 ? `${lValue}l` : `${lValue}l`;
      }
      return `${multipliedNumber}ml`;
    } else if (unitLower === 'l' || unitLower === 'liter' || unitLower === 'liters') {
      return `${multipliedNumber}l`;
    } else if (unitLower === 'lb' || unitLower === 'pound' || unitLower === 'pounds') {
      return `${multipliedNumber}lb`;
    } else if (unitLower === 'oz' || unitLower === 'ounce' || unitLower === 'ounces') {
      if (multipliedNumber >= 16) {
        const lbValue = multipliedNumber / 16;
        return lbValue % 1 === 0 ? `${lbValue}lb` : `${lbValue}lb`;
      }
      return `${multipliedNumber}oz`;
    }
    
    // For unknown units, just multiply the number and keep the unit
    return `${multipliedNumber}${unit}`;
  };

  // Helper function to calculate servings based on weight
  const calculateServings = (weight: string) => {
    if (!weight) return '0 servings';
    
    // Extract number and unit from weight string
    const match = weight.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (!match) return '0 servings';
    
    const [, numberStr, unit] = match;
    const number = parseFloat(numberStr);
    
    if (isNaN(number)) return '0 servings';
    
    // Convert to grams for calculation
    let weightInGrams = number;
    const unitLower = unit.toLowerCase();
    
    if (unitLower === 'kg' || unitLower === 'kilogram' || unitLower === 'kilograms') {
      weightInGrams = number * 1000;
    } else if (unitLower === 'lb' || unitLower === 'pound' || unitLower === 'pounds') {
      weightInGrams = number * 453.592; // 1 lb = 453.592 g
    } else if (unitLower === 'oz' || unitLower === 'ounce' || unitLower === 'ounces') {
      weightInGrams = number * 28.3495; // 1 oz = 28.3495 g
    }
    // For g, gm, gram, grams, ml, l, etc., use the number as is
    
    // Calculate servings: 100g per serving (min), 83.33g per serving (max)
    // This gives us the exact ranges: 500g = 5-6, 1kg = 10-12, 1.5kg = 15-18
    const minServings = Math.floor(weightInGrams / 100);
    const maxServings = Math.round(weightInGrams / 83.33);
    
    if (minServings === maxServings) {
      return `${minServings} serving${minServings !== 1 ? 's' : ''}`;
    }
    
    return `${minServings}–${maxServings} servings`;
  };

  // Helper function to check if "Add New Variation" button should be enabled
  const canAddNewVariation = () => {
    if (productVariations.length === 0) {
      // For the first variation, check if base price fields are filled
      return newProduct.base_weight && newProduct.base_price > 0;
    } else {
      // For subsequent variations, check if the last variation is complete
      const lastVariation = productVariations[productVariations.length - 1];
      return lastVariation.weight && lastVariation.price > 0;
    }
  };

  // Helper function to check if "Add New Edit Variation" button should be enabled
  const canAddNewEditVariation = () => {
    if (editProductVariations.length === 0) {
      // For the first variation, check if base price fields are filled
      return editProduct.base_weight && editProduct.base_price > 0;
    } else {
      // For subsequent variations, check if the last variation is complete
      const lastVariation = editProductVariations[editProductVariations.length - 1];
      return lastVariation.weight && lastVariation.price > 0;
    }
  };

  // Toggle expanded state for product variations
  const toggleProductExpansion = (productId: string | number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  // Toggle top product status
  const handleToggleTopProduct = async (productId: string | number) => {
    try {
      setActionLoading(`top-${productId}`);
      const response = await productService.toggleTopProduct(productId);
      
      // Update the product in the list
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_top_product: response.product.is_top_product }
          : product
      ));
      
      showSuccess(
        'Top Product Status Updated', 
        `Product ${response.product.is_top_product ? 'added to Top Products section in Featured Products' : 'removed from Top Products section in Featured Products'}.`
      );
    } catch (error) {
      console.error('Error toggling top product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product status. Please try again.';
      showError('Update Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle bestseller status
  const handleToggleBestseller = async (productId: string | number) => {
    try {
      setActionLoading(`bestseller-${productId}`);
      const response = await productService.toggleBestseller(productId);
      
      // Update the product in the list
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_bestseller: response.product.is_bestseller }
          : product
      ));
      
      showSuccess(
        'Bestseller Status Updated', 
        `Product ${response.product.is_bestseller ? 'added to Bestsellers section in Featured Products' : 'removed from Bestsellers section in Featured Products'}.`
      );
    } catch (error) {
      console.error('Error toggling bestseller:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product status. Please try again.';
      showError('Update Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle featured status
  const handleToggleFeatured = async (productId: string | number) => {
    try {
      setActionLoading(`featured-${productId}`);
      const response = await productService.toggleFeatured(productId);
      
      // Update the product in the list
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_featured: response.product.is_featured }
          : product
      ));
      
      showSuccess(
        'Status Updated', 
        `Product ${response.product.is_featured ? 'marked as' : 'removed from'} featured.`
      );
    } catch (error) {
      console.error('Error toggling featured:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product status. Please try again.';
      showError('Update Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle active status
  const handleToggleActive = async (productId: string | number) => {
    try {
      setActionLoading(`active-${productId}`);
      const response = await productService.toggleActive(productId);
      
      // Update the product in the list
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_active: response.product.is_active }
          : product
      ));
      
      showSuccess(
        'Status Updated', 
        `Product ${response.product.is_active ? 'activated' : 'deactivated'}.`
      );
    } catch (error) {
      console.error('Error toggling active:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product status. Please try again.';
      showError('Update Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Set editing product (for opening edit modal)
  const handleSetEditingProduct = (product: Product) => {
    setEditingProduct(product);
  };

  // Handle opening image gallery for main product image
  const handleSetProductImage = () => {
    setGalleryType('main');
    setShowImageGallery(true);
  };

  // Handle opening image gallery for product gallery images
  const handleAddGalleryImages = () => {
    setGalleryType('gallery');
    setShowImageGallery(true);
  };


  // Review management functions
  const handleViewReviews = async (product: Product) => {
    setSelectedProductForReviews(product);
    setShowReviewsModal(true);
    await loadProductReviews(product.id);
  };

  const loadProductReviews = async (productId: string | number) => {
    try {
      const response = await apiClient.get(`/products/${productId}/reviews`);
      setProductReviews(response.data?.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      showError(`Failed to load product reviews: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  };

  const handleAddReview = (product: Product) => {
    setSelectedProductForReviews(product);
    setNewReview({
      customer_name: '',
      customer_email: '',
      rating: 5,
      ratings: {
        taste: 5,
        presentation: 5,
        freshness: 5,
        deliveryExperience: 5,
          valueForMoney: 5
      },
      review_title: '',
      review_text: '',
      is_verified_purchase: true,
      is_approved: true
    });
    setReviewImages([]);
    setShowAddReviewModal(true);
  };

  const handleSaveReview = async () => {
    if (!selectedProductForReviews) return;

    // Validation for mandatory fields
    const validationErrors = [];
    
    if (!newReview.customer_name?.trim()) {
      validationErrors.push('Customer Name is required');
    }
    
    if (!newReview.ratings.taste || newReview.ratings.taste < 1) {
      validationErrors.push('Taste rating is required');
    }
    
    if (!newReview.ratings.presentation || newReview.ratings.presentation < 1) {
      validationErrors.push('Presentation rating is required');
    }
    
    if (!newReview.ratings.freshness || newReview.ratings.freshness < 1) {
      validationErrors.push('Freshness rating is required');
    }
    
    if (!newReview.ratings.valueForMoney || newReview.ratings.valueForMoney < 1) {
      validationErrors.push('Value for Money rating is required');
    }
    
    if (!newReview.ratings.deliveryExperience || newReview.ratings.deliveryExperience < 1) {
      validationErrors.push('Delivery Experience rating is required');
    }
    
    // Review Title and Review Text are now optional

    if (validationErrors.length > 0) {
      showError(`Please fill in all required fields:\n• ${validationErrors.join('\n• ')}`);
      return;
    }

    try {
      // Calculate overall rating from individual category ratings
      const categoryRatings = [
        newReview.ratings.taste,
        newReview.ratings.presentation,
        newReview.ratings.freshness,
        newReview.ratings.valueForMoney,
        newReview.ratings.deliveryExperience
      ];
      const calculatedOverallRating = categoryRatings.reduce((sum, rating) => sum + rating, 0) / categoryRatings.length;
      
      const reviewData = {
        ...newReview,
        product_id: selectedProductForReviews.id,
        images: reviewImages,
        // Send both the individual ratings and calculated overall rating
        overall_rating: calculatedOverallRating,
        manual_overall_rating: calculatedOverallRating,
        selected_categories: ['taste', 'presentation', 'freshness', 'valueForMoney', 'deliveryExperience'],
        category_ratings: {
          taste: newReview.ratings.taste,
          presentation: newReview.ratings.presentation,
          freshness: newReview.ratings.freshness,
          valueForMoney: newReview.ratings.valueForMoney,
          deliveryExperience: newReview.ratings.deliveryExperience
        }
      };

      await apiClient.post('/products/reviews', reviewData);
      showSuccess('Review added successfully');
      setShowAddReviewModal(false);
      await loadProductReviews(selectedProductForReviews.id);
    } catch (error) {
      console.error('Save review error:', error);
      showError(`Failed to save review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseAddReviewModal = () => {
    setShowAddReviewModal(false);
    setNewReview({
      customer_name: '',
      customer_email: '',
      rating: 5,
      ratings: {
        taste: 5,
        presentation: 5,
        freshness: 5,
        deliveryExperience: 5,
          valueForMoney: 5
      },
      review_title: '',
      review_text: '',
      is_verified_purchase: true,
      is_approved: true
    });
    setReviewImages([]);
  };

  const handleApproveReview = async (reviewId: string | number) => {
    try {
      await apiClient.patch(`/products/reviews/${reviewId}`, { is_approved: true });
      showSuccess('Review approved');
      if (selectedProductForReviews) {
        await loadProductReviews(selectedProductForReviews.id);
      }
    } catch (error) {
      console.error('Approve review error:', error);
      showError(`Failed to approve review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteReview = async (reviewId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await apiClient.delete(`/products/reviews/${reviewId}`);
      showSuccess('Review deleted successfully');
      if (selectedProductForReviews) {
        await loadProductReviews(selectedProductForReviews.id);
      }
    } catch (error) {
      console.error('Delete review error:', error);
      showError(`Failed to delete review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle removing gallery image
  const handleRemoveGalleryImage = (imageUrl: string) => {
    setSelectedGalleryImages(prev => prev.filter(img => img !== imageUrl));
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      setActionLoading('edit-product');
      
      const productData: {
        name: string;
        description: string;
        short_description?: string;
        category_id: number;
        subcategory_id?: number;
        category_ids?: number[];
        subcategory_ids?: number[];
        primary_category_id?: number;
        primary_subcategory_id?: number;
        // Flavor selection fields
        available_flavor_ids?: number[];
        primary_flavor_id?: number;
        base_price: number;
        base_weight: string;
        discount_percent: number;
        image_url: string;
        is_active: boolean;
        is_featured: boolean;
        is_top_product: boolean;
        is_bestseller: boolean;
        preparation_time: number;
        serving_size: string;
        care_storage: string;
        delivery_guidelines: string;
        is_eggless?: boolean;
        shape?: string;
        country_of_origin?: string;
        variations?: Array<{weight: string, price: number, discount_percent: number}>;
        gallery_images?: string[];
      } = {
        name: editProduct.name,
        description: editProduct.description,
        short_description: editProduct.short_description,
        // Legacy fields for backward compatibility
        category_id: editProduct.category_ids.length > 0 ? editProduct.category_ids[0] : parseInt(editProduct.category_id),
        // Set legacy subcategory_id to first subcategory (can be flavor or non-flavor)
        subcategory_id: editProduct.subcategory_ids.length > 0 ? editProduct.subcategory_ids[0] : (editProduct.subcategory_id ? parseInt(editProduct.subcategory_id) : undefined),
        // New multi-category fields
        category_ids: editProduct.category_ids.length > 0 ? editProduct.category_ids : (editProduct.category_id ? [parseInt(editProduct.category_id)] : []),
        // Combine base subcategories with flavor subcategories
        subcategory_ids: Array.from(new Set([...(editProduct.subcategory_ids.length > 0 ? editProduct.subcategory_ids : (editProduct.subcategory_id ? [parseInt(editProduct.subcategory_id)] : [])), ...(editProduct.available_flavor_ids || [])])),
        primary_category_id: editProduct.primary_category_id,
        primary_subcategory_id: editProduct.primary_subcategory_id || editProduct.primary_flavor_id,
        base_price: editProduct.base_price,
        base_weight: editProduct.base_weight,
        discount_percent: editProduct.discount_percent,
        image_url: selectedMainImage,
        is_active: Boolean(editProduct.is_active),
        is_featured: Boolean(editProduct.is_featured),
        is_top_product: Boolean(editProduct.is_top_product),
        is_bestseller: Boolean(editProduct.is_bestseller),
        preparation_time: editProduct.preparation_time,
        serving_size: editProduct.serving_size,
        care_storage: editProduct.care_storage,
        delivery_guidelines: editProduct.delivery_guidelines,
        is_eggless: String(editProductDetails.version || 'Eggless').toLowerCase() === 'eggless',
        shape: editProductDetails.shape || 'Round',
        country_of_origin: editProductDetails.countryOfOrigin || 'India'
      };

      // Only include variations if they have been modified
      // Compare current variations with original variations to detect changes
      const originalVariations = editingProduct.variants ? editingProduct.variants.map(v => ({
        weight: v.weight,
        price: v.price,
        discount_percent: v.discount_percent || 0
      })) : [];
      
      const variationsChanged = JSON.stringify(originalVariations) !== JSON.stringify(editProductVariations);
      
      if (variationsChanged) {
        productData.variations = editProductVariations;
      }

      // Only include gallery_images if they have been modified
      const originalGalleryImages = editingProduct.gallery_images || [];
      const galleryImagesChanged = JSON.stringify(originalGalleryImages) !== JSON.stringify(selectedGalleryImages);
      
      if (galleryImagesChanged) {
        productData.gallery_images = selectedGalleryImages;
      }

      const response = await productService.updateProduct(editingProduct.id, productData);
      
      // Update the product in the list
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? response.product : p));
      
      setEditingProduct(null);
      showSuccess('Product Updated', `"${response.product.name}" has been successfully updated.`);
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update product. Please try again.';
      showError('Update Failed', errorMessage);
    } finally {
      setActionLoading(null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={loadData} variant="secondary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Simplified Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{filteredProducts.length} products</p>
        </div>
        {/* Mobile: Stacked layout, Desktop: Horizontal layout */}
        <div className="flex flex-col md:flex-row gap-3 md:space-x-3 md:space-y-0">
          <Button
            onClick={() => setShowWeightTierModal(true)} 
            variant="secondary"
            size="lg"
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl w-full md:w-auto"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Tier & Weight Management
          </Button>
          <Button 
            onClick={() => setShowDraftModal(true)} 
            variant="secondary"
            size="lg"
            className="px-6 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 w-full md:w-auto"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Draft ({draftProducts.length})
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="secondary"
            size="lg"
            className="px-6 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 w-full md:w-auto"
          >
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => setShowImportModal(true)} 
            variant="secondary"
            size="lg"
            className="px-6 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 w-full md:w-auto"
          >
            <Upload className="h-5 w-5 mr-2" />
            Import CSV
          </Button>
          <Button 
            onClick={() => {
              resetNewProductForm();
              setShowAddModal(true);
            }} 
            size="lg"
            className="px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 w-full md:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
          Add Product
        </Button>
        </div>
      </div>

      {/* Simplified Search */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="text-sm"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new product.'}
              </p>
            </div>
          ) : (
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="w-1/3 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="w-28 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="w-28 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.map((product) => (
                  <React.Fragment key={product.id}>
                    {/* Main Product Row */}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                onError={(e) => {
                                  e.currentTarget.src = '/api/placeholder/48/48';
                                }}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleProductExpansion(product.id)}
                            className="mr-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            disabled={!product.variants || product.variants.length === 0}
                          >
                            {product.variants && product.variants.length > 0 ? (
                              expandedProducts.has(product.id) ? (
                                <span className="text-gray-400">▼</span>
                              ) : (
                                <span className="text-gray-400">▶</span>
                              )
                            ) : (
                              <span className="text-gray-300">•</span>
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate flex items-center">
                              {getEgglessIcon((product as any).is_eggless)}
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {product.base_weight} • {formatCurrency(product.base_price)}
                              {product.variants && product.variants.length > 0 && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400">
                                  ({product.variants.length} variation{product.variants.length !== 1 ? 's' : ''})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <CompactCategoryDisplay 
                          product={product} 
                          maxItems={4}
                          showTooltip={true}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-center">
                          {/* Main Price Display */}
                          <div className="mb-1">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {formatCurrency(product.discounted_price)}
                            </div>
                            {product.discount_percent > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                {formatCurrency(product.base_price)}
                              </div>
                            )}
                          </div>
                          {/* Discount Badge */}
                          {product.discount_percent > 0 && (
                            <div className="inline-block px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded border border-red-200 dark:border-red-800">
                              {product.discount_percent}% OFF
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {/* Top Product Button */}
                          <button
                            onClick={() => handleToggleTopProduct(product.id)}
                            disabled={actionLoading === `top-${product.id}`}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                              product.is_top_product
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 shadow-sm'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 opacity-60 hover:opacity-80'
                            } ${actionLoading === `top-${product.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={product.is_top_product ? 'Remove from Top Products' : 'Mark as Top Product'}
                          >
                            {actionLoading === `top-${product.id}` ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Star className={`h-3 w-3 mr-1 ${product.is_top_product ? 'fill-current' : ''}`} />
                            )}
                            Top
                          </button>

                          {/* Bestseller Button */}
                          <button
                            onClick={() => handleToggleBestseller(product.id)}
                            disabled={actionLoading === `bestseller-${product.id}`}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                              product.is_bestseller
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 shadow-sm'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 opacity-60 hover:opacity-80'
                            } ${actionLoading === `bestseller-${product.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={product.is_bestseller ? 'Remove from Bestsellers' : 'Mark as Bestseller'}
                          >
                            {actionLoading === `bestseller-${product.id}` ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Award className={`h-3 w-3 mr-1 ${product.is_bestseller ? 'fill-current' : ''}`} />
                            )}
                            Best
                          </button>

                          {/* Featured Button */}
                          <button
                            onClick={() => handleToggleFeatured(product.id)}
                            disabled={actionLoading === `featured-${product.id}`}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                              product.is_featured
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 opacity-60 hover:opacity-80'
                            } ${actionLoading === `featured-${product.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={product.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                          >
                            {actionLoading === `featured-${product.id}` ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Star className={`h-3 w-3 mr-1 ${product.is_featured ? 'fill-current' : ''}`} />
                            )}
                            Featured
                          </button>

                          {/* Active/Inactive Button */}
                          <button
                            onClick={() => handleToggleActive(product.id)}
                            disabled={actionLoading === `active-${product.id}`}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                              product.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 shadow-sm'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 shadow-sm'
                            } ${actionLoading === `active-${product.id}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
                            title={product.is_active ? 'Deactivate Product' : 'Activate Product'}
                          >
                            {actionLoading === `active-${product.id}` ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <div className={`h-2 w-2 mr-1 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            )}
                            {product.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex flex-col items-end space-y-1 min-w-[100px]">
                          <button
                            onClick={() => handleViewReviews(product)}
                            className="flex items-center space-x-1.5 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors w-full justify-center"
                            title="View Reviews"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Reviews</span>
                          </button>
                          <button
                            onClick={() => handleAddReview(product)}
                            className="flex items-center space-x-1.5 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded transition-colors w-full justify-center"
                            title="Add Review"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Rate</span>
                          </button>
                          <button
                            onClick={() => handleSetEditingProduct(product)}
                            className="flex items-center space-x-1.5 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={actionLoading === `edit-${product.id}`}
                            title="Edit Product"
                          >
                            {actionLoading === `edit-${product.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Edit className="h-3 w-3" />
                            )}
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="flex items-center space-x-1.5 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete Product"
                            disabled={actionLoading === `delete-${product.id}`}
                          >
                            {actionLoading === `delete-${product.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Product Variations Rows */}
                    {expandedProducts.has(product.id) && product.variants && product.variants.length > 0 && (
                      <>
                        {product.variants.map((variant, index) => (
                          <tr key={`${product.id}-variant-${variant.id}`} className="bg-gray-50 dark:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={variant.name || variant.weight}
                                      className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600 opacity-75"
                                      onError={(e) => {
                                        e.currentTarget.src = '/api/placeholder/40/40';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center opacity-75">
                                      <Package className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center pl-8 min-w-0">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-gray-600 dark:text-gray-300 truncate flex items-center">
                                    {getEgglessIcon((product as any).is_eggless)}
                                    <span className="font-medium">Variation {index + 1}:</span> {variant.name || variant.weight}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {variant.weight}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                <span className="text-xs">Variant of:</span> {product.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(variant.discounted_price || variant.price)}
                                </div>
                                {variant.discount_percent > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                    {variant.discount_percent}% OFF
                                  </span>
                                )}
                              </div>
                              {variant.discount_percent > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                  {formatCurrency(variant.price)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  variant.is_available 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {variant.is_available ? 'Available' : 'Unavailable'}
                                </span>
                                {variant.stock_quantity !== undefined && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Stock: {variant.stock_quantity}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleSetEditingProduct(product)}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  title="Edit parent product"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVariation(product.id, variant.id, variant.name || variant.weight)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title={`Delete variation: ${variant.name || variant.weight}`}
                                  disabled={actionLoading === `delete-variant-${variant.id}`}
                                >
                                  {actionLoading === `delete-variant-${variant.id}` ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setProductVariations([]);
          resetNewProductForm();
        }}
        title={
          <div className="flex items-center justify-between w-full">
            <span>Add New Product</span>
          </div>
        }
        size="full"
      >
        <div className="space-y-6">
          {/* First Box: Product Name */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Name</h3>
              <Input 
                label="Product Name" 
                placeholder="Enter product name" 
                value={newProduct.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
          </div>

          {/* Second Box: Category & Subcategory Selection */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category & Subcategory Assignment</h3>
            
            <CategoryGridSelector
              categories={categories}
              subcategories={subcategories}
              selectedCategoryIds={newProduct.category_ids}
              selectedSubcategoryIds={newProduct.subcategory_ids}
              primaryCategoryId={newProduct.primary_category_id}
              primarySubcategoryId={newProduct.primary_subcategory_id}
              onCategoriesChange={(categoryIds) => setNewProduct(prev => ({ ...prev, category_ids: categoryIds }))}
              onSubcategoriesChange={(subcategoryIds) => setNewProduct(prev => ({ ...prev, subcategory_ids: subcategoryIds }))}
              onPrimaryCategoryChange={(categoryId) => setNewProduct(prev => ({ ...prev, primary_category_id: categoryId }))}
              onPrimarySubcategoryChange={(subcategoryId) => setNewProduct(prev => ({ ...prev, primary_subcategory_id: subcategoryId }))}
            />
          </div>

          {/* Third Box: Available Flavors Selection */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <FlavorSelector
              subcategories={subcategories}
              selectedSubcategoryIds={newProduct.subcategory_ids}
              selectedFlavorIds={newProduct.available_flavor_ids}
              primaryFlavorId={newProduct.primary_flavor_id}
              onFlavorsChange={(flavorIds) => setNewProduct(prev => ({ ...prev, available_flavor_ids: flavorIds }))}
              onPrimaryFlavorChange={(flavorId) => setNewProduct(prev => ({ ...prev, primary_flavor_id: flavorId }))}
            />
          </div>

          {/* Fourth Box: Price Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Price Section</h3>
            
            {/* Base Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <Input 
                  label="Base Weight" 
                  placeholder="e.g., 1kg" 
                  value={newProduct.base_weight}
                  onChange={(e) => handleInputChange('base_weight', e.target.value)}
                />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Servings
                </label>
                <Input 
                  placeholder={calculateServings(newProduct.base_weight)} 
                  value={newProduct.serving_size}
                  onChange={(e) => handleInputChange('serving_size', e.target.value)}
                />
                {!newProduct.serving_size && (
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated: {calculateServings(newProduct.base_weight)}
                  </p>
                )}
              </div>
                <Input 
                  label="Base Price" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={newProduct.base_price || ''}
                  onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
                />
                <Input 
                  label="Discount %" 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="1" 
                  value={newProduct.discount_percent || ''}
                  onChange={(e) => handleInputChange('discount_percent', parseFloat(e.target.value) || 0)}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discounted Price
                  </label>
                  <div className="px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-green-600">
                    {formatCurrency(calculateDiscountedPrice(newProduct.base_price, newProduct.discount_percent))}
                  </div>
                </div>
              </div>

            {/* Add New Button - Only show when no variations exist */}
            {productVariations.length === 0 && (
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={handleAddVariation}
                  disabled={!canAddNewVariation()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Variation
                </Button>
              </div>
            )}

              {/* Product Variations */}
                  {productVariations.map((variation, index) => (
              <div key={`variation-${index}`} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-700">
                  <Input 
                    label="Base Weight" 
                    placeholder="e.g., 500g" 
                            value={variation.weight}
                            onChange={(e) => handleVariationChange(index, 'weight', e.target.value)}
                          />
                        <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Servings
                          </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-blue-600">
                      {calculateServings(variation.weight)}
                    </div>
                  </div>
                  <Input 
                    label="Base Price" 
                            type="number"
                            step="0.01"
                    min="0"
                    value={variation.price || ''}
                            onChange={(e) => handleVariationChange(index, 'price', parseFloat(e.target.value) || 0)}
                  />
                  <Input 
                    label="Discount %" 
                            type="number"
                    min="0" 
                    max="100" 
                    step="1" 
                    value={variation.discount_percent || ''}
                    onChange={(e) => handleVariationChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                  />
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Discounted Price
                      </label>
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-green-600">
                        {formatCurrency(calculateDiscountedPrice(variation.price, variation.discount_percent))}
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid={`delete-variation-${index}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== VARIATION DELETE BUTTON CLICKED ===');
                          console.log('Button ID:', `delete-variation-${index}`);
                          console.log('Index:', index);
                          console.log('Variation:', variation);
                          console.log('Current productVariations:', productVariations);
                          console.log('=====================================');
                          
                          // Use a more robust approach to avoid closure issues
                          const currentIndex = productVariations.findIndex(v => 
                            v.weight === variation.weight && 
                            v.price === variation.price && 
                            v.discount_percent === variation.discount_percent
                          );
                          console.log('Found variation at index:', currentIndex);
                          if (currentIndex !== -1) {
                            console.log('Calling handleRemoveVariation with index:', currentIndex);
                            handleRemoveVariation(currentIndex);
                          } else {
                            console.error('Could not find variation to delete');
                          }
                        }}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border-2 border-red-300 hover:border-red-500 bg-yellow-100 hover:bg-yellow-200"
                        title={`Remove variation: ${variation.weight} (${formatCurrency(variation.price)})`}
                      >
                        <div className="flex flex-col items-center">
                          <Trash2 className="h-4 w-4" />
                          <span className="text-xs font-bold">VAR</span>
                        </div>
                      </button>
                    </div>
                </div>
                
                {/* Add New button only below the last variation */}
                {index === productVariations.length - 1 && (
                  <div className="flex justify-end mt-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm"
                      onClick={handleAddVariation}
                      disabled={!canAddNewVariation()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Variation
                    </Button>
                </div>
              )}
            </div>
            ))}
          </div>

          {/* Fourth and Fifth Boxes: Product Description and Image - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Fourth Box: Product Description - 75% width (3/4 columns) */}
            <div className="lg:col-span-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Product Description</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(Structured rich text formatting)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleDescriptionPreviewToggle}
                      className="flex items-center gap-2 px-4 py-2 text-xs min-w-[80px]"
                    >
                      <Eye className="h-3 w-3" />
                      {showDescriptionPreview ? 'Hide Preview' : 'Preview'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleDescriptionReset}
                      className="flex items-center gap-2 px-4 py-2 text-xs min-w-[60px]"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleDescriptionClean}
                      className="flex items-center gap-2 px-4 py-2 text-xs min-w-[60px]"
                    >
                      <X className="h-3 w-3" />
                      Clean
                    </Button>
                  </div>
                </div>
                <StructuredDescriptionEditor
                  ref={descriptionEditorRef}
                  placeholder="Write up to 50 words about the product..."
                  value={newProduct.description}
                  onChange={(value) => handleInputChange('description', value)}
                  onShortDescriptionChange={(shortDescription) => handleInputChange('short_description', shortDescription)}
                  onProductDetailsChange={(d) => setNewProductDetails({
                    version: d.version,
                    shape: d.shape,
                    countryOfOrigin: d.countryOfOrigin
                  })}
                  onPreviewToggle={handleDescriptionPreviewToggle}
                  onReset={handleDescriptionReset}
                  onClean={handleDescriptionClean}
                  showPreview={showDescriptionPreview}
                  primarySubcategoryId={newProduct.primary_subcategory_id}
                  subcategories={subcategories}
                  productVariations={productVariations}
                  baseWeight={newProduct.base_weight}
                />
                
                {/* Visual Separator */}
                <div className="mt-8 mb-6">
                  <div className="border-t border-gray-200 dark:border-gray-600"></div>
                </div>

                {/* Care & Storage Field */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Care & Storage</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleCareStorageReset}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset to Default
                    </Button>
                  </div>
                  <RichTextEditor 
                    placeholder="Enter care and storage instructions" 
                    value={newProduct.care_storage}
                    onChange={(value) => handleInputChange('care_storage', value)}
                    height="200px"
                  />
                </div>
                
                {/* Visual Separator */}
                <div className="mt-8 mb-6">
                  <div className="border-t border-gray-200 dark:border-gray-600"></div>
                </div>

                {/* Delivery Guidelines Field */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Guidelines</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleDeliveryGuidelinesReset}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset to Default
                    </Button>
                  </div>
                  <RichTextEditor 
                    placeholder="Enter delivery guidelines and instructions" 
                    value={newProduct.delivery_guidelines}
                    onChange={(value) => handleInputChange('delivery_guidelines', value)}
                    height="170px"
                  />
                </div>
              </div>
            </div>

            {/* Fifth Box: Product Image, Gallery & Publish - 25% width (1/4 column) */}
            <div className="lg:col-span-1 flex flex-col h-full">
              <div className="space-y-6 flex-1">
                {/* Product Image Sub-box */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Product Image <span className="text-red-500">*</span>
                    </h4>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col h-full">
                    {selectedMainImage ? (
                      <div className="space-y-4 flex-1">
                        <div className="relative">
                          <img 
                            src={selectedMainImage} 
                            alt="Selected product" 
                            className="w-full h-48 object-cover rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-600"
                            onClick={handleSetProductImage}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Click the image to edit or update</p>
                          <button 
                            onClick={() => {
                              setSelectedMainImage('');
                              setNewProduct(prev => ({ ...prev, image_url: '' }));
                            }}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm underline"
                          >
                            Remove product image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 mx-auto bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <button 
                              onClick={handleSetProductImage}
                              className="w-full text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium py-2 px-4 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              Upload product image
                            </button>
                            <p className="text-xs text-red-500 mt-2">
                              ⚠️ A product image is required to create the product
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
          </div>

                {/* Product Gallery Sub-box */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Product Gallery</h4>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col h-full">
                    {selectedGalleryImages.length > 0 ? (
                      <div className="space-y-4 flex-1">
                        <div className="grid grid-cols-2 gap-3">
                          {selectedGalleryImages.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <MediaPreview
                                url={imageUrl}
                                type={getFileTypeFromUrl(imageUrl)}
                                alt={`Gallery ${index + 1}`} 
                                className="w-full h-20 object-cover rounded-lg cursor-pointer border border-gray-200 dark:border-gray-600"
                                onRemove={() => handleRemoveGalleryImage(imageUrl)}
                                showRemoveButton={true}
                              />
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleRemoveGalleryImage(imageUrl)}
                                  className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Add more images to your gallery</p>
                          <button 
                            onClick={handleAddGalleryImages}
                            className="w-full text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium py-2 px-4 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            Add more images
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full justify-center">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <button 
                              onClick={handleAddGalleryImages}
                              className="w-full text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium py-2 px-4 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              Add gallery images
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Add multiple images to showcase your product
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview / Publish Sub-box */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Preview / Publish</h4>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col h-full space-y-4">
                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <button 
                          className="flex-1 px-3 py-2 text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
                          onClick={() => {
                            // Handle save as draft
                            console.log('Save as draft');
                          }}
                        >
                          Save Draft
                        </button>
                        <button 
                          className="flex-1 px-3 py-2 text-sm border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors font-medium"
                          onClick={() => {
                            // Handle preview
                            console.log('Preview product');
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                    
                    {/* Status Information */}
                    <div className="space-y-3 flex-1">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Product Status</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                              Status: Draft
                            </div>
                            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs">Edit</button>
                          </div>
                          
                          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              Visibility: Public
                            </div>
                            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs">Edit</button>
                          </div>
                          
                          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              Publish immediately
                            </div>
                            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs">Edit</button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quick Stats</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-600 rounded">
                            <div className="font-semibold text-gray-900 dark:text-white">0</div>
                            <div className="text-gray-500 dark:text-gray-400">Views</div>
                          </div>
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-600 rounded">
                            <div className="font-semibold text-gray-900 dark:text-white">0</div>
                            <div className="text-gray-500 dark:text-gray-400">Orders</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                      {hasUnsavedChanges && (
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
                              clearSavedFormData();
                              resetNewProductForm();
                              setProductVariations([]);
                              setSelectedMainImage('');
                              setSelectedGalleryImages([]);
                            }
                          }}
                          className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors border border-red-200 hover:border-red-300"
                        >
                          Clear Draft
                        </button>
                      )}
                      <button 
                        onClick={handleAddProduct}
                        disabled={actionLoading === 'add-product'}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                      >
            {actionLoading === 'add-product' ? (
              <>
                            <svg className="w-4 h-4 mr-2 animate-spin inline" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Publishing...
              </>
            ) : (
                          'Publish'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => {
          setEditingProduct(null);
          setEditProduct({
            name: '',
            category_id: '', // Legacy field
            subcategory_id: '', // Legacy field
            category_ids: [], // New multi-category field
            subcategory_ids: [], // New multi-subcategory field
            primary_category_id: undefined,
            primary_subcategory_id: undefined,
            // Flavor selection fields
            available_flavor_ids: [],
            primary_flavor_id: undefined,
            base_weight: '',
            base_price: 0,
            discount_percent: 0,
            description: '',
            short_description: '',
            image_url: '',
            is_active: true,
            is_featured: false,
            is_top_product: false,
            is_bestseller: false,
            preparation_time: 0,
            serving_size: '',
            care_storage: '',
            delivery_guidelines: ''
          });
          setEditProductVariations([]);
          setSelectedMainImage('');
          setSelectedGalleryImages([]);
        }}
        title="Edit Product"
        size="full"
      >
        {editingProduct && (
          <div className="space-y-6">
            {/* First Box: Product Name */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Name</h3>
              <Input 
                label="Product Name" 
                value={editProduct.name}
                onChange={(e) => handleEditInputChange('name', e.target.value)}
                placeholder="Enter product name" 
              />
            </div>

            {/* Second Box: Category & Subcategory Selection */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category & Subcategory Assignment</h3>
              
              <CategoryGridSelector
                categories={categories}
                subcategories={subcategories}
                selectedCategoryIds={editProduct.category_ids}
                selectedSubcategoryIds={editProduct.subcategory_ids}
                primaryCategoryId={editProduct.primary_category_id}
                primarySubcategoryId={editProduct.primary_subcategory_id}
                onCategoriesChange={(categoryIds) => setEditProduct(prev => ({ ...prev, category_ids: categoryIds }))}
                onSubcategoriesChange={(subcategoryIds) => setEditProduct(prev => ({ ...prev, subcategory_ids: subcategoryIds }))}
                onPrimaryCategoryChange={(categoryId) => setEditProduct(prev => ({ ...prev, primary_category_id: categoryId }))}
                onPrimarySubcategoryChange={(subcategoryId) => setEditProduct(prev => ({ ...prev, primary_subcategory_id: subcategoryId }))}
              />
            </div>

            {/* Third Box: Available Flavors Selection */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <FlavorSelector
                subcategories={subcategories}
                selectedSubcategoryIds={editProduct.subcategory_ids}
                selectedFlavorIds={editProduct.available_flavor_ids}
                primaryFlavorId={editProduct.primary_flavor_id}
                onFlavorsChange={(flavorIds) => setEditProduct(prev => ({ ...prev, available_flavor_ids: flavorIds }))}
                onPrimaryFlavorChange={(flavorId) => setEditProduct(prev => ({ ...prev, primary_flavor_id: flavorId }))}
              />
            </div>

            {/* Fourth Box: Price Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Price Section</h3>
              <div className="space-y-4">
                {/* Base Price Row */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Weight
                    </label>
              <Input 
                value={editProduct.base_weight}
                onChange={(e) => handleEditInputChange('base_weight', e.target.value)}
                      placeholder="e.g., 500g, 1kg" 
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Servings
                    </label>
                    <Input 
                      value={editProduct.serving_size}
                      onChange={(e) => handleEditInputChange('serving_size', e.target.value)}
                      placeholder={calculateServings(editProduct.base_weight)} 
                    />
                    {!editProduct.serving_size && (
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-calculated: {calculateServings(editProduct.base_weight)}
                      </p>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Base Price
                    </label>
                    <Input 
                type="number" 
                step="0.01"
                min="0"
                value={editProduct.base_price || ''}
                onChange={(e) => handleEditInputChange('base_price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
              />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount %
                    </label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                step="1"
                value={editProduct.discount_percent || ''}
                onChange={(e) => handleEditInputChange('discount_percent', parseFloat(e.target.value) || 0)}
                      placeholder="0"
              />
            </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discounted Price
                    </label>
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-green-600">
                  {formatCurrency(calculateDiscountedPrice(editProduct.base_price, editProduct.discount_percent))}
              </div>
            </div>
                </div>

                {/* Product Variations Section */}
                {editProductVariations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Product Variations</h4>
                    
                    {editProductVariations.map((variation, index) => (
                      <div key={index} className="mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700">
                          <Input 
                            label="Weight" 
                            placeholder="e.g., 500g" 
                            value={variation.weight}
                            onChange={(e) => handleEditVariationChange(index, 'weight', e.target.value)}
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Servings
                            </label>
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-blue-600">
                              {calculateServings(variation.weight)}
                            </div>
                          </div>
                          <Input 
                            label="Price" 
                            placeholder="0.00"
                            type="number"
                            step="0.01"
                            min="0"
                            value={variation.price || ''}
                            onChange={(e) => handleEditVariationChange(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                          <Input 
                            label="Discount %" 
                            placeholder="0"
                            type="number" 
                            min="0" 
                            max="100" 
                            step="1" 
                            value={variation.discount_percent || ''}
                            onChange={(e) => handleEditVariationChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                          />
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Discounted Price
                              </label>
                              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-green-600">
                                {formatCurrency(calculateDiscountedPrice(variation.price, variation.discount_percent))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditRemoveVariation(index)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove variation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Add New button only below the last variation */}
                        {index === editProductVariations.length - 1 && (
                          <div className="flex justify-end mt-2">
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              onClick={handleEditAddVariation}
                              disabled={!canAddNewEditVariation()}
                              className="px-4 py-2"
                            >
                              Add New Variation
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Variation Button - Only show when no variations exist */}
                {editProductVariations.length === 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Product Variations</h4>
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">No variations added yet</p>
                      <Button 
                        type="button" 
                        variant="secondary"
                        size="sm"
                        onClick={handleEditAddVariation}
                        disabled={!canAddNewEditVariation()}
                        className="px-4 py-2"
                      >
                        Add First Variation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fourth & Fifth Box: Description and Image (Side by Side) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Fourth Box: Product Description (75% width) */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Product Description</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">(Structured rich text formatting)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleEditDescriptionPreviewToggle}
                      className="flex items-center gap-2 px-4 py-2 text-xs min-w-[80px]"
                    >
                      <Eye className="h-3 w-3" />
                      {showEditDescriptionPreview ? 'Hide Preview' : 'Preview'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleEditDescriptionReset}
                      className="flex items-center gap-2 px-4 py-2 text-xs min-w-[60px]"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleEditDescriptionClean}
                      className="flex items-center gap-2 px-4 py-2 text-xs min-w-[60px]"
                    >
                      <X className="h-3 w-3" />
                      Clean
                    </Button>
                  </div>
                </div>
                <StructuredDescriptionEditor 
                  ref={editDescriptionEditorRef}
                  value={editProduct.description}
                  onChange={(value) => handleEditInputChange('description', value)}
                  onShortDescriptionChange={(shortDescription) => handleEditInputChange('short_description', shortDescription)}
                  initialShortDescription={editProduct.short_description}
                  onProductDetailsChange={(d) => setEditProductDetails({
                    version: d.version,
                    shape: d.shape,
                    countryOfOrigin: d.countryOfOrigin
                  })}
                  placeholder="Write up to 50 words about the product..."
                  onPreviewToggle={handleEditDescriptionPreviewToggle}
                  onReset={handleEditDescriptionReset}
                  onClean={handleEditDescriptionClean}
                  showPreview={showEditDescriptionPreview}
                  primarySubcategoryId={editProduct.primary_subcategory_id}
                  subcategories={subcategories}
                  productVariations={editProductVariations}
                  baseWeight={editProduct.base_weight}
                />
                
                {/* Visual Separator */}
                <div className="mt-8 mb-6">
                  <div className="border-t border-gray-200 dark:border-gray-600"></div>
                </div>

                {/* Care & Storage Field */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Care & Storage</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleEditCareStorageReset}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset to Default
                    </Button>
                  </div>
                  <RichTextEditor 
                    placeholder="Enter care and storage instructions" 
                    value={editProduct.care_storage}
                    onChange={(value) => handleEditInputChange('care_storage', value)}
                    height="200px"
                  />
                </div>
                
                {/* Visual Separator */}
                <div className="mt-8 mb-6">
                  <div className="border-t border-gray-200 dark:border-gray-600"></div>
                </div>

                {/* Delivery Guidelines Field */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Guidelines</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleEditDeliveryGuidelinesReset}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset to Default
                    </Button>
                  </div>
                  <RichTextEditor 
                    placeholder="Enter delivery guidelines and instructions" 
                    value={editProduct.delivery_guidelines}
                    onChange={(value) => handleEditInputChange('delivery_guidelines', value)}
                    height="170px"
                  />
                </div>
              </div>

              {/* Fifth Box: Product Image, Gallery & Publish (25% width) */}
              <div className="lg:col-span-1 flex flex-col h-full">
                <div className="space-y-6 flex-1">
                  {/* Product Image Sub-box */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Product Image <span className="text-red-500">*</span>
                      </h4>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col h-full">
                      {selectedMainImage ? (
                        <div className="space-y-4 flex-1">
                          <div className="relative">
                            <img
                              src={selectedMainImage}
                              alt="Selected product"
                              className="w-full h-48 object-cover rounded-lg cursor-pointer border-2 border-gray-200 dark:border-gray-600"
                              onClick={handleSetProductImage}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
                                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Click the image to edit or update</p>
                            <button 
                              onClick={() => {
                                setSelectedMainImage('');
                                setEditProduct(prev => ({ ...prev, image_url: '' }));
                              }}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm underline"
                            >
                              Remove product image
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full justify-center">
                          <div className="text-center space-y-4">
                            <div className="w-20 h-20 mx-auto bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <button 
                                onClick={() => handleSetProductImage()}
                                className="w-full text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium py-2 px-4 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                Upload product image
                              </button>
                              <p className="text-xs text-red-500 mt-2">
                                ⚠️ A product image is required to create the product
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Gallery Sub-box */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Product Gallery</h4>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col h-full">
                      {selectedGalleryImages.length > 0 ? (
                        <div className="space-y-4 flex-1">
                          <div className="grid grid-cols-2 gap-3">
                            {selectedGalleryImages.map((imageUrl, index) => (
                              <div key={index} className="relative group">
                                <MediaPreview
                                  url={imageUrl}
                                  type={getFileTypeFromUrl(imageUrl)}
                                  alt={`Gallery ${index + 1}`}
                                  className="w-full h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                  onRemove={() => handleRemoveGalleryImage(imageUrl)}
                                  showRemoveButton={true}
                                />
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleRemoveGalleryImage(imageUrl)}
                                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Add more images to your gallery</p>
                            <button 
                              onClick={() => handleAddGalleryImages()}
                              className="w-full text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium py-2 px-4 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              Add more images
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full justify-center">
                          <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <button 
                                onClick={() => handleAddGalleryImages()}
                                className="w-full text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium py-2 px-4 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              >
                                Add gallery images
                              </button>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Add multiple images to showcase your product
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview / Publish Sub-box */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Preview / Publish</h4>
                      <div className="flex space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col h-full space-y-4">
                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <button 
                            className="flex-1 px-3 py-2 text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
                            onClick={() => {
                              // Handle save as draft
                              console.log('Save as draft');
                            }}
                          >
                            Save Draft
                          </button>
                          <button 
                            className="flex-1 px-3 py-2 text-sm border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors font-medium"
                            onClick={() => {
                              // Handle preview
                              console.log('Preview product');
                            }}
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                      
                      {/* Status Information */}
                      <div className="space-y-3 flex-1">
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Product Status</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Status: {editingProduct?.is_active ? 'Active' : 'Inactive'}
                              </div>
                              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs">Edit</button>
                            </div>
                            
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                Visibility: Public
                              </div>
                              <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs">Edit</button>
                            </div>
                            
                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                Last updated: {editingProduct?.updated_at ? new Date(editingProduct.updated_at).toLocaleDateString() : 'Never'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Quick Stats</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-600 rounded">
                              <div className="font-semibold text-gray-900 dark:text-white">0</div>
                              <div className="text-gray-500 dark:text-gray-400">Views</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-600 rounded">
                              <div className="font-semibold text-gray-900 dark:text-white">0</div>
                              <div className="text-gray-500 dark:text-gray-400">Orders</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Update Button */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                        <button 
                          onClick={handleUpdateProduct}
                          disabled={actionLoading === 'edit-product'}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          {actionLoading === 'edit-product' ? (
                            <>
                              <svg className="w-4 h-4 mr-2 animate-spin inline" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Updating...
                            </>
                          ) : (
                            'Update Product'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                </div>
              </div>
        )}
      </Modal>

      {/* Variants Modal */}
      <Modal
        isOpen={showVariantsModal}
        onClose={() => setShowVariantsModal(false)}
        title="Product Details & Variants"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Product Variants</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select a product from the table to view and manage its variants.
            </p>
            <Button variant="secondary" onClick={() => setShowVariantsModal(false)}>
              Close
            </Button>
          </div>
        </div>
        <ModalFooter>
          <Button onClick={() => setShowVariantsModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* File Upload Modal */}
      <Modal
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        title={galleryType === 'main' ? 'Upload Product Image' : 'Upload Gallery Images & Videos'}
        size="lg"
      >
        <div className="space-y-4">
          {galleryType === 'gallery' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Upload multiple images and videos for your product gallery. Drag and drop files or click to browse.
                </p>
              </div>
            </div>
          )}
          
          <ProductFileUpload
            onFilesSelected={(files) => {
              // Files are being processed
            }}
            onUploadComplete={(urls) => {
              if (galleryType === 'main') {
                setSelectedMainImage(urls[0]);
                setShowImageGallery(false);
                showSuccess('Product image uploaded successfully!');
              } else {
                setSelectedGalleryImages(prev => [...prev, ...urls]);
                setShowImageGallery(false);
                showSuccess(`${urls.length} file${urls.length !== 1 ? 's' : ''} uploaded successfully!`);
              }
            }}
            onUploadError={(error) => {
              showError(error);
            }}
            multiple={galleryType === 'gallery'}
            maxFiles={galleryType === 'gallery' ? 10 : 1}
            accept="image/*,video/*"
          />
          
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="secondary" 
              onClick={() => setShowImageGallery(false)}
              >
                Cancel
              </Button>
          </div>
        </div>
      </Modal>

      {/* Draft Products Modal */}
      <Modal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        title="Draft Products"
        size="full"
      >
        <div className="space-y-4">
          {draftProducts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No draft products</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new product.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {draftProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.image_url ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                                src={product.image_url}
                                alt={product.name}
                                onError={(e) => {
                                  e.currentTarget.src = '/api/placeholder/40/40';
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center">
                            {getEgglessIcon((product as any).is_eggless)}
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <CompactCategoryDisplay 
                          product={product} 
                          maxItems={4}
                          showTooltip={true}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(product.base_price)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.base_weight}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Draft
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(product.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setShowDraftModal(false);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              // Handle publish action
                              console.log('Publishing product:', product.id);
                            }}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => {
                              // Handle delete action
                              setDraftProducts(prev => prev.filter(p => p.id !== product.id));
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDraftModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Import CSV Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={resetImportModal}
        title="Import Products from CSV"
        size="lg"
      >
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Import Instructions</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Download the CSV template to see the required format</li>
                  <li>• Fill in your product data following the template structure</li>
                  <li>• Categories and subcategories must match existing ones</li>
                  <li>• Use "Yes" or "No" for boolean fields (Is Active, Is Featured, etc.)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                />
                <Button
                  onClick={downloadCSVTemplate}
                  variant="secondary"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            {importFile && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{importFile.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setImportFile(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {importStatus === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Importing products...</span>
                <span className="text-gray-600 dark:text-gray-400">{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Results */}
          {importStatus === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">Import Completed</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Successfully imported {importResults.success} out of {importResults.total} products.
                    {importResults.errors > 0 && ` ${importResults.errors} products failed to import.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {importStatus === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Import Failed</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Please check your CSV file format and try again.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={resetImportModal}>
            {importStatus === 'processing' ? 'Cancel' : 'Close'}
          </Button>
          {importFile && importStatus === 'idle' && (
            <Button 
              onClick={processCSVImport}
              disabled={!importFile}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Products
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Reviews Management Modal */}
      <Modal
        isOpen={showReviewsModal}
        onClose={() => setShowReviewsModal(false)}
        title={`Reviews for ${selectedProductForReviews?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Product Reviews</h3>
            <Button
              onClick={() => handleAddReview(selectedProductForReviews!)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Review
            </Button>
          </div>

          {productReviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reviews yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Be the first to add a review for this product.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {productReviews.map((review) => (
                <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {review.customer_name}
                        </h4>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Verified Purchase
                          </span>
                        )}
                        {!review.is_approved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Pending Approval
                          </span>
                        )}
                      </div>
                      {review.review_title && (
                        <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                          {review.review_title}
                        </h5>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {review.review_text}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!review.is_approved && (
                        <button
                          onClick={() => handleApproveReview(review.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          title="Approve Review"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete Review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex space-x-2">
                      {review.images.map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review ${index + 1}`}
                          className="h-16 w-16 object-cover rounded border border-gray-200 dark:border-gray-600"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowReviewsModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Review Modal */}
      <Modal
        isOpen={showAddReviewModal}
        onClose={handleCloseAddReviewModal}
        title={`Add Review for ${selectedProductForReviews?.name || ''}`}
        size="lg"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Customer Name *"
              placeholder="Enter customer name"
              value={newReview.customer_name}
              onChange={(e) => setNewReview(prev => ({ ...prev, customer_name: e.target.value }))}
            />
            <Input
              label="Customer Email (Optional)"
              type="email"
              placeholder="Enter customer email"
              value={newReview.customer_email}
              onChange={(e) => setNewReview(prev => ({ ...prev, customer_email: e.target.value }))}
            />
          </div>

          {/* Rating Categories */}
          <div className="space-y-3">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Rating Categories *
              </h4>
              <div className="space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                <ModernRatingComponent
                  label="Taste"
                  emoji="🍰"
                  rating={newReview.ratings.taste}
                  onRatingChange={(rating) => setNewReview(prev => ({ 
                    ...prev, 
                    ratings: { ...prev.ratings, taste: rating },
                    rating: rating // Update overall rating to match taste for backward compatibility
                  }))}
                  color="pink"
                />
                
                <ModernRatingComponent
                  label="Presentation"
                  emoji="🎂"
                  rating={newReview.ratings.presentation}
                  onRatingChange={(rating) => setNewReview(prev => ({ 
                    ...prev, 
                    ratings: { ...prev.ratings, presentation: rating }
                  }))}
                  color="blue"
                />
                
                <ModernRatingComponent
                  label="Freshness"
                  emoji="🧁"
                  rating={newReview.ratings.freshness}
                  onRatingChange={(rating) => setNewReview(prev => ({ 
                    ...prev, 
                    ratings: { ...prev.ratings, freshness: rating }
                  }))}
                  color="green"
                />
                
                <ModernRatingComponent
                  label="Delivery Experience"
                  emoji="🚚"
                  rating={newReview.ratings.deliveryExperience}
                  onRatingChange={(rating) => setNewReview(prev => ({ 
                    ...prev, 
                    ratings: { ...prev.ratings, deliveryExperience: rating }
                  }))}
                  color="purple"
                />
                
                <ModernRatingComponent
                  label="Value for Money"
                  emoji="💰"
                  rating={newReview.ratings.valueForMoney}
                  onRatingChange={(rating) => setNewReview(prev => ({ 
                    ...prev, 
                    ratings: { ...prev.ratings, valueForMoney: rating }
                  }))}
                  color="orange"
                />
              </div>
            </div>
          </div>

          <Input
            label="Review Title (Optional)"
            placeholder="Enter review title"
            value={newReview.review_title}
            onChange={(e) => setNewReview(prev => ({ ...prev, review_title: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review Text (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Enter review text"
              value={newReview.review_text}
              onChange={(e) => setNewReview(prev => ({ ...prev, review_text: e.target.value }))}
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newReview.is_verified_purchase}
                onChange={(e) => setNewReview(prev => ({ ...prev, is_verified_purchase: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Verified Purchase (Optional)</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newReview.is_approved}
                onChange={(e) => setNewReview(prev => ({ ...prev, is_approved: e.target.checked }))}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Auto-approve (Optional)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review Images (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Drag and drop images here, or click to browse
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                id="review-images"
                onChange={(e) => {
                  // Handle image upload here
                  console.log('Review images selected:', e.target.files);
                }}
              />
              <label
                htmlFor="review-images"
                className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                Select Images
              </label>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={handleCloseAddReviewModal}>
            Cancel
          </Button>
          <Button onClick={handleSaveReview}>
            Save Review
          </Button>
        </ModalFooter>
      </Modal>

      {/* Weight Tier Management Modal */}
      <WeightTierManagement
        isOpen={showWeightTierModal}
        onClose={() => setShowWeightTierModal(false)}
      />
    </div>
  );
};

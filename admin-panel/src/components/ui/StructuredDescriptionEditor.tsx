import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { ChevronDown, ChevronUp, Edit3, Save, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Subcategory } from '../../types';
import type { ProductFormProfile } from '../../utils/productFormProfile';
import { getDefaultPleaseNoteBullets } from '../../utils/productSupplementalDefaults';

interface ProductDetails {
  cakeFlavour: string;
  version: 'Egg' | 'Eggless' | '';
  shape: string;
  servings: string;
  toppings: string;
  weight: string;
  countryOfOrigin: string;
}

interface StructuredDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  productDetails?: Partial<ProductDetails>;
  onProductDetailsChange?: (details: ProductDetails) => void;
  onPreviewToggle?: () => void;
  onReset?: () => void;
  onClean?: () => void;
  showPreview?: boolean;
  // New props for auto-population
  primarySubcategoryId?: number;
  subcategories?: Subcategory[];
  productVariations?: Array<{ weight: string; price: number; discount_percent: number }>;
  baseWeight?: string;
  /** When false (non-cake price forms), do not infer kg/gm from bare numbers in primary option label. */
  isCakePricingForm?: boolean;
  /** Drives shape dropdown options and Product Details field order (cake vs treats / flowers / sweets). */
  formProfile?: ProductFormProfile;
  // New prop for short description sync
  onShortDescriptionChange?: (shortDescription: string) => void;
  initialShortDescription?: string;
}

export interface StructuredDescriptionEditorRef {
  reset: () => void;
  clean: () => void;
}

/** True if the string looks like a mass/volume (not a pack count like "Set of 3"). */
function hasExplicitMassUnit(raw: string): boolean {
  const t = raw.toLowerCase().trim();
  if (!t) return false;
  if (/\b(kg|kilogram|kilograms)\b/.test(t)) return true;
  if (/\b(gm|gram|grams)\b/.test(t)) return true;
  if (/\d+(?:\.\d+)?\s*(kg|g|gm|gram)s?\b/.test(t)) return true;
  if (/\b(ml|millilitre|milliliter|litre|liter|l)\b/.test(t)) return true;
  if (/\b(lb|oz|pound|ounce)s?\b/.test(t)) return true;
  return false;
}

const CAKE_SHAPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Round', label: 'Round' },
  { value: 'Square', label: 'Square' },
  { value: 'Rectangular', label: 'Rectangular' },
  { value: 'Heart', label: 'Heart' },
];

/** Florist-facing arrangement / presentation styles (stored as Shape: … in the description). */
const FLOWER_ARRANGEMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Round bouquet', label: 'Round / dome bouquet' },
  { value: 'Vertical / tall', label: 'Vertical / tall' },
  { value: 'Cascading', label: 'Cascading' },
  { value: 'Hand-tied', label: 'Hand-tied' },
  { value: 'Vase arrangement', label: 'Vase arrangement' },
  { value: 'Basket', label: 'Basket' },
  { value: 'Box / hatbox', label: 'Box / hatbox' },
  { value: 'Heart', label: 'Heart-shaped' },
  { value: 'Wreath', label: 'Wreath' },
  { value: 'Other', label: 'Other' },
];

const TREATS_SHAPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Round', label: 'Round' },
  { value: 'Square', label: 'Square' },
  { value: 'Rectangular', label: 'Rectangular' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Assorted', label: 'Assorted / variety' },
  { value: 'Other', label: 'Other' },
];

const SWEETS_SHAPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Round', label: 'Round' },
  { value: 'Square', label: 'Square' },
  { value: 'Rectangular', label: 'Rectangular' },
  { value: 'Bar / slab', label: 'Bar / slab' },
  { value: 'Bite-sized', label: 'Bite-sized pieces' },
  { value: 'Assorted', label: 'Assorted' },
  { value: 'Other', label: 'Other' },
];

function getShapeOptionsForProfile(profile: ProductFormProfile): { value: string; label: string }[] {
  switch (profile) {
    case 'cake':
      return CAKE_SHAPE_OPTIONS;
    case 'flowers':
      return FLOWER_ARRANGEMENT_OPTIONS;
    case 'treats':
      return TREATS_SHAPE_OPTIONS;
    case 'sweets':
      return SWEETS_SHAPE_OPTIONS;
    default:
      return CAKE_SHAPE_OPTIONS;
  }
}

function productDetailsFlavourLabel(profile: ProductFormProfile): string {
  switch (profile) {
    case 'cake':
      return 'Cake Flavour';
    case 'flowers':
      return 'Flower mix / variety';
    case 'treats':
      return 'Flavor / style';
    case 'sweets':
      return 'Variety';
    default:
      return 'Cake Flavour';
  }
}

function productDetailsShapeLabel(profile: ProductFormProfile): string {
  switch (profile) {
    case 'cake':
      return 'Shape';
    case 'flowers':
      return 'Arrangement style';
    case 'treats':
      return 'Shape / format';
    case 'sweets':
      return 'Shape / pack style';
    default:
      return 'Shape';
  }
}

function productDetailsFlavourPlaceholder(profile: ProductFormProfile): string {
  switch (profile) {
    case 'cake':
      return 'e.g., Chocolate, Vanilla, Strawberry';
    case 'flowers':
      return 'e.g., Roses, Mixed seasonal blooms';
    case 'treats':
      return 'e.g., Chocolate chip, Red velvet';
    case 'sweets':
      return 'e.g., Kaju katli, Assorted mithai';
    default:
      return '';
  }
}

function productDetailsFlowersBouquetLabel(): string {
  return 'Stems, blooms & presentation';
}

function productDetailsFlowersBouquetPlaceholder(): string {
  return 'e.g., 4 pink Oriental lilies, white premium paper wrap';
}

function productDetailsToppingsPlaceholder(profile: ProductFormProfile): string {
  switch (profile) {
    case 'flowers':
      return "e.g., Satin ribbon, baby's breath, eucalyptus, gift message card";
    case 'treats':
      return 'e.g., Drizzle, sprinkles, edible glitter';
    case 'sweets':
      return 'e.g., Silver leaf, nuts, rose petals (decorative)';
    case 'cake':
    default:
      return 'e.g., Fresh fruits, Chocolate shavings, Nuts';
  }
}

function calculateServingsFromWeight(weight: string): string {
  if (!weight) return '0 servings';

  const match = weight.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return '0 servings';

  const [, numberStr, unit] = match;
  const number = parseFloat(numberStr);

  if (isNaN(number)) return '0 servings';

  let weightInGrams = number;
  const unitLower = unit.toLowerCase();

  if (unitLower === 'kg' || unitLower === 'kilogram' || unitLower === 'kilograms') {
    weightInGrams = number * 1000;
  } else if (unitLower === 'lb' || unitLower === 'pound' || unitLower === 'pounds') {
    weightInGrams = number * 453.592;
  } else if (unitLower === 'oz' || unitLower === 'ounce' || unitLower === 'ounces') {
    weightInGrams = number * 28.3495;
  }

  const minServings = Math.floor(weightInGrams / 100);
  const maxServings = Math.round(weightInGrams / 83.33);

  if (minServings === maxServings) {
    return `${minServings} serving${minServings !== 1 ? 's' : ''}`;
  }

  return `${minServings}–${maxServings} servings`;
}

const StructuredDescriptionEditor = forwardRef<StructuredDescriptionEditorRef, StructuredDescriptionEditorProps>(({
  value,
  onChange,
  placeholder = "Write up to 50 words about the product...",
  label = "Product Description",
  error,
  className = "",
  productDetails = {},
  onProductDetailsChange,
  onPreviewToggle,
  onReset,
  onClean,
  showPreview: externalShowPreview,
  primarySubcategoryId,
  subcategories = [],
  productVariations = [],
  baseWeight,
  isCakePricingForm = true,
  formProfile = 'cake',
  onShortDescriptionChange,
  initialShortDescription
}, ref) => {
  const [overviewText, setOverviewText] = useState('');
  const isUpdatingRef = useRef(false);
  const [details, setDetails] = useState<ProductDetails>({
    cakeFlavour: '',
    version: 'Eggless',
    shape: productDetails.shape !== undefined && productDetails.shape !== ''
      ? productDetails.shape
      : formProfile === 'cake'
        ? 'Round'
        : '',
    servings: '',
    toppings: '',
    weight: '',
    countryOfOrigin: 'India',
    ...productDetails
  });

  const [isWeightManuallyEdited, setIsWeightManuallyEdited] = useState(false);
  const [pleaseNote, setPleaseNote] = useState(() => getDefaultPleaseNoteBullets(formProfile));
  const [isEditingPleaseNote, setIsEditingPleaseNote] = useState(false);
  const [tempPleaseNote, setTempPleaseNote] = useState(() => getDefaultPleaseNoteBullets(formProfile));
  const [internalShowPreview, setInternalShowPreview] = useState(false);
  const showPreview = externalShowPreview !== undefined ? externalShowPreview : internalShowPreview;
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    details: true,
    pleaseNote: true
  });

  const isCakeDetailsLayout = formProfile === 'cake';
  const showTreatsEggVersion = formProfile === 'treats';
  const isFlowersProfile = formProfile === 'flowers';
  const flavourFieldLabel = productDetailsFlavourLabel(formProfile);
  const shapeFieldLabel = productDetailsShapeLabel(formProfile);
  const flavourPlaceholder = productDetailsFlavourPlaceholder(formProfile);
  const toppingsPlaceholder = productDetailsToppingsPlaceholder(formProfile);
  const flowersBouquetLabel = productDetailsFlowersBouquetLabel();
  const flowersBouquetPlaceholder = productDetailsFlowersBouquetPlaceholder();

  const shapeSelectOptions = useMemo(() => {
    const base = getShapeOptionsForProfile(formProfile);
    const v = details.shape?.trim();
    if (v && !base.some((o) => o.value === v)) {
      return [{ value: v, label: `${v} (saved value)` }, ...base];
    }
    return base;
  }, [formProfile, details.shape]);

  const shapeSelectClassName =
    'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  // Auto-population logic based on primary subcategory and variations
  useEffect(() => {
    if (primarySubcategoryId && subcategories.length > 0 && !details.cakeFlavour) {
      const primarySubcategory = subcategories.find(sub => 
        sub.id === primarySubcategoryId || sub.id === primarySubcategoryId.toString()
      );
      if (primarySubcategory) {
        // Auto-populate flavor based on subcategory name
        const flavorName = primarySubcategory.name;
        setDetails(prev => ({
          ...prev,
          cakeFlavour: prev.cakeFlavour || flavorName
        }));
      }
    }
  }, [primarySubcategoryId, subcategories, details.cakeFlavour]);

  // Auto-populate weight from base_weight or product variations
  useEffect(() => {
    // Flowers: bouquet text is free-form only — never pull from price options
    if (formProfile === 'flowers') return;

    // Only auto-populate if weight is empty or if baseWeight has changed and weight wasn't manually edited
    if (!details.weight || (!isWeightManuallyEdited && baseWeight && baseWeight.trim())) {
      let defaultWeight = '';

      // Priority 1: Use base_weight if available
      if (baseWeight && baseWeight.trim()) {
        if (isCakePricingForm) {
          const numericValue = parseFloat(baseWeight.replace(/[^\d.]/g, ''));
          if (!isNaN(numericValue)) {
            if (hasExplicitMassUnit(baseWeight)) {
              defaultWeight = baseWeight;
            } else {
              if (numericValue >= 10) {
                defaultWeight = `${numericValue} gm`;
              } else {
                defaultWeight = `${numericValue} kg`;
              }
            }
          } else {
            // Cake only: allow non-numeric base labels (e.g. custom text) to flow through
            defaultWeight = baseWeight;
          }
        } else {
          // Non-cake: never copy primary option label into Weight unless it clearly states mass/volume
          // (avoids "Set of", "Set of 3", "Standard", etc. in the weight field)
          if (hasExplicitMassUnit(baseWeight)) {
            defaultWeight = baseWeight;
          }
        }
      } else if (productVariations.length > 0) {
        const vw = productVariations[0].weight;
        if (isCakePricingForm || hasExplicitMassUnit(vw)) {
          defaultWeight = vw;
        }
      }

      if (defaultWeight) {
        setDetails(prev => ({
          ...prev,
          weight: defaultWeight
        }));
      } else if (
        !isCakePricingForm &&
        !isWeightManuallyEdited &&
        baseWeight &&
        baseWeight.trim() &&
        !hasExplicitMassUnit(baseWeight) &&
        details.weight.trim() === baseWeight.trim()
      ) {
        // Drop stale mirror of option label (e.g. "Set of") from Weight after label-only sync was removed
        setDetails(prev => ({ ...prev, weight: '' }));
      }
    }
  }, [baseWeight, productVariations, details.weight, isWeightManuallyEdited, isCakePricingForm, formProfile]);

  // Reset manual edit flag when baseWeight changes
  useEffect(() => {
    if (baseWeight && baseWeight.trim()) {
      setIsWeightManuallyEdited(false);
    }
  }, [baseWeight]);

  // Parse existing description data for edit mode
  useEffect(() => {
    if (value && value.trim() && !isUpdatingRef.current) {
      // Always parse the description when value changes to ensure edit mode works correctly
        
        const lines = value.split('\n');
        let currentOverview = '';
        let currentDetails = { ...details };
        let currentPleaseNote = pleaseNote;
        let inDetails = false;
        let inPleaseNote = false;

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.includes('Product Details:')) {
            inDetails = true;
            inPleaseNote = false;
            continue;
          } else if (trimmedLine.includes('Please Note:')) {
            inDetails = false;
            inPleaseNote = true;
            currentPleaseNote = '';
            continue;
          }
          
          if (inDetails && trimmedLine) {
            // Parse product details
            if (trimmedLine.includes('Cake Flavour:')) {
              currentDetails.cakeFlavour = stripHtmlTags(trimmedLine.replace('Cake Flavour:', '').trim());
            } else if (trimmedLine.includes('Bouquet contents:')) {
              currentDetails.weight = stripHtmlTags(trimmedLine.replace('Bouquet contents:', '').trim());
            } else if (trimmedLine.includes('Weight:')) {
              currentDetails.weight = stripHtmlTags(trimmedLine.replace('Weight:', '').trim());
            } else if (trimmedLine.includes('Servings:')) {
              currentDetails.servings = stripHtmlTags(trimmedLine.replace('Servings:', '').trim());
            } else if (trimmedLine.includes('Shape:')) {
              currentDetails.shape = stripHtmlTags(trimmedLine.replace('Shape:', '').trim());
            } else if (trimmedLine.includes('Version:')) {
              const version = stripHtmlTags(trimmedLine.replace('Version:', '').trim());
              currentDetails.version = version === 'Egg' || version === 'Eggless' ? version : '';
            } else if (trimmedLine.includes('Toppings:')) {
              currentDetails.toppings = stripHtmlTags(trimmedLine.replace('Toppings:', '').trim());
            } else if (trimmedLine.includes('Country of Origin:')) {
              currentDetails.countryOfOrigin = stripHtmlTags(trimmedLine.replace('Country of Origin:', '').trim());
            }
          } else if (inPleaseNote && trimmedLine) {
            // Parse please note
            if (trimmedLine.startsWith('•')) {
              currentPleaseNote += (currentPleaseNote ? '\n' : '') + stripHtmlTags(trimmedLine);
            }
          } else if (!inDetails && !inPleaseNote && trimmedLine) {
            // Parse overview text
            currentOverview += (currentOverview ? ' ' : '') + stripHtmlTags(trimmedLine);
          }
        }

        // Set the parsed data
        if (currentOverview.trim()) {
          setOverviewText(currentOverview.trim());
        }
        
        if (currentDetails.cakeFlavour || currentDetails.weight || currentDetails.servings || currentDetails.toppings) {
          setDetails(currentDetails);
        }
        
        if (currentPleaseNote !== pleaseNote) {
          setPleaseNote(currentPleaseNote);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // details and pleaseNote are intentionally excluded to avoid infinite loops

  const pleaseNoteProfileRef = useRef<ProductFormProfile | undefined>(undefined);
  useEffect(() => {
    if (pleaseNoteProfileRef.current === undefined) {
      pleaseNoteProfileRef.current = formProfile;
      return;
    }
    if (pleaseNoteProfileRef.current !== formProfile) {
      const next = getDefaultPleaseNoteBullets(formProfile);
      setPleaseNote(next);
      setTempPleaseNote(next);
      pleaseNoteProfileRef.current = formProfile;
    }
  }, [formProfile]);

  // Parse initial short description for overview text
  useEffect(() => {
    if (initialShortDescription && initialShortDescription.trim()) {
      setOverviewText(initialShortDescription.trim());
    }
  }, [initialShortDescription]);

  // Auto-calculate servings from weight only for cake pricing or when weight clearly has mass units (avoids flicker / "0 servings" for non-cake labels)
  useEffect(() => {
    if (formProfile === 'flowers') return;
    const w = details.weight?.trim();
    if (!w) return;
    if (!isCakePricingForm && !hasExplicitMassUnit(w)) return;

    const newServings = calculateServingsFromWeight(w);
    setDetails(prev => (prev.servings === newServings ? prev : { ...prev, servings: newServings }));
  }, [details.weight, isCakePricingForm, formProfile]);

  // Expose reset and clean methods to parent component
  useImperativeHandle(ref, () => ({
    reset: () => {
      setOverviewText('');
      setDetails({
        cakeFlavour: '',
        version: '',
        shape: '',
        servings: '',
        toppings: '',
        weight: '',
        countryOfOrigin: ''
      });
      setPleaseNote(getDefaultPleaseNoteBullets(formProfile));
      onChange(''); // Clear the main description value
    },
    clean: () => {
      // Clean up overview text
      setOverviewText(prev => {
        if (prev === '()' || prev.match(/^[()\s]*$/)) {
          return '';
        }
        return prev;
      });
      
      // Clean up details
      setDetails(prev => ({
        ...prev,
        cakeFlavour: prev.cakeFlavour === '()' ? '' : prev.cakeFlavour,
        shape: prev.shape === '()' ? '' : prev.shape,
        servings: prev.servings === '()' ? '' : prev.servings,
        toppings: prev.toppings === '()' ? '' : prev.toppings,
        weight: prev.weight === '()' ? '' : prev.weight,
        countryOfOrigin: prev.countryOfOrigin === '()' ? '' : prev.countryOfOrigin
      }));
      
      // Clean up main description value
      const cleanedDescription = value.replace(/\(\)/g, '').trim();
      onChange(cleanedDescription);
    }
  }), [value, onChange, formProfile]);

  // Helper function to strip HTML tags and template text
  const stripHtmlTags = (text: string): string => {
    let cleaned = text.replace(/<[^>]*>/g, '').trim();
    
    // Remove common template/placeholder text
    const templateTexts = [
      '(Editable per product)',
      '(Editable)',
      '(Template)',
      '(Placeholder)',
      '(To be filled)',
      '(Customize)',
      '(Edit as needed)',
      '(Fill in)',
      '(Enter details)',
      '(Add details)'
    ];
    
    templateTexts.forEach(template => {
      cleaned = cleaned.replace(new RegExp(template, 'gi'), '').trim();
    });
    
    // If the result is just parentheses or empty, return empty string
    if (cleaned === '()' || cleaned === '' || cleaned === '()' || cleaned.match(/^[()\s]*$/)) {
      return '';
    }
    
    return cleaned;
  };


  // Additional cleanup effect to ensure overview text is clean
  useEffect(() => {
    if (overviewText === '()' || overviewText.match(/^[()\s]*$/)) {
      setOverviewText('');
    }
  }, [overviewText]);

  // Generate structured description
  const generateDescription = () => {
    let description = '';
    
    // Add overview
    if (overviewText.trim()) {
      description += overviewText.trim() + '\n\n';
    }
    
    // Add product details
    const hasDetails = Object.values(details).some(val => val && val.trim());
    if (hasDetails) {
      description += 'Product Details:\n';
      if (details.cakeFlavour) description += `Cake Flavour: ${details.cakeFlavour}\n`;
      if (details.version) description += `Version: ${details.version}\n`;
      if (details.shape) description += `Shape: ${details.shape}\n`;
      if (formProfile === 'flowers') {
        if (details.weight) description += `Bouquet contents: ${details.weight}\n`;
        if (details.toppings) description += `Toppings: ${details.toppings}\n`;
      } else {
        if (details.servings) description += `Servings: ${details.servings}\n`;
        if (details.toppings) description += `Toppings: ${details.toppings}\n`;
        if (details.weight) description += `Weight: ${details.weight}\n`;
      }
      if (details.countryOfOrigin) description += `Country of Origin: ${details.countryOfOrigin}\n`;
      description += '\n';
    }
    
    // Add please note
    if (pleaseNote.trim()) {
      description += `Please Note:\n${pleaseNote.trim()}`;
    }
    
    return description.trim();
  };

  // Update parent component when content changes (only when user makes changes)
  useEffect(() => {
    // Only update if we're not in the middle of parsing
    if (!isUpdatingRef.current) {
      const newDescription = generateDescription();
      if (newDescription !== value && newDescription.trim()) {
        isUpdatingRef.current = true;
        onChange(newDescription);
        // Reset the flag in the next tick
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overviewText, details, pleaseNote]); // generateDescription, onChange, and value are intentionally excluded to prevent infinite loops

  // Update product details in parent
  useEffect(() => {
    if (onProductDetailsChange) {
      onProductDetailsChange(details);
    }
  }, [details, onProductDetailsChange]);


  // Sync overview text with short description
  useEffect(() => {
    if (onShortDescriptionChange) {
      onShortDescriptionChange(overviewText);
    }
  }, [overviewText, onShortDescriptionChange]);


  const wordCount = overviewText.trim() === '' ? 0 : overviewText.trim().split(/\s+/).filter(word => word.length > 0).length;
  const maxWords = 50;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDetailChange = (field: keyof ProductDetails, value: string) => {
    setDetails(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Track manual edits for weight field
    if (field === 'weight') {
      setIsWeightManuallyEdited(true);
    }
  };

  const savePleaseNote = () => {
    setPleaseNote(tempPleaseNote);
    setIsEditingPleaseNote(false);
  };

  const cancelPleaseNoteEdit = () => {
    setTempPleaseNote(pleaseNote);
    setIsEditingPleaseNote(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetToTemplate = () => {
    if (onReset) {
      onReset();
    } else {
      setOverviewText('');
      setDetails({
        cakeFlavour: '',
        version: '',
        shape: '',
        servings: '',
        toppings: '',
        weight: '',
        countryOfOrigin: ''
      });
      setPleaseNote(getDefaultPleaseNoteBullets(formProfile));
    }
  };

  // Function to clean up any problematic content
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanUpFields = () => {
    if (onClean) {
      onClean();
    } else {
      // Clean up overview text
      setOverviewText(prev => {
        if (prev === '()' || prev.match(/^[()\s]*$/)) {
          return '';
        }
        return prev;
      });
      
      // Clean up details
      setDetails(prev => ({
        ...prev,
        cakeFlavour: prev.cakeFlavour === '()' ? '' : prev.cakeFlavour,
        shape: prev.shape === '()' ? '' : prev.shape,
        servings: prev.servings === '()' ? '' : prev.servings,
        toppings: prev.toppings === '()' ? '' : prev.toppings,
        weight: prev.weight === '()' ? '' : prev.weight,
        countryOfOrigin: prev.countryOfOrigin === '()' ? '' : prev.countryOfOrigin
      }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePreviewToggle = () => {
    if (onPreviewToggle) {
      onPreviewToggle();
    } else {
      setInternalShowPreview(!internalShowPreview);
    }
  };

  const previewContent = generateDescription();

  return (
    <div className={`space-y-3 ${className}`}>

      {/* Preview Mode */}
      {showPreview && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
            {previewContent || 'No content to preview'}
          </div>
        </div>
      )}

      {/* Block A: Product Overview */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="flex items-center justify-between p-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Product Overview</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Brief description (up to 50 words)</p>
          </div>
          <button
            type="button"
            onClick={() => toggleSection('overview')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all duration-200 hover:scale-110 shadow-sm border border-blue-200 dark:border-blue-700"
            title={expandedSections.overview ? 'Collapse section' : 'Expand section'}
          >
            {expandedSections.overview ? (
              <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
          </button>
        </div>
        
        {expandedSections.overview && (
          <div className="px-3 pb-3">
            <textarea
              value={overviewText}
              onChange={(e) => {
                setOverviewText(e.target.value);
              }}
              placeholder={placeholder}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-amber-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {wordCount} / {maxWords} words
              </div>
              {wordCount > maxWords && (
                <div className="text-xs text-red-500">
                  Exceeds recommended word limit
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Block B: Product Details */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="flex items-center justify-between p-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Product Details</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Structured product specifications</p>
          </div>
          <button
            type="button"
            onClick={() => toggleSection('details')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-200 hover:scale-110 shadow-sm border border-green-200 dark:border-green-700"
            title={expandedSections.details ? 'Collapse section' : 'Expand section'}
          >
            {expandedSections.details ? (
              <ChevronUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-green-600 dark:text-green-400" />
            )}
          </button>
        </div>
        
        {expandedSections.details && (
          <div className="px-3 pb-3 space-y-2">
            {isCakeDetailsLayout ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {flavourFieldLabel}
                      {primarySubcategoryId && subcategories.find(sub =>
                        sub.id === primarySubcategoryId || sub.id === primarySubcategoryId.toString()
                      ) && (
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
                      )}
                    </label>
                    <Input
                      value={details.cakeFlavour}
                      onChange={(e) => handleDetailChange('cakeFlavour', e.target.value)}
                      placeholder={flavourPlaceholder}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Version
                    </label>
                    <select
                      value={details.version}
                      onChange={(e) => handleDetailChange('version', e.target.value)}
                      className={shapeSelectClassName}
                    >
                      <option value="">Select version</option>
                      <option value="Egg">Egg</option>
                      <option value="Eggless">Eggless</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Weight
                      {isCakePricingForm && (baseWeight || productVariations.length > 0) && (
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                          {baseWeight ? '(From base weight)' : '(Auto-filled)'}
                        </span>
                      )}
                      {!isCakePricingForm && (
                        <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                          (Not synced from primary option label unless it includes kg, g, ml, etc.)
                        </span>
                      )}
                    </label>
                    <Input
                      value={details.weight}
                      onChange={(e) => handleDetailChange('weight', e.target.value)}
                      placeholder="e.g., 1 kg, 500g, 2 lbs"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {shapeFieldLabel}
                    </label>
                    <select
                      value={details.shape}
                      onChange={(e) => handleDetailChange('shape', e.target.value)}
                      className={shapeSelectClassName}
                    >
                      <option value="">Select shape</option>
                      {shapeSelectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Servings
                      {details.weight &&
                        (isCakePricingForm || hasExplicitMassUnit(details.weight)) && (
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Auto-calculated)</span>
                      )}
                    </label>
                    <Input
                      value={details.servings}
                      onChange={(e) => handleDetailChange('servings', e.target.value)}
                      placeholder="e.g., 8-10 people, 12 servings"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country of Origin
                    </label>
                    <Input
                      value={details.countryOfOrigin}
                      onChange={(e) => handleDetailChange('countryOfOrigin', e.target.value)}
                      placeholder="e.g., India"
                      className="text-sm"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {shapeFieldLabel}
                    </label>
                    <select
                      value={details.shape}
                      onChange={(e) => handleDetailChange('shape', e.target.value)}
                      className={shapeSelectClassName}
                    >
                      <option value="">
                        {formProfile === 'flowers' ? 'Select arrangement style' : 'Select shape'}
                      </option>
                      {shapeSelectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country of Origin
                    </label>
                    <Input
                      value={details.countryOfOrigin}
                      onChange={(e) => handleDetailChange('countryOfOrigin', e.target.value)}
                      placeholder="e.g., India"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {flavourFieldLabel}
                      {primarySubcategoryId && subcategories.find(sub =>
                        sub.id === primarySubcategoryId || sub.id === primarySubcategoryId.toString()
                      ) && (
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Auto-filled)</span>
                      )}
                    </label>
                    <Input
                      value={details.cakeFlavour}
                      onChange={(e) => handleDetailChange('cakeFlavour', e.target.value)}
                      placeholder={flavourPlaceholder}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {isFlowersProfile ? (
                        <>
                          {flowersBouquetLabel}
                          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                            (stem counts, varieties, wrap, vase — not synced from price options)
                          </span>
                        </>
                      ) : (
                        <>
                          Weight
                          {isCakePricingForm && (baseWeight || productVariations.length > 0) && (
                            <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                              {baseWeight ? '(From base weight)' : '(Auto-filled)'}
                            </span>
                          )}
                          {!isCakePricingForm && (
                            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                              (Not synced from primary option label unless it includes kg, g, ml, etc.)
                            </span>
                          )}
                        </>
                      )}
                    </label>
                    {isFlowersProfile ? (
                      <textarea
                        value={details.weight}
                        onChange={(e) => handleDetailChange('weight', e.target.value)}
                        rows={3}
                        placeholder={flowersBouquetPlaceholder}
                        className={`${shapeSelectClassName} min-h-[4.5rem] resize-y font-sans`}
                      />
                    ) : (
                      <Input
                        value={details.weight}
                        onChange={(e) => handleDetailChange('weight', e.target.value)}
                        placeholder="e.g., 1 kg, 500g, 2 lbs"
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
                {!isFlowersProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={showTreatsEggVersion ? '' : 'md:col-span-2'}>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Servings
                      {details.weight &&
                        (isCakePricingForm || hasExplicitMassUnit(details.weight)) && (
                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(Auto-calculated)</span>
                      )}
                    </label>
                    <Input
                      value={details.servings}
                      onChange={(e) => handleDetailChange('servings', e.target.value)}
                      placeholder="e.g., 8-10 people, 12 servings"
                      className="text-sm"
                    />
                  </div>
                  {showTreatsEggVersion && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Version
                      </label>
                      <select
                        value={details.version}
                        onChange={(e) => handleDetailChange('version', e.target.value)}
                        className={shapeSelectClassName}
                      >
                        <option value="">Select version</option>
                        <option value="Egg">Egg</option>
                        <option value="Eggless">Eggless</option>
                      </select>
                    </div>
                  )}
                </div>
                )}
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {formProfile === 'flowers' ? 'Add-ons (ribbon, foliage, etc.)' : 'Toppings'}
              </label>
              <Input
                value={details.toppings}
                onChange={(e) => handleDetailChange('toppings', e.target.value)}
                placeholder={toppingsPlaceholder}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Static Informational Section */}
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="flex items-center justify-between p-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Please Note</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Standard brand messaging</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditingPleaseNote && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingPleaseNote(true)}
                className="flex items-center gap-1 text-xs"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </Button>
            )}
            <button
              type="button"
              onClick={() => toggleSection('pleaseNote')}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all duration-200 hover:scale-110 shadow-sm border border-purple-200 dark:border-purple-700"
              title={expandedSections.pleaseNote ? 'Collapse section' : 'Expand section'}
            >
              {expandedSections.pleaseNote ? (
                <ChevronUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
            </button>
          </div>
        </div>
        
        {expandedSections.pleaseNote && (
          <div className="px-3 pb-3">
            {isEditingPleaseNote ? (
              <div className="space-y-3">
                <textarea
                  value={tempPleaseNote}
                  onChange={(e) => setTempPleaseNote(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={savePleaseNote}
                    className="flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={cancelPleaseNoteEdit}
                    className="flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {pleaseNote}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      
      <div className="text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: Use the structured fields above to create consistent, searchable product descriptions!
      </div>
    </div>
  );
});

StructuredDescriptionEditor.displayName = 'StructuredDescriptionEditor';

export default StructuredDescriptionEditor;

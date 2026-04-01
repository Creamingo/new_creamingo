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
  /** Flowers-only: comma-separated varieties */
  flowerVariety: string;
  colorTheme: string;
  numberOfStems: string;
  stemsPresentation: string;
  packagingType: string;
  /** Flowers: comma-separated add-on labels */
  addOns: string;
  /** Flowers: comma-separated occasion labels */
  occasionTags: string;
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

/** Arrangement styles for Flowers category (stored under Arrangement Style in description). */
const FLOWER_ARRANGEMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Bouquet', label: 'Bouquet' },
  { value: 'Basket Arrangement', label: 'Basket Arrangement' },
  { value: 'Vase Arrangement', label: 'Vase Arrangement' },
  { value: 'Box Arrangement', label: 'Box Arrangement' },
  { value: 'Hand Bunch', label: 'Hand Bunch' },
  { value: 'Heart Arrangement', label: 'Heart Arrangement' },
  { value: 'Standing Arrangement', label: 'Standing Arrangement' },
];

const FLOWER_VARIETY_OPTIONS: string[] = [
  'Roses',
  'Lilies',
  'Orchids',
  'Carnations',
  'Gerberas',
  'Tulips',
  'Mixed Seasonal Flowers',
];

const FLOWER_COLOR_THEME_OPTIONS: { value: string; label: string }[] = [
  { value: 'Red', label: 'Red' },
  { value: 'Pink', label: 'Pink' },
  { value: 'White', label: 'White' },
  { value: 'Yellow', label: 'Yellow' },
  { value: 'Orange', label: 'Orange' },
  { value: 'Purple', label: 'Purple' },
  { value: 'Mixed', label: 'Mixed' },
];

const FLOWER_PACKAGING_OPTIONS: { value: string; label: string }[] = [
  { value: 'Paper Wrap', label: 'Paper Wrap' },
  { value: 'Premium Wrap', label: 'Premium Wrap' },
  { value: 'Net Wrap', label: 'Net Wrap' },
  { value: 'Box Packaging', label: 'Box Packaging' },
  { value: 'Basket', label: 'Basket' },
  { value: 'Vase', label: 'Vase' },
];

const FLOWER_ADDON_OPTIONS: string[] = [
  'Ribbon',
  'Greeting Card',
  'Foliage',
  'Decorative Wrap',
  'Chocolate',
  'Teddy Bear',
];

const FLOWER_COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: 'India', label: 'India' },
  { value: 'Netherlands', label: 'Netherlands' },
  { value: 'Kenya', label: 'Kenya' },
  { value: 'Thailand', label: 'Thailand' },
  { value: 'Colombia', label: 'Colombia' },
];

const FLOWER_OCCASION_OPTIONS: string[] = [
  'Birthday',
  'Anniversary',
  'Love & Romance',
  'Congratulations',
  'Sympathy',
  'Thank You',
];

const FLOWER_STEM_QUICK_PICKS = [6, 10, 12, 20, 50];

/** Valid arrangement-style values only (no cake shapes). */
const FLOWER_ARRANGEMENT_VALUE_SET = new Set(FLOWER_ARRANGEMENT_OPTIONS.map((o) => o.value));

function toggleCsvItem(csv: string, item: string): string {
  const parts = csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const idx = parts.indexOf(item);
  if (idx >= 0) parts.splice(idx, 1);
  else parts.push(item);
  return parts.join(', ');
}

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
    countryOfOrigin: formProfile === 'flowers' ? '' : 'India',
    flowerVariety: '',
    colorTheme: '',
    numberOfStems: '',
    stemsPresentation: '',
    packagingType: '',
    addOns: '',
    occasionTags: '',
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
  const [flowerAdditionalOpen, setFlowerAdditionalOpen] = useState(false);
  const [flowerVarietyDraft, setFlowerVarietyDraft] = useState('');

  const isCakeDetailsLayout = formProfile === 'cake';
  const showTreatsEggVersion = formProfile === 'treats';
  const isFlowersProfile = formProfile === 'flowers';
  const flavourFieldLabel = productDetailsFlavourLabel(formProfile);
  const shapeFieldLabel = productDetailsShapeLabel(formProfile);
  const flavourPlaceholder = productDetailsFlavourPlaceholder(formProfile);
  const toppingsPlaceholder = productDetailsToppingsPlaceholder(formProfile);
  const shapeSelectOptions = useMemo(() => {
    const base = getShapeOptionsForProfile(formProfile);
    if (formProfile === 'flowers') {
      // Never inject cake-era "Round (saved value)" — only valid florist arrangement labels
      return base;
    }
    const v = details.shape?.trim();
    if (v && !base.some((o) => o.value === v)) {
      return [{ value: v, label: `${v} (saved value)` }, ...base];
    }
    return base;
  }, [formProfile, details.shape]);

  const shapeSelectClassName =
    'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  // Auto-population logic based on primary subcategory and variations (cakes / treats — not flowers)
  useEffect(() => {
    if (formProfile === 'flowers') return;
    if (primarySubcategoryId && subcategories.length > 0 && !details.cakeFlavour) {
      const primarySubcategory = subcategories.find(sub => 
        sub.id === primarySubcategoryId || sub.id === primarySubcategoryId.toString()
      );
      if (primarySubcategory) {
        const flavorName = primarySubcategory.name;
        setDetails(prev => ({
          ...prev,
          cakeFlavour: prev.cakeFlavour || flavorName
        }));
      }
    }
  }, [primarySubcategoryId, subcategories, details.cakeFlavour, formProfile]);

  const wasFlowersProfileRef = useRef(false);

  /** Flowers: defaults & clear cake-shape when user switches category to Flowers */
  useEffect(() => {
    if (formProfile !== 'flowers') {
      wasFlowersProfileRef.current = false;
      return;
    }
    const entering = !wasFlowersProfileRef.current;
    wasFlowersProfileRef.current = true;
    if (!entering) return;
    setDetails((prev) => ({
      ...prev,
      shape: prev.shape?.trim() && FLOWER_ARRANGEMENT_VALUE_SET.has(prev.shape.trim()) ? prev.shape : '',
      colorTheme: prev.colorTheme?.trim() || 'Mixed',
      packagingType: prev.packagingType?.trim() || 'Paper Wrap',
    }));
  }, [formProfile]);

  /** After description parse: strip cake-era Shape values (Round, etc.) from arrangement */
  useEffect(() => {
    if (formProfile !== 'flowers') return;
    setDetails((prev) => {
      const s = prev.shape?.trim();
      if (s && !FLOWER_ARRANGEMENT_VALUE_SET.has(s)) {
        return { ...prev, shape: '' };
      }
      return prev;
    });
  }, [formProfile, value]);

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
        let currentPleaseNote = '';
        let sawPleaseNoteHeader = false;
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
            sawPleaseNoteHeader = true;
            currentPleaseNote = '';
            continue;
          }
          
          if (inDetails && trimmedLine) {
            // Parse product details
            if (trimmedLine.includes('Flower Type / Variety:')) {
              const v = stripHtmlTags(trimmedLine.replace('Flower Type / Variety:', '').trim());
              currentDetails.flowerVariety = v;
              currentDetails.cakeFlavour = currentDetails.cakeFlavour || v;
            } else if (trimmedLine.includes('Arrangement Style:')) {
              currentDetails.shape = stripHtmlTags(trimmedLine.replace('Arrangement Style:', '').trim());
            } else if (trimmedLine.includes('Color Theme:')) {
              currentDetails.colorTheme = stripHtmlTags(trimmedLine.replace('Color Theme:', '').trim());
            } else if (trimmedLine.includes('Number of Stems:')) {
              currentDetails.numberOfStems = stripHtmlTags(trimmedLine.replace('Number of Stems:', '').trim());
            } else if (trimmedLine.includes('Stems, Blooms & Presentation:')) {
              const v = stripHtmlTags(trimmedLine.replace('Stems, Blooms & Presentation:', '').trim());
              currentDetails.stemsPresentation = v;
              currentDetails.weight = currentDetails.weight || v;
            } else if (trimmedLine.includes('Packaging Type:')) {
              currentDetails.packagingType = stripHtmlTags(trimmedLine.replace('Packaging Type:', '').trim());
            } else if (trimmedLine.includes('Add-ons:')) {
              const v = stripHtmlTags(trimmedLine.replace('Add-ons:', '').trim());
              currentDetails.addOns = v;
              currentDetails.toppings = currentDetails.toppings || v;
            } else if (trimmedLine.includes('Occasion Tags:')) {
              currentDetails.occasionTags = stripHtmlTags(trimmedLine.replace('Occasion Tags:', '').trim());
            } else if (trimmedLine.includes('Cake Flavour:')) {
              const v = stripHtmlTags(trimmedLine.replace('Cake Flavour:', '').trim());
              currentDetails.cakeFlavour = v;
              currentDetails.flowerVariety = currentDetails.flowerVariety || v;
            } else if (trimmedLine.includes('Bouquet contents:')) {
              const v = stripHtmlTags(trimmedLine.replace('Bouquet contents:', '').trim());
              currentDetails.stemsPresentation = currentDetails.stemsPresentation || v;
              currentDetails.weight = v;
            } else if (trimmedLine.includes('Weight:')) {
              currentDetails.weight = stripHtmlTags(trimmedLine.replace('Weight:', '').trim());
            } else if (trimmedLine.includes('Servings:')) {
              currentDetails.servings = stripHtmlTags(trimmedLine.replace('Servings:', '').trim());
            } else if (trimmedLine.includes('Shape:')) {
              if (formProfile !== 'flowers') {
                currentDetails.shape = stripHtmlTags(trimmedLine.replace('Shape:', '').trim());
              }
            } else if (trimmedLine.includes('Version:')) {
              const version = stripHtmlTags(trimmedLine.replace('Version:', '').trim());
              currentDetails.version = version === 'Egg' || version === 'Eggless' ? version : '';
            } else if (trimmedLine.includes('Toppings:')) {
              const v = stripHtmlTags(trimmedLine.replace('Toppings:', '').trim());
              currentDetails.toppings = v;
              currentDetails.addOns = currentDetails.addOns || v;
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
        
        if (
          currentDetails.cakeFlavour ||
          currentDetails.weight ||
          currentDetails.servings ||
          currentDetails.toppings ||
          currentDetails.shape ||
          currentDetails.flowerVariety ||
          currentDetails.colorTheme ||
          currentDetails.numberOfStems ||
          currentDetails.stemsPresentation ||
          currentDetails.packagingType ||
          currentDetails.addOns ||
          currentDetails.occasionTags
        ) {
          setDetails((prev) => ({ ...prev, ...currentDetails }));
        }
        
        setPleaseNote((prev) => {
          if (!sawPleaseNoteHeader) return prev;
          return currentPleaseNote === prev ? prev : currentPleaseNote;
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, formProfile]); // details and pleaseNote are intentionally excluded to avoid infinite loops

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
      setFlowerVarietyDraft('');
      setOverviewText('');
      setDetails({
        cakeFlavour: '',
        version: '',
        shape: '',
        servings: '',
        toppings: '',
        weight: '',
        countryOfOrigin: '',
        flowerVariety: '',
        colorTheme: '',
        numberOfStems: '',
        stemsPresentation: '',
        packagingType: '',
        addOns: '',
        occasionTags: ''
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
        countryOfOrigin: prev.countryOfOrigin === '()' ? '' : prev.countryOfOrigin,
        flowerVariety: prev.flowerVariety === '()' ? '' : prev.flowerVariety,
        colorTheme: prev.colorTheme === '()' ? '' : prev.colorTheme,
        numberOfStems: prev.numberOfStems === '()' ? '' : prev.numberOfStems,
        stemsPresentation: prev.stemsPresentation === '()' ? '' : prev.stemsPresentation,
        packagingType: prev.packagingType === '()' ? '' : prev.packagingType,
        addOns: prev.addOns === '()' ? '' : prev.addOns,
        occasionTags: prev.occasionTags === '()' ? '' : prev.occasionTags
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
    
    const hasFlowerDetails =
      formProfile === 'flowers' &&
      [
        details.flowerVariety,
        details.cakeFlavour,
        details.shape,
        details.colorTheme,
        details.numberOfStems,
        details.addOns,
        details.toppings,
        details.packagingType,
        details.countryOfOrigin,
        details.occasionTags
      ].some((val) => val && String(val).trim());

    const hasDetails =
      formProfile === 'flowers'
        ? hasFlowerDetails
        : Object.values(details).some((val) => val && String(val).trim());

    if (hasDetails) {
      description += 'Product Details:\n';
      if (formProfile === 'flowers') {
        const variety = (details.flowerVariety || details.cakeFlavour).trim();
        if (variety) description += `Flower Type / Variety: ${variety}\n`;
        if (details.shape) description += `Arrangement Style: ${details.shape}\n`;
        const colorOut = (details.colorTheme || 'Mixed').trim();
        if (colorOut) description += `Color Theme: ${colorOut}\n`;
        if (details.numberOfStems) description += `Number of Stems: ${details.numberOfStems}\n`;
        const addons = (details.addOns || details.toppings).trim();
        if (addons) description += `Add-ons: ${addons}\n`;
        const packOut = (details.packagingType || 'Paper Wrap').trim();
        if (packOut) description += `Packaging Type: ${packOut}\n`;
        const occasions = (details.occasionTags || '').trim();
        if (occasions) description += `Occasion Tags: ${occasions}\n`;
        if (details.countryOfOrigin?.trim()) description += `Country of Origin: ${details.countryOfOrigin.trim()}\n`;
      } else {
        if (details.cakeFlavour) description += `Cake Flavour: ${details.cakeFlavour}\n`;
        if (details.version) description += `Version: ${details.version}\n`;
        if (details.shape) description += `Shape: ${details.shape}\n`;
        if (details.servings) description += `Servings: ${details.servings}\n`;
        if (details.toppings) description += `Toppings: ${details.toppings}\n`;
        if (details.weight) description += `Weight: ${details.weight}\n`;
        if (details.countryOfOrigin) description += `Country of Origin: ${details.countryOfOrigin}\n`;
      }
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
  const maxWords = isFlowersProfile ? 80 : 50;

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

  const appendFlowerVarietyToken = (raw: string) => {
    const s = raw.trim();
    if (!s) return;
    setDetails((prev) => {
      const tokens = prev.flowerVariety.split(',').map((x) => x.trim()).filter(Boolean);
      if (tokens.includes(s)) return prev;
      return { ...prev, flowerVariety: [...tokens, s].join(', ') };
    });
  };

  const removeFlowerVarietyToken = (tag: string) => {
    setDetails((prev) => {
      const tokens = prev.flowerVariety.split(',').map((x) => x.trim()).filter(Boolean);
      return { ...prev, flowerVariety: tokens.filter((t) => t !== tag).join(', ') };
    });
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
      setFlowerVarietyDraft('');
      setOverviewText('');
      setDetails({
        cakeFlavour: '',
        version: '',
        shape: '',
        servings: '',
        toppings: '',
        weight: '',
        countryOfOrigin: '',
        flowerVariety: '',
        colorTheme: '',
        numberOfStems: '',
        stemsPresentation: '',
        packagingType: '',
        addOns: '',
        occasionTags: ''
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
        countryOfOrigin: prev.countryOfOrigin === '()' ? '' : prev.countryOfOrigin,
        flowerVariety: prev.flowerVariety === '()' ? '' : prev.flowerVariety,
        colorTheme: prev.colorTheme === '()' ? '' : prev.colorTheme,
        numberOfStems: prev.numberOfStems === '()' ? '' : prev.numberOfStems,
        stemsPresentation: prev.stemsPresentation === '()' ? '' : prev.stemsPresentation,
        packagingType: prev.packagingType === '()' ? '' : prev.packagingType,
        addOns: prev.addOns === '()' ? '' : prev.addOns,
        occasionTags: prev.occasionTags === '()' ? '' : prev.occasionTags
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isFlowersProfile ? 'Short intro for shoppers (up to 80 words)' : 'Brief description (up to 50 words)'}
            </p>
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
            ) : isFlowersProfile ? (
              <div className="space-y-7">
                <p className="text-xs text-emerald-800 dark:text-emerald-200/90 rounded-md bg-emerald-50 dark:bg-emerald-900/25 px-2.5 py-2 border border-emerald-200/70 dark:border-emerald-800/50">
                  <span className="font-medium">Flowers category:</span> use only the fields below. Cake-style fields (cake flavour, weight in kg, servings, cake shape) are not shown here.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                        Arrangement style
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/35 px-1.5 py-0.5 rounded">Required</span>
                    </div>
                    <select
                      value={details.shape}
                      onChange={(e) => handleDetailChange('shape', e.target.value)}
                      className={shapeSelectClassName}
                    >
                      <option value="">Select arrangement style</option>
                      {shapeSelectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Color theme
                    </label>
                    <select
                      value={details.colorTheme || 'Mixed'}
                      onChange={(e) => handleDetailChange('colorTheme', e.target.value)}
                      className={shapeSelectClassName}
                    >
                      {FLOWER_COLOR_THEME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                      Flower type / variety
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/35 px-1.5 py-0.5 rounded">Required</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    Tap a suggestion to add; type in the box and press Enter or comma to add more. Remove with ✕ on each tag.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FLOWER_VARIETY_OPTIONS.map((opt) => {
                      const selected = details.flowerVariety
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            handleDetailChange('flowerVariety', toggleCsvItem(details.flowerVariety, opt))
                          }
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            selected
                              ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-100'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className={`flex flex-wrap items-center gap-1.5 min-h-[44px] px-2.5 py-2 rounded-xl border bg-white/90 dark:bg-gray-800/90 transition-all duration-200 backdrop-blur-sm focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20 dark:focus-within:border-rose-500 ${
                      details.flowerVariety.trim() || flowerVarietyDraft
                        ? 'border-rose-200 dark:border-rose-800/60'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {details.flowerVariety
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <span
                          key={`${tag}-${idx}`}
                          className="inline-flex items-center gap-0.5 pl-2 pr-1 py-0.5 text-xs rounded-md bg-rose-50 dark:bg-rose-900/35 border border-rose-200/90 dark:border-rose-700/50 text-rose-900 dark:text-rose-100"
                        >
                          <span className="max-w-[200px] truncate">{tag}</span>
                          <button
                            type="button"
                            className="p-0.5 rounded hover:bg-rose-200/80 dark:hover:bg-rose-800/50 text-rose-700 dark:text-rose-200"
                            aria-label={`Remove ${tag}`}
                            onClick={() => removeFlowerVarietyToken(tag)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    <input
                      type="text"
                      className="flex-1 min-w-[10rem] text-sm py-1 px-0.5 border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-amber-400/90 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0"
                      placeholder="Type and select flowers (e.g., Roses, Lilies)"
                      value={flowerVarietyDraft}
                      onChange={(e) => setFlowerVarietyDraft(e.target.value)}
                      onBlur={() => {
                        if (flowerVarietyDraft.trim()) {
                          appendFlowerVarietyToken(flowerVarietyDraft);
                          setFlowerVarietyDraft('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          if (flowerVarietyDraft.trim()) {
                            appendFlowerVarietyToken(flowerVarietyDraft);
                            setFlowerVarietyDraft('');
                          }
                        } else if (e.key === 'Backspace' && !flowerVarietyDraft) {
                          const tokens = details.flowerVariety
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          if (tokens.length > 0) {
                            removeFlowerVarietyToken(tokens[tokens.length - 1]);
                          }
                        }
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (text.includes(',') || text.includes(';') || text.includes('\n')) {
                          e.preventDefault();
                          text
                            .split(/[,;\n]+/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .forEach((t) => appendFlowerVarietyToken(t));
                          setFlowerVarietyDraft('');
                        }
                      }}
                      aria-label="Add flower types"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 items-start">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                        Number of stems
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/35 px-1.5 py-0.5 rounded">Required</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Digits only — use quick picks for common counts.</p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={details.numberOfStems}
                      onChange={(e) =>
                        handleDetailChange('numberOfStems', e.target.value.replace(/\D/g, ''))
                      }
                      placeholder="e.g. 10"
                      className="text-sm border-rose-200/90 dark:border-rose-800/50 focus:border-rose-400 focus:ring-rose-400/20"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 self-center mr-1">Quick:</span>
                      {FLOWER_STEM_QUICK_PICKS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleDetailChange('numberOfStems', String(n))}
                          className="px-2 py-0.5 text-xs rounded-md border border-rose-200/70 dark:border-rose-800/50 text-gray-700 dark:text-gray-300 hover:bg-rose-50 dark:hover:bg-rose-900/40"
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 md:pt-[1.875rem]">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Packaging type
                    </label>
                    <select
                      value={details.packagingType || 'Paper Wrap'}
                      onChange={(e) => handleDetailChange('packagingType', e.target.value)}
                      className={shapeSelectClassName}
                    >
                      {FLOWER_PACKAGING_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Add-ons
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {FLOWER_ADDON_OPTIONS.map((opt) => {
                      const selected = details.addOns
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            handleDetailChange('addOns', toggleCsvItem(details.addOns, opt))
                          }
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            selected
                              ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-100'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Occasion tags
                    <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">(optional — homepage &amp; discovery)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {FLOWER_OCCASION_OPTIONS.map((opt) => {
                      const selected = details.occasionTags
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            handleDetailChange('occasionTags', toggleCsvItem(details.occasionTags, opt))
                          }
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            selected
                              ? 'bg-violet-100 dark:bg-violet-900/40 border-violet-400 dark:border-violet-600 text-violet-900 dark:text-violet-100'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFlowerAdditionalOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/50 hover:bg-gray-100/80 dark:hover:bg-gray-700/50"
                  >
                    Additional information (optional)
                    {flowerAdditionalOpen ? (
                      <ChevronUp className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  {flowerAdditionalOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-200 dark:border-gray-600">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Country of origin
                      </label>
                      <Input
                        list="flower-country-suggestions"
                        value={details.countryOfOrigin}
                        onChange={(e) => handleDetailChange('countryOfOrigin', e.target.value)}
                        placeholder="Optional — e.g. Netherlands"
                        className="text-sm"
                      />
                      <datalist id="flower-country-suggestions">
                        {FLOWER_COUNTRY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </div>
              </div>
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
                      <option value="">Select shape</option>
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
                </div>
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Toppings
                  </label>
                  <Input
                    value={details.toppings}
                    onChange={(e) => handleDetailChange('toppings', e.target.value)}
                    placeholder={toppingsPlaceholder}
                    className="text-sm"
                  />
                </div>
              </>
            )}
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

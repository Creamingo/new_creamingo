'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const ProductCustomization = ({ 
  product, 
  selectedVariant, 
  customizations, 
  onVariantChange, 
  onCustomizationChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get available options from product attributes
  const getAvailableOptions = (attributeType) => {
    if (!product.attributes || !product.attributes[attributeType]) {
      return [];
    }
    return product.attributes[attributeType].sort((a, b) => a.displayOrder - b.displayOrder);
  };

  const flavors = getAvailableOptions('flavor');
  const shapes = getAvailableOptions('shape');
  const occasions = getAvailableOptions('occasion');

  // Set default values on component mount
  useEffect(() => {
    const defaultCustomizations = {};
    
    if (flavors.length > 0 && !customizations.flavor) {
      const defaultFlavor = flavors.find(f => f.isDefault) || flavors[0];
      defaultCustomizations.flavor = defaultFlavor.value;
    }
    
    if (shapes.length > 0 && !customizations.shape) {
      const defaultShape = shapes.find(s => s.isDefault) || shapes[0];
      defaultCustomizations.shape = defaultShape.value;
    }
    
    if (Object.keys(defaultCustomizations).length > 0) {
      onCustomizationChange(defaultCustomizations);
    }
  }, [flavors, shapes, customizations, onCustomizationChange]);

  const handleFlavorChange = (flavor) => {
    onCustomizationChange({ flavor });
  };

  const handleShapeChange = (shape) => {
    onCustomizationChange({ shape });
  };

  const handleEgglessToggle = () => {
    onCustomizationChange({ isEggless: !customizations.isEggless });
  };

  const handleMessageChange = (e) => {
    onCustomizationChange({ message: e.target.value });
  };

  const renderOptionSelector = (title, options, selectedValue, onChange, type = 'radio') => {
    if (!options || options.length === 0) return null;

    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">{title}</label>
        <div className="flex flex-wrap gap-2">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => onChange(option.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedValue === option.value
                  ? 'border-rose-500 bg-rose-50 text-rose-700'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {option.value}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const hasCustomizations = flavors.length > 0 || shapes.length > 0 || product.is_eggless || occasions.length > 0;

  if (!hasCustomizations) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Customize Your Cake</h3>
          <p className="text-sm text-gray-500">Personalize your order</p>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isExpanded && (
        <div className="p-4 space-y-6 border-t border-gray-200">
          {/* Weight/Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Weight</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => onVariantChange(variant)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      selectedVariant?.id === variant.id
                        ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{variant.weight}</div>
                        <div className="text-sm text-gray-500">
                          {variant.name || 'Standard'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          ₹{variant.discount_percent > 0 ? variant.discounted_price : variant.price}
                        </div>
                        {variant.discount_percent > 0 && (
                          <div className="text-sm text-gray-500 line-through">
                            ₹{variant.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Flavor Selection */}
          {renderOptionSelector(
            'Flavor',
            flavors,
            customizations.flavor,
            handleFlavorChange
          )}

          {/* Shape Selection */}
          {renderOptionSelector(
            'Shape',
            shapes,
            customizations.shape,
            handleShapeChange
          )}

          {/* Eggless Option */}
          {product.is_eggless && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Dietary Options</label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customizations.isEggless}
                  onChange={handleEgglessToggle}
                  className="w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                />
                <span className="text-sm text-gray-700">Make it Eggless (+₹50)</span>
              </label>
            </div>
          )}

          {/* Message on Cake */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Message on Cake (Optional)
            </label>
            <textarea
              value={customizations.message}
              onChange={handleMessageChange}
              placeholder="e.g., Happy Birthday Anya!"
              maxLength={50}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none"
              rows={2}
            />
            <div className="text-xs text-gray-500 text-right">
              {customizations.message.length}/50 characters
            </div>
          </div>

          {/* Summary of Selections */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Your Selection:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {selectedVariant && (
                <div>Weight: {selectedVariant.weight}</div>
              )}
              {customizations.flavor && (
                <div>Flavor: {customizations.flavor}</div>
              )}
              {customizations.shape && (
                <div>Shape: {customizations.shape}</div>
              )}
              {customizations.isEggless && (
                <div>Dietary: Eggless</div>
              )}
              {customizations.message && (
                <div>Message: "{customizations.message}"</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCustomization;

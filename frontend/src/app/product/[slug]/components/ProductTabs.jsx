'use client';

import { useState } from 'react';
import { 
  Info,
  Shield,
  Truck,
  Thermometer,
  Clock,
  AlertTriangle,
  Package,
  Calendar,
  MapPin,
  Cake,
  Circle,
  Layers,
  Users,
  Sparkles,
  Globe
} from 'lucide-react';

const ProductTabs = ({ product, selectedVariant, customizations = {}, dynamicContent = null, selectedTier = null }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Helper function to parse product details from description
  const parseProductDetails = () => {
    const details = {};
    
    let description = dynamicContent ? dynamicContent.description : product.description;
    
    // Add tier information to description if not already present
    if (selectedTier && !description.includes('Cake Tiers:')) {
      description += `\nCake Tiers: ${selectedTier}`;
    }
    
    if (description) {
      const lines = description.split('\n');
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        // Parse Cake Flavour
        if (trimmedLine.includes('Cake Flavour:')) {
          details.cakeFlavour = trimmedLine.replace('Cake Flavour:', '').trim();
        }
        // Parse Version
        else if (trimmedLine.includes('Version:')) {
          details.version = trimmedLine.replace('Version:', '').trim();
        }
        // Parse Cake Tiers
        else if (trimmedLine.includes('Cake Tiers:')) {
          details.cakeTiers = trimmedLine.replace('Cake Tiers:', '').trim();
        }
        // Parse Shape
        else if (trimmedLine.includes('Shape:')) {
          details.shape = trimmedLine.replace('Shape:', '').trim();
        }
        // Parse Servings
        else if (trimmedLine.includes('Servings:')) {
          details.servings = trimmedLine.replace('Servings:', '').trim();
        }
        // Parse Weight
        else if (trimmedLine.includes('Weight:')) {
          details.weight = trimmedLine.replace('Weight:', '').trim();
        }
        // Parse Toppings
        else if (trimmedLine.includes('Toppings:')) {
          details.toppings = trimmedLine.replace('Toppings:', '').trim();
        }
        // Parse Country of Origin
        else if (trimmedLine.includes('Country of Origin:')) {
          details.countryOfOrigin = trimmedLine.replace('Country of Origin:', '').trim();
        }
      });
    }
    
    return details;
  };

  // Get dynamic product details based on current selections
  const getDynamicProductDetails = () => {
    const parsedDetails = parseProductDetails();
    
    return {
      cakeFlavour: customizations.flavor || parsedDetails.cakeFlavour || 'Chocolate',
      version: customizations.isEggless ? 'Eggless' : (parsedDetails.version || 'Egg'),
      shape: customizations.shape || parsedDetails.shape || product.shape || 'Round',
      servings: selectedVariant ? 
        (selectedVariant.weight ? 
          (() => {
            const weight = selectedVariant.weight.toLowerCase();
            const kgMatch = weight.match(/([0-9]*\.?[0-9]+)\s*(kg|kilogram)/);
            const gmMatch = weight.match(/([0-9]*\.?[0-9]+)\s*(g|gm|gram)/);
            let kg = 0;
            
            if (kgMatch) {
              kg = parseFloat(kgMatch[1]);
            } else if (gmMatch) {
              kg = parseFloat(gmMatch[1]) / 1000;
            }
            
            if (kg > 0) {
              if (kg <= 0.5) return '4–6 servings';
              if (kg <= 0.75) return '6–8 servings';
              if (kg <= 1.0) return '8–10 servings';
              if (kg <= 1.5) return '12–15 servings';
              if (kg <= 2.0) return '16–20 servings';
              if (kg <= 2.5) return '20–25 servings';
              if (kg <= 3.0) return '24–30 servings';
              return `${Math.round(kg * 8)}–${Math.round(kg * 10)} servings`;
            }
            return parsedDetails.servings || '6–8 servings';
          })() :
          parsedDetails.servings || '6–8 servings') :
        (parsedDetails.servings || product.serving_size || '6–8 servings'),
      weight: selectedVariant ? selectedVariant.weight : (parsedDetails.weight || product.base_weight || '1kg'),
      toppings: parsedDetails.toppings || 'Fresh cream and decorations',
      countryOfOrigin: parsedDetails.countryOfOrigin || product.country_of_origin || 'India'
    };
  };

  const dynamicDetails = getDynamicProductDetails();

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Info,
      content: (
        <div className="space-y-3">
          {/* Short Description */}
          {product.short_description && (
            <div className="mb-3">
              <div 
                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            </div>
          )}
          
          {/* Dynamic Product Details - Row Layout for Desktop */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Product Details</h4>
            <div className="bg-gray-50/50 dark:bg-gray-700/30 border border-rose-200/30 dark:border-rose-800/30 rounded-lg p-3 sm:p-4 lg:p-4">
              {/* Mobile: Grid Layout with Icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 lg:hidden">
                <div className="flex items-center gap-2">
                  <Cake className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Cake Flavour</span>
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{dynamicDetails.cakeFlavour}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Version</span>
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{dynamicDetails.version}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Shape</span>
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{dynamicDetails.shape}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Cake Tiers</span>
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{dynamicDetails.cakeTiers || selectedTier || 'Not selected'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Servings</span>
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{dynamicDetails.servings}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Weight</span>
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{dynamicDetails.weight}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Toppings</span>
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 leading-relaxed break-words">{dynamicDetails.toppings}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Globe className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Country of Origin</span>
                    <span className="text-gray-400 dark:text-gray-500">-</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{dynamicDetails.countryOfOrigin}</span>
                  </div>
                </div>
              </div>

              {/* Desktop: Row Layout with Icons */}
              <div className="hidden lg:block space-y-2.5">
                <div className="flex items-center gap-3 py-1.5">
                  <Cake className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cake Flavour</span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dynamicDetails.cakeFlavour}</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <Circle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Version</span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dynamicDetails.version}</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <Circle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Shape</span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dynamicDetails.shape}</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <Layers className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cake Tiers</span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dynamicDetails.cakeTiers || selectedTier || 'Not selected'}</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <Users className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Servings</span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dynamicDetails.servings}</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <Package className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Weight</span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dynamicDetails.weight}</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Toppings</span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dynamicDetails.toppings}</span>
                </div>
                <div className="flex items-center gap-3 py-1.5">
                  <Globe className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Country of Origin</span>
                  <span className="text-gray-400 dark:text-gray-500">-</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dynamicDetails.countryOfOrigin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features - Compact Horizontal Scroll on Mobile */}
          <div className="space-y-2.5">
            <h4 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">Key Features</h4>
            <div className="flex sm:grid sm:grid-cols-2 gap-2 overflow-x-auto sm:overflow-x-visible pb-1.5 sm:pb-0">
              <div className="flex items-center space-x-2 p-2 bg-green-50/70 dark:bg-green-900/15 rounded-lg border border-green-200/50 dark:border-green-800/30 flex-shrink-0 sm:flex-shrink">
                <div className="w-5 h-5 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-[10px] font-semibold">✓</span>
                </div>
                <span className="text-[11px] font-medium text-green-800 dark:text-green-300 whitespace-nowrap">Freshly Baked</span>
              </div>
              
              <div className="flex items-center space-x-2 p-2 bg-purple-50/70 dark:bg-purple-900/15 rounded-lg border border-purple-200/50 dark:border-purple-800/30 flex-shrink-0 sm:flex-shrink">
                <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 text-[10px] font-semibold">✓</span>
            </div>
                <span className="text-[11px] font-medium text-purple-800 dark:text-purple-300 whitespace-nowrap">Premium Quality</span>
              </div>
              
              <div className="flex items-center space-x-2 p-2 bg-orange-50/70 dark:bg-orange-900/15 rounded-lg border border-orange-200/50 dark:border-orange-800/30 flex-shrink-0 sm:flex-shrink">
                <div className="w-5 h-5 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 text-[10px] font-semibold">✓</span>
            </div>
                <span className="text-[11px] font-medium text-orange-800 dark:text-orange-300 whitespace-nowrap">Handcrafted</span>
            </div>
            
              <div className="flex items-center space-x-2 p-2 bg-rose-50/70 dark:bg-rose-900/15 rounded-lg border border-rose-200/50 dark:border-rose-800/30 flex-shrink-0 sm:flex-shrink">
                <div className="w-5 h-5 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center">
                  <span className="text-rose-600 dark:text-rose-400 text-[10px] font-semibold">✓</span>
              </div>
                <span className="text-[11px] font-medium text-rose-800 dark:text-rose-300 whitespace-nowrap">Made with Love</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'care',
      label: 'Care & Storage',
      icon: Shield,
      content: (
        <div className="space-y-3">
          {/* Important Storage Instructions */}
          <div className="p-3 bg-yellow-50/70 dark:bg-yellow-900/15 border border-yellow-200/50 dark:border-yellow-800/30 rounded-lg">
            <h4 className="text-base font-semibold text-yellow-900 dark:text-yellow-300 mb-3">Important Storage Instructions</h4>
            
            <div className="space-y-2.5 text-yellow-800 dark:text-yellow-200 text-sm leading-relaxed">
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-700 dark:text-yellow-300 text-[10px] font-semibold">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <Shield className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-300" />
                    <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-xs">Refrigerate Immediately</p>
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-300 text-xs">Store cream cakes in a refrigerator. Fondant cakes should be kept in an air-conditioned environment.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-700 dark:text-yellow-300 text-[10px] font-semibold">2</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <Thermometer className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-300" />
                    <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-xs">Temperature Control</p>
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-300 text-xs">Slice and serve the cake at room temperature. Keep away from direct heat.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-700 dark:text-yellow-300 text-[10px] font-semibold">3</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-300" />
                    <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-xs">Consumption Time</p>
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-300 text-xs">Consume the cake within 24 hours for best taste and freshness.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-yellow-200 dark:bg-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-700 dark:text-yellow-300 text-[10px] font-semibold">4</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-300" />
                    <p className="font-semibold text-yellow-900 dark:text-yellow-200 text-xs">Safety Notice</p>
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-300 text-xs">Some decorations may contain wires, toothpicks, or skewers - please check before serving to children.</p>
                </div>
              </div>
              
              <div className="mt-2.5 pt-2.5 border-t border-yellow-300/50 dark:border-yellow-700/50">
                <p className="text-yellow-800 dark:text-yellow-300 text-xs font-medium text-center">
                  Enjoy your Creamingo cake! 🎂
                </p>
              </div>
            </div>
          </div>

          {/* General Care Tips */}
          <div className="p-3 bg-gray-50/50 dark:bg-gray-700/30 border border-rose-200/30 dark:border-rose-800/30 rounded-lg">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2.5">General Care Tips</h4>
            <div className="space-y-2 text-gray-700 dark:text-gray-300 text-xs leading-relaxed">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-gray-700 dark:text-gray-300">Handle with care to maintain shape and decoration integrity</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-gray-700 dark:text-gray-300">Keep away from direct sunlight and heat sources</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-gray-700 dark:text-gray-300">Store in original packaging when possible to maintain freshness</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-gray-700 dark:text-gray-300">Use a serrated knife to cut fondant cakes for clean slices</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-rose-500 dark:bg-rose-400 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-gray-700 dark:text-gray-300">Check for any damage before consumption and enjoy your Creamingo cake! 🎂</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'delivery',
      label: 'Delivery Info',
      icon: Truck,
      content: (
        <div className="space-y-3">
          {/* Delivery Guidelines */}
          <div className="p-3 bg-green-50/70 dark:bg-green-900/15 border border-green-200/50 dark:border-green-800/30 rounded-lg">
            <h4 className="text-base font-semibold text-green-900 dark:text-green-300 mb-3">Delivery Guidelines</h4>
            
            <div className="space-y-2.5 text-green-800 dark:text-green-200 text-sm leading-relaxed">
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 dark:text-green-300 text-[10px] font-semibold">1</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <Package className="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
                    <p className="font-semibold text-green-900 dark:text-green-200 text-xs">Packaging</p>
                  </div>
                  <p className="text-green-800 dark:text-green-300 text-xs">Creamingo hand-deliver your cake in a high-quality cardboard box</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 dark:text-green-300 text-[10px] font-semibold">2</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <Package className="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
                    <p className="font-semibold text-green-900 dark:text-green-200 text-xs">Complimentary Items</p>
                  </div>
                  <p className="text-green-800 dark:text-green-300 text-xs">Tags and knives are complimentary but will be provided subject to availability</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 dark:text-green-300 text-[10px] font-semibold">3</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
                    <p className="font-semibold text-green-900 dark:text-green-200 text-xs">Delivery Timing</p>
                  </div>
                  <p className="text-green-800 dark:text-green-300 text-xs">Delivery time is an estimate and may vary depending on product availability and your location</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 dark:text-green-300 text-[10px] font-semibold">4</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
                    <p className="font-semibold text-green-900 dark:text-green-200 text-xs">Perishable Items</p>
                  </div>
                  <p className="text-green-800 dark:text-green-300 text-xs">As cakes are perishable items, delivery will be attempted only once</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2.5">
                <div className="w-5 h-5 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-700 dark:text-green-300 text-[10px] font-semibold">5</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-green-700 dark:text-green-300" />
                    <p className="font-semibold text-green-900 dark:text-green-200 text-xs">Address Changes</p>
                  </div>
                  <p className="text-green-800 dark:text-green-300 text-xs">Delivery cannot be redirected to another address once the order is placed</p>
                </div>
              </div>
              
              <div className="mt-2.5 pt-2.5 border-t border-green-300/50 dark:border-green-700/50">
                <p className="text-green-800 dark:text-green-300 text-xs font-medium text-center">
                  We are always eager to serve you better! ⭐
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Options */}
            <div className="space-y-3">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Delivery Options</h4>
            <div className="space-y-2.5">
               <div className="flex items-center space-x-2.5 p-2.5 bg-blue-50/70 dark:bg-blue-900/15 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
                 <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                   <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">⚡</span>
                 </div>
                 <div className="min-w-0 flex-1">
                   <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">Same Day Delivery</p>
                   <p className="text-[10px] text-blue-700 dark:text-blue-400">Choose from available time slots today</p>
                 </div>
               </div>
              
              <div className="flex items-center space-x-2.5 p-2.5 bg-purple-50/70 dark:bg-purple-900/15 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
                <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-purple-900 dark:text-purple-300">Scheduled Delivery</p>
                  <p className="text-[10px] text-purple-700 dark:text-purple-400">Book in advance for specific dates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-xl dark:shadow-black/20 border border-gray-200 dark:border-gray-700">
      {/* Tab Headers */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 lg:flex-none lg:w-1/3 ${
                  isActive
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span>{tab.label}</span>
                {/* Animated Underline */}
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 dark:bg-rose-400 transition-all duration-200 ${
                    isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-800">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default ProductTabs;

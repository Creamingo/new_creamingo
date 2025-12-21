'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const ProductBreadcrumb = ({ product }) => {
  if (!product) return null;

  // Category name to slug mapping (based on backend mapping)
  const categoryNameToSlugMap = {
    'Cakes for Any Occasion': 'cakes-for-occasion',
    'Cakes by Flavor': 'cakes-by-flavor',
    'Pick a Cake by Flavor': 'cakes-by-flavor', // Alternative name mapping
    'Kid\'s Cake Collection': 'kids-cake-collection',
    'Crowd-Favorite Cakes': 'crowd-favorite-cakes',
    'Love & Relationship Cakes': 'love-relationship-cakes',
    'Cakes for Every Milestone Year': 'milestone-year-cakes',
    'Small Treats & Desserts': 'small-treats-desserts',
    'Flowers': 'flowers',
    'Sweets & Dry Fruits': 'sweets-dry-fruits'
  };

  // Subcategory name to slug mapping (based on backend mapping)
  const subcategoryNameToSlugMap = {
    // Cakes for Any Occasion subcategories
    'Birthday': 'birthday',
    'Anniversary': 'anniversary',
    'Engagement': 'engagement',
    'Wedding': 'wedding',
    'New Beginning': 'new-beginning',
    'No Reason Cake': 'no-reason-cake',
    // Cakes by Flavor subcategories
    'Chocolate': 'chocolate',
    'Choco Truffle': 'choco-truffle',
    'Red Velvet': 'red-velvet',
    'Black Forest': 'black-forest',
    'Pineapple': 'pineapple',
    'Butterscotch': 'butterscotch',
    'Vanilla': 'vanilla',
    'Mixed Fruit': 'mixed-fruit',
    'Mixed Fruits': 'mixed-fruits',
    'Strawberry': 'strawberry',
    'Blueberry': 'blueberry',
    // Kid's Cake Collection subcategories
    'Barbie Doll': 'barbie-doll',
    'Cartoon Cakes': 'cartoon-cakes',
    'Designer Cakes': 'designer-cakes',
    'Number Cakes': 'number-cakes',
    'Super Hero Cakes': 'super-hero-cakes',
    // Crowd-Favorite Cakes subcategories
    'Fondant Cakes': 'fondant-cakes',
    'Multi Tier': 'multi-tier',
    'Photo Cakes': 'photo-cakes',
    'Pinata Cakes': 'pinata-cakes',
    'Unicorn Cakes': 'unicorn-cakes',
    // Love and Relationship Cakes subcategories
    'Cake for Brother': 'cake-for-brother',
    'Cake for Father': 'cake-for-father',
    'Cake for Her': 'cake-for-her',
    'Cake for Him': 'cake-for-him',
    'Cake for Mother': 'cake-for-mother',
    'Cake for Sister': 'cake-for-sister',
    // Cakes for Every Milestone Year subcategories
    '1 Year': '1-year',
    'Half Year': 'half-year',
    '5 Year': '5-year',
    '5 Years': '5-years',
    '10 Year': '10-year',
    '10 Years': '10-years',
    '25 Year': '25-year',
    '25 Years': '25-years',
    '50 Year': '50-year',
    '50 Years': '50-years',
    // Flowers subcategories
    'All Flowers Combos': 'all-flowers-combos',
    'Bridal Bouquet': 'bridal-bouquet',
    'Rose Bouquet': 'rose-bouquet',
    'Mixed Flower Bouquet': 'mixed-flower-bouquet',
    // Sweets and Dry Fruits subcategories
    'Chocolates and Combos': 'chocolates-and-combos',
    'Sweets and Combos': 'sweets-and-combos',
    'Dry Fruits and Combos': 'dry-fruits-and-combos',
    // Small Treats Desserts subcategories
    'Pastries': 'pastries',
    'Cupcakes': 'cupcakes',
    'Cookies': 'cookies',
    'Brownies': 'brownies'
  };

  // Generate category and subcategory slugs
  const categorySlug = product.category_name ? 
    (categoryNameToSlugMap[product.category_name] || product.category_name.toLowerCase().replace(/\s+/g, '-')) : null;
  const subcategorySlug = product.subcategory_name ? 
    (subcategoryNameToSlugMap[product.subcategory_name] || product.subcategory_name.toLowerCase().replace(/\s+/g, '-')) : null;

  const breadcrumbItems = [
    {
      label: 'Home',
      href: '/',
      icon: <Home className="w-4 h-4" />
    }
  ];

  // Add category if available
  if (categorySlug && product.category_name) {
    breadcrumbItems.push({
      label: product.category_name,
      href: `/category/${categorySlug}`,
      icon: null
    });
  }

  // Add subcategory if available
  if (subcategorySlug && product.subcategory_name) {
    breadcrumbItems.push({
      label: product.subcategory_name,
      href: `/category/${categorySlug}/${subcategorySlug}`,
      icon: null
    });
  }

  // Add current product (not clickable)
  breadcrumbItems.push({
    label: product.name,
    href: null,
    icon: null,
    isCurrent: true
  });

  return (
    <nav className="flex items-center space-x-1 sm:space-x-2 text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0 mb-0 sm:mt-0.5 sm:mb-2 px-0 py-0 sm:py-0.5" aria-label="Breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1 sm:space-x-2">
          {index > 0 && (
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
          
          {item.href ? (
            <Link 
              href={item.href}
              className="flex items-center space-x-1 hover:text-[#8B4513] dark:hover:text-amber-400 transition-colors duration-200 group"
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="truncate max-w-[120px] sm:max-w-[200px] group-hover:underline">
                {item.label}
              </span>
            </Link>
          ) : (
            <span 
              className={`flex items-center space-x-1 ${
                item.isCurrent 
                  ? 'text-[#8B4513] dark:text-amber-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="truncate max-w-[120px] sm:max-w-[200px]">
                {item.label}
              </span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default ProductBreadcrumb;

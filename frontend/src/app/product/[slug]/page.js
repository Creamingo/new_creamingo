'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Head from 'next/head';
import productApi from '../../../api/productApi';
import Header from '../../../components/Header';
import LocationBar from '../../../components/LocationBar';
import Footer from '../../../components/Footer';
import ProductBreadcrumb from './components/ProductBreadcrumb';
import ProductHero from './components/ProductHero';
import ProductSummary from './components/ProductSummary';
import ProductCombos from './components/ProductCombos';
import ProductTabs from './components/ProductTabs';
import CustomerReviews from './components/CustomerReviews';
import RelatedProducts from './components/RelatedProducts';
import StickyCartBar from './components/StickyCartBar';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import ProductSkeleton from './components/ProductSkeleton';
import ScrollToTop from './components/ScrollToTop';
import { generateDynamicTitle } from '../../../utils/dynamicTitle';
import { useCart } from '../../../contexts/CartContext';
import { useWishlist } from '../../../contexts/WishlistContext';

export default function ProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { slug } = params;
  const { addToCart, getItemCount } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [dynamicContent, setDynamicContent] = useState(null);
  const [subcategoryContext, setSubcategoryContext] = useState(null);
  const [displayTitle, setDisplayTitle] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);

  // Add data attribute to body for product page specific styles
  // Must be called before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    document.body.setAttribute('data-page', 'product');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch product by slug
        const productResponse = await productApi.getProductBySlug(slug);
        
        if (productResponse.success && productResponse.data.product) {
          const productData = productResponse.data.product;
          setProduct(productData);
          
          // Check for subcategory context from URL parameters
          const subcategoryParam = searchParams.get('subcategory');
          if (subcategoryParam) {
            setSubcategoryContext(subcategoryParam);
            // Generate dynamic title based on subcategory context
            const dynamicTitle = generateDynamicTitle(productData.name, subcategoryParam);
            setDisplayTitle(dynamicTitle);
          } else {
            setDisplayTitle(productData.name);
          }
          
          // Default to base weight (selectedVariant remains null)
          // Users can manually select a variant if needed

          // Reset flavor selection on page load/refresh
          setSelectedFlavor(null);
          
          // Clear flavor from URL on page refresh
          if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            if (url.searchParams.has('flavor')) {
              url.searchParams.delete('flavor');
              window.history.replaceState({}, '', url);
            }
          }

          // Fetch related products
          try {
            const relatedResponse = await productApi.getRelatedProducts(productData.id, 20);
            if (relatedResponse.success) {
              setRelatedProducts(relatedResponse.data.products || []);
            }
          } catch (relatedError) {
            console.warn('Failed to fetch related products:', relatedError);
            // Don't fail the entire page if related products fail
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProductData();
    }
  }, [slug]);

  const handleVariantChange = (variant) => {
    setSelectedVariant(variant);
  };

  const handleFlavorChange = (flavor) => {
    setSelectedFlavor(flavor);
    
    // Update URL with flavor parameter for analytics (SEO-safe)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location);
      url.searchParams.set('flavor', flavor.name.toLowerCase().replace(/\s+/g, '-'));
      window.history.replaceState({}, '', url);
    }
  };

  const handleDynamicContentUpdate = (content) => {
    setDynamicContent(content);
  };


  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async (orderData) => {
    try {
      const result = addToCart({
        product,
        variant: selectedVariant,
        quantity,
        flavor: selectedFlavor,
        tier: selectedTier,
        ...orderData
      });

      if (result.success) {
        // Show success message or notification
        console.log('Item added to cart successfully:', result.item);
        // Navigate to cart page after successful addition
        router.push('/cart');
      } else {
        console.error('Failed to add item to cart:', result.error);
        // You can add an error notification here
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleBuyNow = (orderData) => {
    // TODO: Implement buy now functionality
    console.log('Buy now:', {
      product,
      variant: selectedVariant,
      quantity,
      ...orderData
    });
  };

  const handleShare = (platform) => {
    // TODO: Implement sharing functionality
    console.log('Share on:', platform, product);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <LocationBar />
        <ProductSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <ErrorMessage 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <ErrorMessage message="Product not found" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden max-w-full" style={{ minWidth: 0 }}>
      {/* SEO Meta Tags - Fixed for SEO, not affected by flavor selection */}
      <Head>
        <title>{product.name} | Creamingo</title>
        <meta name="description" content={`Order the finest ${product.name} with rich flavors and freshness guaranteed. Available in multiple flavours.`} />
        <meta name="keywords" content={`${product.name}, cake, creamingo, online cake delivery, fresh cake`} />
        
        {/* Canonical URL - Always points to base product */}
        <link rel="canonical" href={`https://www.creamingo.com/product/${product.slug}`} />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={`${product.name} | Creamingo`} />
        <meta property="og:description" content={`Order the finest ${product.name} with rich flavors and freshness guaranteed. Available in multiple flavours.`} />
        <meta property="og:image" content={product.image_url} />
        <meta property="og:url" content={`https://www.creamingo.com/product/${product.slug}`} />
        <meta property="og:type" content="product" />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | Creamingo`} />
        <meta name="twitter:description" content={`Order the finest ${product.name} with rich flavors and freshness guaranteed. Available in multiple flavours.`} />
        <meta name="twitter:image" content={product.image_url} />
        
        {/* Product Schema with Flavor Variants */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name,
              "description": product.description,
              "image": product.image_url,
              "brand": {
                "@type": "Brand",
                "name": "Creamingo"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "INR",
                "price": product.base_price,
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Creamingo"
                }
              },
              "hasVariant": product.subcategories
                ?.filter(subcat => [9, 10, 12, 14, 11, 13, 17, 16, 15, 18].includes(Number(subcat.id)))
                ?.map(flavor => ({
                  "@type": "Product",
                  "name": `${flavor.name} ${product.name}`,
                  "description": `Indulge in our delicious ${flavor.name.toLowerCase()} ${product.name.toLowerCase()}.`
                })) || []
            })
          }}
        />
      </Head>

      {/* Header */}
      <Header />
      
      {/* Mobile Location Bar - Always sticky on PDP */}
      <div className="product-location-bar-wrapper">
        <LocationBar isSticky={true} />
      </div>

      {/* Main Product Content */}
      <div className="w-full mx-auto px-3 sm:px-6 lg:px-12 xl:px-16 pt-2 sm:pt-4 lg:pt-2 pb-20 sm:pb-8 overflow-x-hidden max-w-full" style={{ minWidth: 0 }}>
        {/* Breadcrumb Navigation */}
        <ProductBreadcrumb product={product} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 overflow-x-hidden max-w-full" style={{ minWidth: 0 }}>
          {/* Left Column - Product Images */}
          <div className="order-1 lg:order-1 overflow-x-hidden max-w-full" style={{ minWidth: 0 }}>
            <ProductHero 
              product={product}
              selectedVariant={selectedVariant}
              isFavorite={product ? isInWishlist(product.id) : false}
              onFavoriteToggle={() => product && toggleWishlist(product.id)}
              onQuickShare={() => handleShare('copy')}
            />
          </div>

          {/* Right Column - Product Details */}
          <div className="order-2 lg:order-2 lg:h-[calc(100vh-120px)] lg:flex lg:flex-col w-full overflow-x-hidden max-w-full" style={{ minWidth: 0 }}>
            {/* Main Content Area - Scrollable */}
            <div className="lg:flex-1 lg:overflow-y-auto lg:overflow-x-hidden product-content-scroll w-full max-w-full" style={{ minWidth: 0 }}>
              <ProductSummary 
                product={product}
                selectedVariant={selectedVariant}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onShare={handleShare}
                onVariantChange={handleVariantChange}
                selectedFlavor={selectedFlavor}
                onFlavorChange={handleFlavorChange}
                onDynamicContentUpdate={handleDynamicContentUpdate}
                displayTitle={displayTitle}
                selectedTier={selectedTier}
                onTierChange={setSelectedTier}
              />


            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-10 sm:mt-12">
          <ProductTabs 
            product={product} 
            selectedVariant={selectedVariant}
            dynamicContent={dynamicContent}
            selectedTier={selectedTier}
          />
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-10 sm:mt-12">
          <CustomerReviews productId={product.id} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-14">
            <RelatedProducts 
              products={relatedProducts}
              currentProductId={product.id}
            />
          </div>
        )}
      </div>

      {/* Footer - Hidden on mobile for better UX, but remains in DOM for SEO */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />

    </div>
  );
}

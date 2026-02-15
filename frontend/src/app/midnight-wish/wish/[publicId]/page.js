'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import MobileFooter from '../../../../components/MobileFooter';
import LocationBar from '../../../../components/LocationBar';
import { useCart } from '../../../../contexts/CartContext';
import { useToast } from '../../../../contexts/ToastContext';
import { getWishByPublicId } from '../../../../api/midnightWishApi';
import { Gift, Loader2, ShoppingBag, Star, ChevronRight } from 'lucide-react';

function resolveImageUrl(url) {
  if (!url) return '/placeholder-cake.png';
  if (url.startsWith('http')) return url;
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  const path = url.startsWith('/') ? url : `/${url}`;
  return base.replace(/\/api\/?$/, '') + path;
}

export default function MidnightWishViewPage() {
  const router = useRouter();
  const params = useParams();
  const publicId = params?.publicId;
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [wish, setWish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fulfilling, setFulfilling] = useState(false);

  useEffect(() => {
    if (!publicId) {
      setError('Invalid wish link');
      setLoading(false);
      return;
    }
    let cancelled = false;
    getWishByPublicId(publicId)
      .then((res) => {
        if (!cancelled) {
          setWish(res.wish);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || 'This wish link is invalid or has been removed');
          setWish(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [publicId]);

  const handleFulfillWish = async () => {
    if (!wish || !wish.items || wish.items.length === 0) return;
    setFulfilling(true);
    try {
      let added = 0;
      for (const item of wish.items) {
        const product = {
          id: item.product_id,
          name: item.product_name,
          slug: item.product_slug,
          image_url: item.image_url,
          base_price: item.base_price,
          discounted_price: item.discounted_price
        };
        const variant = item.variant
          ? {
              id: item.variant.id,
              name: item.variant.name,
              weight: item.variant.weight,
              discounted_price: item.variant.discounted_price ?? item.variant.price
            }
          : null;
        const cartItem = {
          product,
          variant,
          quantity: item.quantity || 1,
          deliverySlot: null,
          cakeMessage: null,
          combos: [],
          totalPrice: (item.discounted_price || item.base_price) * (item.quantity || 1)
        };
        const result = addToCart(cartItem);
        if (result?.success) added++;
      }
      showSuccess(
        'Added to cart',
        added === wish.items.length
          ? 'All items are in your cart. Choose delivery and checkout to fulfill this wish!'
          : `${added} item(s) added. You can add the rest from the product pages.`
      );
      router.push('/cart');
    } catch (e) {
      showError('Error', e.message || 'Could not add items to cart');
    } finally {
      setFulfilling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100">
        <Header />
        <LocationBar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
          <p className="text-gray-400">Loading wish...</p>
        </div>
        <Footer />
        <MobileFooter />
      </div>
    );
  }

  if (error || !wish) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100">
        <Header />
        <LocationBar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">This link isn’t valid</h1>
          <p className="text-gray-400 mb-6">
            The wish may have been removed or the link might be wrong. You can go back to Midnight Wish or try another link.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/midnight-wish')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold"
            >
              Go to Midnight Wish
            </button>
            <button
              onClick={() => router.push('/midnight-wish/fulfill')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 font-medium"
            >
              Paste a different link
            </button>
          </div>
        </div>
        <Footer />
        <MobileFooter />
      </div>
    );
  }

  const totalItems = wish.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;

  return (
    <div className="min-h-screen bg-[#0d0d12] text-gray-100">
      <Header />
      <LocationBar />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(251,191,36,0.12),transparent)]" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-amber-400/90 text-sm font-medium mb-3">
              <Star className="w-4 h-4" />
              Midnight Wish
            </div>
            {wish.wisher_first_name && (
              <p className="text-gray-400 text-lg mb-1">
                {wish.wisher_first_name}&apos;s wish
              </p>
            )}
            {wish.occasion && (
              <p className="text-amber-400/90 font-medium">{wish.occasion}</p>
            )}
            {wish.message && (
              <p className="text-gray-300 mt-3 max-w-md mx-auto">&ldquo;{wish.message}&rdquo;</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-8">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-semibold">
                {wish.items?.length || 0} {wish.items?.length === 1 ? 'item' : 'items'}
              </span>
              <span className="text-amber-400 text-sm">
                {totalItems} total
              </span>
            </div>
            <ul className="divide-y divide-white/10">
              {wish.items?.map((item) => (
                <li key={item.id} className="flex gap-4 p-4">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 cursor-pointer"
                    onClick={() => router.push(`/product/${item.product_slug || item.product_id}`)}
                  >
                    <img
                      src={resolveImageUrl(item.image_url)}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => router.push(`/product/${item.product_slug || item.product_id}`)}
                      className="text-left"
                    >
                      <p className="text-white font-medium hover:text-amber-400 transition-colors">
                        {item.product_name}
                      </p>
                    </button>
                    {item.variant && (
                      <p className="text-sm text-gray-500">{item.variant.name}</p>
                    )}
                    <p className="text-amber-400 font-semibold mt-1">
                      ₹{Number(item.discounted_price ?? item.base_price ?? 0).toFixed(0)}
                      {item.quantity > 1 && ` × ${item.quantity}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-4">
              Fulfill this wish by adding all items to your cart. You&apos;ll choose delivery at checkout.
            </p>
            <button
              onClick={handleFulfillWish}
              disabled={fulfilling || !wish.items?.length}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-[#0d0d12] font-bold text-lg transition-colors"
            >
              {fulfilling ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Gift className="w-6 h-6" />
              )}
              {fulfilling ? 'Adding to cart...' : 'Fulfill this wish'}
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="mt-4 inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              Go to cart
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {wish.delivery_pincode && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Delivery pincode: {wish.delivery_pincode}
            </p>
          )}
        </div>
      </div>

      <Footer />
      <MobileFooter />
    </div>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import MobileFooter from '../../components/MobileFooter';
import LocationBar from '../../components/LocationBar';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Star,
  Sparkles,
  Gift,
  Plus,
  Trash2,
  LogIn,
  Copy,
  Check,
  Loader2,
  Share2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Heart,
  MessageCircle,
  Download,
  Info,
  Cake,
  Link2,
  Pencil,
  ShoppingCart
} from 'lucide-react';
import { createWish, getMyWishes, deleteWish, deleteWishItem } from '../../api/midnightWishApi';
import productApi from '../../api/productApi';
import weightTierApi from '../../api/weightTierApi';
import { getMidnightWishDraft, addToMidnightWishDraft, getMidnightWishDraftMessage, setMidnightWishDraftMessage, DRAFT_STORAGE_KEY } from '../../utils/midnightWishDraft';
import { formatPrice } from '../../utils/priceFormatter';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function resolveImageUrl(url) {
  if (!url) return '/placeholder-cake.png';
  if (url.startsWith('http')) return url;
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  const path = url.startsWith('/') ? url : `/${url}`;
  return base.replace(/\/api\/?$/, '') + path;
}

const WISH_TYPES = [
  { id: 'birthday', label: 'Birthday Wish', emoji: '🎂', occasion: 'Birthday', microLabel: 'It\'s my birthday → Surprise me' },
  { id: 'anniversary', label: 'Anniversary Wish', emoji: '💑', occasion: 'Anniversary', microLabel: 'I wish → my partner surprises me' },
  { id: 'kids', label: 'Kids Celebration Wish', emoji: '🧸', occasion: 'Kids Celebration', microLabel: 'I want this cake → Mom & Dad / Friend' },
  { id: 'surprise', label: 'A Surprise Without Reason', emoji: '🎁', occasion: 'Surprise', microLabel: 'I want this → from Someone Special' }
];

// Occasion-based message suggestions: "who → whom" – user hinting to someone special to fulfill their wish
const MESSAGE_SUGGESTIONS_BY_CATEGORY = [
  {
    tag: '🎂 Birthday',
    messages: [
      'It\'s my birthday → surprise me with this cake 🎂',
      'My birthday wish – this cake, please! 🎉',
      'One of the gifts for my birthday 🎂✨',
      'This is the cake I\'m dreaming of for my big day!'
    ]
  },
  {
    tag: '💑 Anniversary',
    messages: [
      'I\'d love this from you on our day 💕',
      'Our anniversary – surprise me with this 🌹',
      'Hint for our special day 💑',
      'This would make our celebration perfect 💖'
    ]
  },
  {
    tag: '🧸 Kids Celebration',
    messages: [
      'Mom & Dad, this is my dream cake! 🧸',
      'I want this cake for my party 🎉',
      'My party wish cake – please? 🧁',
      'This is the one I want for my celebration! 🎂'
    ]
  },
  {
    tag: '🎁 Surprise / Just because',
    messages: [
      'I\'d love this from you tonight 💕',
      'Surprise me with this at midnight 🌙✨',
      'Someone special, take the hint 💕',
      'This would mean everything from you 💖',
      'Hint hint 😉 this is my dream cake'
    ]
  }
];

export default function MidnightWishPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useCustomerAuth();
  const { openAuthModal } = useAuthModal();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(null);
  const [wishType, setWishType] = useState(null);
  const [occasion, setOccasion] = useState('');
  const [draftItems, setDraftItems] = useState([]);
  const [message, setMessage] = useState('');
  const [curatedProducts, setCuratedProducts] = useState([]);
  const [curatedLoading, setCuratedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchMore, setShowSearchMore] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createdWish, setCreatedWish] = useState(null);
  const [myWishes, setMyWishes] = useState([]);
  const [loadingMyWishes, setLoadingMyWishes] = useState(false);
  const [deletingWishId, setDeletingWishId] = useState(null);
  const [deleteConfirmWishId, setDeleteConfirmWishId] = useState(null);
  const [deleteSuccessShow, setDeleteSuccessShow] = useState(false);
  const [removingWishItemKey, setRemovingWishItemKey] = useState(null);
  const [openWishModal, setOpenWishModal] = useState(null);
  const [removeDraftItemConfirm, setRemoveDraftItemConfirm] = useState(null);
  const [expandedMessageCategoryIndex, setExpandedMessageCategoryIndex] = useState(0);
  const [addToWishModalProduct, setAddToWishModalProduct] = useState(null);
  const [addToWishModalFull, setAddToWishModalFull] = useState(null);
  const [addToWishModalLoading, setAddToWishModalLoading] = useState(false);
  const [addToWishModalImageIndex, setAddToWishModalImageIndex] = useState(0);
  const [addToWishModalVariant, setAddToWishModalVariant] = useState(null);
  const [addToWishModalTier, setAddToWishModalTier] = useState(null);
  const [addToWishModalEditIndex, setAddToWishModalEditIndex] = useState(null);
  const [addToWishModalEditVariantId, setAddToWishModalEditVariantId] = useState(null);
  const [addToWishWeightTierMappings, setAddToWishWeightTierMappings] = useState({});
  const [linkCopyFeedbackUntil, setLinkCopyFeedbackUntil] = useState(0);
  const [shortLinkCopyFeedbackUntil, setShortLinkCopyFeedbackUntil] = useState(0);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [fulfillLinkInput, setFulfillLinkInput] = useState('');
  const [downloadingCard, setDownloadingCard] = useState(false);
  const [showWhatIsWish, setShowWhatIsWish] = useState(false);
  const shareCardRef = useRef(null);
  const fulfillInputRef = useRef(null);
  const wishScrollRef = useRef(null);
  const [wishScrollIndex, setWishScrollIndex] = useState(0);
  const [wishFooterExpanded, setWishFooterExpanded] = useState(false); // collapsed by default on Home

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    setWishScrollIndex(0);
  }, [draftItems.length]);

  const isFirstMessageEffectRef = useRef(true);
  useEffect(() => {
    const draft = getMidnightWishDraft();
    if (draft.length > 0) setDraftItems(draft);
    const savedMessage = getMidnightWishDraftMessage();
    if (savedMessage) setMessage(savedMessage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isFirstMessageEffectRef.current) {
      isFirstMessageEffectRef.current = false;
      return;
    }
    setMidnightWishDraftMessage(message);
  }, [message]);

  const COPY_FEEDBACK_MS_EFFECT = 2500;
  useEffect(() => {
    if (linkCopyFeedbackUntil <= 0) return;
    const t = setTimeout(() => setLinkCopyFeedbackUntil(0), COPY_FEEDBACK_MS_EFFECT);
    return () => clearTimeout(t);
  }, [linkCopyFeedbackUntil]);

  useEffect(() => {
    if (shortLinkCopyFeedbackUntil <= 0) return;
    const t = setTimeout(() => setShortLinkCopyFeedbackUntil(0), COPY_FEEDBACK_MS_EFFECT);
    return () => clearTimeout(t);
  }, [shortLinkCopyFeedbackUntil]);

  // When on Step 2 (cakes), open the message section that matches selected occasion; default Birthday
  useEffect(() => {
    if (step !== 'cakes') return;
    const index = wishType?.id === 'birthday' ? 0 : wishType?.id === 'anniversary' ? 1 : wishType?.id === 'kids' ? 2 : wishType?.id === 'surprise' ? 3 : 0;
    setExpandedMessageCategoryIndex(index);
  }, [step, wishType?.id]);

  // Fetch full product when Add to Wish modal is opened
  useEffect(() => {
    if (!addToWishModalProduct) {
      setAddToWishModalFull(null);
      setAddToWishModalVariant(null);
      setAddToWishModalTier(null);
      setAddToWishModalImageIndex(0);
      setAddToWishModalEditIndex(null);
      setAddToWishModalEditVariantId(null);
      return;
    }
    setAddToWishModalLoading(true);
    setAddToWishModalFull(null);
    const slug = addToWishModalProduct.slug;
    const id = addToWishModalProduct.id;
    const editVariantId = addToWishModalEditVariantId;
    const fetchProduct = slug
      ? productApi.getProductBySlug(slug)
      : productApi.getProductById(id);
    fetchProduct
      .then((res) => {
        const product = res?.data?.product || res?.product;
        if (product) {
          setAddToWishModalFull(product);
          const variants = product.variants || [];
          const baseWeight = product.base_weight;
          let variant = null;
          let tier = null;
          if (editVariantId != null) {
            const found = variants.find((v) => v.id === editVariantId);
            if (found) {
              variant = found;
              const tiers = getAvailableTiersForWeight(found.weight);
              tier = tiers[0] || null;
            }
          }
          if (!variant) {
            variant = variants[0] || null;
            const w = variant?.weight || baseWeight;
            if (w) tier = getAvailableTiersForWeight(w)[0] || null;
          }
          setAddToWishModalVariant(variant);
          setAddToWishModalTier(tier);
        }
      })
      .catch(() => showError('Could not load product', 'Try again'))
      .finally(() => setAddToWishModalLoading(false));
    weightTierApi.getAllWeightTierMappings?.()
      .then((r) => {
        const mappings = {};
        if (r?.data?.mappings && Array.isArray(r.data.mappings)) {
          r.data.mappings.forEach((m) => {
            if (m?.weight) mappings[m.weight] = m.available_tiers || [];
          });
        }
        setAddToWishWeightTierMappings(mappings);
      })
      .catch(() => {});
  }, [addToWishModalProduct?.id, addToWishModalEditVariantId]);

  const inferServingsFromWeight = (weightText) => {
    if (weightText == null || weightText === '') return null;
    const lower = String(weightText).toLowerCase().trim();
    let kg = 0;
    const gMatch = lower.match(/(\d+)\s*g(?:m)?/);
    const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*k(?:g)?/);
    if (kgMatch) kg = parseFloat(kgMatch[1]);
    else if (gMatch) kg = parseFloat(gMatch[1]) / 1000;
    else if (/^\d+(\.\d+)?$/.test(lower)) kg = parseFloat(lower);
    if (kg <= 0) return null;
    if (kg <= 0.6) return '4–6 servings';
    if (kg <= 1.0) return '8–10 servings';
    if (kg <= 1.5) return '12–15 servings';
    if (kg <= 2.0) return '16–20 servings';
    if (kg <= 2.5) return '20–25 servings';
    if (kg <= 3.0) return '24–30 servings';
    return `${Math.round(kg * 10)}+ servings`;
  };

  const getAvailableTiersForWeight = (weight) => {
    if (!weight) return ['1 Tier'];
    const w = addToWishWeightTierMappings[weight] || addToWishWeightTierMappings[weight?.toLowerCase?.()];
    if (Array.isArray(w)) return w.map((t) => `${t} Tier`);
    return ['1 Tier'];
  };

  const persistDraft = (items) => {
    if (typeof window === 'undefined') return;
    if (items.length === 0) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setMidnightWishDraftMessage('');
    } else {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(items));
    }
  };

  const addToDraft = (product, variant = null, quantity = 1, options = {}) => {
    const next = addToMidnightWishDraft(product, variant, quantity, options);
    setDraftItems(next);
    showSuccess('Added to wish', `${product.name} added`);
  };

  const removeFromDraft = (productId, variantId) => {
    setDraftItems((prev) => {
      const next = prev.filter(
        (i) => !(i.product_id === productId && (i.variant_id || null) === (variantId || null))
      );
      persistDraft(next);
      return next;
    });
  };

  const updateDraftAtIndex = (index, product, variant, quantity = 1, options = {}) => {
    setDraftItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const next = [...prev];
      const { weight: weightDisplay, tier: tierDisplay } = options;
      next[index] = {
        product_id: product.id,
        variant_id: variant?.id || null,
        quantity,
        product_name: product.name,
        product_slug: product.slug,
        image_url: product.image_url,
        base_price: product.base_price,
        discounted_price: product.discounted_price ?? product.base_price,
        weight: weightDisplay ?? variant?.weight ?? null,
        tier: tierDisplay ?? null
      };
      persistDraft(next);
      return next;
    });
  };

  const openAddToWishModalForEdit = (index) => {
    const item = draftItems[index];
    if (!item) return;
    setAddToWishModalEditIndex(index);
    setAddToWishModalEditVariantId(item.variant_id ?? null);
    setAddToWishModalProduct({
      id: item.product_id,
      slug: item.product_slug,
      name: item.product_name,
      image_url: item.image_url,
      base_price: item.base_price,
      discounted_price: item.discounted_price
    });
  };

  useEffect(() => {
    if (step === 'cakes' && curatedProducts.length === 0) {
      setCuratedLoading(true);
      fetch(`${API_BASE_URL}/products/top?limit=8`)
        .then((r) => r.json())
        .then((data) => {
          const list = data?.data?.products || data?.products || [];
          setCuratedProducts(Array.isArray(list) ? list : []);
        })
        .catch(() => setCuratedProducts([]))
        .finally(() => setCuratedLoading(false));
    }
  }, [step]);

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await productApi.searchProducts(searchQuery.trim(), { limit: 12 });
      const products = res.products || res.data || [];
      setSearchResults(Array.isArray(products) ? products : []);
    } catch (e) {
      setSearchResults([]);
      showError('Search failed', e.message || 'Try again');
    } finally {
      setSearching(false);
    }
  };

  const fetchMyWishes = async () => {
    if (!isAuthenticated) return;
    setLoadingMyWishes(true);
    try {
      const res = await getMyWishes();
      const raw = res.wishes || [];
      const seen = new Set();
      const deduped = raw.filter((w) => {
        const key = w.public_id || w.id || `wish-${w.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setMyWishes(deduped);
    } catch (_) {
      setMyWishes([]);
    } finally {
      setLoadingMyWishes(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchMyWishes();
  }, [isAuthenticated]);

  // Clear draft when user is not authenticated (logout or guest) so no cross-user draft leakage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated) {
      persistDraft([]);
      setDraftItems([]);
      setMidnightWishDraftMessage('');
    }
  }, [isAuthenticated]);

  const handleCreateWish = async () => {
    if (draftItems.length === 0) {
      showError('Add cakes', 'Pick at least one cake for your wish');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        message: message.trim() || undefined,
        occasion: occasion.trim() || undefined,
        items: draftItems.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id || undefined,
          quantity: i.quantity || 1
        }))
      };
      const res = await createWish(payload);
      setCreatedWish(res.wish);
      setWishType(null);
      const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/midnight-wish/wish/${res.wish.public_id}` : res.wish.share_url;
      if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
        navigator.clipboard.writeText(shareUrl);
        showSuccess('Link copied!', 'Share it anywhere – WhatsApp, message, or email.');
      } else {
        showSuccess('Your wish is ready!', 'Copy the link below to share.');
      }
      fetchMyWishes();
    } catch (e) {
      showError('Could not create wish', e.message || 'Please try again');
    } finally {
      setCreating(false);
    }
  };

  const getShareUrl = () =>
    typeof window !== 'undefined'
      ? `${window.location.origin}/midnight-wish/wish/${createdWish?.public_id}`
      : createdWish?.share_url || '';

  const getShortShareUrl = () =>
    typeof window !== 'undefined' && createdWish?.public_id
      ? `${window.location.origin}/w/${createdWish.public_id}`
      : '';

  const COPY_FEEDBACK_MS = 2500;

  const copyShareUrl = () => {
    const url = getShareUrl();
    if (typeof navigator !== 'undefined' && navigator.clipboard && url) {
      navigator.clipboard.writeText(url);
      setLinkCopyFeedbackUntil(Date.now() + COPY_FEEDBACK_MS);
    }
  };

  const copyShortShareUrl = () => {
    const url = getShortShareUrl();
    if (typeof navigator !== 'undefined' && navigator.clipboard && url) {
      navigator.clipboard.writeText(url);
      setShortLinkCopyFeedbackUntil(Date.now() + COPY_FEEDBACK_MS);
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    const title = 'Midnight Wish 🎂';
    const text = 'Someone, fulfill my Midnight Wish!';
    if (typeof navigator !== 'undefined' && navigator.share && url) {
      try {
        await navigator.share({ title, text, url });
        showSuccess('Shared', 'Thanks for sharing!');
      } catch (e) {
        if (e?.name !== 'AbortError') showError('Share failed', e?.message || 'Could not share');
      }
    }
  };

  const shareOnWhatsApp = () => {
    const url = getShareUrl();
    const text = `Someone, fulfill my Midnight Wish 🎂✨ ${url}`;
    if (typeof window !== 'undefined') {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  const handleDownloadCard = async () => {
    if (!shareCardRef.current) return;
    setDownloadingCard(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#0d0d12',
        logging: false
      });
      const link = document.createElement('a');
      link.download = `midnight-wish-${createdWish?.public_id || 'card'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showSuccess('Downloaded', 'Card saved as image');
    } catch (e) {
      const msg = e?.message || '';
      showError(
        'Download failed',
        msg.includes('resolve') || msg.includes('html2canvas') ? 'Image export is not available. Try again after refreshing.' : msg || 'Could not save image'
      );
    } finally {
      setDownloadingCard(false);
    }
  };

  const openFulfillLink = () => {
    let raw = fulfillLinkInput.trim();
    if (!raw) {
      showError('Paste a link', 'Paste the wish link you received');
      return;
    }
    // Normalize: support full URL, short URL (/w/...), host+path (example.com/w/...), or raw id
    if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/') && raw.includes('/')) {
      raw = 'https://' + raw;
    }
    const match =
      raw.match(/\/midnight-wish\/wish\/([a-f0-9]+)/i) ||
      raw.match(/\/w\/([a-f0-9]+)/i) ||
      raw.match(/([a-f0-9]{8,})/);
    const publicId = match ? match[1].toLowerCase() : null;
    if (publicId) {
      router.push(`/midnight-wish/wish/${publicId}`);
    } else {
      showError('Invalid link', 'This link doesn\'t look right. Check and paste again.');
      /* Keep input value so user can correct it */
    }
  };

  const handleDeleteWish = async (wishId) => {
    setDeletingWishId(wishId);
    setDeleteConfirmWishId(null);
    try {
      await deleteWish(wishId);
      setMyWishes((prev) => prev.filter((w) => w.id !== wishId));
      setDeleteSuccessShow(true);
    } catch (e) {
      setTimeout(() => showError('Could not delete', e.message || 'Please try again.'), 0);
    } finally {
      setDeletingWishId(null);
    }
  };

  const handleRemoveWishItem = async (wishId, itemId) => {
    const key = `${wishId}-${itemId}`;
    setRemovingWishItemKey(key);
    try {
      await deleteWishItem(wishId, itemId);
      const res = await getMyWishes();
      setMyWishes(res.wishes || []);
      showSuccess('Item removed', '');
    } catch (e) {
      showError('Could not remove item', e.message || 'Please try again.');
    } finally {
      setRemovingWishItemKey(null);
    }
  };

  const resetFlow = (keepDraft = false) => {
    setCreatedWish(null);
    setStep(null);
    setWishType(null);
    if (!keepDraft) {
      setOccasion('');
      setMessage('');
      setDraftItems([]);
      persistDraft([]);
      setMidnightWishDraftMessage('');
    }
    setShowSearchMore(false);
    setSearchResults([]);
    setSearchQuery('');
    if (isAuthenticated) fetchMyWishes();
  };

  // ——— Guest: emotional hook + login ———
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100">
        <Header />
        <LocationBar />
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,191,36,0.12),transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-transparent to-[#0d0d12]" />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-400 mb-6">
              <Star className="w-10 h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              Make a Midnight Wish
            </h1>
            <p className="text-amber-400/90 text-sm sm:text-base font-medium mb-6">
              Make a wish. Share it. Someone special might surprise you.
            </p>
            <ul className="max-w-sm mx-auto relative mb-10 ml-8 sm:ml-12">
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-amber-500/40 via-amber-500/30 to-amber-500/40" aria-hidden />
              <li className="relative flex items-center gap-3 text-gray-300 pb-4 last:pb-0">
                <span className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex-shrink-0">
                  <Sparkles className="w-3 h-3" />
                </span>
                <span className="text-sm">Choose your occasion</span>
              </li>
              <li className="relative flex items-center gap-3 text-gray-300 pb-4 last:pb-0">
                <span className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex-shrink-0">
                  <Cake className="w-3 h-3" />
                </span>
                <span className="text-sm">Pick cakes for your wish</span>
              </li>
              <li className="relative flex items-center gap-3 text-gray-300 pb-4 last:pb-0">
                <span className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex-shrink-0">
                  <Link2 className="w-3 h-3" />
                </span>
                <span className="text-sm">Share your wish link & get surprised 🎉</span>
              </li>
            </ul>
            <p className="text-gray-500 mb-10">
              Log in to create your wish and get a shareable link.
            </p>
            <button
              onClick={() => openAuthModal('/midnight-wish')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0d0d12] hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]"
            >
              <LogIn className="w-5 h-5" />
              Log in to make my wish
            </button>
          </div>
        </div>
        {/* Footer omitted on Midnight Wish for cleaner UX; page content is sufficient for SEO */}
        <MobileFooter />
      </div>
    );
  }

  // ——— Authenticated: emotional landing (no form) ———
  if (isAuthenticated && step === null && !createdWish) {
    return (
      <div className={`min-h-screen bg-[#0d0d12] text-gray-100${draftItems.length > 0 ? ' pb-24' : ''}`}>
        <Header />
        <LocationBar />
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,191,36,0.15),transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-transparent to-[#0d0d12]" />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-400 mb-6">
              <Star className="w-10 h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
              Make a Midnight Wish
            </h1>
            <p className="text-amber-400/90 text-sm sm:text-base font-medium mb-6">
              Make a wish. Share it. Someone special might surprise you.
            </p>
            <ul className="max-w-sm mx-auto relative mb-8 ml-8 sm:ml-12">
              <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-amber-500/40 via-amber-500/30 to-amber-500/40" aria-hidden />
              <li className="relative flex items-center gap-3 text-gray-300 pb-4 last:pb-0">
                <span className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex-shrink-0">
                  <Sparkles className="w-3 h-3" />
                </span>
                <span className="text-sm">Choose your occasion</span>
              </li>
              <li className="relative flex items-center gap-3 text-gray-300 pb-4 last:pb-0">
                <span className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex-shrink-0">
                  <Cake className="w-3 h-3" />
                </span>
                <span className="text-sm">Pick cakes for your wish</span>
              </li>
              <li className="relative flex items-center gap-3 text-gray-300 pb-4 last:pb-0">
                <span className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex-shrink-0">
                  <Link2 className="w-3 h-3" />
                </span>
                <span className="text-sm">Share your wish link & get surprised 🎉</span>
              </li>
            </ul>
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                type="button"
                onClick={() => setShowWhatIsWish(!showWhatIsWish)}
                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-amber-400 text-sm font-medium transition-colors"
                aria-expanded={showWhatIsWish}
              >
                <Info className="w-4 h-4" />
                What is Midnight Wish?
              </button>
            </div>
            {showWhatIsWish && (
              <div className="max-w-md mx-auto mb-8 px-4 py-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <p className="text-amber-400/95 font-medium text-base leading-snug">
                  A Midnight Wish is your silent request for love and surprise.
                </p>
                <p className="text-gray-400 text-sm pl-3 border-l-2 border-amber-500/40 leading-relaxed">
                  Pick your dream cake, share the wish link, and someone who cares can make it come true.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => {
                    const draft = getMidnightWishDraft();
                    if (draft.length > 0) setDraftItems(draft);
                    setStep('cakes');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-bold text-lg transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0d0d12] hover:shadow-[0_0_24px_rgba(251,191,36,0.3)]"
                >
                  <Gift className="w-6 h-6" />
                  Make My Wish
                </button>
                <span className="text-gray-500 text-xs">Create your wish link</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => {
                  fulfillInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  setTimeout(() => fulfillInputRef.current?.focus(), 400);
                }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 font-semibold text-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:ring-offset-2 focus:ring-offset-[#0d0d12] hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                >
                  <Heart className="w-6 h-6" />
                  Fulfill Someone&apos;s Wish
                </button>
                <span className="text-gray-500 text-xs">Paste a wish link to buy the cake for them</span>
              </div>
            </div>

            <section id="fulfill-section" className="pt-8 border-t border-white/10 mt-12 scroll-mt-24">
              <p className="text-gray-400 mb-3">Have a wish link? Paste it below to buy the cake for them.</p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  ref={fulfillInputRef}
                  type="text"
                  value={fulfillLinkInput}
                  onChange={(e) => setFulfillLinkInput(e.target.value)}
                  placeholder="Paste the wish link here"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  onClick={openFulfillLink}
                  className="px-5 py-3 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-semibold"
                >
                  Open wish
                </button>
              </div>
            </section>

            {/* My wishes list removed from Home – use your own design elsewhere */}
            {false && myWishes.length > 0 && draftItems.length === 0 && (
              <div className="mt-12 pt-8 pb-16 border-t border-white/10 text-left max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-400 mb-3">My wishes</p>
                <div className="space-y-4">
                  {myWishes.slice(0, 10).map((w) => {
                    const wishUrl = typeof window !== 'undefined' ? `${window.location.origin}/midnight-wish/wish/${w.public_id}` : '';
                    const shareText = 'Fulfill my Midnight Wish 🎂 – order this cake for me!';
                    const items = w.items || [];
                    const groupedByProduct = items.reduce((acc, it) => {
                      const key = it.product_id;
                      if (!acc[key]) acc[key] = { product_name: it.product_name, image_url: it.image_url, variations: [] };
                      if (it.variation) acc[key].variations.push(it.variation);
                      return acc;
                    }, {});
                    const productGroups = Object.entries(groupedByProduct);
                    return (
                      <div key={w.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="p-3">
                          {items.length > 0 ? (
                            <>
                              <div className="flex items-start gap-3">
                                <div className="flex gap-1.5 flex-shrink-0">
                                  {items.slice(0, 4).map((it) => {
                                    const removing = removingWishItemKey === `${w.id}-${it.id}`;
                                    const showItemRemove = items.length > 1;
                                    return (
                                      <div key={it.id} className="relative w-10 h-10 rounded-md overflow-hidden bg-white/10 ring-1 ring-white/10">
                                        <img src={resolveImageUrl(it.image_url)} alt="" className="w-full h-full object-cover" />
                                        {showItemRemove && (
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveWishItem(w.id, it.id)}
                                            disabled={removing}
                                            className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/90 hover:bg-red-500 text-white shadow transition-colors disabled:opacity-70"
                                            aria-label={`Remove ${it.product_name}${it.variation ? ` (${it.variation})` : ''} from wish`}
                                            title="Remove item"
                                          >
                                            {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="min-w-0 flex-1">
                                  {items.length === 1 ? (
                                    (() => {
                                      const it = items[0];
                                      const weight = it.weight || it.variation || null;
                                      const servings = weight ? inferServingsFromWeight(weight) : null;
                                      const parts = [];
                                      if (typeof it.price === 'number') parts.push({ text: formatPrice(it.price), isPrice: true });
                                      if (weight) parts.push({ text: weight });
                                      if (servings) parts.push({ text: servings });
                                      parts.push({ text: '1 Tier' });
                                      return (
                                        <div>
                                          <p className="text-sm font-medium text-white truncate">{it.product_name}</p>
                                          <p className="mt-1 text-xs text-gray-400">
                                            {parts.map((part, i) => (
                                              <span key={i}>
                                                {i > 0 && <span className="text-gray-500 mx-1">·</span>}
                                                {part.isPrice ? <span className="text-amber-400 font-semibold">{part.text}</span> : part.text}
                                              </span>
                                            ))}
                                          </p>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    productGroups.map(([pid, g]) => (
                                      <div key={pid} className="mb-2 last:mb-0">
                                        <p className="text-sm font-medium text-white truncate">{g.product_name}</p>
                                        {g.variations.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                            {g.variations.map((v, i) => (
                                              <span key={i} className="inline-flex px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400/90 text-xs font-medium ring-1 ring-amber-500/20">
                                                {v}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                              {w.occasion && <p className="text-gray-500 text-xs mt-1">{w.occasion}</p>}
                            </>
                          ) : (
                            <p className="text-gray-400 text-sm mb-2">{w.item_count} items{w.occasion && ` · ${w.occasion}`}</p>
                          )}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                            <button type="button" onClick={() => setOpenWishModal(w)} className="text-amber-400 text-sm hover:underline font-medium">Open</button>
                            <button onClick={() => { if (wishUrl) window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + wishUrl)}`, '_blank'); }} className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-500/90 hover:text-green-400 inline-flex items-center justify-center" aria-label="Share on WhatsApp" title="WhatsApp">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            </button>
                            <button onClick={async () => { if (typeof navigator !== 'undefined' && navigator.share && wishUrl) { try { await navigator.share({ title: 'Midnight Wish', text: shareText, url: wishUrl }); showSuccess('Shared!', ''); } catch (e) { if (e?.name !== 'AbortError') { navigator.clipboard?.writeText(wishUrl); showSuccess('Link copied', ''); } } } else if (wishUrl) { navigator.clipboard?.writeText(wishUrl); showSuccess('Copied!', 'Link copied'); } }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white" aria-label="Share link" title="Share"><Share2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteConfirmWishId(w.id)} disabled={deletingWishId === w.id} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 disabled:opacity-50" aria-label="Delete wish" title="Delete wish">
                              {deletingWishId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Portals: render modals on document.body so they are not clipped by overflow-hidden */}
            {typeof document !== 'undefined' && deleteConfirmWishId != null && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60" onClick={() => setDeleteConfirmWishId(null)} role="dialog" aria-modal="true" aria-labelledby="delete-wish-title">
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1f] shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                  <h3 id="delete-wish-title" className="text-lg font-semibold text-white text-center mb-2">Delete this wish?</h3>
                  <p className="text-gray-400 text-sm text-center mb-6">The share link will stop working. This can&apos;t be undone.</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmWishId(null)}
                      className="flex-1 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteWish(deleteConfirmWishId)}
                      disabled={deletingWishId !== null}
                      className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50"
                    >
                      {deletingWishId === deleteConfirmWishId ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
            {typeof document !== 'undefined' && deleteSuccessShow && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true" aria-labelledby="delete-success-title">
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1f] shadow-xl p-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <h3 id="delete-success-title" className="text-lg font-semibold text-white text-center mb-2">Wish deleted</h3>
                  <p className="text-gray-400 text-sm text-center mb-6">The wish has been removed.</p>
                  <button
                    type="button"
                    onClick={() => setDeleteSuccessShow(false)}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-medium"
                  >
                    OK
                  </button>
                </div>
              </div>,
              document.body
            )}

            {/* Open Wish popup: view wish + share on same page */}
            {typeof document !== 'undefined' && openWishModal != null && createPortal(
              (() => {
                const w = openWishModal;
                const wishUrl = typeof window !== 'undefined' ? `${window.location.origin}/midnight-wish/wish/${w.public_id}` : '';
                const shareText = 'Fulfill my Midnight Wish 🎂 – order this cake for me!';
                const items = w.items || [];
                return (
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70"
                    onClick={() => setOpenWishModal(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="open-wish-modal-title"
                  >
                    <div
                      className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1f] shadow-xl p-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-start gap-2 mb-4">
                        <h2 id="open-wish-modal-title" className="text-lg font-bold text-white">Your wish</h2>
                        <button type="button" onClick={() => setOpenWishModal(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white" aria-label="Close">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      {w.occasion && <p className="text-amber-400/90 text-sm font-medium mb-1">{w.occasion}</p>}
                      {w.message && w.message.trim() && <p className="text-gray-300 text-sm mb-3">{w.message.trim()}</p>}
                      {items.length > 0 && (
                        <ul className="space-y-1.5 mb-4 text-sm text-gray-300">
                          {items.map((it) => (
                            <li key={it.id} className="flex justify-between gap-2">
                              <span className="truncate">{it.product_name}</span>
                              {(it.weight || it.variation) && <span className="text-amber-400/90 flex-shrink-0">{it.weight || it.variation}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-gray-400 text-xs mb-2">Share this link</p>
                      <div className="flex gap-2 mb-3">
                        <input readOnly value={wishUrl} className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm" />
                        <button
                          type="button"
                          onClick={() => { if (wishUrl) { navigator.clipboard?.writeText(wishUrl); showSuccess('Copied!', 'Link copied'); } }}
                          className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-medium hover:bg-amber-500/30 flex-shrink-0"
                        >
                          <Copy className="w-4 h-4 inline mr-1" /> Copy
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => { if (wishUrl) window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + wishUrl)}`, '_blank'); }}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/50 text-green-400 hover:bg-green-500/10 font-medium"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={async () => { if (typeof navigator !== 'undefined' && navigator.share && wishUrl) { try { await navigator.share({ title: 'Midnight Wish', text: shareText, url: wishUrl }); showSuccess('Shared!', ''); } catch (e) { if (e?.name !== 'AbortError') { navigator.clipboard?.writeText(wishUrl); showSuccess('Link copied', ''); } } } else if (wishUrl) { navigator.clipboard?.writeText(wishUrl); showSuccess('Copied!', 'Link copied'); } }}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 font-medium"
                        >
                          <Share2 className="w-5 h-5" /> Share
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })(),
              document.body
            )}

            {draftItems.length > 0 && (
              <>
                {typeof document !== 'undefined' && removeDraftItemConfirm && createPortal(
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60" onClick={() => setRemoveDraftItemConfirm(null)} role="dialog" aria-modal="true" aria-labelledby="remove-draft-item-title">
                    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1f] shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                      </div>
                      <h3 id="remove-draft-item-title" className="text-lg font-semibold text-white text-center mb-2">Remove from your wish?</h3>
                      <p className="text-gray-400 text-sm text-center mb-6">This cake will be removed from your wish. You can add it again anytime.</p>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setRemoveDraftItemConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 font-medium">Cancel</button>
                        <button type="button" onClick={() => { removeFromDraft(removeDraftItemConfirm.productId, removeDraftItemConfirm.variantId); setRemoveDraftItemConfirm(null); }} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium">Remove</button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
                <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[#0d0d12]/95 backdrop-blur-sm safe-area-pb w-full">
                  <div className="w-full px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-gray-400 text-sm text-center sm:text-left">
                      {draftItems.length === 1
                        ? '1 item is waiting to complete someone\'s wish'
                        : `${draftItems.length} items are waiting to complete someone's wish`}
                    </p>
                    <button
                      onClick={() => { const draft = getMidnightWishDraft(); if (draft.length > 0) setDraftItems(draft); setStep('cakes'); }}
                      className="w-full sm:w-auto sm:min-w-[180px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-bold text-[15px] tracking-tight shrink-0"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Continue to wish
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {/* No site footer on Midnight Wish Home – cleaner UX with or without draft */}
      </div>
    );
  }

  // ——— Authenticated Home: "Your wish is ready" (created from Home, skip Step 2) ———
  if (isAuthenticated && step === null && createdWish) {
    const firstItem = draftItems?.[0] ?? null;
    const shareCardImage = firstItem ? resolveImageUrl(firstItem.image_url) : null;
    const displayMessage = (message && message.trim()) ? message.trim() : 'Someone, fulfill my Midnight Wish 🎂✨';
    const displayOccasion = (occasion && occasion.trim()) ? occasion.trim() : '';

    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100 pb-24">
        <Header />
        <LocationBar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => resetFlow(true)} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors" aria-label="Back">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-amber-400 text-sm font-medium">Step 3 of 3 · Final</span>
            <div className="flex-1 h-1 rounded-full bg-white/10">
              <div className="h-full w-full rounded-full bg-amber-500/60" />
            </div>
          </div>
          <div className="max-w-lg mx-auto space-y-6">
            {/* Success header */}
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
                  <Check className="w-4 h-4" />
                </span>
                Your wish is ready!
              </div>
              <p className="text-gray-500 text-xs mt-2">Link copied – paste in WhatsApp, message, or email.</p>
            </div>

            {/* Wish card */}
            <div ref={shareCardRef} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] shadow-xl">
              <div className="aspect-[4/3] sm:aspect-video bg-white/5 relative">
                {shareCardImage ? (
                  <img src={shareCardImage} alt="Your wish" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-indigo-500/20">
                    <Star className="w-20 h-20 text-amber-400/80" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  {displayOccasion && <p className="text-amber-400 font-semibold text-sm mb-1">{displayOccasion}</p>}
                  <p className="text-lg font-bold leading-snug">{displayMessage}</p>
                  <p className="text-white/80 text-xs mt-1.5">Share this link. Someone special can fulfill it.</p>
                  <p className="text-white/50 text-[10px] mt-2 uppercase tracking-wider">Creamingo · Midnight Wish</p>
                </div>
              </div>
            </div>

            {/* Share panel – one card for all actions */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <button
                type="button"
                onClick={handleDownloadCard}
                disabled={downloadingCard}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold text-sm disabled:opacity-50 transition-colors"
              >
                {downloadingCard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloadingCard ? 'Preparing...' : 'Download card'}
              </button>

              <div className="border-t border-white/10 pt-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Share your wish link</p>
                <div className="flex gap-2 items-center">
                  <input readOnly value={getShareUrl()} className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs truncate focus:outline-none" />
                  <button
                    onClick={copyShareUrl}
                    className={`flex-shrink-0 h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold min-w-[100px] transition-colors ${linkCopyFeedbackUntil > 0 ? 'bg-green-600 text-white ring-2 ring-green-400/50 ring-offset-2 ring-offset-[#0d0d12]' : 'bg-amber-500 hover:bg-amber-400 text-[#0d0d12]'}`}
                  >
                    {linkCopyFeedbackUntil > 0 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {linkCopyFeedbackUntil > 0 ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <input readOnly value={getShortShareUrl()} className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-mono truncate focus:outline-none" />
                  <button
                    onClick={copyShortShareUrl}
                    className={`flex-shrink-0 h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-medium min-w-[72px] transition-colors ${shortLinkCopyFeedbackUntil > 0 ? 'bg-green-600 text-white ring-2 ring-green-400/50 ring-offset-2 ring-offset-[#0d0d12]' : 'border border-white/15 text-gray-400 hover:bg-white/10'}`}
                  >
                    {shortLinkCopyFeedbackUntil > 0 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {shortLinkCopyFeedbackUntil > 0 ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {canNativeShare && (
                  <button onClick={handleNativeShare} className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 text-gray-300 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                )}
                <button onClick={shareOnWhatsApp} className={`${canNativeShare ? 'flex-1' : 'w-full'} h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/40 text-green-400 hover:bg-green-500/10 text-sm font-medium transition-colors`}>
                  Share on WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Sticky footer: single CTA, no duplicate Copy link */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[#0d0d12]/95 backdrop-blur-sm safe-area-pb w-full">
          <div className="w-full px-4 py-2.5 flex justify-center">
            <button onClick={resetFlow} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 hover:text-white text-sm font-medium">
              Create another wish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ——— Step 1: Wish type (with Skip) ———
  if (step === 'type') {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100">
        <Header />
        <LocationBar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <button onClick={() => setStep(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full px-3 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30">Step 1 of 3</span>
            <div className="flex-1 h-1 rounded-full bg-white/10">
              <div className="h-full w-1/3 rounded-full bg-amber-500/60" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Choose your wish type</h2>
          <p className="text-gray-400 mb-6">Pick an occasion so someone special knows what it’s for (optional)</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {WISH_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setWishType(t);
                  setOccasion(t.occasion);
                  setStep('cakes');
                }}
                className="p-5 rounded-2xl border-2 border-white/10 bg-white/5 hover:border-amber-400/50 hover:bg-amber-500/10 hover:scale-[1.02] text-left transition-all duration-200 group"
              >
                <span className="text-2xl mb-2 block">{t.emoji}</span>
                <span className="text-white font-semibold text-sm block mb-2">{t.label}</span>
                <span className="block pl-2.5 py-1 pr-1 rounded-r-md border-l-2 border-amber-500/40 bg-amber-500/5 text-[11px] sm:text-xs text-amber-100/90 leading-snug group-hover:border-amber-400/60 group-hover:bg-amber-500/10 transition-colors">
                  {t.microLabel}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setWishType(null);
              setOccasion('');
              setStep('cakes');
            }}
            className="text-gray-500 hover:text-amber-400 text-sm font-medium transition-colors"
          >
            Skip – just pick cakes
          </button>
        </div>
        <MobileFooter />
      </div>
    );
  }

  // ——— Step 2: Pick cakes (curated first, search more secondary) ———
  if (step === 'cakes') {
    const firstItem = draftItems?.[0] ?? null;
    const shareCardImage = firstItem ? resolveImageUrl(firstItem.image_url) : null;
    const displayMessage = (message && message.trim()) ? message.trim() : 'Someone, fulfill my Midnight Wish 🎂✨';
    const displayOccasion = (occasion && occasion.trim()) ? occasion.trim() : '';

    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100 pb-24">
        <Header />
        <LocationBar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          {createdWish ? (
            /* Success state: same page (Step 2), share card + share panel */
            <>
<button onClick={() => resetFlow(true)} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors" aria-label="Back">
              <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-amber-400 text-sm font-medium">Step 3 of 3 · Final</span>
                <div className="flex-1 h-1 rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-amber-500/60" />
                </div>
              </div>
              <div className="max-w-lg mx-auto space-y-6">
              {/* Success header */}
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
                    <Check className="w-4 h-4" />
                  </span>
                  Your wish is ready!
                </div>
                <p className="text-gray-500 text-xs mt-2">Link copied – paste in WhatsApp, message, or email.</p>
              </div>

              {/* Wish card */}
              <div ref={shareCardRef} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] shadow-xl">
                <div className="aspect-[4/3] sm:aspect-video bg-white/5 relative">
                  {shareCardImage ? (
                    <img src={shareCardImage} alt="Your wish" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-indigo-500/20">
                      <Star className="w-20 h-20 text-amber-400/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    {displayOccasion && <p className="text-amber-400 font-semibold text-sm mb-1">{displayOccasion}</p>}
                    <p className="text-lg font-bold leading-snug">{displayMessage}</p>
                    <p className="text-white/80 text-xs mt-1.5">Share this link. Someone special can fulfill it.</p>
                    <p className="text-white/50 text-[10px] mt-2 uppercase tracking-wider">Creamingo · Midnight Wish</p>
                  </div>
                </div>
              </div>

              {/* Share panel – one card for all actions */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={downloadingCard}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold text-sm disabled:opacity-50 transition-colors"
                >
                  {downloadingCard ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloadingCard ? 'Preparing...' : 'Download card'}
                </button>

                <div className="border-t border-white/10 pt-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Share your wish link</p>
                  <div className="flex gap-2 items-center">
                    <input readOnly value={getShareUrl()} className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs truncate focus:outline-none" />
                    <button
                      onClick={copyShareUrl}
                      className={`flex-shrink-0 h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold min-w-[100px] transition-colors ${linkCopyFeedbackUntil > 0 ? 'bg-green-600 text-white ring-2 ring-green-400/50 ring-offset-2 ring-offset-[#0d0d12]' : 'bg-amber-500 hover:bg-amber-400 text-[#0d0d12]'}`}
                    >
                      {linkCopyFeedbackUntil > 0 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {linkCopyFeedbackUntil > 0 ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input readOnly value={getShortShareUrl()} className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-mono truncate focus:outline-none" />
                    <button
                      onClick={copyShortShareUrl}
                      className={`flex-shrink-0 h-10 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-medium min-w-[72px] transition-colors ${shortLinkCopyFeedbackUntil > 0 ? 'bg-green-600 text-white ring-2 ring-green-400/50 ring-offset-2 ring-offset-[#0d0d12]' : 'border border-white/15 text-gray-400 hover:bg-white/10'}`}
                    >
                      {shortLinkCopyFeedbackUntil > 0 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {shortLinkCopyFeedbackUntil > 0 ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {canNativeShare && (
                    <button onClick={handleNativeShare} className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 text-gray-300 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  )}
                  <button onClick={shareOnWhatsApp} className={`${canNativeShare ? 'flex-1' : 'w-full'} h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/40 text-green-400 hover:bg-green-500/10 text-sm font-medium transition-colors`}>
                    Share on WhatsApp
                  </button>
                </div>
              </div>
            </div>
            </>
          ) : (
            <>
          <button
            onClick={() => { setStep('type'); setDraftItems(getMidnightWishDraft()); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-200/90 hover:bg-amber-500/15 hover:border-amber-500/50 hover:text-amber-100 font-medium text-sm transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Choose your occasion type
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400 text-sm font-medium">Step 2 of 3</span>
            <div className="flex-1 h-1 rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-amber-500/60" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Pick cakes for your wish</h2>
          <p className="text-gray-400 mb-6">Tap to add. At least one cake.</p>

          {wishType && (
            <p className="text-amber-400/90 text-sm font-medium mb-4">{wishType.emoji} {wishType.label}</p>
          )}

          {/* Curated carousel */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-400 mb-3">Popular picks</p>
            {curatedLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-10 h-10 text-amber-400 animate-spin" /></div>
            ) : curatedProducts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-gray-400 mb-3">No popular picks right now.</p>
                <button
                  type="button"
                  onClick={() => setShowSearchMore(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-semibold text-sm"
                >
                  <Search className="w-4 h-4" />
                  Search cakes
                </button>
                <span className="text-gray-500 text-sm mx-2">or</span>
                <button
                  type="button"
                  onClick={() => router.push('/category/cakes-by-flavor')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 text-gray-400 hover:bg-white/10 font-medium text-sm"
                >
                  Browse cakes
                </button>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                {curatedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex-shrink-0 w-[160px] sm:w-[180px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                  >
                    <div className="aspect-square bg-white/5 cursor-pointer" onClick={() => router.push(`/product/${p.slug || p.id}`)}>
                      <img src={resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-white font-medium text-sm line-clamp-2">{p.name}</p>
                      <p className="text-amber-400 text-xs mt-1">₹{Number(p.discounted_price ?? p.base_price ?? 0).toFixed(0)}</p>
                      <button onClick={() => setAddToWishModalProduct(p)} className="mt-2 w-full py-2 rounded-xl bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 flex items-center justify-center gap-1">
                        <Plus className="w-4 h-4" /> Add to wish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search more (secondary) */}
          <div className="mb-8">
            <button
              onClick={() => setShowSearchMore((v) => !v)}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium"
            >
              <Search className="w-4 h-4" />
              {showSearchMore ? 'Hide search' : 'Search more cakes'}
              <ChevronRight className={`w-4 h-4 transition-transform ${showSearchMore ? 'rotate-90' : ''}`} />
            </button>
            {showSearchMore && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  placeholder="Chocolate, Birthday..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button onClick={runSearch} disabled={searching} className="px-4 py-2.5 rounded-xl bg-white/10 text-gray-300 font-medium disabled:opacity-50">
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                </button>
              </div>
            )}
            {showSearchMore && searchResults.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {searchResults.map((p) => (
                  <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
                    <div className="aspect-square cursor-pointer" onClick={() => router.push(`/product/${p.slug || p.id}`)}>
                      <img src={resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2">
                      <p className="text-white text-sm font-medium line-clamp-2">{p.name}</p>
                      <p className="text-amber-400 text-xs">₹{Number(p.discounted_price ?? p.base_price ?? 0).toFixed(0)}</p>
                      <button onClick={() => setAddToWishModalProduct(p)} className="mt-2 w-full py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 flex items-center justify-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional message (merged into this step) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Add a message (optional)</label>
            <p className="text-xs text-gray-500 mb-3">Tap a suggestion or write your own message to someone special 💌</p>
            <div className="space-y-1 mb-3">
              {MESSAGE_SUGGESTIONS_BY_CATEGORY.map(({ tag, messages }, index) => {
                const isExpanded = expandedMessageCategoryIndex === index;
                return (
                  <div key={tag} className="rounded-xl border border-white/10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedMessageCategoryIndex(index)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-sm font-medium text-amber-400/90">{tag}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2 border-t border-white/10 bg-white/[0.02]">
                        {messages.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setMessage(suggestion)}
                            className="px-3 py-1.5 rounded-lg text-sm border border-white/20 text-gray-300 hover:border-amber-500/50 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="relative">
              <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Or type your own message..."
                maxLength={100}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Create my wish moved to sticky footer below */}
            </>
          )}

          {/* Remove-from-wish confirmation modal (Step 2 – Your wish) */}
          {typeof document !== 'undefined' && removeDraftItemConfirm && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60" onClick={() => setRemoveDraftItemConfirm(null)} role="dialog" aria-modal="true" aria-labelledby="remove-draft-item-title">
              <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a1f] shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <h3 id="remove-draft-item-title" className="text-lg font-semibold text-white text-center mb-2">Remove from your wish?</h3>
                <p className="text-gray-400 text-sm text-center mb-6">This cake will be removed from your wish. You can add it again anytime.</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRemoveDraftItemConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeFromDraft(removeDraftItemConfirm.productId, removeDraftItemConfirm.variantId);
                      setRemoveDraftItemConfirm(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Add to Wish modal: PDP-style with images, weight, tier, serving */}
          {typeof document !== 'undefined' && addToWishModalProduct != null && createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70"
              onClick={() => setAddToWishModalProduct(null)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-to-wish-modal-title"
            >
              <div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1f] shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {addToWishModalLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-10 h-10 animate-spin text-amber-400" />
                  </div>
                ) : addToWishModalFull ? (
                  (() => {
                    const full = addToWishModalFull;
                    const allImages = [full.image_url, ...(full.gallery_images || [])].filter(Boolean).map(resolveImageUrl);
                    const mainImage = allImages[addToWishModalImageIndex] || allImages[0];
                    const baseWeight = full.base_weight ?? full.variants?.[0]?.weight ?? null;
                    const variants = full.variants || [];
                    const currentWeightRaw = addToWishModalVariant?.weight ?? baseWeight;
                    const currentWeight = currentWeightRaw != null && currentWeightRaw !== '' ? String(currentWeightRaw).trim() : null;
                    const tierOptions = getAvailableTiersForWeight(currentWeight);
                    const selectedTier = addToWishModalTier || tierOptions[0];
                    const servingText = inferServingsFromWeight(currentWeight);
                    const actualPrice = addToWishModalVariant
                      ? (addToWishModalVariant.price ?? full.base_price)
                      : (full.base_price ?? 0);
                    const discountedPrice = addToWishModalVariant
                      ? (addToWishModalVariant.discount_percent > 0 ? (addToWishModalVariant.discounted_price ?? addToWishModalVariant.price) : addToWishModalVariant.price)
                      : (full.discount_percent > 0 ? (full.discounted_price ?? full.base_price) : full.base_price);
                    let discountPercent = addToWishModalVariant
                      ? (addToWishModalVariant.discount_percent ?? 0)
                      : (full.discount_percent ?? 0);
                    if (discountPercent <= 0 && actualPrice > 0 && (addToWishModalVariant?.discounted_price ?? full.discounted_price) < actualPrice) {
                      discountPercent = Math.round(((actualPrice - discountedPrice) / actualPrice) * 100);
                    }
                    const hasDiscount = discountPercent > 0;
                    const productForDraft = {
                      id: full.id,
                      name: full.name,
                      slug: full.slug,
                      image_url: full.image_url,
                      base_price: full.base_price,
                      discounted_price: full.discounted_price ?? full.base_price
                    };
                    const variantForDraft = addToWishModalVariant
                      ? {
                          id: addToWishModalVariant.id,
                          name: addToWishModalVariant.name,
                          weight: addToWishModalVariant.weight,
                          price: addToWishModalVariant.price,
                          discounted_price: addToWishModalVariant.discounted_price ?? addToWishModalVariant.price
                        }
                      : null;
                    const isEditMode = addToWishModalEditIndex !== null;
                    const draftOptions = { weight: currentWeight ?? undefined, tier: selectedTier ?? undefined };
                    const handleAddToWish = () => {
                      if (isEditMode) {
                        const currentQty = draftItems[addToWishModalEditIndex]?.quantity ?? 1;
                        updateDraftAtIndex(addToWishModalEditIndex, productForDraft, variantForDraft, currentQty, draftOptions);
                        showSuccess('Wish updated', `${full.name} updated in your wish`);
                      } else {
                        addToDraft(productForDraft, variantForDraft, 1, draftOptions);
                      }
                      setAddToWishModalProduct(null);
                    };
                    return (
                      <>
                        <div className="sticky top-0 flex justify-end p-2 bg-[#1a1a1f] border-b border-white/5 z-10">
                          <button
                            type="button"
                            onClick={() => setAddToWishModalProduct(null)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                            aria-label="Close"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-4 sm:p-6">
                          <div className="flex gap-4 mb-6">
                            <div className="flex flex-col gap-2 w-16 flex-shrink-0">
                              {allImages.map((src, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setAddToWishModalImageIndex(i)}
                                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 ${addToWishModalImageIndex === i ? 'border-amber-500' : 'border-white/10'}`}
                                >
                                  <img src={src} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                            <div className="flex-1 min-w-0 aspect-square max-w-sm rounded-xl overflow-hidden bg-white/5">
                              {mainImage && <img src={mainImage} alt={full.name} className="w-full h-full object-cover" />}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h2 id="add-to-wish-modal-title" className="text-xl font-bold text-white">{full.name}</h2>

                            {/* Price: clear structure, catchy card */}
                            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-white/5 to-transparent p-3.5">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{currentWeight ? 'Price for' : 'Size'}</span>
                                <span className={`rounded-md px-2 py-0.5 text-sm font-bold ring-1 ${currentWeight ? 'bg-amber-500/20 text-amber-400 ring-amber-500/30' : 'bg-white/10 text-gray-400 ring-white/20'}`}>
                                  {currentWeight || 'Choose size'}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                {hasDiscount ? (
                                  <>
                                    <span className="text-sm line-through text-gray-500">{formatPrice(actualPrice)}</span>
                                    <span className="text-xl font-bold tracking-tight text-amber-400">{formatPrice(discountedPrice)}</span>
                                    <span className="rounded-md bg-red-500/90 px-2 py-0.5 text-xs font-bold text-white shadow-sm">−{Math.round(discountPercent)}%</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                                      Save {formatPrice(actualPrice - discountedPrice)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xl font-bold tracking-tight text-amber-400">{formatPrice(actualPrice)}</span>
                                )}
                              </div>
                            </div>

                            <div>
                              <p className="text-gray-400 text-sm mb-2">{currentWeight ? 'Weight' : 'Choose size'}</p>
                              <div className="flex flex-wrap gap-2">
                                {baseWeight && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAddToWishModalVariant(null);
                                      const baseTiers = getAvailableTiersForWeight(baseWeight);
                                      setAddToWishModalTier(baseTiers[0] || null);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!addToWishModalVariant ? 'bg-amber-500/30 border border-amber-500/50 text-amber-400' : 'bg-white/10 border border-white/10 text-gray-300 hover:bg-white/15'}`}
                                  >
                                    {baseWeight}
                                  </button>
                                )}
                                {variants.map((v) => (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => {
                                      setAddToWishModalVariant(v);
                                      const tiers = getAvailableTiersForWeight(v.weight);
                                      setAddToWishModalTier(tiers[0] || null);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${addToWishModalVariant?.id === v.id ? 'bg-amber-500/30 border border-amber-500/50 text-amber-400' : 'bg-white/10 border border-white/10 text-gray-300 hover:bg-white/15'}`}
                                  >
                                    {v.weight}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {(tierOptions.length > 0 || servingText) && (
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                {tierOptions.length > 0 && (
                                  <>
                                    <span className="text-gray-400 font-semibold">Tier</span>
                                    <div className="flex items-center gap-3" role="radiogroup" aria-label="Tier selection">
                                      {tierOptions.map((t) => (
                                        <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                                          <input
                                            type="radio"
                                            name="addToWishTier"
                                            value={t}
                                            checked={selectedTier === t}
                                            onChange={() => setAddToWishModalTier(t)}
                                            className="w-3.5 h-3.5 text-amber-500 border-white/30 focus:ring-amber-500"
                                          />
                                          <span className="font-medium text-white">{t}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </>
                                )}
                                {servingText && (
                                  <span className="text-gray-400"><span className="text-gray-500">Serving:</span> {servingText}</span>
                                )}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={handleAddToWish}
                              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-bold flex items-center justify-center gap-2"
                            >
                              <Heart className="w-5 h-5" />
                              {isEditMode ? 'Update your wish' : 'Add to wish'}
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="py-16 text-center text-gray-400">Could not load product.</div>
                )}
              </div>
            </div>,
            document.body
          )}

          {/* Step 2: Sticky footer – success: Create another only; draft: wish summary + Create my wish */}
          <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[#0d0d12]/95 backdrop-blur-sm safe-area-pb w-full">
            {createdWish ? (
              <div className="w-full px-4 py-2.5 flex justify-center">
                <button onClick={resetFlow} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 hover:text-white text-sm font-medium">
                  Create another wish
                </button>
              </div>
            ) : draftItems.length > 0 ? (
              <div className="w-full px-3 pt-2 pb-1.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="flex items-center gap-2 text-gray-500 text-[11px] font-semibold uppercase tracking-widest flex-shrink-0">
                    <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0" />
                    Your wish ({draftItems.length})
                  </p>
                  <div className="flex-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setWishFooterExpanded((v) => !v)}
                      className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 text-gray-400 hover:text-amber-400 hover:bg-white/15"
                      aria-expanded={wishFooterExpanded}
                      aria-label={wishFooterExpanded ? 'Collapse' : 'Expand'}
                    >
                      {wishFooterExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                  {draftItems.length > 1 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-gray-500 font-medium">{wishScrollIndex + 1} of {draftItems.length}</span>
                      <div className="flex gap-1">
                        {draftItems.map((_, i) => (
                          <span
                            key={i}
                            className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${i === wishScrollIndex ? 'bg-amber-400' : 'bg-white/30'}`}
                            aria-hidden
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {wishFooterExpanded && (
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <div
                    ref={wishScrollRef}
                    onScroll={() => {
                      const el = wishScrollRef.current;
                      if (!el || draftItems.length <= 1) return;
                      const cardWidthPx = typeof window !== 'undefined' ? window.innerWidth * 0.75 : 280;
                      const gapPx = 8;
                      const index = Math.min(Math.round(el.scrollLeft / (cardWidthPx + gapPx)), draftItems.length - 1);
                      setWishScrollIndex(index);
                    }}
                    className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 px-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {draftItems.map((item, index) => {
                      const weight = item.weight || null;
                      const servings = weight ? inferServingsFromWeight(weight) : null;
                      const tier = item.tier || '1 Tier';
                      const detailParts = [];
                      detailParts.push(`₹${Number(item.discounted_price ?? item.base_price ?? 0).toFixed(0)}`);
                      detailParts.push(weight || '—');
                      detailParts.push(servings || '—');
                      detailParts.push(tier.includes('Tier') ? tier : `${tier} Tier`);
                      return (
                        <div
                          key={`${item.product_id}-${item.variant_id ?? 'b'}-${index}`}
                          data-wish-card
                          className="flex items-start gap-2 flex-shrink-0 w-[75vw] min-w-[75vw] max-w-[75vw] snap-start rounded-lg bg-white/5 border border-white/10 p-2"
                        >
                          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                            <img src={resolveImageUrl(item.image_url)} alt={item.product_name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-end gap-1">
                              <p className="text-white text-xs font-semibold tracking-tight leading-tight truncate flex-1 min-w-0 text-left">{item.product_name}</p>
                              <button
                                type="button"
                                onClick={() => openAddToWishModalForEdit(index)}
                                className="p-1 text-gray-400 hover:text-amber-400 flex-shrink-0"
                                aria-label="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemoveDraftItemConfirm({ productId: item.product_id, variantId: item.variant_id, productName: item.product_name })}
                                className="p-1 text-gray-400 hover:text-red-400 flex-shrink-0"
                                aria-label="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-gray-500 text-[10px] mt-0.5 tracking-tight truncate tabular-nums">{detailParts.join(' · ')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {message && message.trim() && (
                    <div className="border-t border-white/10 px-2.5 py-1.5 bg-white/[0.03]">
                      <p className="text-[10px] text-gray-400 truncate" title={message.trim()}>Message — {message.trim()}</p>
                    </div>
                  )}
                </div>
                )}
              </div>
            ) : null}
            {!createdWish && (
            <div className="w-full px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-3">
              {draftItems.length === 0 && (
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-gray-500 text-xs sm:text-sm font-medium tracking-wide">Add at least one cake to continue</p>
                  <p className="text-gray-600 text-xs">Tap &apos;Add to wish&apos; on any cake above.</p>
                </div>
              )}
              <button
                onClick={handleCreateWish}
                disabled={draftItems.length === 0 || creating}
                className="w-full sm:flex-1 sm:max-w-md inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#0d0d12] font-bold text-[15px] tracking-tight shrink-0"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                {creating ? 'Creating...' : 'Create my wish'}
              </button>
            </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

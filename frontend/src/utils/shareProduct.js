/**
 * Share a product URL. Uses Web Share API when appropriate, otherwise platform-specific URLs or clipboard.
 * @param {{ slug: string, name?: string }} product
 * @param {'quick' | 'whatsapp' | 'instagram' | 'facebook' | 'copy' | 'native'} platform
 * @returns {Promise<{ ok: boolean, method?: string, cancelled?: boolean }>}
 */
export async function shareProduct(product, platform) {
  if (typeof window === 'undefined' || !product?.slug) {
    return { ok: false };
  }

  const url = `${window.location.origin}/product/${product.slug}`;
  const title = product.name || 'Product';
  const text = `Check out ${title} on Creamingo`;

  const copyUrl = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      return true;
    } finally {
      document.body.removeChild(ta);
    }
  };

  // Mobile hero: prefer native share sheet, then clipboard
  if (platform === 'quick') {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        return { ok: true, method: 'share' };
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return { ok: false, cancelled: true };
        }
        // User gesture or API not available; fall through to copy
      }
    }
    const copied = await copyUrl();
    return copied ? { ok: true, method: 'clipboard' } : { ok: false };
  }

  if (platform === 'whatsapp') {
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    return { ok: true, method: 'whatsapp' };
  }

  if (platform === 'facebook') {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    return { ok: true, method: 'facebook' };
  }

  if (platform === 'native') {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return { ok: true, method: 'share' };
      } catch (err) {
        if (err && err.name === 'AbortError') {
          return { ok: false, cancelled: true };
        }
      }
    }
    return { ok: false };
  }

  if (platform === 'instagram') {
    const copied = await copyUrl();
    return copied ? { ok: true, method: 'clipboard-instagram' } : { ok: false };
  }

  if (platform === 'copy') {
    const copied = await copyUrl();
    return copied ? { ok: true, method: 'clipboard' } : { ok: false };
  }

  return { ok: false };
}

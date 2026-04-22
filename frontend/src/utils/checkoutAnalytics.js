/**
 * Lightweight checkout product/analytics hooks (P9).
 * Extend with GTM / gtag / Plausible by listening to `creamingo:checkout` on window
 * or pushing to dataLayer when present.
 */
export function trackCheckoutEvent(eventName, payload = {}) {
  if (typeof window === 'undefined') return;
  const enriched = { event: eventName, ...payload, t: Date.now() };
  try {
    window.dispatchEvent(new CustomEvent('creamingo:checkout', { detail: enriched }));
  } catch {
    /* ignore */
  }
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  } catch {
    /* ignore */
  }
  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...payload });
    }
  } catch {
    /* ignore */
  }
}

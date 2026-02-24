/**
 * Reorder: add order items to cart by fetching products and calling addToCart.
 * Use from order detail or list; then redirect to /cart.
 *
 * @param {Object} order - Order with items[] (each: product_id, variant_id, quantity, tier, cake_message)
 * @param {Function} addToCart - CartContext.addToCart (supports object form and suppressToast)
 * @param {Object} productApi - productApi.getProductById
 * @param {Object} [options] - { suppressToast: boolean }
 * @returns {Promise<{ added: number, skipped: number, errors: string[] }>}
 */
export async function reorderOrderToCart(order, addToCart, productApi, options = {}) {
  const { suppressToast = true } = options;
  const items = order?.items || [];
  const result = { added: 0, skipped: 0, errors: [] };

  if (items.length === 0) {
    result.errors.push('No items in this order');
    return result;
  }

  for (const orderItem of items) {
    const productId = orderItem.product_id;
    if (!productId) {
      result.skipped += 1;
      result.errors.push(`Item "${orderItem.product_name || 'Unknown'}" has no product ID`);
      continue;
    }

    try {
      const product = await productApi.getProductById(productId);
      if (!product || !product.id) {
        result.skipped += 1;
        result.errors.push(`Product "${orderItem.product_name || productId}" not found`);
        continue;
      }

      const variantId = orderItem.variant_id;
      const variant = Array.isArray(product.variants) && variantId
        ? product.variants.find((v) => v.id === variantId || v.id === Number(variantId))
        : null;

      const cartPayload = {
        product,
        variant: variant || null,
        quantity: orderItem.quantity ?? 1,
        flavor: null,
        tier: orderItem.tier || null,
        deliverySlot: null,
        cakeMessage: orderItem.cake_message && String(orderItem.cake_message).trim() ? orderItem.cake_message : null,
        combos: [], // Reorder does not re-add combo selections; user can add on product page
      };

      const addResult = addToCart(cartPayload, undefined, undefined, undefined, undefined, null, null, null, suppressToast);
      if (addResult?.success) {
        result.added += 1;
      } else {
        result.skipped += 1;
        if (addResult?.error && !addResult?.isDuplicate) {
          result.errors.push(addResult.error);
        }
      }
    } catch (err) {
      result.skipped += 1;
      result.errors.push(err.message || `Failed to add ${orderItem.product_name || productId}`);
    }
  }

  return result;
}

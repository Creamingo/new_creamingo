'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Package, Sparkles } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/priceFormatter';
import { resolveImageUrl } from '../utils/imageUrl';
import ConfirmModal from './ConfirmModal';

const CartDisplay = ({ isOpen, onClose }) => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartSummary,
    isLoading 
  } = useCart();

  const [isClearing, setIsClearing] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    variant: 'danger',
    onConfirm: null
  });

  const openConfirmModal = (options) => {
    setConfirmModal(prev => ({ ...prev, open: true, ...options }));
  };
  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, open: false, onConfirm: null }));
  };
  const handleConfirmModalConfirm = () => {
    confirmModal.onConfirm?.();
    closeConfirmModal();
  };

  const handleClearCart = async () => {
    openConfirmModal({
      title: 'Clear cart?',
      message: 'Are you sure you want to clear your cart? All items will be removed.',
      confirmLabel: 'Clear cart',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        setIsClearing(true);
        try {
          clearCart();
        } finally {
          setIsClearing(false);
        }
      }
    });
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    openConfirmModal({
      title: 'Remove item?',
      message: 'Remove this item from cart?',
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      variant: 'danger',
      onConfirm: () => removeFromCart(itemId)
    });
  };

  const cartSummary = getCartSummary();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Cart</h2>
                <p className="text-blue-100">
                  {cartSummary.totalItems} item{cartSummary.totalItems !== 1 ? 's' : ''} 
                  {cartSummary.totalCombos > 0 && ` • ${cartSummary.totalCombos} combo${cartSummary.totalCombos !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
          {/* Cart Items */}
          <div className="flex-1 p-6 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600">Add some delicious cakes to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
                  >
                    {/* Main Product Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={resolveImageUrl(item.product.image_url)}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.product.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-gray-600">Weight: {item.variant.weight}</p>
                        )}
                        {item.flavor && (
                          <p className="text-sm text-gray-600">Flavor: {item.flavor.name}</p>
                        )}
                        {item.tier && (
                          <p className="text-sm text-gray-600">Tier: {item.tier}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-blue-600">
                              {formatPrice(item.totalPrice || ((item.variant?.discounted_price || item.product.discounted_price || item.product.base_price) * item.quantity))}
                            </span>
                            {item.combos && item.combos.length > 0 && (
                              <span className="text-xs text-gray-500">
                                Includes {item.combos.length} combo item{item.combos.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Combo Items */}
                    {item.combos && item.combos.length > 0 && (
                      <div className="mt-4 pl-24">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-600">Combo Items</span>
                        </div>
                        <div className="space-y-2">
                          {item.combos.map((combo, index) => {
                            // Calculate correct unit price (discounted or regular)
                            const comboUnitPrice = combo.unitPrice !== undefined 
                              ? combo.unitPrice 
                              : ((combo.discount_percentage > 0 || (combo.discounted_price && combo.discounted_price < combo.price))
                                  ? (combo.discounted_price || combo.price)
                                  : combo.price);
                            const comboItemTotal = comboUnitPrice * combo.quantity;
                            
                            return (
                              <div
                                key={combo.id || index}
                                className="flex items-center justify-between bg-purple-50 rounded-lg p-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-medium text-gray-900">{combo.product_name}</span>
                                  <span className="text-xs text-gray-500">× {combo.quantity}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {combo.discounted_price && combo.discounted_price < combo.price && (
                                    <span className="text-xs text-gray-400 line-through">
                                      {formatPrice(combo.price * combo.quantity)}
                                    </span>
                                  )}
                                  <span className="text-sm font-medium text-purple-600">
                                    {formatPrice(comboItemTotal)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Delivery Slot */}
                    {item.deliverySlot && (
                      <div className="mt-3 pl-24">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Delivery:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {item.deliverySlot.date} at {item.deliverySlot.time}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Cake Message */}
                    {item.cakeMessage && (
                      <div className="mt-3 pl-24">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Message:</span>
                          <span className="text-sm font-medium text-gray-900">"{item.cakeMessage}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-200 p-6">
            <div className="sticky top-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No items in your cart</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items ({cartSummary.totalItems})</span>
                      <span className="font-medium">{formatPrice(cartSummary.totalPrice)}</span>
                    </div>
                    {cartSummary.totalCombos > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Combos ({cartSummary.totalCombos})</span>
                        <span className="font-medium text-purple-600">Included</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-xl font-bold text-blue-600">{formatPrice(cartSummary.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                    >
                      Proceed to Checkout
                    </button>
                    <button
                      onClick={handleClearCart}
                      disabled={isClearing}
                      className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      {isClearing ? 'Clearing...' : 'Clear Cart'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        variant={confirmModal.variant}
        onConfirm={handleConfirmModalConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

export default CartDisplay;

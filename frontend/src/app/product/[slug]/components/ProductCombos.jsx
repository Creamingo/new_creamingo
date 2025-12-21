'use client';

import { useState, useMemo } from 'react';

const defaultCombos = [
  {
    id: 'combo-rose',
    name: 'Red Roses Bouquet',
    price: 199,
    image: '/images/combos/red-roses.png',
  },
  {
    id: 'combo-candle',
    name: 'Celebration Candle',
    price: 49,
    image: '/images/combos/candle.png',
  },
  {
    id: 'combo-card',
    name: 'Greeting Card',
    price: 79,
    image: '/images/combos/card.png',
  },
];

const ProductCombos = ({ combos = defaultCombos, onUpdate }) => {
  const [items, setItems] = useState(
    combos.map(c => ({ ...c, qty: 0, checked: false }))
  );

  const total = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.checked ? i.qty * i.price : 0), 0);
  }, [items]);

  const setQty = (id, qty) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i)));
  };

  const setChecked = (id, checked) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, checked, qty: checked && i.qty === 0 ? 1 : i.qty } : i)));
  };

  const handleSubmit = () => {
    const selected = items.filter(i => i.checked && i.qty > 0);
    onUpdate && onUpdate(selected);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-xl dark:shadow-black/20 border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>Make It a Combo</span>
          <span className="text-base">💐</span>
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Add something special to your cake order</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {items.map(item => (
          <div key={item.id} className={`relative flex flex-col rounded-lg border ${item.checked ? 'border-rose-400 dark:border-rose-500 ring-1.5 ring-rose-100 dark:ring-rose-900/30' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 overflow-hidden`}>
            <div className="aspect-square bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs select-none">
              {/* Placeholder image block; replace with real images as available */}
              <span className="px-2 text-center">{item.name}</span>
            </div>

            <div className="p-2.5 space-y-1.5">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{item.name}</div>
              <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">₹{item.price}</div>

              <div className="flex items-center justify-between gap-2">
                {/* Quantity control */}
                <div className="inline-flex items-stretch rounded-md overflow-hidden border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setQty(item.id, item.qty - 1)}
                    disabled={item.qty <= 0}
                    className={`${item.qty > 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'} px-2 py-1 text-xs sm:text-sm disabled:opacity-50`}
                  >
                    −
                  </button>
                  <div className="px-2 py-1 min-w-[26px] text-center text-xs sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{item.qty}</div>
                  <button
                    onClick={() => setQty(item.id, item.qty + 1)}
                    className="px-2 py-1 bg-rose-500 dark:bg-rose-600 text-white hover:bg-rose-600 dark:hover:bg-rose-700 text-xs sm:text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Add checkbox */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!item.checked}
                    onChange={e => setChecked(item.id, e.target.checked)}
                    className="w-4 h-4 text-rose-600 dark:text-rose-500 border-gray-300 dark:border-gray-600 rounded focus:ring-rose-500 dark:focus:ring-rose-400"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Add to Combo</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">Combo total: <span className="font-semibold text-gray-900 dark:text-gray-100">₹{total}</span></div>
        <button onClick={handleSubmit} className="px-3 py-1.5 rounded-md bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 text-sm font-medium">
          {total > 0 ? 'Update Combo' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCombos;



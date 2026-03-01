# Orders – File & structure

## Suggested structure

```
frontend/src/app/orders/
├── page.js                    # List + detail (?)order=), reorder handler, invoice
├── README.md                  # This file
└── components/
    ├── OrderDetailView.js     # Single order: header, timeline, items, delivery, payment, Reorder + Invoice
    └── OrderTimeline.js       # Status steps: Placed → Preparing → Out for delivery → Delivered

frontend/src/components/
└── OrderListCard.js           # Shared compact row card (Order #, date, status, amount, Copy ID, View Order, Reorder)

frontend/src/utils/
├── orderStatus.js             # getStatusColor(), getStatusIcon() – shared by list & detail
└── reorderToCart.js           # reorderOrderToCart(order, addToCart, productApi) – prefill cart from order
```

## Copy Order ID

- **List:** `OrderListCard` – Copy icon/button next to Order # (title: "Copy Order ID").
- **Detail:** `OrderDetailView` – "Copy ID" link next to "Order #…" in sticky header.

## Order timeline

- **Component:** `OrderTimeline.js` – status-based steps; used in `OrderDetailView` below the header.
- **Steps:** Placed → Preparing → Out for delivery → Delivered (cancelled shows "This order was cancelled").

## Reorder

- **Flow:** `reorderOrderToCart()` fetches each product by `product_id`, builds cart item (variant, tier, cake message), calls `addToCart(..., suppressToast: true)`, then page shows one toast and redirects to `/cart`.
- **Hooks:** Orders `page.js` uses `useCart()`, `useToast()`, `productApi`; `handleReorder(order)` is passed to `OrderDetailView` and `OrderListCard` (both receive full `order` for reorder).

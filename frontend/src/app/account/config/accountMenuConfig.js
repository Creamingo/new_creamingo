/**
 * Single source of truth for the Account page menu.
 * href: route path or '#sectionId' for in-page sections (orders, coupons, faqs, reviews).
 * action: 'logout' | 'deleteAccount' for special handlers.
 * badgeKey: key in badgeCounts prop (e.g. 'orders', 'coupons', 'reviews').
 */
export const accountMenuGroups = [
  {
    id: 'orders-payments',
    title: 'Orders & Payments',
    icon: 'Package',
    items: [
      { id: 'my-orders', label: 'My Orders', href: '#orders', icon: 'ShoppingBag', badgeKey: 'orders' },
      { id: 'track-order', label: 'Track Order', href: '/track-order', icon: 'Truck' },
      { id: 'invoices', label: 'Invoices', href: '#orders', icon: 'FileText' },
      { id: 'reorder', label: 'Reorder', href: '#orders', icon: 'RotateCcw' },
    ],
  },
  {
    id: 'wallet-rewards',
    title: 'Wallet & Rewards',
    icon: 'Wallet',
    items: [
      { id: 'wallet-balance', label: 'Wallet Balance', href: '/wallet', icon: 'Wallet' },
      { id: 'cashback-history', label: 'Cashback History', href: '/wallet', icon: 'History' },
      { id: 'loyalty-points', label: 'Loyalty Points', href: '/rewards', icon: 'Award' },
    ],
  },
  {
    id: 'coupons-offers',
    title: 'Coupons & Offers',
    icon: 'Tag',
    items: [
      { id: 'available-coupons', label: 'Available Coupons', href: '#coupons', icon: 'Tag', badgeKey: 'coupons' },
      { id: 'collected-coupons', label: 'Collected Coupons', href: '#coupons', icon: 'Bookmark' },
      { id: 'upcoming-deals', label: 'Upcoming Deals', href: '#coupons', icon: 'Sparkles' },
    ],
  },
  {
    id: 'addresses-delivery',
    title: 'Addresses & Delivery',
    icon: 'MapPin',
    items: [
      { id: 'saved-addresses', label: 'Saved Addresses', href: '/account/profile', icon: 'MapPin' },
      { id: 'delivery-preferences', label: 'Delivery Preferences', href: '/account/profile', icon: 'Truck' },
    ],
  },
  {
    id: 'activity-support',
    title: 'Activity & Support',
    icon: 'Headphones',
    items: [
      { id: 'my-reviews', label: 'My Reviews', href: '#reviews', icon: 'Star', badgeKey: 'reviews' },
      { id: 'raise-ticket', label: 'Raise Ticket', href: '/support', icon: 'MessageCircle' },
      { id: 'my-tickets', label: 'My Tickets', href: '/support', icon: 'Ticket' },
      { id: 'feedback', label: 'Feedback', href: '/support', icon: 'MessageSquare' },
    ],
  },
  {
    id: 'refer-earn',
    title: 'Refer & Earn',
    icon: 'Gift',
    items: [
      { id: 'refer-friends', label: 'Refer Friends', href: '/rewards', icon: 'Users' },
      { id: 'referral-rewards', label: 'Referral Rewards', href: '/rewards', icon: 'Gift' },
    ],
  },
  {
    id: 'help-policies',
    title: 'Help & Policies',
    icon: 'HelpCircle',
    items: [
      { id: 'faqs', label: 'FAQs', href: '#faqs', icon: 'HelpCircle' },
      { id: 'refund-policy', label: 'Refund Policy', href: '/refund-policy', icon: 'RefreshCw' },
      { id: 'terms', label: 'Terms & Conditions', href: '/terms', icon: 'FileText' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'Settings',
    items: [
      { id: 'notifications', label: 'Notifications', href: '/account/profile', icon: 'Bell' },
      { id: 'theme', label: 'Theme', href: '#appearance', icon: 'Palette' },
      { id: 'language', label: 'Language', href: '/account/profile', icon: 'Globe' },
      { id: 'delete-account', label: 'Delete Account', action: 'deleteAccount', icon: 'Trash2' },
      { id: 'logout', label: 'Logout', action: 'logout', icon: 'LogOut' },
    ],
  },
];

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
      { id: 'your-orders', label: 'Your Orders', href: '#orders', icon: 'ShoppingBag', badgeKey: 'orders' },
    ],
  },
  {
    id: 'wallet-coupons',
    title: 'Wallet & Coupons',
    icon: 'Wallet',
    items: [
      { id: 'wallet-balance', label: 'Wallet Balance', href: '/wallet', icon: 'Wallet' },
      { id: 'available-coupons', label: 'Available Coupons', href: '#coupons', icon: 'Tag', badgeKey: 'coupons' },
      { id: 'collected-coupons', label: 'Collected Coupons', href: '#coupons', icon: 'Bookmark' },
      { id: 'one-rs-deals-offers', label: '₹1 Deals offers', href: '#coupons', icon: 'Sparkles' },
    ],
  },
  {
    id: 'activity-support',
    title: 'Activity & Support',
    icon: 'Headphones',
    items: [
      { id: 'your-feedback', label: 'Your Feedback', href: '/support', icon: 'MessageSquare' },
      { id: 'your-reviews', label: 'Your Reviews', href: '#reviews', icon: 'Star', badgeKey: 'reviews' },
      { id: 'raise-ticket', label: 'Raise Ticket', href: '/support', icon: 'MessageCircle' },
      { id: 'your-tickets', label: 'Your Tickets', href: '/support', icon: 'Ticket' },
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
      { id: 'saved-addresses', label: 'Saved Addresses', href: '/account/profile', icon: 'MapPin' },
      { id: 'notifications', label: 'Notifications', href: '/account/profile', icon: 'Bell' },
      { id: 'theme', label: 'Theme', href: '#appearance', icon: 'Palette' },
      { id: 'language', label: 'Language', href: '/account/profile', icon: 'Globe' },
      { id: 'delete-account', label: 'Delete Account', action: 'deleteAccount', icon: 'Trash2' },
      { id: 'logout', label: 'Logout', action: 'logout', icon: 'LogOut' },
    ],
  },
];

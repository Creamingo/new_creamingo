/**
 * Seed chatbot_intents and chatbot_faqs from the default content.
 * Run: node src/scripts/seedChatbotConfig.js (from backend folder)
 * Or: node backend/src/scripts/seedChatbotConfig.js (from project root)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { query } = require('../config/db');
const { invalidate } = require('../utils/chatbotConfigCache');

const INTENTS = [
  { name: 'Menu', keywords: ['menu', 'options', 'what can you do', 'what do you do', 'help me', 'how can you help'], reply: "Here's what I can help with:\n\n1️⃣ **Browse Cakes** – See our cakes & desserts by category\n2️⃣ **Track Order** – Check your order status\n3️⃣ **Offers & Wallet** – Signup cashback, wallet, promos\n4️⃣ **Delivery** – Timings, charges, slots\n5️⃣ **Contact Support** – Call or WhatsApp 7570030333\n\nTap an option below 👇", link_text: null, link_href: null, quick_replies: ['Browse Cakes', 'Track Order', 'Offers & Wallet', 'Delivery info', 'Contact Support'], sort_order: 0 },
  { name: 'Track Order', keywords: ['track order', 'track my order', 'order status', 'where is my order', 'tracking'], reply: 'You can track your order in **Orders** in your account or use **Track Order** on the site with your order number. We also send SMS and email updates.', link_text: 'Track Order', link_href: '/track-order', quick_replies: null, sort_order: 1 },
  { name: 'Wallet', keywords: ['wallet', 'balance', 'wallet balance', 'cashback'], reply: 'Wallet balance and cashback can be managed in your account. Use wallet at checkout (up to 10% of order). Referrals and promotions add to your wallet.', link_text: 'Wallet', link_href: '/wallet', quick_replies: null, sort_order: 2 },
  { name: 'Offers', keywords: ['offers', 'offer', 'signup', 'sign up', 'welcome bonus', 'discount', 'promo'], reply: 'Sign up and get **wallet cashback up to ₹100**! Use your wallet at checkout (up to 10% of order). Check **Offers** and apply promo codes at checkout.', link_text: 'Wallet & offers', link_href: '/wallet', quick_replies: null, sort_order: 3 },
  { name: 'Contact', keywords: ['contact', 'call', 'phone', 'speak to human', 'support', 'help'], reply: 'You can call us at **7570030333** or use **WhatsApp** (same number) from the Help menu in the footer. You can also raise a ticket from Help.', link_text: 'Contact', link_href: '/contact', quick_replies: null, sort_order: 4 },
  { name: 'Cancel Order', keywords: ['cancel', 'cancel order'], reply: 'You can cancel within 1 hour from your account. After that, please contact support. Once the order is prepared or out for delivery, cancellation may not be possible.', link_text: 'My Orders', link_href: '/orders', quick_replies: null, sort_order: 5 },
  { name: 'Refund', keywords: ['refund', 'return', 'refund policy'], reply: 'We offer full refunds for orders cancelled within 1 hour. For defective or damaged items we offer replacement or refund. Refunds are processed in 5–7 business days.', link_text: 'Refund Policy', link_href: '/refund-policy', quick_replies: null, sort_order: 6 },
  { name: 'Delivery', keywords: ['delivery', 'delivery time', 'delivery charges', 'when will i get'], reply: 'Delivery is usually 2–4 hours for same-day orders (placed before 3 PM). You choose a slot at checkout. Charges depend on location and order value; orders above ₹1500 get free delivery.', link_text: 'FAQ', link_href: '/faq', quick_replies: null, sort_order: 7 },
  { name: 'FAQ', keywords: ['faq', 'frequently asked', 'questions'], reply: 'We have a full FAQ on delivery, orders, payments, refunds, wallet, and more.', link_text: 'View FAQ', link_href: '/faq', quick_replies: null, sort_order: 8 },
  { name: 'Midnight Wish', keywords: ['midnight wish', 'wish', 'fulfill wish'], reply: 'Midnight Wish lets you create or fulfill surprise cake wishes. Create a wish or fulfill someone else\'s from our Midnight Wish section.', link_text: 'Midnight Wish', link_href: '/midnight-wish', quick_replies: null, sort_order: 9 },
  { name: 'Browse Cakes', keywords: ['browse cakes', 'browse', 'cakes', 'catalog', 'products', 'menu cakes'], reply: 'Browse our cakes and desserts by category – flavour, occasion, eggless, and more. Pick a slot and get same-day delivery in many areas.', link_text: 'Browse Cakes', link_href: '/products', quick_replies: null, sort_order: 10 },
  { name: 'Account', keywords: ['account', 'profile', 'login', 'sign up'], reply: 'Use Account in the footer or header to log in, edit profile, see orders, wallet, and addresses.', link_text: 'Account', link_href: '/account', quick_replies: null, sort_order: 11 }
];

const FAQS = [
  { keywords: 'delivery charges cost', response: 'Delivery charges vary by location and order value. Orders above ₹500 may get free delivery; above ₹1500 get free delivery. Check exact charges at checkout.', link_text: null, link_href: null, sort_order: 0 },
  { keywords: 'how long delivery take', response: 'Same-day delivery usually takes 2–4 hours for orders placed before 3 PM. You can choose a delivery slot at checkout. Orders after 3 PM are scheduled for the next day.', link_text: null, link_href: null, sort_order: 1 },
  { keywords: 'deliver to my area pincode', response: 'Enter your pincode on the product or checkout page to see if we deliver to your area. We\'re expanding our delivery network.', link_text: null, link_href: null, sort_order: 2 },
  { keywords: 'schedule delivery date time', response: 'Yes. At checkout you can pick a date and time slot. For special occasions we recommend ordering in advance.', link_text: null, link_href: null, sort_order: 3 },
  { keywords: 'not available at delivery', response: 'Our delivery partner will try to call you. You can also allow someone else to receive the order. Have someone available during the scheduled slot.', link_text: null, link_href: null, sort_order: 4 },
  { keywords: 'track my order', response: 'You can track your order in the Orders section of your account, or use "Track Order" on the website with your order number. We also send SMS and email updates.', link_text: null, link_href: null, sort_order: 5 },
  { keywords: 'cancel order', response: 'You can cancel within 1 hour from your account. After that, contact support. Once the order is prepared or dispatched, cancellation may not be possible.', link_text: null, link_href: null, sort_order: 6 },
  { keywords: 'order delayed', response: 'If there\'s a delay we\'ll notify you by SMS and email and keep you updated; we may offer compensation where applicable.', link_text: null, link_href: null, sort_order: 7 },
  { keywords: 'modify change order', response: 'Changes can be made within 30 minutes of placing the order, subject to availability. Contact support quickly; changes may not be possible once preparation has started.', link_text: null, link_href: null, sort_order: 8 },
  { keywords: 'order confirmation', response: 'After placing an order you get an email and SMS with your order number. Use that number to track your order.', link_text: null, link_href: null, sort_order: 9 },
  { keywords: 'payment methods accept', response: 'We accept credit/debit cards, UPI (Google Pay, PhonePe, Paytm), net banking, digital wallets, and cash on delivery (COD) where available.', link_text: null, link_href: null, sort_order: 10 },
  { keywords: 'payment secure safe', response: 'Yes. We use SSL and secure payment gateways and don\'t store card details. Transactions are handled by PCI-DSS compliant processors.', link_text: null, link_href: null, sort_order: 11 },
  { keywords: 'when charged refund', response: 'Online payments are charged at order confirmation. COD is paid at delivery. Refunds are processed in 5–7 business days to the original payment method.', link_text: null, link_href: null, sort_order: 12 },
  { keywords: 'emi installments', response: 'We don\'t offer payment plans. You may use your bank\'s credit card EMI if available; check with your bank.', link_text: null, link_href: null, sort_order: 13 },
  { keywords: 'update profile', response: 'Go to your account dashboard and click "Edit Profile" to change your name, phone, and addresses. Some changes may need verification.', link_text: null, link_href: null, sort_order: 14 },
  { keywords: 'change email', response: 'Contact support to change your email. You\'ll need to verify the new email for security.', link_text: null, link_href: null, sort_order: 15 },
  { keywords: 'reset forgot password', response: 'Use "Forgot Password" on the login page and enter your email. You\'ll get a reset link (valid 24 hours).', link_text: null, link_href: null, sort_order: 16 },
  { keywords: 'delete account', response: 'Contact support to delete your account. It\'s permanent and processed within 7 business days.', link_text: null, link_href: null, sort_order: 17 },
  { keywords: 'refund policy', response: 'Full refund for orders cancelled within 1 hour. For defective or damaged items we offer replacement or full refund. Refunds are processed in 5–7 business days.', link_text: null, link_href: null, sort_order: 18 },
  { keywords: 'return product', response: 'Contact support within 24 hours of delivery. We\'ll arrange pickup for defective, damaged, or incorrect items.', link_text: null, link_href: null, sort_order: 19 },
  { keywords: 'how long refund', response: 'Refunds are usually processed within 5–7 business days after we receive and verify the return. You\'ll get an email when it\'s done.', link_text: null, link_href: null, sort_order: 20 },
  { keywords: 'customize cake', response: 'Yes. You can add customization at checkout or contact us. We do personalised messages, photos, and themes. Custom orders may require advance notice.', link_text: null, link_href: null, sort_order: 21 },
  { keywords: 'eggless cakes', response: 'Yes. We have many eggless options; you can filter for them on the site. They\'re clearly marked and prepared separately.', link_text: null, link_href: null, sort_order: 22 },
  { keywords: 'shelf life fresh', response: 'Cakes are baked fresh; shelf life is 2–3 days in the fridge. We recommend consuming within 24–48 hours. Storage instructions come with each order.', link_text: null, link_href: null, sort_order: 23 },
  { keywords: 'bulk order', response: 'We do bulk orders for events and corporate. Contact us in advance for pricing; we recommend ordering 3–5 days ahead.', link_text: null, link_href: null, sort_order: 24 },
  { keywords: 'referral program', response: 'Share your referral code; when friends sign up and place their first order, you both earn rewards. You can get cashback in your wallet. See Refer and Earn in your account.', link_text: null, link_href: null, sort_order: 25 },
  { keywords: 'promo code use', response: 'Enter your promo code in the "Apply Promo Code" field at checkout. One code per order; some codes have a minimum order value.', link_text: null, link_href: null, sort_order: 26 },
  { keywords: 'wallet credits', response: 'Wallet credits come from referrals, cashback, and promotions. Use them at checkout. Check balance in your account and on the Wallet page.', link_text: null, link_href: null, sort_order: 27 },
  { keywords: 'contact support help phone', response: 'You can call us at 7570030333 or chat here. For quick help, use Call or WhatsApp from the Help menu in the footer.', link_text: null, link_href: null, sort_order: 28 },
  { keywords: 'what is creamingo', response: 'Creamingo is a cake and dessert delivery service. We offer custom cakes, eggless options, delivery slots, wallet, referrals, and Midnight Wish gifting.', link_text: null, link_href: null, sort_order: 29 },
  { keywords: 'midnight wish', response: 'Midnight Wish lets you create or fulfill surprise cake wishes. You can send a wish link or fulfill someone else\'s wish from our Midnight Wish section.', link_text: null, link_href: null, sort_order: 30 }
];

async function seed() {
  console.log('Seeding chatbot config...');
  try {
    await query('DELETE FROM chatbot_intents');
    for (const i of INTENTS) {
      await query(
        'INSERT INTO chatbot_intents (name, keywords, reply, link_text, link_href, quick_replies, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [i.name, JSON.stringify(i.keywords), i.reply, i.link_text, i.link_href, i.quick_replies ? JSON.stringify(i.quick_replies) : null, i.sort_order]
      );
    }
    console.log('Inserted', INTENTS.length, 'intents');

    await query('DELETE FROM chatbot_faqs');
    for (const f of FAQS) {
      await query(
        'INSERT INTO chatbot_faqs (keywords, response, link_text, link_href, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [f.keywords, f.response, f.link_text, f.link_href, f.sort_order]
      );
    }
    console.log('Inserted', FAQS.length, 'FAQs');

    invalidate();
    console.log('Chatbot config seeded successfully.');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  }
}

module.exports = { seed };

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

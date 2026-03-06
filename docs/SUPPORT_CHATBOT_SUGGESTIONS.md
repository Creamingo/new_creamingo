# Raise Ticket & Chatbot – How to Manage

The footer sticky **Help** options are configured in **`frontend/src/components/MobileFooter.js`**:

- **Call** – uses `HELP_PHONE_NUMBER` (e.g. `7570030333`), opens `tel:+91...`
- **WhatsApp** – same number, opens `https://wa.me/91...`
- **Raise Ticket** – currently routes to `/contact`. You can change it to a dedicated support or chatbot page.

---

## How to create a chatbot for “Raise Ticket”

### Option 1: Third‑party live chat (fastest)

Use a widget that gives you both **live chat** and **ticket-style** support:

- **Tawk.to** – free, embed script in layout, add a “Raise Ticket” or “Support” widget.
- **Crisp** – free tier, chat + ticketing, good for small teams.
- **Intercom / Zendesk** – paid, full ticketing and bots.

**Steps (e.g. Tawk):**

1. Sign up at [tawk.to](https://www.tawk.to), get the embed script.
2. Add the script in `frontend/src/app/layout.js` (in `<body>` or a global component).
3. In **MobileFooter.js**, change Raise Ticket to open the chat widget instead of navigating:

```js
// Example: open Tawk widget
action: () => {
  if (typeof window.Tawk_API !== 'undefined') {
    window.Tawk_API.maximize()
  } else {
    router.push('/contact')
  }
}
```

Same idea works for Crisp/Intercom (they expose `window` APIs to open the widget).

---

### Option 2: Dedicated “Raise Ticket” page with embedded chat

1. Create a page, e.g. `frontend/src/app/support/page.js` (or `support/ticket/page.js`).
2. On that page, embed the same chat widget (Tawk/Crisp script in layout, widget selector on this page) or an iframe to your help desk.
3. In **MobileFooter.js**, point Raise Ticket to that page:

```js
action: () => router.push('/support')  // or '/support/ticket'
```

Users tap “Raise Ticket” → land on support page → chat/widget is right there.

---

### Option 3: Simple custom “ticket” form (no bot)

Keep “Raise Ticket” as a form that creates a ticket in your backend:

1. Use or extend your existing **Contact** page (`/contact`) to collect: subject, message, email, phone.
2. Backend: POST to an API that creates a ticket (store in DB or send to email).
3. In **MobileFooter.js** you already have `router.push('/contact')` – you can rename the button to “Contact support” or keep “Raise Ticket” and style the contact page as a ticket form.

No chatbot, but manageable and you control the flow.

---

### Option 4: AI chatbot (e.g. OpenAI / custom)

For an actual **bot** that answers FAQs and can create a ticket:

1. **Backend:** Add an API route that talks to OpenAI (or another LLM), and optionally creates a ticket when the user says “I want to raise a ticket” or “speak to human”.
2. **Frontend:** Build a small chat UI (message list + input) on a page like `/support` or `/support/chat`.
3. In **MobileFooter.js**, set Raise Ticket to:

```js
action: () => router.push('/support/chat')
```

This is more work but gives a custom, on-brand experience.

---

## Summary

- **Call** and **WhatsApp** are managed via **`HELP_PHONE_NUMBER`** in **MobileFooter.js** (e.g. `7570030333`).
- **Raise Ticket** is currently **“Contact”**; for a chatbot, use a widget (Option 1 or 2) or a custom chat page (Option 4). Easiest path: Tawk/Crisp + open widget or `/support` page with widget embedded.

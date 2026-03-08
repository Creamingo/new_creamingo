# Chatbot: Admin Edit Answers + Chat History Analytics — Flow (No Implementation)

This doc describes **how** the two features would work: editing chatbot answers from the admin panel, and chat history analytics. Implementation can follow this flow later.

---

## Part 1: Admin Panel — Edit Chatbot Answers

### Current state

- **Backend:** Answers live in code in `chatController.js`:
  - **INTENTS** — list of `{ keywords, reply, link?, quickReplies? }`
  - **KNOWLEDGE** — list of `{ q, a }` (FAQ-style keyword → answer)
- Changing an answer = code change + deploy.

### Target state

- Answers are stored in the **database** and editable from the **admin panel**.
- The chat API **reads** from DB (with optional in-memory cache) instead of hardcoded arrays.
- Admin users can **list, add, edit, delete** FAQ rows and intent replies without touching code.

---

### 1.1 Data model (conceptual)

**Option A — Two tables (recommended)**

| Table | Purpose | Main columns (conceptual) |
|-------|---------|---------------------------|
| **chatbot_faqs** | FAQ-style Q&A (keyword match) | id, keywords (or key_phrase), response, link_text, link_href, sort_order, is_active, created_at, updated_at |
| **chatbot_intents** | Intent-based replies (e.g. “Track Order”, “Menu”) | id, name/slug, keywords (JSON array or comma-separated), reply, link_text, link_href, quick_replies (JSON array), sort_order, is_active, created_at, updated_at |

- **chatbot_faqs:** One row per FAQ entry (like current KNOWLEDGE).
- **chatbot_intents:** One row per intent (like current INTENTS). Order is by `sort_order` so “menu” can be checked first.

**Option B — Single table**

- One table **chatbot_responses** with a type column: `type = 'faq' | 'intent'`, and columns for keywords, reply, link, quick_replies, etc. Slightly more flexible but queries and admin UI are a bit more complex.

**Recommendation:** Option A so “intents” (menu, track order, contact) and “FAQ” (generic keyword answers) stay clearly separated and the chat logic stays simple.

---

### 1.2 Backend flow (edit answers)

1. **New API routes (admin-only, protected)**  
   - `GET /api/chat/config/faqs` — list all FAQ rows.  
   - `POST /api/chat/config/faqs` — create FAQ.  
   - `PUT /api/chat/config/faqs/:id` — update FAQ.  
   - `DELETE /api/chat/config/faqs/:id` — delete FAQ.  
   - Same for intents: `GET/POST/PUT/DELETE /api/chat/config/intents`.

2. **Existing chat API**  
   - `POST /api/chat` (current “send message” endpoint):
     - Load intents and FAQs from **DB** (or from **cache**).
     - Run same logic as today: match intent by keywords → else match FAQ by keyword score → else fallback.
     - Return reply (+ link, quickReplies) as now.
   - Optional: in-memory cache (e.g. load config on first request or via a small TTL) so not every message hits the DB.

3. **Migration / seeding**  
   - One-time: create tables and **seed** them from current `INTENTS` and `KNOWLEDGE` in code so existing behavior is preserved, then switch the controller to read from DB.

---

### 1.3 Admin panel flow (edit answers)

1. **Sidebar**  
   - New item, e.g. **“Chatbot”** or **“Support bot”**, with sub-items or a single page:
     - **“Chatbot answers”** (or “FAQ & intents”).

2. **Chatbot answers page**  
   - **Tabs or sections:** “Intents” and “FAQ”.
   - **Intents tab:**
     - Table: name/slug, keywords, reply (truncated), link, quick replies, order, active, actions (Edit / Delete).
     - Buttons: “Add intent”.
     - Edit/Add form: name, keywords (comma-separated or one per line), reply (textarea), optional link text + URL, optional quick reply buttons (comma-separated), sort order, active.
   - **FAQ tab:**
     - Table: keywords/phrase, response (truncated), link, order, active, actions.
     - Buttons: “Add FAQ”.
     - Edit/Add form: keywords, response (textarea), optional link, sort order, active.
   - **Save:** Call backend `PUT/POST` → success toast → refetch list.  
   - **Delete:** Confirm → `DELETE` → refetch.

3. **Permissions**  
   - Restrict “Chatbot answers” to admin (or a role like “support manager”) using existing auth/role middleware (e.g. same pattern as Settings).

4. **No code deploy**  
   - After deployment of this feature, all answer changes are done in the admin panel; no code change needed for copy updates.

---

### 1.4 End-to-end flow (edit answers)

```
Admin logs in → Sidebar: "Chatbot" → "Chatbot answers"
  → Chooses "Intents" or "FAQ"
  → Clicks Edit on a row (or Add)
  → Fills form (keywords, reply, link, quick replies for intents)
  → Saves
  → Backend updates DB
  → (Optional: invalidate cache so next chat message uses new config)

Customer opens chat (Help > Raise Ticket) → sends message
  → Backend loads intents/FAQs from DB (or cache)
  → Matches and returns reply
  → Customer sees updated answer
```

---

## Part 2: Chat History Analytics

### Goal

- **Record** every chat conversation (who said what, when).
- **Show** in admin: volume, trends, top topics, fallback rate, and optionally full conversation view.

### 2.1 Data model (conceptual)

| Table | Purpose | Main columns (conceptual) |
|-------|---------|---------------------------|
| **chatbot_sessions** | One per “chat open” or per user/session | id, session_id (e.g. UUID from frontend or generated), customer_id (nullable, if logged in), started_at, ended_at (nullable), channel (e.g. 'web'), metadata (JSON, optional) |
| **chatbot_messages** | Every message in a conversation | id, session_id (FK), role ('user' \| 'bot'), content (text), intent_slug or faq_id (nullable, which intent/FAQ matched), is_fallback (boolean), created_at |

- **session_id:** Sent by frontend on first message of a “conversation” (same tab/window). Frontend generates a UUID once per chat open and sends it with every message in that thread.
- **customer_id:** If user is logged in, backend can set it when saving the message or session.
- **intent_slug / faq_id / is_fallback:** Filled by the chat controller when it responds (which intent or FAQ matched, or that it was fallback). Enables “top intents” and “fallback rate” analytics.

---

### 2.2 Backend flow (analytics)

1. **When a message is sent** (`POST /api/chat`):
   - Resolve or create **chatbot_sessions** by session_id (and optionally attach customer_id if auth token present).
   - Insert **chatbot_messages** row for the **user** message (role=user, content=message).
   - Run existing logic (intent match → FAQ match → fallback); get reply and which intent/FAQ matched (or fallback).
   - Insert **chatbot_messages** row for the **bot** (role=bot, content=reply, intent_slug/faq_id/is_fallback).
   - Return reply (+ link, quickReplies) to frontend as now.

2. **New API routes (admin-only)**  
   - `GET /api/chat/analytics/summary` — aggregated stats:
     - Total conversations (sessions) in date range.
     - Total messages (user + bot) in date range.
     - Messages per day (or per week) for a chart.
     - Top intents (count by intent_slug).
     - Top “unmatched” or fallback count (is_fallback = true).
     - Optional: top FAQ ids.
   - `GET /api/chat/analytics/sessions` — list sessions (with filters: date range, has_fallback, etc.), paginated.
   - `GET /api/chat/analytics/sessions/:sessionId/messages` — all messages in one conversation (for “view conversation” in admin).

3. **Privacy / retention**  
   - Decide retention (e.g. keep messages 90 days, then anonymize or delete). Can be enforced in analytics queries or a cron job.

---

### 2.3 Admin panel flow (analytics)

1. **Sidebar**  
   - Under same **“Chatbot”** section: **“Chat analytics”** (or “Chat history”).

2. **Analytics dashboard page**  
   - **Date range** filter (e.g. last 7 days, 30 days, custom).
   - **Summary cards:**
     - Total conversations.
     - Total messages.
     - Fallback rate (% of user messages that got fallback reply).
   - **Charts:**
     - Messages or conversations per day (line or bar).
     - Top intents (bar or table): “Track Order”, “Menu”, “Contact”, etc.
     - Top “unmatched” queries (user messages that hit fallback) — helps you add new FAQs or intents.
   - **Table: “Recent conversations”**  
     - Columns: session id (short), started at, message count, had fallback?, (optional) customer).  
     - Row click or “View” → open a **conversation detail** view that lists all messages in that session (user/bot, time, content, matched intent/FAQ).

3. **Optional**
   - Export CSV: list of sessions or messages for the selected date range.
   - Filter by “had fallback” to focus on conversations that didn’t get a good match.

---

### 2.4 Frontend (customer app) change for analytics

- **Session ID:** When the user opens the chat (e.g. first time in that tab), generate a UUID and store in component state (or sessionStorage). Send this `session_id` in the body of every `POST /api/chat` request (e.g. `{ message, session_id }`). Backend uses it to group messages into one conversation.

---

### 2.5 End-to-end flow (analytics)

```
Customer opens chat → frontend generates session_id (once)
  → Customer sends "Track order"
  → POST /api/chat { message, session_id }
  → Backend matches intent, saves user message + bot reply to DB (with intent_slug), returns reply
  → Customer sees reply

Admin → Sidebar: "Chatbot" → "Chat analytics"
  → Selects date range
  → Sees summary (conversations, messages, fallback rate)
  → Sees chart: messages per day
  → Sees top intents and top unmatched queries
  → Clicks a conversation → sees full thread (user/bot messages, timestamps, which intent/FAQ matched)
  → Uses “top unmatched” to add new FAQ or intent in “Chatbot answers”
```

---

## Summary

| Feature | Flow in one sentence |
|--------|----------------------|
| **Edit chatbot answers** | Store intents and FAQs in DB; add admin-only CRUD API and a “Chatbot answers” page (Intents + FAQ tabs); chat API reads from DB (with optional cache) so edits take effect without deploy. |
| **Chat history analytics** | Log every user/bot message with session_id and matched intent/FAQ/fallback; add admin-only analytics API and “Chat analytics” page with summary, charts, top intents, top unmatched, and conversation detail view. |

Implementation order that fits this flow:

1. DB: create tables (chatbot_faqs, chatbot_intents, chatbot_sessions, chatbot_messages) and seed from current code.  
2. Backend: chat API reads from DB; add config CRUD and analytics APIs; on each message, write to sessions + messages.  
3. Frontend (customer): send session_id with each chat message.  
4. Admin: “Chatbot answers” page (intents + FAQ CRUD) and “Chat analytics” page (summary, charts, conversation list and detail).

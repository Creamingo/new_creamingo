# Chatbot Admin & Analytics – Setup

## 1. Run the database migration

Create the chatbot tables (MySQL). From **project root**:

```bash
# Option A: Node script (uses your .env DB config)
node backend/src/scripts/runChatbotMigration.js

# Option B: MySQL client
mysql -u YOUR_DB_USER -p YOUR_DB_NAME < backend/database/migrations/063_create_chatbot_tables.sql
```

The Node script skips statements that would create tables that already exist.

## 2. Seed the chatbot config (intents + FAQs)

From **project root**:

```bash
node backend/src/scripts/seedChatbotConfig.js
```

This inserts the default intents and FAQs. After this, the chat API will use the database; you can edit answers from the admin panel.

### One-shot: migration + seed

From **project root**, run both in one go:

```bash
node backend/src/scripts/setupChatbot.js
```

## 3. Restart backend

Restart the backend server so it picks up the new routes and tables.

## 4. Admin panel

- **Chatbot Answers:** Sidebar → **Chatbot Answers**. Edit **Intents** and **FAQs** (list, add, edit, delete). Changes take effect immediately (cache invalidated on save).
- **Chat Analytics:** Sidebar → **Chat Analytics**. Set date range, view summary (conversations, messages, fallback rate), top unmatched queries, and recent conversations. Click **View** on a session to see the full thread.

## 5. Customer app

The customer chat (Help → Raise Ticket) already sends `session_id` (generated once per browser session). No extra setup needed.

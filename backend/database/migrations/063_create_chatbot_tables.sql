-- Migration: Create chatbot tables (config + history/analytics)
-- MySQL-compatible

-- Chatbot intents (menu, track order, contact, etc.)
CREATE TABLE IF NOT EXISTS chatbot_intents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  keywords TEXT NOT NULL COMMENT 'JSON array of keyword strings',
  reply TEXT NOT NULL,
  link_text VARCHAR(255) DEFAULT NULL,
  link_href VARCHAR(500) DEFAULT NULL,
  quick_replies TEXT DEFAULT NULL COMMENT 'JSON array of button labels',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Chatbot FAQ (keyword -> response)
CREATE TABLE IF NOT EXISTS chatbot_faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keywords VARCHAR(500) NOT NULL COMMENT 'Key phrase for matching',
  response TEXT NOT NULL,
  link_text VARCHAR(255) DEFAULT NULL,
  link_href VARCHAR(500) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Chat sessions (one per conversation)
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL UNIQUE COMMENT 'UUID from frontend',
  customer_id INT DEFAULT NULL,
  channel VARCHAR(50) DEFAULT 'web',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chatbot_sessions_session_id (session_id),
  INDEX idx_chatbot_sessions_started (started_at),
  INDEX idx_chatbot_sessions_customer (customer_id)
);

-- Chat messages (each user + bot message)
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  role ENUM('user','bot') NOT NULL,
  content TEXT NOT NULL,
  intent_id INT DEFAULT NULL,
  faq_id INT DEFAULT NULL,
  is_fallback TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_chatbot_messages_session (session_id),
  INDEX idx_chatbot_messages_created (created_at),
  INDEX idx_chatbot_messages_intent (intent_id),
  INDEX idx_chatbot_messages_fallback (is_fallback)
);

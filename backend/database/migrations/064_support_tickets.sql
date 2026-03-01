-- Support tickets raised via Help > Raise Ticket (chat).
-- Each ticket is linked to a chatbot session for full conversation in admin.
-- MySQL-compatible.

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'e.g. TKT-00001',
  session_id VARCHAR(64) NOT NULL COMMENT 'chatbot_sessions.session_id',
  customer_id INT DEFAULT NULL,
  subject VARCHAR(500) DEFAULT NULL COMMENT 'Optional, first message snippet',
  status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  admin_notes TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_support_tickets_session (session_id),
  INDEX idx_support_tickets_status (status),
  INDEX idx_support_tickets_created (created_at),
  INDEX idx_support_tickets_customer (customer_id)
);

-- Migration 002: Update idea categories to match product requirements
-- Recreates ideas table with updated category CHECK constraint
-- Categories: process_improvement | product_idea | cost_reduction | customer_experience | other

CREATE TABLE IF NOT EXISTS ideas_new (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  category     TEXT    NOT NULL CHECK (
                 category IN (
                   'process_improvement',
                   'product_idea',
                   'cost_reduction',
                   'customer_experience',
                   'other'
                 )
               ),
  status       TEXT    NOT NULL DEFAULT 'submitted'
                       CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  submitter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Copy any existing data (maps old categories where possible)
INSERT OR IGNORE INTO ideas_new
  SELECT id, title, description,
    CASE category
      WHEN 'process'    THEN 'process_improvement'
      WHEN 'product'    THEN 'product_idea'
      WHEN 'technology' THEN 'other'
      WHEN 'culture'    THEN 'other'
      ELSE 'other'
    END,
    status, submitter_id, created_at, updated_at
  FROM ideas;

DROP TABLE ideas;
ALTER TABLE ideas_new RENAME TO ideas;

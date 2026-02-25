-- Migration 004: Idea Status History
-- Tracks every status transition for an idea, including who triggered it.

CREATE TABLE IF NOT EXISTS idea_status_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id    INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  status     TEXT    NOT NULL CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  changed_by TEXT    NOT NULL,
  timestamp  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_idea_status_history_idea_id
  ON idea_status_history (idea_id, timestamp);

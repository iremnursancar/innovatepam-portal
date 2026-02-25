-- Migration 005: Idea Votes
-- One row per (user, idea) pair — unique constraint enforces one vote per user per idea.

CREATE TABLE IF NOT EXISTS idea_votes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id    INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (idea_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_idea_votes_idea_id ON idea_votes (idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_user_id ON idea_votes (user_id);

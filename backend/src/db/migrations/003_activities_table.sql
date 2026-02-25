-- Migration 003: Activity Feed
-- Creates the activities table for recording idea lifecycle events.

CREATE TABLE IF NOT EXISTS activities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  type        TEXT    NOT NULL CHECK (type IN ('idea_submitted', 'idea_accepted', 'idea_rejected', 'idea_under_review')),
  user_email  TEXT    NOT NULL,
  idea_title  TEXT    NOT NULL,
  timestamp   TEXT    NOT NULL DEFAULT (datetime('now'))
);

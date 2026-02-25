-- Migration 001: Initial Schema
-- Creates: users, ideas, attachments, evaluations

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'submitter' CHECK (role IN ('submitter', 'admin')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ideas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  category     TEXT    NOT NULL CHECK (category IN ('process', 'product', 'technology', 'culture', 'other')),
  status       TEXT    NOT NULL DEFAULT 'submitted'
                       CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  submitter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attachments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id     INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  filename    TEXT    NOT NULL,
  originalname TEXT   NOT NULL,
  mimetype    TEXT    NOT NULL,
  size        INTEGER NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evaluations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id    INTEGER NOT NULL UNIQUE REFERENCES ideas(id) ON DELETE CASCADE,
  admin_id   INTEGER NOT NULL REFERENCES users(id),
  decision   TEXT    NOT NULL CHECK (decision IN ('accepted', 'rejected')),
  comment    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

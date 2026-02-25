-- Migration 006: Public / Private ideas
-- Adds is_public column (defaults to FALSE = private).

ALTER TABLE ideas ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1));

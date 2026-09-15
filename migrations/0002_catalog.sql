-- Editable catalogue + settings (seeded from the real price list on first run).
CREATE TABLE IF NOT EXISTS categories (
  id    TEXT PRIMARY KEY,
  line  TEXT NOT NULL,            -- standard | elite
  name  TEXT NOT NULL,
  sort  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  line        TEXT NOT NULL,
  name        TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  mrp         INTEGER NOT NULL DEFAULT 0,  -- struck-through list price
  price       INTEGER NOT NULL DEFAULT 0,  -- actual selling price
  active      INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_line ON products (line);

-- Single-row key/value store for editable site settings (value = JSON).
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

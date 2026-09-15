-- Per-order transport fee + grand total (product total is `total`).
ALTER TABLE orders ADD COLUMN transport INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN grand_total INTEGER NOT NULL DEFAULT 0;

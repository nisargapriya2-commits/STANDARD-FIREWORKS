-- Orders / enquiries captured from the website checkout.
CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY,           -- short human code, e.g. SF-7F3K2
  created_at   INTEGER NOT NULL,           -- epoch ms
  status       TEXT NOT NULL DEFAULT 'new',-- new | verified | dispatched | delivered | cancelled
  customer_name TEXT NOT NULL,
  phone        TEXT NOT NULL,
  whatsapp     TEXT,
  address      TEXT NOT NULL,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL,
  pincode      TEXT NOT NULL,
  items_json   TEXT NOT NULL,              -- snapshot: [{id,name,content,qty,unit,total}]
  item_count   INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0, -- net sellable total (0 if prices not set)
  has_prices   INTEGER NOT NULL DEFAULT 0, -- 0/1
  payment_ref  TEXT,                       -- filled by admin after verifying the receipt
  admin_note   TEXT,
  source       TEXT NOT NULL DEFAULT 'website'
);

CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

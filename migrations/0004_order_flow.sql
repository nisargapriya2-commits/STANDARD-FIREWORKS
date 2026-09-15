-- Full order flow: customer email/GST, GST amount, payment UTR + screenshot, product stock.
ALTER TABLE orders ADD COLUMN email TEXT;
ALTER TABLE orders ADD COLUMN gst_no TEXT;
ALTER TABLE orders ADD COLUMN gst INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN utr TEXT;
ALTER TABLE orders ADD COLUMN screenshot_data TEXT;

-- Stock: -1 = unlimited/untracked, 0 = out of stock, >0 = units available.
ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT -1;

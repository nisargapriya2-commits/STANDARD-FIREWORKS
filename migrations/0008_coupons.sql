-- Personal discount codes the owner hands out while negotiating a big order.
--
-- Deliberately NO used/reserved counters: how many times a code has been used is
-- DERIVED by counting the orders that hold it and aren't cancelled/rejected.
-- That is self-correcting — an abandoned or rejected order frees the code again
-- on its own, and flipping an order's status back and forth can't double-count.
CREATE TABLE IF NOT EXISTS coupons (
	code TEXT PRIMARY KEY,                      -- always stored UPPERCASE
	kind TEXT NOT NULL,                         -- 'flat' (₹ off) | 'percent'
	value INTEGER NOT NULL,                     -- rupees, or percent
	max_discount INTEGER NOT NULL DEFAULT 0,    -- ₹ cap for percent codes; 0 = uncapped
	min_order INTEGER NOT NULL DEFAULT 0,       -- product subtotal needed to use it
	phone TEXT,                                 -- locked to this customer; NULL = anyone
	customer_name TEXT,                         -- so the owner recognises the row
	max_uses INTEGER NOT NULL DEFAULT 1,
	active INTEGER NOT NULL DEFAULT 1,
	expires_at INTEGER,                         -- ms epoch; NULL = never expires
	created_at INTEGER NOT NULL,
	note TEXT,
	from_order TEXT                             -- the order it was generated from
);

CREATE INDEX IF NOT EXISTS coupons_phone ON coupons (phone);

-- What the customer actually redeemed, frozen onto the order.
ALTER TABLE orders ADD COLUMN coupon_code TEXT;
ALTER TABLE orders ADD COLUMN coupon_discount INTEGER NOT NULL DEFAULT 0;

-- Spend-more-save-more slab discount, frozen onto the order.
--
-- The slabs live in settings and the owner can change them at any time, so the
-- ₹ actually granted has to be stored with the order — otherwise re-opening an
-- old order would re-price it against today's slabs and the total would drift.
-- `tier_label` keeps the wording the customer saw ("Spend ₹10,000+").
ALTER TABLE orders ADD COLUMN tier_discount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN tier_label TEXT;

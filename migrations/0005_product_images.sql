-- Owner-uploaded product photos.
-- `image` holds a compressed data URL (same approach as the logo/QR in settings).
-- `image_v` is bumped on every upload: 0 = no photo, >0 = photo present. It is also the
-- cache-buster in the public image URL (/api/product-image/<id>?v=<image_v>), which lets us
-- serve photos with a long immutable cache while still updating instantly on re-upload.
ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN image_v INTEGER NOT NULL DEFAULT 0;

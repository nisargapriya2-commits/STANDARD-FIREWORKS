-- Owner-uploaded pictures everywhere else on the site.

-- 1. Category photos (home carousel + price-list section headers).
ALTER TABLE categories ADD COLUMN image TEXT NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN image_v INTEGER NOT NULL DEFAULT 0;

-- 2. Pictures not tied to a product or category: the shop logo, the About-page
--    photos, and the home-page banners. `group_key` says which of those it is;
--    `logo` holds a single row, the others hold as many as the owner uploads.
CREATE TABLE IF NOT EXISTS site_images (
	id TEXT PRIMARY KEY,
	group_key TEXT NOT NULL,
	data TEXT NOT NULL,
	v INTEGER NOT NULL DEFAULT 1,
	caption TEXT NOT NULL DEFAULT '',
	sort INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS site_images_group_sort ON site_images (group_key, sort);

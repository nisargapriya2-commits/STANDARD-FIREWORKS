-- Third delivery level: the area/locality inside the city (State → City → Area),
-- plus the Google Maps link of that delivery point as it was at order time.
ALTER TABLE orders ADD COLUMN area TEXT;
ALTER TABLE orders ADD COLUMN area_map TEXT;

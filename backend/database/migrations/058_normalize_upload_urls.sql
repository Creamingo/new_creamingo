-- Normalize absolute upload URLs to relative /uploads/... so domains can change safely

UPDATE categories
SET image_url = CONCAT('/uploads/', SUBSTRING(image_url, LOCATE('/uploads/', image_url) + 9))
WHERE image_url LIKE 'http%://%/uploads/%';

UPDATE categories
SET icon_image_url = CONCAT('/uploads/', SUBSTRING(icon_image_url, LOCATE('/uploads/', icon_image_url) + 9))
WHERE icon_image_url LIKE 'http%://%/uploads/%';

UPDATE subcategories
SET image_url = CONCAT('/uploads/', SUBSTRING(image_url, LOCATE('/uploads/', image_url) + 9))
WHERE image_url LIKE 'http%://%/uploads/%';

UPDATE products
SET image_url = CONCAT('/uploads/', SUBSTRING(image_url, LOCATE('/uploads/', image_url) + 9))
WHERE image_url LIKE 'http%://%/uploads/%';

UPDATE banners
SET image_url = CONCAT('/uploads/', SUBSTRING(image_url, LOCATE('/uploads/', image_url) + 9))
WHERE image_url LIKE 'http%://%/uploads/%';

UPDATE collections
SET image_url = CONCAT('/uploads/', SUBSTRING(image_url, LOCATE('/uploads/', image_url) + 9))
WHERE image_url LIKE 'http%://%/uploads/%';

UPDATE product_gallery_images
SET image_url = CONCAT('/uploads/', SUBSTRING(image_url, LOCATE('/uploads/', image_url) + 9))
WHERE image_url LIKE 'http%://%/uploads/%';

UPDATE product_review_images
SET image_url = CONCAT('/uploads/', SUBSTRING(image_url, LOCATE('/uploads/', image_url) + 9))
WHERE image_url LIKE 'http%://%/uploads/%';

UPDATE add_on_products
SET image_url = CONCAT('/uploads/', SUBSTRING(image_url, LOCATE('/uploads/', image_url) + 9))
WHERE image_url LIKE 'http%://%/uploads/%';

-- Create product_gallery_images table
CREATE TABLE IF NOT EXISTS product_gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_product_gallery_images_product_id ON product_gallery_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_gallery_images_display_order ON product_gallery_images(display_order);

-- Add occasion categories for "Cakes for Any Occasion" section
INSERT OR IGNORE INTO categories (name, description, image_url, order_index) VALUES 
('Birthday', 'Celebrate special birthdays with our delicious cakes', '/Design 1.webp', 6),
('Anniversary', 'Mark your special milestones with our anniversary cakes', '/Design 2.webp', 7),
('Engagement', 'Celebrate your engagement with our elegant cakes', '/Design 3.webp', 8),
('Wedding', 'Make your wedding day perfect with our wedding cakes', '/Design 4.webp', 9),
('New Beginning', 'Start new chapters with our celebration cakes', '/Design 1.webp', 10),
('No Reason Cake', 'Sometimes you just need a cake for no reason at all', '/Design 2.webp', 11);

-- Add subcategories for occasion categories
INSERT OR IGNORE INTO subcategories (name, description, category_id, image_url, order_index) VALUES 
-- Birthday subcategories
('Chocolate Birthday', 'Rich chocolate birthday cakes', (SELECT id FROM categories WHERE name = 'Birthday'), '/Design 1.webp', 1),
('Vanilla Birthday', 'Classic vanilla birthday cakes', (SELECT id FROM categories WHERE name = 'Birthday'), '/Design 2.webp', 2),
('Strawberry Birthday', 'Fresh strawberry birthday cakes', (SELECT id FROM categories WHERE name = 'Birthday'), '/Design 3.webp', 3),
('Red Velvet Birthday', 'Luxurious red velvet birthday cakes', (SELECT id FROM categories WHERE name = 'Birthday'), '/Design 4.webp', 4),
('Butterscotch Birthday', 'Sweet butterscotch birthday cakes', (SELECT id FROM categories WHERE name = 'Birthday'), '/Design 1.webp', 5),

-- Anniversary subcategories
('Chocolate Anniversary', 'Rich chocolate anniversary cakes', (SELECT id FROM categories WHERE name = 'Anniversary'), '/Design 2.webp', 1),
('Vanilla Anniversary', 'Classic vanilla anniversary cakes', (SELECT id FROM categories WHERE name = 'Anniversary'), '/Design 3.webp', 2),
('Strawberry Anniversary', 'Fresh strawberry anniversary cakes', (SELECT id FROM categories WHERE name = 'Anniversary'), '/Design 4.webp', 3),
('Red Velvet Anniversary', 'Luxurious red velvet anniversary cakes', (SELECT id FROM categories WHERE name = 'Anniversary'), '/Design 1.webp', 4),
('Butterscotch Anniversary', 'Sweet butterscotch anniversary cakes', (SELECT id FROM categories WHERE name = 'Anniversary'), '/Design 2.webp', 5),

-- Engagement subcategories
('Chocolate Engagement', 'Rich chocolate engagement cakes', (SELECT id FROM categories WHERE name = 'Engagement'), '/Design 3.webp', 1),
('Vanilla Engagement', 'Classic vanilla engagement cakes', (SELECT id FROM categories WHERE name = 'Engagement'), '/Design 4.webp', 2),
('Strawberry Engagement', 'Fresh strawberry engagement cakes', (SELECT id FROM categories WHERE name = 'Engagement'), '/Design 1.webp', 3),
('Red Velvet Engagement', 'Luxurious red velvet engagement cakes', (SELECT id FROM categories WHERE name = 'Engagement'), '/Design 2.webp', 4),
('Butterscotch Engagement', 'Sweet butterscotch engagement cakes', (SELECT id FROM categories WHERE name = 'Engagement'), '/Design 3.webp', 5),

-- Wedding subcategories
('Chocolate Wedding', 'Rich chocolate wedding cakes', (SELECT id FROM categories WHERE name = 'Wedding'), '/Design 4.webp', 1),
('Vanilla Wedding', 'Classic vanilla wedding cakes', (SELECT id FROM categories WHERE name = 'Wedding'), '/Design 1.webp', 2),
('Strawberry Wedding', 'Fresh strawberry wedding cakes', (SELECT id FROM categories WHERE name = 'Wedding'), '/Design 2.webp', 3),
('Red Velvet Wedding', 'Luxurious red velvet wedding cakes', (SELECT id FROM categories WHERE name = 'Wedding'), '/Design 3.webp', 4),
('Butterscotch Wedding', 'Sweet butterscotch wedding cakes', (SELECT id FROM categories WHERE name = 'Wedding'), '/Design 4.webp', 5),

-- New Beginning subcategories
('Chocolate New Beginning', 'Rich chocolate new beginning cakes', (SELECT id FROM categories WHERE name = 'New Beginning'), '/Design 1.webp', 1),
('Vanilla New Beginning', 'Classic vanilla new beginning cakes', (SELECT id FROM categories WHERE name = 'New Beginning'), '/Design 2.webp', 2),
('Strawberry New Beginning', 'Fresh strawberry new beginning cakes', (SELECT id FROM categories WHERE name = 'New Beginning'), '/Design 3.webp', 3),
('Red Velvet New Beginning', 'Luxurious red velvet new beginning cakes', (SELECT id FROM categories WHERE name = 'New Beginning'), '/Design 4.webp', 4),
('Butterscotch New Beginning', 'Sweet butterscotch new beginning cakes', (SELECT id FROM categories WHERE name = 'New Beginning'), '/Design 1.webp', 5),

-- No Reason Cake subcategories
('Chocolate No Reason', 'Rich chocolate no reason cakes', (SELECT id FROM categories WHERE name = 'No Reason Cake'), '/Design 2.webp', 1),
('Vanilla No Reason', 'Classic vanilla no reason cakes', (SELECT id FROM categories WHERE name = 'No Reason Cake'), '/Design 3.webp', 2),
('Strawberry No Reason', 'Fresh strawberry no reason cakes', (SELECT id FROM categories WHERE name = 'No Reason Cake'), '/Design 4.webp', 3),
('Red Velvet No Reason', 'Luxurious red velvet no reason cakes', (SELECT id FROM categories WHERE name = 'No Reason Cake'), '/Design 1.webp', 4),
('Butterscotch No Reason', 'Sweet butterscotch no reason cakes', (SELECT id FROM categories WHERE name = 'No Reason Cake'), '/Design 2.webp', 5);

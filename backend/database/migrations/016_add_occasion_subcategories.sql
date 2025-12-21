-- Add subcategories for "Cakes for Any Occasion" category
-- First, get the category ID for "Cakes for Any Occasion"
-- Then add subcategories for each occasion type

INSERT OR IGNORE INTO subcategories (name, description, category_id, image_url, order_index) VALUES 
-- Birthday subcategories
('Birthday Cakes', 'Delicious birthday cakes for all ages', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 1.webp', 1),
('Kids Birthday', 'Fun and colorful cakes for children', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 2.webp', 2),
('Adult Birthday', 'Sophisticated cakes for adults', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 3.webp', 3),
('Chocolate Birthday', 'Rich chocolate birthday cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 1.webp', 4),
('Vanilla Birthday', 'Classic vanilla birthday cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 2.webp', 5),

-- Anniversary subcategories
('Anniversary Cakes', 'Elegant cakes for special milestones', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 3.webp', 6),
('Wedding Anniversary', 'Celebrate years of love', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 4.webp', 7),
('Chocolate Anniversary', 'Rich chocolate anniversary cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 1.webp', 8),
('Vanilla Anniversary', 'Classic vanilla anniversary cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 2.webp', 9),
('Red Velvet Anniversary', 'Luxurious red velvet anniversary cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 3.webp', 10),

-- Engagement subcategories
('Engagement Cakes', 'Celebrate your special engagement', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 4.webp', 11),
('Ring Cake', 'Elegant engagement ring cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 1.webp', 12),
('Chocolate Engagement', 'Rich chocolate engagement cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 2.webp', 13),
('Vanilla Engagement', 'Classic vanilla engagement cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 3.webp', 14),
('Strawberry Engagement', 'Fresh strawberry engagement cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 4.webp', 15),

-- Wedding subcategories
('Wedding Cakes', 'Make your wedding day perfect', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 1.webp', 16),
('Multi-Tier Wedding', 'Elegant multi-tier wedding cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 2.webp', 17),
('Chocolate Wedding', 'Rich chocolate wedding cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 3.webp', 18),
('Vanilla Wedding', 'Classic vanilla wedding cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 4.webp', 19),
('Red Velvet Wedding', 'Luxurious red velvet wedding cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 1.webp', 20),

-- New Beginning subcategories
('New Beginning Cakes', 'Start new chapters with celebration', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 2.webp', 21),
('Fresh Start', 'Cakes for new beginnings', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 3.webp', 22),
('Chocolate New Beginning', 'Rich chocolate new beginning cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 4.webp', 23),
('Vanilla New Beginning', 'Classic vanilla new beginning cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 1.webp', 24),
('Strawberry New Beginning', 'Fresh strawberry new beginning cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 2.webp', 25),

-- No Reason Cake subcategories
('No Reason Cakes', 'Sometimes you just need a cake', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 3.webp', 26),
('Just Because', 'Cakes for no reason at all', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 4.webp', 27),
('Chocolate No Reason', 'Rich chocolate no reason cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 1.webp', 28),
('Vanilla No Reason', 'Classic vanilla no reason cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 2.webp', 29),
('Strawberry No Reason', 'Fresh strawberry no reason cakes', (SELECT id FROM categories WHERE name = 'Cakes for Any Occasion'), '/Design 3.webp', 30);

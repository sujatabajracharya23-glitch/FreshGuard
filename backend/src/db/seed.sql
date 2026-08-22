-- Optional demo data for UC4 - Food Analytics.
-- Run AFTER schema.sql and after registering at least one real user
-- (see README). Replace the user_id below with your actual user_id.

-- Example (adjust user_id = 1 to match a real registered + verified user):
-- INSERT INTO food_items (user_id, item_name, quantity, unit, category, expiry_date, status) VALUES
-- (1, 'Chicken Breast', 1, 'kg', 'meat', '2026-08-01', 'used'),
-- (1, 'Fresh Milk', 2, 'L', 'dairy', '2026-07-30', 'used'),
-- (1, 'Bread Loaf', 1, 'pcs', 'bakery', '2026-07-26', 'donated'),
-- (1, 'Canned Beans', 3, 'pcs', 'canned', '2026-12-01', 'active');

-- INSERT INTO donations (user_id, item_name, quantity, status, posted_at, completed_at) VALUES
-- (1, 'Bread Loaf', 1, 'completed', '2026-07-20 09:00:00', '2026-07-21 14:00:00'),
-- (1, 'Rice (5kg bag)', 1, 'listed', '2026-07-22 10:00:00', NULL);

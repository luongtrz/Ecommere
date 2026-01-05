-- Migration script: Move products from parent categories to leaf categories
-- This handles the case where old data has products assigned to parent categories

-- Step 1: Identify parent categories with products
-- These violate the new business rule

SELECT 
  c.id,
  c.name,
  c.slug,
  COUNT(p.id) as product_count,
  COUNT(child.id) as children_count
FROM categories c
LEFT JOIN products p ON p."categoryId" = c.id
LEFT JOIN categories child ON child."parentId" = c.id
GROUP BY c.id, c.name, c.slug
HAVING COUNT(child.id) > 0 AND COUNT(p.id) > 0;

-- Step 2: Manual migration options

-- Option 1: Move all products from parent to its first child
-- UPDATE products 
-- SET "categoryId" = (
--   SELECT id FROM categories 
--   WHERE "parentId" = 'parent-category-id' 
--   LIMIT 1
-- )
-- WHERE "categoryId" = 'parent-category-id';

-- Option 2: Create a "General" subcategory for each parent with products
-- INSERT INTO categories (id, name, slug, "parentId")
-- VALUES (gen_random_uuid(), 'Tong hop', 'tong-hop', 'parent-category-id');
-- 
-- UPDATE products 
-- SET "categoryId" = (new-general-subcategory-id)
-- WHERE "categoryId" = 'parent-category-id';

-- For your specific case "Cham Soc Ca Nhan":
-- Option: Move 4 products to "Cham soc suc khoe" subcategory

-- UPDATE products
-- SET "categoryId" = (
--   SELECT id FROM categories 
--   WHERE slug = 'cham-soc-suc-khoe' 
--   LIMIT 1
-- )
-- WHERE "categoryId" = (
--   SELECT id FROM categories 
--   WHERE slug = 'cham-soc-ca-nhan' 
--   LIMIT 1
-- );

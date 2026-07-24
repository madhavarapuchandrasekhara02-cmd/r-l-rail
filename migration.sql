-- Roots & Leaves Database Migration: Production Hardening
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard) for your database.

-- =====================================================================
-- 1. ALIGN ORDER STATUS CHECK CONSTRAINT
-- =====================================================================
-- First, drop the existing status constraint if it exists.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Re-create the constraint including 'Returned' and 'RTO' statuses.
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('Pending', 'Paid', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'RTO'));

-- =====================================================================
-- 2. CREATE PERFORMANCE INDEXES
-- =====================================================================
-- Optimizes storefront guest tracking lookups by phone or order number.
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);

-- Optimizes admin panel listing and dashboard KPI aggregations.
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- Optimizes order details retrieval and packing list aggregations.
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- Optimizes Delhivery webhook updates and status checks.
CREATE INDEX IF NOT EXISTS idx_shipments_waybill ON shipments (waybill);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments (order_id);

-- Optimizes Razorpay webhook query lookups.
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders (payment_method);

-- =====================================================================
-- 3. CREATE ATOMIC CASCADE DELETION FUNCTION
-- =====================================================================
-- Safely deletes a product and all its variants inside a database transaction.
CREATE OR REPLACE FUNCTION delete_product_cascade(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete all associated product variants
  DELETE FROM product_variants WHERE product_id = p_product_id;
  
  -- Delete the product itself
  DELETE FROM products WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 4. CREATE TOP SELLERS ANALYTICS AGGREGATION FUNCTION
-- =====================================================================
-- Aggregates real quantities sold and revenue generated for paid/shipped/delivered orders.
CREATE OR REPLACE FUNCTION get_top_products(limit_count INT DEFAULT 5)
RETURNS TABLE(product_name TEXT, total_quantity BIGINT, total_revenue NUMERIC)
AS $$
  SELECT
    oi.product_name,
    SUM(oi.quantity)::BIGINT AS total_quantity,
    SUM(oi.price * oi.quantity)::NUMERIC AS total_revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('Paid', 'Shipped', 'Delivered')
  GROUP BY oi.product_name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
$$ LANGUAGE sql STABLE;

-- =====================================================================
-- 5. CREATE CATEGORY COUNTS CONSOLIDATION FUNCTION
-- =====================================================================
-- Consolidates product counts per category in a single query.
CREATE OR REPLACE FUNCTION get_category_counts()
RETURNS TABLE(category TEXT, count BIGINT)
AS $$
  SELECT category, COUNT(*)::BIGINT
  FROM products
  GROUP BY category;
$$ LANGUAGE sql STABLE;

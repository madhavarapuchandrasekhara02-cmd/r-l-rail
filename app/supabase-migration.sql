-- ============================================
-- AYUSHAA FOODS & NATURALS - DB UPDATE
-- ============================================
-- Run this script in your Supabase SQL Editor

-- 1. Create a sequence for Sequential Order IDs (RAL-1, RAL-2, etc.)
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- 2. Update the generate_order_number function to use the sequence
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'RAL-' || NEXTVAL('order_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger is attached (It should already be, but recreating is safe)
DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- 3. Create a sequence for Auto SKU Generation (PROD-1001, etc.)
CREATE SEQUENCE IF NOT EXISTS sku_seq START 1001;

-- 4. Create an RPC function to get the next SKU safely from the frontend
CREATE OR REPLACE FUNCTION get_next_sku(prefix text DEFAULT 'PROD')
RETURNS text AS $$
BEGIN
  RETURN prefix || '-' || NEXTVAL('sku_seq');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_next_sku(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_sku(text) TO anon;

-- Note: Ensure that product_variants has SKU as UNIQUE if not already
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_sku_key;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_sku_key UNIQUE (sku);

-- ============================================
-- ENTERPRISE TAXATION SCHEMA ADDITIONS
-- ============================================

-- Add tax and HSN columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate INTEGER NOT NULL DEFAULT 18;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT NOT NULL DEFAULT '33051090';

-- Add tax and invoice columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_taxable INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cgst INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_sgst INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_igst INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_gst INTEGER NOT NULL DEFAULT 0;

-- Add tax and HSN columns to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS hsn_code TEXT NOT NULL DEFAULT '33051090';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS gst_rate INTEGER NOT NULL DEFAULT 18;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS taxable_value INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cgst_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sgst_amount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS igst_amount INTEGER NOT NULL DEFAULT 0;

-- Create sequence for Invoice sequence
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;


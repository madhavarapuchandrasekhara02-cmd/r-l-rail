-- Ayushyaa Foods & Naturals - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  ingredients TEXT,
  how_to_use TEXT,
  rating DECIMAL(2,1) DEFAULT 4.5,
  category TEXT NOT NULL CHECK (category IN ('Foods', 'Naturals')),
  images TEXT[] DEFAULT '{}',
  gst_rate INTEGER NOT NULL DEFAULT 18 CHECK (gst_rate IN (0, 5, 12, 18, 28)),
  hsn_code TEXT NOT NULL DEFAULT '33051090',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCT VARIANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_label TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  sku TEXT NOT NULL UNIQUE,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  invoice_number TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  landmark TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled')),
  total INTEGER NOT NULL DEFAULT 0,
  delivery_charge INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'phonepe',
  total_taxable INTEGER NOT NULL DEFAULT 0,
  total_cgst INTEGER NOT NULL DEFAULT 0,
  total_sgst INTEGER NOT NULL DEFAULT 0,
  total_igst INTEGER NOT NULL DEFAULT 0,
  total_gst INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0,
  hsn_code TEXT NOT NULL DEFAULT '33051090',
  gst_rate INTEGER NOT NULL DEFAULT 18,
  taxable_value INTEGER NOT NULL DEFAULT 0,
  cgst_amount INTEGER NOT NULL DEFAULT 0,
  sgst_amount INTEGER NOT NULL DEFAULT 0,
  igst_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Shipped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHIPMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  waybill TEXT,
  tracking_status TEXT,
  tracking_url TEXT,
  label_url TEXT,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DO $$
BEGIN
  -- Products
  DROP POLICY IF EXISTS "Products public read" ON products;
  DROP POLICY IF EXISTS "Products admin all" ON products;
  
  -- Variants
  DROP POLICY IF EXISTS "Variants public read" ON product_variants;
  DROP POLICY IF EXISTS "Variants admin all" ON product_variants;
  
  -- Orders
  DROP POLICY IF EXISTS "Orders public create" ON orders;
  DROP POLICY IF EXISTS "Orders public read own" ON orders;
  DROP POLICY IF EXISTS "Orders admin all" ON orders;
  
  -- Order Items
  DROP POLICY IF EXISTS "Order items public read own" ON order_items;
  DROP POLICY IF EXISTS "Order items admin all" ON order_items;
  
  -- Shipments
  DROP POLICY IF EXISTS "Shipments public read own" ON shipments;
  DROP POLICY IF EXISTS "Shipments admin all" ON shipments;
END $$;

-- ============================================
-- PUBLIC POLICIES (Storefront)
-- ============================================

-- Products: public can read
CREATE POLICY "Products public read" ON products FOR SELECT USING (true);

-- Variants: public can read
CREATE POLICY "Variants public read" ON product_variants FOR SELECT USING (true);

-- ============================================
-- ADMIN POLICIES (Full access for authenticated users)
-- ============================================

-- Products: admin full access (Disabled from frontend)
CREATE POLICY "Products admin all" ON products FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Variants: admin full access (Disabled from frontend)
CREATE POLICY "Variants admin all" ON product_variants FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Orders: admin full access (Disabled from frontend)
CREATE POLICY "Orders admin all" ON orders FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Order Items: admin full access (Disabled from frontend)
CREATE POLICY "Order items admin all" ON order_items FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Shipments: admin full access (Disabled from frontend)
CREATE POLICY "Shipments admin all" ON shipments FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- ============================================
-- STORAGE BUCKET (Product Images)
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
  DROP POLICY IF EXISTS "Product images admin upload" ON storage.objects;
END $$;

CREATE POLICY "Product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Product images admin upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Product images admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- ============================================
-- FUNCTION: Auto-generate order number
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- ============================================
-- SEED DATA (Sample Products)
-- ============================================
-- Uncomment and run to add sample data:

-- INSERT INTO products (name, slug, description, ingredients, how_to_use, category, images) VALUES
-- ('Dry Fruit Laddu', 'dry-fruit-laddu', 'Handcrafted with premium dry fruits, nuts, and jaggery. A healthy alternative to traditional sweets.', 'Almonds, Cashews, Dates, Raisins, Ghee, Jaggery', 'Consume 1-2 laddus daily as a healthy snack. Best enjoyed with warm milk.', 'Foods', ARRAY['https://example.com/laddu.jpg']),
-- ('Chia Seeds', 'chia-seeds', 'Premium quality chia seeds rich in omega-3 fatty acids, fiber, and protein.', '100% Pure Chia Seeds', 'Add 1-2 tbsp to smoothies, yogurt, or salads. Soak in water for 10 minutes before consuming.', 'Foods', ARRAY['https://example.com/chia.jpg']),
-- ('Herbal Nourish Shampoo', 'herbal-nourish-shampoo', 'Gentle, chemical-free shampoo made with Ayurvedic herbs for healthy hair.', 'Amla, Reetha, Shikakai, Bhringraj, Aloe Vera', 'Wet hair, apply shampoo, massage gently, rinse thoroughly. Use 2-3 times a week.', 'Naturals', ARRAY['https://example.com/shampoo.jpg']);

-- INSERT INTO product_variants (product_id, size_label, price, sku, stock)
-- SELECT id, '250g', 249, 'DFL-250', 100 FROM products WHERE slug = 'dry-fruit-laddu'
-- UNION ALL
-- SELECT id, '500g', 499, 'DFL-500', 50 FROM products WHERE slug = 'dry-fruit-laddu'
-- UNION ALL
-- SELECT id, '100g', 65, 'CHIA-100', 200 FROM products WHERE slug = 'chia-seeds'
-- UNION ALL
-- SELECT id, '200ml', 199, 'HNS-200', 75 FROM products WHERE slug = 'herbal-nourish-shampoo';

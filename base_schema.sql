CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  ingredients text,
  how_to_use text,
  rating numeric DEFAULT 4.5,
  category text NOT NULL CHECK (category = ANY (ARRAY['hair-rituals'::text, 'face-rituals'::text, 'wellness-rituals'::text, 'baby-rituals'::text])),
  images text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  gst_rate integer NOT NULL DEFAULT 18,
  hsn_code text NOT NULL DEFAULT '33051090'::text,
  display_order integer NOT NULL DEFAULT 999,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  size_label text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  sku text NOT NULL UNIQUE,
  stock integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_number text NOT NULL UNIQUE DEFAULT ('RAL-' || nextval('order_number_seq')::TEXT),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  landmark text,
  status text NOT NULL CHECK (status = ANY (ARRAY['Pending'::text, 'Paid'::text, 'Packed'::text, 'Shipped'::text, 'Delivered'::text, 'Cancelled'::text, 'Returned'::text, 'RTO'::text])),
  total integer NOT NULL DEFAULT 0,
  delivery_charge integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  total_taxable integer NOT NULL DEFAULT 0,
  total_cgst integer NOT NULL DEFAULT 0,
  total_sgst integer NOT NULL DEFAULT 0,
  total_igst integer NOT NULL DEFAULT 0,
  total_gst integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  invoice_number text,
  CONSTRAINT orders_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id text NOT NULL,
  variant_id text NOT NULL,
  product_name text NOT NULL,
  variant_label text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  hsn_code text NOT NULL DEFAULT '33051090'::text,
  gst_rate integer NOT NULL DEFAULT 18,
  taxable_value integer NOT NULL DEFAULT 0,
  cgst_amount integer NOT NULL DEFAULT 0,
  sgst_amount integer NOT NULL DEFAULT 0,
  igst_amount integer NOT NULL DEFAULT 0,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  waybill text UNIQUE,
  tracking_status text,
  tracking_url text,
  label_url text,
  shipped_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  courier_partner text DEFAULT 'Delhivery'::text,
  tracking_id text,
  pickup_status text DEFAULT 'Pending'::text,
  last_tracking_update timestamp with time zone,
  pickup_request_id text,
  pickup_scheduled_time timestamp with time zone,
  CONSTRAINT shipments_pkey PRIMARY KEY (id),
  CONSTRAINT shipments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

CREATE TABLE IF NOT EXISTS public.shipment_batches (
  id text NOT NULL,
  order_ids text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipment_batches_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  shipment_id uuid,
  status text NOT NULL,
  location text,
  description text,
  event_time timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipment_tracking_events_pkey PRIMARY KEY (id),
  CONSTRAINT shipment_tracking_events_shipment_id_fkey FOREIGN KEY (shipment_id) REFERENCES public.shipments(id)
);

CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text NOT NULL,
  CONSTRAINT admin_emails_pkey PRIMARY KEY (email)
);

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip text NOT NULL,
  count integer DEFAULT 0,
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT rate_limits_pkey PRIMARY KEY (ip)
);

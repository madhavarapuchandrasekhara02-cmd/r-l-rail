# Ayushyaa Foods & Naturals - Fullstack eCommerce Platform

## Architecture

This is a **fullstack eCommerce application** built with:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend API**: Hono + tRPC (type-safe APIs)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: PhonePe UPI Integration
- **Shipping**: Shiprocket API (waybill, tracking, labels)

## Project Structure

```
/mnt/agents/output/app/
├── src/
│   ├── pages/           # Storefront pages (Home, Shop, Product, Checkout, Track, About, Contact)
│   ├── admin/           # Admin Dashboard (Login, Dashboard, Products, Orders, Packing)
│   ├── components/      # Shared components (Navbar, Footer, CartDrawer, ProductCard)
│   ├── lib/             # Utilities (Supabase client, Zustand cart store)
│   ├── App.tsx          # Router configuration
│   └── main.tsx         # Entry point
├── api/
│   ├── routers/         # tRPC routers (payment, shipping, order, dispatch)
│   ├── lib/             # Server utilities
│   ├── router.ts        # Main router registration
│   └── boot.ts          # Hono server entry
├── contracts/           # Shared types
├── db/                  # Database schema (Drizzle ORM)
├── supabase-schema.sql  # Supabase SQL schema + RLS policies
└── .env.example         # Environment variable template
```

## Setup Instructions

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com) and create a new project
- Copy the project URL and anon key

### 2. Run the SQL Schema
- Open the Supabase SQL Editor
- Copy and paste the contents of `supabase-schema.sql`
- Run the script to create all tables, indexes, RLS policies, and storage bucket

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### 4. Set Up Admin User
In Supabase Auth, create an admin user with email/password. Only authenticated users can access the admin dashboard.

### 5. Install & Run
```bash
npm install
npm run dev          # Development server
npm run build        # Production build
```

## Storefront Features

- **Home Page**: Hero, featured products, trust badges, shop by category, stats
- **Shop Page**: Product grid with category tabs (All/Foods/Naturals), search
- **Product Detail**: Image gallery, variant selector (size), quantity, accordion sections (description, ingredients, how to use, storage)
- **Cart Drawer**: Slide-out with items, quantity controls, delivery threshold, coupon
- **Checkout**: Multi-step (Address -> Payment), pincode auto-lookup, PhonePe/COD
- **Track Order**: Search by order ID or phone, status timeline, tracking details
- **About & Contact**: Brand story, founder info, contact cards, Google Maps

## Admin Dashboard Features

- **Authentication**: Supabase Auth (email/password), route guards
- **Dashboard**: KPI cards (Total Sales, Pending Orders), recent orders
- **Product Management**: Full CRUD with image upload (WebP compression, max 2MB), variant management
- **Order Management**: Filter by status, expand for details, partial fulfillment
- **Packing List**: Aggregated view of all pending items grouped by product+variant
- **Dispatch**: Mark as shipped, auto-generate waybill, tracking URL, label

## API Routes (tRPC)

| Router | Endpoint | Description |
|--------|----------|-------------|
| `payment.initiate` | POST | Initiate PhonePe payment |
| `payment.callback` | POST | PhonePe callback handler |
| `shipping.checkPincode` | GET | Check pincode serviceability |
| `shipping.calculateCost` | GET | Calculate shipping cost |
| `order.list` | GET | List orders (with filters) |
| `order.getById` | GET | Get single order |
| `order.updateStatus` | POST | Update order status |
| `order.getPackingList` | GET | Get aggregated packing list |
| `order.getKPIs` | GET | Get dashboard KPIs |
| `dispatch.createShipment` | POST | Create shipment + waybill |
| `dispatch.partialFulfill` | POST | Mark individual items shipped |
| `dispatch.generateLabel` | GET | Generate shipping label |

## Database Schema

### products
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Product name |
| slug | text | URL-friendly slug |
| description | text | Product description |
| ingredients | text | Ingredients list |
| how_to_use | text | Usage instructions |
| rating | decimal | Product rating |
| category | text | Foods or Naturals |
| images | text[] | Array of image URLs |

### product_variants
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| product_id | uuid | FK to products |
| size_label | text | e.g. "250g", "200ml" |
| price | integer | Price in INR |
| sku | text | Stock keeping unit |
| stock | integer | Inventory count |

### orders
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_number | text | Unique order ID (auto-generated) |
| customer_name | text | Customer name |
| customer_phone | text | Phone number |
| status | text | Pending/Paid/Shipped/Delivered |
| total | integer | Total amount |
| delivery_charge | integer | Shipping cost |

### order_items
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_id | uuid | FK to orders |
| product_id | text | Product reference |
| variant_id | text | Variant reference |
| product_name | text | Denormalized name |
| variant_label | text | Denormalized size |
| quantity | integer | Qty ordered |
| status | text | Pending/Shipped |

### shipments
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_id | uuid | FK to orders |
| waybill | text | Tracking number |
| tracking_status | text | Current status |
| tracking_url | text | Courier tracking URL |
| label_url | text | Shipping label URL |
| shipped_at | timestamptz | Ship timestamp |

## RLS Policies

### Public (Storefront)
- **products**: Read only
- **product_variants**: Read only
- **orders**: Create (checkout) + Read (track own)
- **order_items**: Create + Read own
- **shipments**: Read own

### Authenticated (Admin)
- **All tables**: Full CRUD access
- **Storage**: Upload/delete product images

## Security Notes

- Stock is NEVER exposed in the storefront UI
- Stock is only visible in the admin dashboard (product edit form)
- All admin routes are protected by auth guards
- tRPC provides end-to-end type safety
- Supabase RLS ensures data isolation

## Deployment

### Storefront (Hostinger)
1. Build: `npm run build`
2. Upload `dist/public/` contents to Hostinger
3. Set environment variables
4. The server runs on port 3000

### Admin Dashboard
- Built into the same project at `/admin/*` routes
- Deploy the same build, access `/admin` for the dashboard

## Environment Variables Reference

| Variable | Description | Source |
|----------|-------------|--------|
| VITE_SUPABASE_URL | Supabase project URL | Supabase Dashboard |
| VITE_SUPABASE_ANON_KEY | Supabase anon/public key | Supabase Dashboard |
| SUPABASE_SERVICE_KEY | Supabase service role key | Supabase Dashboard |
| PHONEPE_MERCHANT_ID | PhonePe merchant ID | PhonePe Dashboard |
| PHONEPE_SALT_KEY | PhonePe salt key | PhonePe Dashboard |
| SHIPROCKET_EMAIL | Shiprocket login email | Shiprocket Account |
| SHIPROCKET_PASSWORD | Shiprocket password | Shiprocket Account |

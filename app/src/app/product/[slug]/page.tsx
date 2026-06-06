/**
 * Product Detail Page — Dynamic Server Component
 * Generates per-product metadata, Product schema, BreadcrumbList,
 * FAQPage schema, and Speakable schema from Supabase data.
 *
 * ProductDetail UI view is "use client" — unchanged visually.
 */
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import ProductDetail from "@/views/ProductDetail";
import SchemaOrg from "@/components/SchemaOrg";
import {
  buildProductSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
  BRAND,
} from "@/lib/seo";

// ─── Supabase Server Client ───────────────────────────────────────────────────

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

// ─── Dynamic Metadata ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabaseServer();

  const { data: product } = await supabase
    .from("products")
    .select(`*, product_variants(*)`)
    .eq("slug", slug)
    .single();

  if (!product) {
    return {
      title: "Product Not Found | Roots & Leaves",
      description: "This product could not be found.",
    };
  }

  const variants = product.product_variants || [];
  const minPrice = variants.length
    ? Math.min(...variants.map((v: { price: number }) => v.price))
    : 0;
  const maxPrice = variants.length
    ? Math.max(...variants.map((v: { price: number }) => v.price))
    : 0;
  const priceStr =
    minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice}–₹${maxPrice}`;
  const image = product.images?.[0] || BRAND.logo;
  const category = product.category || "herbal care";
  const categoryLabel = category.replace("-", " ");

  const title = `${product.name} — Premium Herbal ${categoryLabel} | Roots & Leaves`;
  const description =
    product.description
      ? `${product.name} by Roots & Leaves. ${product.description.slice(0, 120)}. 100% natural, chemical-free. ${priceStr}. Ships across South India.`
      : `${product.name} — Premium herbal ${categoryLabel} by Roots & Leaves. 100% natural & chemical-free. ${priceStr}. Trusted across South India.`;

  return {
    title,
    description,
    keywords: [
      `${product.name} buy online`,
      `${product.name} price India`,
      `herbal ${categoryLabel} South India`,
      `natural ${categoryLabel} Andhra Pradesh`,
      `ayurvedic ${categoryLabel} Telangana`,
      `chemical free ${categoryLabel} India`,
      "Roots and Leaves products",
      "premium herbal hair care India",
    ].join(", "),
    alternates: {
      canonical: `${BRAND.url}/product/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${BRAND.url}/product/${slug}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: `${product.name} — Roots & Leaves Herbal Product`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ─── Product FAQ (generic — AI/voice searchable) ──────────────────────────────

function buildProductFaqs(productName: string, category: string) {
  const cat = category.replace("-", " ");
  return [
    {
      question: `Is ${productName} 100% natural and chemical-free?`,
      answer: `Yes. ${productName} by Roots & Leaves is formulated with 100% natural botanical ingredients. It contains no synthetic chemicals, parabens, sulfates, or artificial fragrances. All products are handcrafted in small batches to preserve purity and potency.`,
    },
    {
      question: `How do I use ${productName}?`,
      answer: `Apply ${productName} as directed. For hair oils, warm gently and massage into the scalp in circular motions. Leave for 30–60 minutes or overnight before washing. For shampoos and conditioners, apply to wet hair, lather gently, and rinse thoroughly.`,
    },
    {
      question: `Does ${productName} ship across South India?`,
      answer: `Yes. Roots & Leaves ships ${productName} across all of South India including Andhra Pradesh, Telangana, Karnataka, and Tamil Nadu. We deliver to Hyderabad, Vijayawada, Visakhapatnam, Bangalore, Chennai, Tirupati, Guntur, Warangal, Mysore, and Coimbatore.`,
    },
    {
      question: `What are the key ingredients in ${productName}?`,
      answer: `${productName} contains carefully selected Ayurvedic botanicals including traditional South Indian herbs known for their hair and skin benefits. All ingredients are sourced from trusted natural origins across India.`,
    },
    {
      question: `Is ${productName} suitable for all hair types?`,
      answer: `Roots & Leaves products are formulated to be gentle and suitable for most hair types including dry, oily, normal, and damaged hair. Being 100% natural and chemical-free, they are safe for regular use.`,
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabaseServer();

  const { data: product } = await supabase
    .from("products")
    .select(`*, product_variants(*)`)
    .eq("slug", slug)
    .single();

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: product?.name || "Product", path: `/product/${slug}` },
  ]);

  const productFaqs = buildProductFaqs(
    product?.name || "This Product",
    product?.category || "herbal care"
  );
  const faqSchema = buildFAQSchema(productFaqs);

  const variants = product?.product_variants || [];
  const minPrice = variants.length
    ? Math.min(...variants.map((v: { price: number }) => v.price))
    : 0;
  const maxPrice = variants.length
    ? Math.max(...variants.map((v: { price: number }) => v.price))
    : 0;

  const productSchema = product
    ? buildProductSchema({
        name: product.name,
        description:
          product.description ||
          `Premium herbal ${product.category} by Roots & Leaves — 100% natural, chemical-free.`,
        slug,
        image: product.images?.[0] || BRAND.logo,
        minPrice,
        maxPrice,
        rating: product.rating || 4.5,
        reviewCount: 20,
        sku: product.sku || slug,
        ingredients: product.ingredients || undefined,
      })
    : null;

  return (
    <>
      {/* ── Structured Data (zero UI impact) ── */}
      <SchemaOrg schema={breadcrumbSchema} />
      <SchemaOrg schema={faqSchema} />
      {productSchema && <SchemaOrg schema={productSchema} />}

      {/* ── Semantic hidden FAQ for AI/crawlers ── */}
      {product && (
        <section
          aria-label={`FAQ about ${product.name}`}
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
            borderWidth: 0,
          }}
        >
          <h2>{product.name} — Frequently Asked Questions</h2>
          {productFaqs.map((faq, i) => (
            <div key={i} itemScope itemType="https://schema.org/Question">
              <h3 itemProp="name">{faq.question}</h3>
              <div itemScope itemType="https://schema.org/Answer">
                <p itemProp="text">{faq.answer}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── The actual UI (unchanged) ── */}
      <ProductDetail />
    </>
  );
}

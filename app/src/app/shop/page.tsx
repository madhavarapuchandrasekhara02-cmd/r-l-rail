/**
 * Shop Page — Server Component with SEO metadata + ItemList schema
 */
import type { Metadata } from "next";
import Shop from "@/views/Shop";
import { Suspense } from "react";
import SchemaOrg from "@/components/SchemaOrg";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title:
    "Shop Herbal Hair Care Products — Natural Hair Oils, Shampoos & More",
  description:
    "Shop Roots & Leaves premium herbal hair care collection. 100% natural herbal hair oils, chemical-free shampoos, Ayurvedic conditioners, herbal hair dyes, and natural bath powders. Trusted across South India — shop online with delivery to Andhra Pradesh, Telangana, Karnataka & Tamil Nadu.",
  keywords: [
    "buy herbal hair oil online",
    "herbal shampoo online India",
    "natural hair care products South India",
    "ayurvedic hair products online",
    "chemical free hair care online",
    "herbal hair oil Andhra Pradesh buy",
    "herbal shampoo Hyderabad",
    "natural hair oil Bangalore buy",
    "best herbal hair products India",
    "herbal hair dye online",
    "herbal bath powder buy",
  ].join(", "),
  alternates: {
    canonical: "https://www.rootsandleaves.in/shop",
  },
  openGraph: {
    title: "Shop Herbal Hair Care — Roots & Leaves Natural Products",
    description:
      "Browse our full collection of premium herbal hair oils, shampoos, conditioners and more. 100% natural. Ships across South India.",
    url: "https://www.rootsandleaves.in/shop",
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Shop", path: "/shop" },
]);

const collectionPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Roots & Leaves Herbal Products Collection",
  description:
    "Premium herbal hair care and wellness products including hair oils, shampoos, conditioners, hair dyes, and bath powders.",
  url: "https://www.rootsandleaves.in/shop",
  provider: {
    "@type": "Organization",
    "@id": "https://www.rootsandleaves.in/#organization",
  },
};

export default function Page() {
  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <SchemaOrg schema={collectionPageSchema} />
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
        <Shop />
      </Suspense>
    </>
  );
}

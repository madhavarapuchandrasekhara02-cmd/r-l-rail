/**
 * Shipping Policy Page — Server Component with SEO metadata
 */
import type { Metadata } from "next";
import ShippingPolicy from "@/views/Shipping";
import SchemaOrg from "@/components/SchemaOrg";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Shipping Policy — Roots & Leaves | Delivery Across South India",
  description:
    "Roots & Leaves shipping policy. We deliver herbal hair care products across India including Andhra Pradesh, Telangana, Karnataka, Tamil Nadu, and all major cities. Standard delivery in 3–7 business days.",
  robots: { index: true, follow: false },
  alternates: {
    canonical: "https://www.rootsandleaves.in/shipping",
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Shipping Policy", path: "/shipping" },
]);

export default function Page() {
  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <ShippingPolicy />
    </>
  );
}

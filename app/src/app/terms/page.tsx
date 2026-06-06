/**
 * Terms of Service Page — Server Component with SEO metadata
 */
import type { Metadata } from "next";
import TermsOfService from "@/views/Terms";
import SchemaOrg from "@/components/SchemaOrg";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Service — Roots & Leaves",
  description:
    "Roots & Leaves Terms of Service. Read our complete terms and conditions governing the use of our website and purchase of our premium herbal hair care products.",
  robots: { index: true, follow: false },
  alternates: {
    canonical: "https://www.rootsandleaves.in/terms",
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Terms of Service", path: "/terms" },
]);

export default function Page() {
  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <TermsOfService />
    </>
  );
}

/**
 * Returns/Refund Policy Page — Server Component with SEO metadata
 */
import type { Metadata } from "next";
import RefundPolicy from "@/views/Returns";
import SchemaOrg from "@/components/SchemaOrg";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Refund & Return Policy — Roots & Leaves",
  description:
    "Roots & Leaves refund and return policy. We stand behind our natural herbal products. Read our complete refund and return process to understand how we handle returns and exchanges.",
  robots: { index: true, follow: false },
  alternates: {
    canonical: "https://www.rootsandleaves.in/returns",
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Return Policy", path: "/returns" },
]);

export default function Page() {
  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <RefundPolicy />
    </>
  );
}

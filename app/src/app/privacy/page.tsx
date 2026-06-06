/**
 * Privacy Policy Page — Server Component with SEO metadata
 */
import type { Metadata } from "next";
import PrivacyPolicy from "@/views/Privacy";
import SchemaOrg from "@/components/SchemaOrg";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy — Roots & Leaves",
  description:
    "Read the Roots & Leaves Privacy Policy. We are committed to protecting your personal information and maintaining transparency about how we collect and use your data.",
  robots: { index: true, follow: false },
  alternates: {
    canonical: "https://www.rootsandleaves.in/privacy",
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Privacy Policy", path: "/privacy" },
]);

export default function Page() {
  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <PrivacyPolicy />
    </>
  );
}

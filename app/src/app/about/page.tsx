/**
 * About Page — Server Component with SEO metadata + schema
 */
import type { Metadata } from "next";
import About from "@/views/About";
import SchemaOrg from "@/components/SchemaOrg";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Roots & Leaves — Our Ayurvedic Heritage & Story",
  description:
    "Learn about Roots & Leaves — South India's premium herbal hair wellness brand. Founded on traditional Ayurvedic wisdom and pure botanical care, we preserve ancient South Indian hair rituals for modern women across Andhra Pradesh, Telangana, Karnataka & Tamil Nadu.",
  alternates: {
    canonical: "https://www.rootsandleaves.in/about",
  },
  openGraph: {
    title: "About Roots & Leaves — Our Ayurvedic Heritage & Story",
    description:
      "Discover the story behind South India's most trusted herbal hair wellness brand. Pure botanicals, ancient wisdom, modern luxury.",
    url: "https://www.rootsandleaves.in/about",
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
]);

const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Roots & Leaves",
  description:
    "Roots & Leaves is South India's premium herbal hair wellness brand rooted in traditional Ayurvedic wisdom and pure botanical formulations.",
  url: "https://www.rootsandleaves.in/about",
  mainEntity: {
    "@type": "Organization",
    "@id": "https://www.rootsandleaves.in/#organization",
  },
};

export default function Page() {
  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <SchemaOrg schema={aboutPageSchema} />
      <About />
    </>
  );
}

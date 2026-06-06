/**
 * Contact Page — Server Component with SEO metadata + LocalBusiness schema
 */
import type { Metadata } from "next";
import Contact from "@/views/Contact";
import SchemaOrg from "@/components/SchemaOrg";
import { buildBreadcrumbSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact Roots & Leaves — Herbal Hair Wellness Brand Visakhapatnam",
  description:
    "Contact Roots & Leaves for questions about our herbal hair care products. Reach our apothecary team via email, phone, or WhatsApp. Located in Gajuwaka, Visakhapatnam, Andhra Pradesh. We ship across Andhra Pradesh, Telangana, Karnataka & Tamil Nadu.",
  alternates: {
    canonical: "https://www.rootsandleaves.in/contact",
  },
  openGraph: {
    title: "Contact Roots & Leaves — Premium Herbal Hair Brand Visakhapatnam",
    description:
      "Get in touch with our team for product queries, orders, or feedback. Available via email, phone & WhatsApp.",
    url: "https://www.rootsandleaves.in/contact",
  },
};

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
]);

const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Roots & Leaves",
  description:
    "Get in touch with Roots & Leaves for herbal hair care product queries, orders, and customer support.",
  url: "https://www.rootsandleaves.in/contact",
  mainEntity: {
    "@type": "LocalBusiness",
    "@id": "https://www.rootsandleaves.in/#localbusiness",
  },
};

export default function Page() {
  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <SchemaOrg schema={contactPageSchema} />
      <Contact />
    </>
  );
}

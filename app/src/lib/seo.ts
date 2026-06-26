/**
 * Roots & Leaves — Central SEO Utility
 * Generates metadata, JSON-LD schema, OpenGraph, hreflang tags,
 * and South India regional SEO signals.
 *
 * NO UI impact — purely meta/head layer.
 */

import type { Metadata } from "next";

// ─── Brand Constants ────────────────────────────────────────────────────────

export const BRAND = {
  name: "Roots & Leaves",
  legalName: "Ayushyaa Foods & Naturals",
  url: "https://www.rootsandleaves.in",
  logo: "https://www.rootsandleaves.in/roots-logo.png",
  email: "Rootsleaves2@gmail.com",
  phone: ["+916301204845"],
  address: {
    street: "10-1-62, Chaitanya Nagar, Gajuwaka",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    country: "IN",
    postalCode: "530026",
  },
  social: {
    instagram: "https://www.instagram.com/sishika.vlogs",
    youtube: "https://www.youtube.com/@SisHiKkA",
    whatsapp: "https://wa.me/916301204845",
  },
  description:
    "Experience the epitome of pure, luxurious Ayurvedic wellness. Roots & Leaves offers handcrafted, 100% natural hair and face care rituals. Discover the ancient secrets of true beauty.",
  keywords: [
    // Core product keywords
    "herbal hair oil",
    "herbal shampoo",
    "herbal hair care",
    "natural hair growth oil",
    "ayurvedic hair care",
    "herbal hair dye",
    "chemical-free hair products",
    "traditional hair care",
    "herbal bath powder",
    "natural conditioner",
    // Regional South India
    "herbal hair oil Andhra Pradesh",
    "herbal shampoo Telangana",
    "ayurvedic hair care Karnataka",
    "natural hair oil Tamil Nadu",
    "herbal hair care Hyderabad",
    "natural hair oil Vijayawada",
    "herbal shampoo Visakhapatnam",
    "herbal hair oil Visakhapatnam",
    "best hair care Vizag",
    "ayurvedic hair oil Bangalore",
    "herbal hair care Chennai",
    "herbal products Tirupati",
    "natural hair care Guntur",
    "herbal oil Warangal",
    // Brand + category
    "Roots and Leaves herbal",
    "premium herbal wellness South India",
    "best herbal hair oil India",
    "chemical free hair products India",
    "pure botanical hair care",
    "small batch ayurvedic products",
    // Ingredients
    "amla hair oil",
    "reetha shampoo",
    "shikakai hair care",
    "hibiscus hair oil",
    "bhringraj oil for hair growth",
  ],
} as const;

// ─── Default OpenGraph Image ─────────────────────────────────────────────────

export const OG_DEFAULTS = {
  images: [
    {
      url: `${BRAND.url}/roots-logo.png`,
      width: 1200,
      height: 630,
      alt: "Roots & Leaves — Premium Herbal Hair Wellness Brand South India",
    },
  ],
  siteName: BRAND.name,
  locale: "en_IN",
  type: "website" as const,
};

// ─── Metadata Builder ────────────────────────────────────────────────────────

export function buildMetadata({
  title,
  description,
  path = "",
  keywords = [],
  ogImage,
  noIndex = false,
  type = "website",
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  type?: "website" | "article" | "product";
}): Metadata {
  const canonical = `${BRAND.url}${path}`;
  const fullTitle = title.includes("Roots")
    ? title
    : `${title} | Roots & Leaves`;

  return {
    title: fullTitle,
    description,
    keywords: [...BRAND.keywords, ...keywords].join(", "),
    authors: [{ name: BRAND.legalName, url: BRAND.url }],
    creator: BRAND.legalName,
    publisher: BRAND.legalName,
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-snippet": -1,
            "max-image-preview": "large",
            "max-video-preview": -1,
          },
        },
    alternates: {
      canonical,
      languages: {
        "en-IN": canonical,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      ...OG_DEFAULTS,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }]
        : OG_DEFAULTS.images,
      type: type === "product" ? "website" : type === "article" ? "article" : "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImage ? [ogImage] : [OG_DEFAULTS.images[0].url],
      site: "@rootsandleaves",
      creator: "@rootsandleaves",
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
    category: "health & beauty",
    other: {
      "pinterest-rich-pin": "true",
    },
  };
}

// ─── JSON-LD Schema Builders ─────────────────────────────────────────────────

/** Organization schema — injected globally */
export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BRAND.url}/#organization`,
    name: BRAND.name,
    legalName: BRAND.legalName,
    url: BRAND.url,
    logo: {
      "@type": "ImageObject",
      url: BRAND.logo,
      width: 512,
      height: 512,
    },
    description: BRAND.description,
    foundingDate: "2022",
    areaServed: [
      "Andhra Pradesh",
      "Telangana",
      "Karnataka",
      "Tamil Nadu",
      "India",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: BRAND.phone[0],
        contactType: "customer service",
        availableLanguage: ["English", "Telugu", "Tamil", "Kannada", "Hindi"],
        areaServed: "IN",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: BRAND.address.street,
      addressLocality: BRAND.address.city,
      addressRegion: BRAND.address.state,
      postalCode: BRAND.address.postalCode,
      addressCountry: BRAND.address.country,
    },
    sameAs: [
      BRAND.social.instagram,
      BRAND.social.youtube,
      BRAND.social.whatsapp,
    ],
    brand: {
      "@type": "Brand",
      name: BRAND.name,
      description: "Premium herbal hair wellness brand rooted in South Indian Ayurvedic traditions.",
    },
  };
}

/** WebSite schema with SearchAction — enables sitelinks searchbox */
export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BRAND.url}/#website`,
    name: BRAND.name,
    url: BRAND.url,
    description: BRAND.description,
    inLanguage: ["en-IN", "te-IN", "ta-IN", "kn-IN"],
    publisher: {
      "@id": `${BRAND.url}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BRAND.url}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** SiteNavigationElement schema — encourages sitelinks in search results */
export function buildSiteNavigationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Hair Care",
        "description": "Premium, all-natural hair care rituals for ultimate nourishment.",
        "url": `${BRAND.url}/shop?category=hair-rituals`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Face Care",
        "description": "Luxurious Ayurvedic face care for a radiant, youthful glow.",
        "url": `${BRAND.url}/shop?category=face-rituals`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "All Products",
        "description": "Explore our complete collection of exquisite botanical formulations.",
        "url": `${BRAND.url}/shop`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "About Us",
        "description": "Discover the heritage, purity, and passion behind Roots & Leaves.",
        "url": `${BRAND.url}/about`
      },
      {
        "@type": "SiteNavigationElement",
        "position": 5,
        "name": "Track Your Order",
        "description": "Easily track the delivery status of your Roots & Leaves order.",
        "url": `${BRAND.url}/track`
      }
    ]
  };
}

/** LocalBusiness schema — Gajuwaka studio */
export function buildLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "Store", "HealthAndBeautyBusiness"],
    "@id": `${BRAND.url}/#localbusiness`,
    name: BRAND.name,
    legalName: BRAND.legalName,
    description: BRAND.description,
    url: BRAND.url,
    telephone: BRAND.phone[0],
    email: BRAND.email,
    image: BRAND.logo,
    logo: BRAND.logo,
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Credit Card, Debit Card, Net Banking",
    address: {
      "@type": "PostalAddress",
      streetAddress: BRAND.address.street,
      addressLocality: BRAND.address.city,
      addressRegion: BRAND.address.state,
      postalCode: BRAND.address.postalCode,
      addressCountry: BRAND.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 17.6896,
      longitude: 83.1655,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    areaServed: [
      { "@type": "State", name: "Andhra Pradesh", containedInPlace: { "@type": "Country", name: "India" } },
      { "@type": "State", name: "Telangana", containedInPlace: { "@type": "Country", name: "India" } },
      { "@type": "State", name: "Karnataka", containedInPlace: { "@type": "Country", name: "India" } },
      { "@type": "State", name: "Tamil Nadu", containedInPlace: { "@type": "Country", name: "India" } },
    ],
    hasMap: "https://maps.google.com/?q=Gajuwaka,Visakhapatnam",
    sameAs: [BRAND.social.instagram, BRAND.social.youtube, "https://www.bingplaces.com"],
    knowsAbout: [
      "Herbal Hair Care",
      "Ayurvedic Beauty",
      "Natural Hair Oils",
      "Herbal Shampoo",
      "Traditional South Indian Hair Rituals",
    ],
  };
}

/** Product schema builder — call per product */
export function buildProductSchema({
  name,
  description,
  slug,
  image,
  minPrice,
  maxPrice,
  rating,
  reviewCount,
  sku,
  ingredients,
}: {
  name: string;
  description: string;
  slug: string;
  image: string;
  minPrice: number;
  maxPrice: number;
  rating?: number;
  reviewCount?: number;
  sku?: string;
  ingredients?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: image || BRAND.logo,
    url: `${BRAND.url}/product/${slug}`,
    sku: sku || slug,
    mpn: sku || slug,
    gtin13: sku || undefined,
    brand: {
      "@type": "Brand",
      name: BRAND.name,
    },
    manufacturer: {
      "@type": "Organization",
      name: BRAND.legalName,
    },
    ...(ingredients
      ? {
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Key Ingredients",
              value: ingredients,
            },
            {
              "@type": "PropertyValue",
              name: "Formulation",
              value: "100% Natural, Ayurvedic, Chemical-Free",
            },
            {
              "@type": "PropertyValue",
              name: "Region",
              value: "South India",
            },
          ],
        }
      : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: 1,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: BRAND.name,
      },
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "INR",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 2,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
    },
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating,
            bestRating: 5,
            worstRating: 1,
            reviewCount: reviewCount || 10,
          },
        }
      : {}),
  };
}

/** BreadcrumbList schema builder */
export function buildBreadcrumbSchema(
  crumbs: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${BRAND.url}${crumb.path}`,
    })),
  };
}

/** FAQPage schema builder */
export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** QAPage schema builder for single question pages or prominent AIO targeting */
export function buildQASchema(question: string, answer: string, authorName = BRAND.legalName) {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: question,
      answerCount: 1,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
        author: {
          "@type": "Organization",
          name: authorName,
        },
      },
    },
  };
}

/** Speakable schema — marks sections readable by voice assistants */
export function buildSpeakableSchema(xpaths: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    speakable: {
      "@type": "SpeakableSpecification",
      xPath: xpaths,
    },
    url: BRAND.url,
  };
}

/** ItemList schema — for shop / category pages */
export function buildItemListSchema(
  items: { name: string; url: string; image?: string; position: number }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Roots & Leaves Herbal Products",
    description: "Premium herbal hair care and wellness products by Roots & Leaves",
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

/** MerchantReturnPolicy schema */
export function buildMerchantReturnPolicySchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MerchantReturnPolicy",
    applicableCountry: "IN",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  };
}

/** HowTo schema for products */
export function buildHowToSchema(name: string, steps: { name: string; text: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to use ${name}`,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

import type { Metadata, Viewport } from "next";
import { TRPCProvider } from "@/providers/trpc";
import Script from "next/script";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "@/index.css";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Toaster } from "sonner";
import SchemaOrg from "@/components/SchemaOrg";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildSiteNavigationSchema,
  buildLocalBusinessSchema,
  BRAND,
} from "@/lib/seo";

// ─── Fonts ───────────────────────────────────────────────────────────────────
// Only load the weights actually used, reducing font payload size

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

// ─── Global Metadata ─────────────────────────────────────────────────────────

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  // Default title template — each page overrides {title}
  title: {
    default:
      "Roots & Leaves | Luxury Ayurvedic Hair & Skin Care",
    template: "%s | Roots & Leaves",
  },
  description:
    "Experience the epitome of pure, luxurious Ayurvedic wellness. Roots & Leaves offers handcrafted, 100% natural hair and face care rituals. Discover the ancient secrets of true beauty.",
  keywords: [
    "Roots and Leaves",
    "Ayushyaa Foods and Naturals",
    "herbal hair oil",
    "herbal shampoo",
    "ayurvedic hair care",
    "natural hair growth oil",
    "herbal hair dye",
    "chemical-free hair products",
    "herbal bath powder",
    "natural conditioner",
    "best herbal hair oil South India",
    "herbal hair oil Andhra Pradesh",
    "herbal shampoo Telangana",
    "ayurvedic hair care Karnataka",
    "natural hair oil Tamil Nadu",
    "herbal hair care Hyderabad",
    "ayurvedic hair oil Bangalore",
    "herbal hair care Chennai",
    "best herbal products in AP",
    "buy natural hair products USA",
    "buy herbal hair products UK",
    "Telugu traditional hair care products",
    "Telugu NRI ayurvedic hair care",
    "South Indian herbal products USA",
    "pure herbal hair oil Chennai",
    "best hair oil for Indian women USA",
    "sulphate free ayurvedic shampoo USA",
    "paraben free herbal shampoo UK",
    "organic hair dye for grey hair",
    "sunni pindi online",
    "traditional South Indian bath powder",
    "buy sunni pindi in USA",
    "dry fruit laddu",
    "authentic South Indian dry fruit laddu",
    "premium chia seeds online",
    "best ayurvedic brand for hair growth oil and shampoo"
  ].join(", "),
  authors: [{ name: "Ayushyaa Foods & Naturals", url: BRAND.url }],
  creator: "Ayushyaa Foods & Naturals",
  publisher: "Roots & Leaves",
  robots: {
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
    canonical: BRAND.url,
    languages: {
      "en-IN": BRAND.url,
      "en-US": `${BRAND.url}/shipping/international`,
      "en-GB": `${BRAND.url}/shipping/international`,
      "te-IN": `${BRAND.url}/te`,
      "ta-IN": `${BRAND.url}/ta`,
      "kn-IN": `${BRAND.url}/kn`,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BRAND.url,
    siteName: BRAND.name,
    title: "Roots & Leaves | Luxury Ayurvedic Hair & Skin Care",
    description:
      "Experience the epitome of pure, luxurious Ayurvedic wellness. Roots & Leaves offers handcrafted, 100% natural hair and face care rituals.",
    images: [
      {
        url: `${BRAND.url}/roots-logo.png`,
        width: 1200,
        height: 630,
        alt: "Roots & Leaves — Luxury Ayurvedic Hair & Skin Care",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roots & Leaves | Luxury Ayurvedic Hair & Skin Care",
    description:
      "Experience the epitome of pure, luxurious Ayurvedic wellness.",
    images: [`${BRAND.url}/roots-logo.png`],
    site: "@rootsandleaves",
    creator: "@rootsandleaves",
  },
  category: "health & beauty",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    other: {
      me: ["Rootsleaves2@gmail.com"],
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
    },
  },
  other: {
    "pinterest-rich-pin": "true",
    "og:locale:alternate": ["te_IN", "ta_IN", "kn_IN"],
  },
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${cormorant.variable} ${dmSans.variable}`}
      style={{ backgroundColor: "#F3E9D7" }}
      suppressHydrationWarning
    >
      <head>
        {/* ── Preconnect to external domains for speed ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        {/* ── DNS Prefetch fallback ── */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* ── Preload LCP hero image ── */}
        <link
          rel="preload"
          as="image"
          href="/HeroPage1_v2.png"
          fetchPriority="high"
        />

        {/* ── Web App Manifest & Icons ── */}
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />

        {/* ── Theme / Brand Color ── */}
        <meta name="theme-color" content="#F3E9D7" />
        <meta name="msapplication-TileColor" content="#F3E9D7" />

        {/* ── Geo / Regional Signals ── */}
        <meta name="geo.region" content="IN-AP" />
        <meta name="geo.region" content="US" />
        <meta name="geo.region" content="GB" />
        <meta name="geo.placename" content="Visakhapatnam, Andhra Pradesh, India" />
        <meta name="geo.position" content="17.6896;83.1655" />
        <meta name="ICBM" content="17.6896, 83.1655" />

        {/* ── Language Targets ── */}
        <meta name="language" content="English" />
        <meta name="content-language" content="en-IN, en-US, en-GB, te" />

        {/* ── Pinterest Rich Pins ── */}
        <meta name="pinterest-rich-pin" content="true" />

        {/* ── Mobile Optimization ── */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />

        {/* ── Global Organization + WebSite + Navigation Schema ── */}
        <SchemaOrg schema={buildOrganizationSchema()} />
        <SchemaOrg schema={buildWebSiteSchema()} />
        <SchemaOrg schema={buildSiteNavigationSchema()} />
        <SchemaOrg schema={buildLocalBusinessSchema()} />

        {/* ── Google Analytics 4 (async, deferred — minimal JS overhead) ── */}
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}', {
                    page_path: window.location.pathname,
                    anonymize_ip: true,
                    send_page_view: true
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body suppressHydrationWarning style={{ backgroundColor: "#F3E9D7" }}>
        <TRPCProvider>
          {children}
          <Toaster position="top-right" richColors />
          <WhatsAppButton />
        </TRPCProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}

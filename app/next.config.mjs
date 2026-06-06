/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Performance ──────────────────────────────────────────────────────────
  reactStrictMode: true,
  
  // Compress output (gzip) — reduces Hostinger bandwidth usage
  compress: true,

  // Power Cache (ISR-friendly)
  experimental: {
    // Optimise package imports — reduces JS bundle for lucide-react etc
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-accordion"],
  },

  // ── Image Optimization ───────────────────────────────────────────────────
  images: {
    // Serve WebP + AVIF (best modern formats for bandwidth efficiency)
    formats: ["image/avif", "image/webp"],

    // Responsive breakpoints (match actual usage in components)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimize unoptimized images
    minimumCacheTTL: 31536000, // 1 year cache for optimized images

    // Remote patterns — only allow known safe origins
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  // ── Bundle Optimization ──────────────────────────────────────────────────
  // Ensure ESM-heavy packages are correctly transpiled
  transpilePackages: ["lucide-react"],

  // ── HTTP Headers ─────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Security + performance headers for all routes
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        // Long-term cache for Next.js hashed static assets
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Image assets — long cache
        source: "/(.*\\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // ── URL Rewrites (category routes → shop with filter) ────────────────────
  async rewrites() {
    return [
      {
        source: "/hair-rituals",
        destination: "/shop?category=hair-rituals",
      },
      {
        source: "/face-rituals",
        destination: "/shop?category=face-rituals",
      },
      {
        source: "/wellness-rituals",
        destination: "/shop?category=wellness-rituals",
      },
      {
        source: "/baby-rituals",
        destination: "/shop?category=baby-rituals",
      },
    ];
  },

  // ── 301 Redirects ────────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source: "/naturals",
        destination: "/hair-rituals",
        permanent: true,
      },
      {
        source: "/foods",
        destination: "/wellness-rituals",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

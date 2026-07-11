/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Performance ──────────────────────────────────────────────────────────
  reactStrictMode: true,
  
  // Compress output (gzip) — reduces Hostinger bandwidth usage
  compress: true,

  // Power Cache (ISR-friendly)
  experimental: {
    // Optimise package imports — reduces JS bundle for lucide-react etc
    optimizePackageImports: ["framer-motion", "@radix-ui/react-accordion"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // ── Image Optimization ───────────────────────────────────────────────────
  images: {
    // Bypass local server-side optimization; delegate directly to Cloudinary
    loader: 'custom',
    loaderFile: './src/lib/cloudinary-loader.ts',
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
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://res.cloudinary.com https://*.supabase.co; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://api.razorpay.com https://checkout.razorpay.com; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com;",
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
        source: "/hair-care",
        destination: "/shop?category=hair-rituals",
      },
      {
        source: "/face-rituals",
        destination: "/shop?category=face-rituals",
      },
      {
        source: "/face-care",
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

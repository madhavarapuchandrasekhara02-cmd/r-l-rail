import dotenv from 'dotenv';
dotenv.config();

/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://www.rootsandleaves.in",
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: "weekly",
  priority: 0.7,
  outDir: "public",

  // Exclude admin & API routes from sitemap
  exclude: [
    "/admin",
    "/admin/*",
    "/api/*",
    "/checkout",
    "/track",
    "/404",
    "/_next/*",
  ],

  // Custom priorities for key pages
  additionalPaths: async (config) => {
    const paths = [
      {
      loc: "/",
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/shop",
      changefreq: "daily",
      priority: 0.95,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/about",
      changefreq: "monthly",
      priority: 0.85,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/contact",
      changefreq: "monthly",
      priority: 0.80,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/hair-rituals",
      changefreq: "weekly",
      priority: 0.90,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/wellness-rituals",
      changefreq: "weekly",
      priority: 0.90,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/face-rituals",
      changefreq: "weekly",
      priority: 0.85,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/baby-rituals",
      changefreq: "weekly",
      priority: 0.85,
      lastmod: new Date().toISOString(),
    },
    {
      loc: "/shipping",
      changefreq: "yearly",
      priority: 0.40,
    },
    {
      loc: "/returns",
      changefreq: "yearly",
      priority: 0.40,
    },
    {
      loc: "/privacy",
      changefreq: "yearly",
      priority: 0.30,
    },
    {
      loc: "/terms",
      changefreq: "yearly",
      priority: 0.30,
    },
    ];

    // Fetch dynamic products from Railway Database
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      try {
        const { Pool } = await import("pg");
        const pool = new Pool({
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        });
        const { rows: products } = await pool.query("SELECT slug, updated_at FROM products");
        await pool.end();
        
        if (products) {
          for (const product of products) {
            paths.push({
              loc: `/product/${product.slug}`,
              changefreq: "weekly",
              priority: 0.90,
              lastmod: product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.error("Error fetching products for sitemap:", e);
      }
    }

    return paths;
  },

  // Transform function to add image tags for product pages
  transform: async (config, path) => {
    // Boost product pages
    if (path.startsWith("/product/")) {
      return {
        loc: path,
        changefreq: "weekly",
        priority: 0.90,
        lastmod: new Date().toISOString(),
      };
    }
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};

export default config;

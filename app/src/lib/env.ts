import "server-only";
import { z } from "zod";
import "dotenv/config"; // Ensure variables are loaded if not run via Next.js directly

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Anon key is required"),
  SUPABASE_URL: z.string().url("Must be a valid URL").optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1, "Service key is required"),

  // Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1, "Razorpay Key ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "Razorpay Secret is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "Razorpay Webhook Secret is required"),

  // Delhivery One
  DELHIVERY_API_TOKEN: z.string().min(1, "Delhivery Token is required"),
  DELHIVERY_BASE_URL: z.string().url("Must be a valid URL").default("https://track.delhivery.com"),
  DELHIVERY_ORIGIN_PINCODE: z.string().min(6, "Valid origin pincode is required"),
  DELHIVERY_PICKUP_LOCATION_NAME: z.string().min(1, "Pickup location name is required"),
  DELHIVERY_CLIENT_NAME: z.string().min(1, "Client name is required"),

  // Legacy DB
  DATABASE_URL: z.string().optional(),

  // Seller Details (Only state is needed for GST CGST/IGST tax calculation)
  SELLER_STATE: z.string().min(1, "Seller state is required"),

  // SEO
  NEXT_PUBLIC_SITE_URL: z.string().url("Must be a valid URL").default("https://www.rootsandleaves.in"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  _env.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  throw new Error("Invalid environment variables");
}

export const env = _env.data;

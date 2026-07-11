import "server-only";
import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Anon key is required"),
  SUPABASE_URL: z.string().url("Must be a valid URL").optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1, "Service key is required"),

  // Delhivery One
  DELHIVERY_API_TOKEN: z.string().min(1, "Delhivery Token is required"),
  DELHIVERY_BASE_URL: z.string().url("Must be a valid URL").default("https://track.delhivery.com"),
  DELHIVERY_ORIGIN_PINCODE: z.string().min(6, "Valid origin pincode is required"),
  DELHIVERY_PICKUP_LOCATION_NAME: z.string().min(1, "Pickup location name is required"),
  DELHIVERY_CLIENT_NAME: z.string().min(1, "Client name is required"),

  // Cloudinary
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, "Cloud name is required"),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1, "Upload preset is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "Cloudinary API Key is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "Cloudinary API Secret is required"),

  // Admin configuration
  ADMIN_EMAILS: z.string().min(1, "Admin emails are required"),

  // Seller Details
  SELLER_NAME: z.string().min(1, "Seller name is required"),
  SELLER_GSTIN: z.string().optional(),
  SELLER_ADDRESS: z.string().min(1, "Seller address is required"),
  SELLER_STATE: z.string().min(1, "Seller state is required"),
  RETURN_PHONE: z.string().min(1, "Return phone is required"),
  SELLER_PHONE: z.string().optional(),
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

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { supabaseAdmin } from "./lib/supabase-admin";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

// Parse admin emails from env (comma-separated, lowercased)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Extracts user from Bearer token or cookie
function extractToken(req: Request): string {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => c.trim().split("="))
  );
  return cookies["sb-access-token"]
    ? decodeURIComponent(cookies["sb-access-token"])
    : "";
}

// Middleware: verifies user is authenticated
const isAuthed = t.middleware(async ({ ctx, next }) => {
  const token = extractToken(ctx.req);

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Credentials are missing or session is expired.",
    });
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session is invalid or token check failed.",
    });
  }

  return next({
    ctx: { ...ctx, user },
  });
});

// Middleware: verifies user is authenticated AND is an admin
const isAdmin = t.middleware(async ({ ctx, next }) => {
  const token = extractToken(ctx.req);

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Credentials are missing or session is expired.",
    });
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session is invalid or token check failed.",
    });
  }

  // Verify the user's email is in the admin list
  const userEmail = (user.email || "").toLowerCase();
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(userEmail)) {
    console.warn(`[Security Alert] Failed admin access attempt for email: ${userEmail}`);
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have admin access to this resource.",
    });
  }

  return next({
    ctx: { ...ctx, user },
  });
});

export const createRouter = t.router;
export const publicQuery = t.procedure;
export const protectedQuery = t.procedure.use(isAuthed);
export const protectedMutation = t.procedure.use(isAuthed);
export const adminQuery = t.procedure.use(isAdmin);
export const adminMutation = t.procedure.use(isAdmin);

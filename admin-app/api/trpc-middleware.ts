import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { verifyToken } from "./lib/auth";
import { env } from '../src/lib/env';

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message:
        process.env.NODE_ENV === 'production' && error.code === 'INTERNAL_SERVER_ERROR'
          ? 'Internal server error'
          : shape.message,
      data: {
        ...shape.data,
        // Remove stack traces in production
        stack: process.env.NODE_ENV === 'production' ? undefined : shape.data.stack,
      },
    };
  },
});

// Parse admin emails from env (comma-separated, lowercased)
const ADMIN_EMAILS = (env.ADMIN_EMAILS || "")
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
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.substring(0, idx).trim();
    const value = pair.substring(idx + 1).trim();
    cookies[key] = value;
  }
  return cookies["admin-token"]
    ? decodeURIComponent(cookies["admin-token"])
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

  try {
    const payload = verifyToken(token)
    const user = {
      id: payload.userId,
      email: payload.email,
    }
    return next({
      ctx: { ...ctx, user },
    });
  } catch (err) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session is invalid or token check failed.",
    });
  }
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

  try {
    const payload = verifyToken(token)
    const user = {
      id: payload.userId,
      email: payload.email,
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
  } catch (err: any) {
    if (err instanceof TRPCError) throw err
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session is invalid or token check failed.",
    });
  }
});

export const createRouter = t.router;
export const publicQuery = t.procedure;
export const protectedQuery = t.procedure.use(isAuthed);
export const protectedMutation = t.procedure.use(isAuthed);
export const adminQuery = t.procedure.use(isAdmin);
export const adminMutation = t.procedure.use(isAdmin);

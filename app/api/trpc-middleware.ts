import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { supabaseAdmin } from "./lib/supabase-admin";

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

import { env } from '../src/lib/env';



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

export const createRouter = t.router;
export const publicQuery = t.procedure;
export const protectedQuery = t.procedure.use(isAuthed);
export const protectedMutation = t.procedure.use(isAuthed);

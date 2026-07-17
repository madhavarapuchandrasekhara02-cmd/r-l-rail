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

// Memory-based rate limiter fallback (used if DB rate_limits fails or is unconfigured)
const ipRequestCounts = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_MAX = 10; // Max requests per window for mutations
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes cleanup interval for memory Map fallback
let lastCleanup = Date.now();

const rateLimiter = t.middleware(async ({ ctx, next }) => {
  const ip = ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip') || '127.0.0.1';
  const nowMs = Date.now();

  try {
    // 1. Fetch current rate limit info from Supabase
    const { data: limitRecord, error: fetchErr } = await supabaseAdmin
      .from('rate_limits')
      .select('*')
      .eq('ip', ip)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!limitRecord) {
      // Create new limit window
      await supabaseAdmin
        .from('rate_limits')
        .insert({
          ip,
          count: 1,
          expires_at: new Date(nowMs + RATE_LIMIT_WINDOW_MS).toISOString()
        });
    } else {
      const expiresAt = new Date(limitRecord.expires_at).getTime();
      if (nowMs > expiresAt) {
        // Window expired: Reset counter and set new window
        await supabaseAdmin
          .from('rate_limits')
          .update({
            count: 1,
            expires_at: new Date(nowMs + RATE_LIMIT_WINDOW_MS).toISOString()
          })
          .eq('ip', ip);
      } else {
        // Within window: Increment count
        const newCount = limitRecord.count + 1;
        if (newCount > RATE_LIMIT_MAX) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many checkout or payment attempts. Please wait a minute and try again.",
          });
        }

        await supabaseAdmin
          .from('rate_limits')
          .update({ count: newCount })
          .eq('ip', ip);
      }
    }
  } catch (err: any) {
    if (err instanceof TRPCError) throw err;
    console.error('[Rate Limiter] Supabase rate limit check failed. Falling back to memory-based limiter.', err.message || err);
    
    // Memory fallback logic
    // Periodic inline cleanup sweep to prevent memory leaks in fallback
    if (nowMs - lastCleanup > CLEANUP_INTERVAL_MS) {
      lastCleanup = nowMs;
      for (const [key, val] of ipRequestCounts.entries()) {
        if (nowMs > val.expiresAt) {
          ipRequestCounts.delete(key);
        }
      }
    }

    const rateLimitState = ipRequestCounts.get(ip) || { count: 0, expiresAt: nowMs + RATE_LIMIT_WINDOW_MS };
    if (nowMs > rateLimitState.expiresAt) {
      rateLimitState.count = 1;
      rateLimitState.expiresAt = nowMs + RATE_LIMIT_WINDOW_MS;
    } else {
      rateLimitState.count++;
    }
    ipRequestCounts.set(ip, rateLimitState);
    if (rateLimitState.count > RATE_LIMIT_MAX) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many checkout or payment attempts. Please wait a minute and try again.",
      });
    }
  }

  return next();
});

export const createRouter = t.router;
export const publicQuery = t.procedure;
export const publicMutation = t.procedure.use(rateLimiter);


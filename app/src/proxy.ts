import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extremely basic in-memory rate limiter for Edge Runtime
// Note: In Edge runtime (like Vercel), this Map resets frequently and per isolate.
// It is useful for basic, short-burst rate limiting without a database.
const ipRequestCounts = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_MAX = 60; // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

export function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const now = Date.now();

  // Rate Limiter Check (Targeting /api routes primarily)
  if (request.nextUrl.pathname.startsWith('/api')) {
    const rateLimitState = ipRequestCounts.get(ip) || { count: 0, expiresAt: now + RATE_LIMIT_WINDOW_MS };
    
    if (now > rateLimitState.expiresAt) {
      rateLimitState.count = 1;
      rateLimitState.expiresAt = now + RATE_LIMIT_WINDOW_MS;
    } else {
      rateLimitState.count++;
    }

    ipRequestCounts.set(ip, rateLimitState);

    // If rate limit exceeded, return 429 Too Many Requests
    if (rateLimitState.count > RATE_LIMIT_MAX) {
      console.warn(`[Security] Rate limit exceeded for IP: ${ip}`);
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  // Proceed to the next middleware or route handler
  const response = NextResponse.next();

  // Apply Strict Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Content Security Policy — whitelists only the exact external domains this app requires.
  // Each domain is documented for auditability.
  const cspDirectives = [
    // Default: block everything not explicitly allowed
    "default-src 'self'",

    // Scripts: self + Razorpay checkout SDK + Google Analytics/Tag Manager + YouTube API
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://www.youtube.com https://s.ytimg.com",

    // Styles: self + inline (required by Next.js) + Google Fonts CSS
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

    // Images: self + data URIs + Cloudinary + Supabase Storage + Razorpay branding + YouTube thumbnails + Transparent Textures
    "img-src 'self' data: https://res.cloudinary.com https://*.supabase.co https://cdn.razorpay.com https://www.googletagmanager.com https://img.youtube.com https://*.ytimg.com https://www.transparenttextures.com",

    // Fonts: self + data URIs + Google Fonts static files + Perplexity font
    "font-src 'self' data: https://fonts.gstatic.com https://frontend-cdn.perplexity.ai",

    // XHR/Fetch: self + Supabase API + Razorpay API + Delhivery API + Google Analytics
    "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://checkout.razorpay.com https://staging-express.delhivery.com https://track.delhivery.com https://www.google-analytics.com https://www.googletagmanager.com",

    // Frames: Razorpay checkout modal + YouTube embedded videos
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com",

    // Block all object/embed/base/form targets not explicitly needed
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  return response;
}

export const config = {
  // Apply middleware to API routes and sensitive pages, skip static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Extremely basic in-memory rate limiter for Edge Runtime
// Note: In Edge runtime (like Vercel), this Map resets frequently and per isolate.
// It is useful for basic, short-burst rate limiting without a database.
const ipRequestCounts = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_MAX = 60; // Max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

export function middleware(request: NextRequest) {
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

  // Clone headers so we can append security headers
  const headers = new Headers(request.headers);
  const response = NextResponse.next({
    request: {
      headers,
    },
  });

  // Apply Strict Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // Basic Content Security Policy
  // This is a relaxed default to avoid breaking functionality, can be hardened later.
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  );

  return response;
}

export const config = {
  // Apply middleware to API routes and sensitive pages, skip static files
  matcher: [
    '/api/:path*',
    '/checkout/:path*',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

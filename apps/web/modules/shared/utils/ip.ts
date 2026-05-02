import { NextRequest } from "next/server";

/**
 * Extracts the client IP address from a Next.js request
 * Handles various proxy headers and fallbacks
 */
export function getClientIp(req: NextRequest): string | null {
  // Try x-forwarded-for (most common proxy header)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips[0]) return ips[0];
  }

  // Try x-real-ip (some proxies use this)
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  // Try CF-Connecting-IP (Cloudflare)
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // Try True-Client-IP (Akamai, Cloudflare)
  const trueClientIp = req.headers.get("true-client-ip");
  if (trueClientIp) return trueClientIp;

  // Fallback to connection remote address (not available in Next.js edge runtime)
  // This is mainly for local development
  return "127.0.0.1";
}

/**
 * Creates a rate limit identifier for a request
 * Prefers user ID if authenticated, falls back to IP address
 */
export function getRateLimitIdentifier(
  req: NextRequest,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  const ip = getClientIp(req);
  return `ip:${ip || "unknown"}`;
}

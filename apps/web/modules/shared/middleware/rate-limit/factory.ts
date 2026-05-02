import { IRateLimitProvider } from "./interface";
import { UpstashRateLimitProvider } from "./upstash";
import { NoopRateLimitProvider } from "./noop";
import { env } from "@/env.mjs";

let cachedProvider: IRateLimitProvider | null = null;

export function createRateLimitProvider(): IRateLimitProvider {
  if (cachedProvider) return cachedProvider;

  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    cachedProvider = new UpstashRateLimitProvider();
  } else {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[rate-limit] Upstash creds missing — using NoopRateLimitProvider. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable real rate limiting."
      );
    }
    cachedProvider = new NoopRateLimitProvider();
  }

  return cachedProvider;
}

export function resetRateLimitProvider(): void {
  cachedProvider = null;
}

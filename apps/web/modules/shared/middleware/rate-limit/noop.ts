import { IRateLimitProvider, RateLimitConfig, RateLimitResult } from "./interface";

/**
 * No-op rate limit provider. Used when Upstash creds aren't configured
 * (e.g. personal-use deployments). Allows every request.
 */
export class NoopRateLimitProvider implements IRateLimitProvider {
  async limit(_identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60_000,
    };
  }

  async reset(_identifier: string): Promise<void> {
    // no-op
  }
}

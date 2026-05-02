import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env.mjs";
import {
  IRateLimitProvider,
  RateLimitConfig,
  RateLimitResult,
} from "./interface";

/**
 * Upstash Redis-based rate limiting provider
 */
export class UpstashRateLimitProvider implements IRateLimitProvider {
  private redis: Redis;
  private limiters: Map<string, Ratelimit> = new Map();

  constructor() {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        "Upstash Redis credentials not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables."
      );
    }

    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  /**
   * Get or create a rate limiter for a specific configuration
   */
  private getLimiter(config: RateLimitConfig): Ratelimit {
    const key = `${config.requests}:${config.window}`;

    if (!this.limiters.has(key)) {
      const limiter = new Ratelimit({
        redis: this.redis,
        limiter: Ratelimit.slidingWindow(
          config.requests,
          config.window as Duration
        ),
        analytics: true,
        prefix: "jetframe:ratelimit",
      });
      this.limiters.set(key, limiter);
    }

    return this.limiters.get(key)!;
  }

  /**
   * Check if a request is allowed
   */
  async limit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const limiter = this.getLimiter(config);
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
    };
  }

  /**
   * Reset the rate limit for an identifier
   */
  async reset(identifier: string): Promise<void> {
    // Delete all keys for this identifier
    const keys = await this.redis.keys(`jetframe:ratelimit:${identifier}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

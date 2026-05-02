/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (in milliseconds) when the limit resets */
  reset: number;
  /** Number of requests allowed in the window */
  limit: number;
}

/**
 * Configuration for a rate limiter
 */
export interface RateLimitConfig {
  /** Number of requests allowed */
  requests: number;
  /** Time window (e.g., "1 m", "1 h", "1 d") */
  window: string;
}

/**
 * Rate limit provider interface
 * Implementations can use different backends (Upstash Redis, in-memory, etc.)
 */
export interface IRateLimitProvider {
  /**
   * Check if a request is allowed and update the counter
   * @param identifier Unique identifier for the rate limit (user ID, IP, etc.)
   * @param config Rate limit configuration
   * @returns Rate limit result
   */
  limit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult>;

  /**
   * Reset the rate limit for an identifier
   * @param identifier Unique identifier to reset
   */
  reset(identifier: string): Promise<void>;
}

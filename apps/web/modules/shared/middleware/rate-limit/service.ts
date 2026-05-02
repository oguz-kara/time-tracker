import { RateLimitError } from "@/modules/shared/errors";
import { createRateLimitProvider } from "./factory";
import { RateLimitConfig, RateLimitResult } from "./interface";

/**
 * Check if a request is allowed based on rate limits
 * Throws RateLimitError if the limit is exceeded
 *
 * @param identifier Unique identifier (user ID, IP address, etc.)
 * @param config Rate limit configuration
 * @returns Rate limit result with remaining requests and reset time
 * @throws RateLimitError if the rate limit is exceeded
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const provider = createRateLimitProvider();
  const result = await provider.limit(identifier, config);

  if (!result.success) {
    const resetDate = new Date(result.reset);
    const resetInSeconds = Math.ceil((result.reset - Date.now()) / 1000);

    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${resetInSeconds} seconds (resets at ${resetDate.toISOString()})`
    );
  }

  return result;
}

/**
 * Reset the rate limit for an identifier
 * Useful for administrative purposes or testing
 *
 * @param identifier Unique identifier to reset
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const provider = createRateLimitProvider();
  await provider.reset(identifier);
}

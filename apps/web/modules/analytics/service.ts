import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  if (!process.env.POSTHOG_KEY) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    });
  }

  return posthogClient;
}

export interface TrackEventOptions {
  userId: string;
  event: string;
  properties?: Record<string, any>;
}

export interface IdentifyUserOptions {
  userId: string;
  traits: Record<string, any>;
}

/**
 * Track an event in PostHog (server-side)
 */
export function trackEvent({ userId, event, properties }: TrackEventOptions): void {
  const client = getPostHogClient();

  if (!client) {
    // PostHog not configured, skip tracking
    return;
  }

  client.capture({
    distinctId: userId,
    event,
    properties,
  });
}

/**
 * Identify a user in PostHog (server-side)
 */
export function identifyUser({ userId, traits }: IdentifyUserOptions): void {
  const client = getPostHogClient();

  if (!client) {
    // PostHog not configured, skip identification
    return;
  }

  client.identify({
    distinctId: userId,
    properties: traits,
  });
}

/**
 * Shutdown PostHog client (call this on server shutdown)
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}

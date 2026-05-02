/**
 * Storage Provider Factory
 *
 * Creates storage provider instances based on configuration.
 * Follows the adapter pattern to allow swapping providers (R2 → S3 → GCS)
 * without changing business logic.
 *
 * Usage:
 *   const storage = createStorageProvider();
 *   await storage.upload({ ... });
 */

import type { StorageProvider } from "./interface";
import { R2Adapter } from "./adapters/r2";
import { saasConfig } from "@/saas.config";

/**
 * Creates a storage provider instance based on configuration
 *
 * @throws {Error} If required environment variables are missing
 * @throws {Error} If provider is not supported
 */
export function createStorageProvider(): StorageProvider {
  const provider = saasConfig.features.storage.provider;

  switch (provider) {
    case "r2": {
      return new R2Adapter();
    }

    // Future providers can be added here:
    // case 's3':
    //   return new S3Adapter();
    // case 'gcs':
    //   return new GCSAdapter();

    default:
      throw new Error(`Unknown storage provider: ${provider}`);
  }
}

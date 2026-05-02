/**
 * Storage Provider Interface
 *
 * Defines the contract that all storage providers (R2, S3, GCS) must implement.
 * Follows the adapter pattern to allow swapping providers without changing business logic.
 */

export interface StorageProvider {
  /**
   * Upload a file to storage
   */
  upload(params: {
    file: Buffer;
    key: string;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ url: string; key: string }>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Get a signed URL for temporary access to a file
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * List files with a given prefix
   */
  list(prefix: string): Promise<Array<{
    key: string;
    size: number;
    lastModified: Date;
  }>>;

  /**
   * Health check for the storage provider
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}

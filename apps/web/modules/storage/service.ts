/**
 * Storage Service Layer
 *
 * Pure business logic for file storage operations.
 * Handles validation, storage provider interaction, and database persistence.
 */

import { db, eq, and, desc, files } from "@jetframe/db";
import { createStorageProvider } from "./factory";
import { saasConfig } from "@/saas.config";
import {
  FileTooLargeError,
  InvalidFileTypeError,
  NotFoundError,
  FileUploadError,
  FileDeleteError,
} from "@/modules/shared/errors";
import { nanoid } from "nanoid";
import type { FileRecord } from "./types";

/**
 * Upload a file to storage and save metadata to database
 */
export async function uploadFile(
  orgId: string,
  userId: string,
  file: { buffer: Buffer; name: string; type: string }
): Promise<FileRecord> {
  // Validate file size
  const maxFileSize = saasConfig.limits.upload.maxFileSize;
  if (file.buffer.length > maxFileSize) {
    throw new FileTooLargeError(maxFileSize);
  }

  // Validate file type
  const allowedTypes = saasConfig.limits.upload.allowedTypes;
  if (!allowedTypes.includes(file.type as any)) {
    throw new InvalidFileTypeError([...allowedTypes]);
  }

  // Generate unique key
  const ext = file.name.split(".").pop() || "";
  const key = `${orgId}/${nanoid()}.${ext}`;

  // Upload to storage provider
  const storage = createStorageProvider();
  let uploadResult;
  try {
    uploadResult = await storage.upload({
      file: file.buffer,
      key,
      contentType: file.type,
    });
  } catch (error) {
    throw new FileUploadError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  // Save metadata to database
  const [record] = await db
    .insert(files)
    .values({
      organizationId: orgId,
      userId,
      key,
      filename: file.name,
      contentType: file.type,
      size: file.buffer.length,
      url: uploadResult.url,
      metadata: null,
    })
    .returning();

  return record;
}

/**
 * Delete a file from storage and database
 */
export async function deleteFile(
  orgId: string,
  fileId: string
): Promise<void> {
  // Find file record
  const file = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.organizationId, orgId)),
  });

  if (!file) {
    throw new NotFoundError("File");
  }

  // Delete from storage provider
  const storage = createStorageProvider();
  try {
    await storage.delete(file.key);
  } catch (error) {
    throw new FileDeleteError(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  // Delete from database
  await db.delete(files).where(eq(files.id, fileId));
}

/**
 * Get file metadata by ID
 */
export async function getFile(
  orgId: string,
  fileId: string
): Promise<FileRecord> {
  const file = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.organizationId, orgId)),
  });

  if (!file) {
    throw new NotFoundError("File");
  }

  return file;
}

/**
 * List all files for an organization
 */
export async function listFiles(orgId: string): Promise<FileRecord[]> {
  return db.query.files.findMany({
    where: eq(files.organizationId, orgId),
    orderBy: [desc(files.createdAt)],
  });
}

/**
 * Get a signed URL for temporary access to a file
 */
export async function getSignedUrl(
  orgId: string,
  fileId: string,
  expiresIn = 3600
): Promise<string> {
  // Verify file exists and belongs to org
  const file = await getFile(orgId, fileId);

  // Generate signed URL
  const storage = createStorageProvider();
  return storage.getSignedUrl(file.key, expiresIn);
}

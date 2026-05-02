/**
 * Storage Module TypeScript Types
 */

export interface FileRecord {
  id: string;
  organizationId: string;
  userId: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadFileInput {
  file: {
    buffer: Buffer;
    name: string;
    type: string;
  };
}

export interface DeleteFileInput {
  fileId: string;
}

export interface GetSignedUrlInput {
  fileId: string;
  expiresIn?: number;
}

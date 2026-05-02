/**
 * Storage GraphQL Schema
 *
 * Defines GraphQL types for the storage module using Pothos.
 */

import { builder } from "@/lib/graphql/builder";

/**
 * File Type
 * Represents uploaded file metadata
 */
export const FileType = builder.objectRef<{
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
}>("File");

builder.objectType(FileType, {
  description: "Uploaded file metadata",
  fields: (t) => ({
    id: t.exposeID("id"),
    organizationId: t.exposeString("organizationId"),
    userId: t.exposeString("userId"),
    key: t.exposeString("key"),
    filename: t.exposeString("filename"),
    contentType: t.exposeString("contentType"),
    size: t.exposeInt("size"),
    url: t.exposeString("url"),
    metadata: t.field({
      type: "JSON",
      nullable: true,
      resolve: (file) => file.metadata as any,
    }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

/**
 * SignedUrl Type
 * Represents a temporary signed URL for file access
 */
export const SignedUrlType = builder.objectRef<{
  url: string;
  expiresIn: number;
}>("SignedUrl");

builder.objectType(SignedUrlType, {
  description: "Temporary signed URL for file access",
  fields: (t) => ({
    url: t.exposeString("url"),
    expiresIn: t.exposeInt("expiresIn"),
  }),
});

/**
 * Input Types
 */
export const UploadFileInputType = builder.inputType("UploadFileInput", {
  fields: (t) => ({
    filename: t.string({ required: true }),
    contentType: t.string({ required: true }),
    size: t.int({ required: true }),
    // Note: In a real implementation, you'd use multipart/form-data
    // For now, we'll assume the file is uploaded separately and we just store metadata
    // Or use base64 encoding for small files
    base64Data: t.string({ required: true }),
  }),
});

export const DeleteFileInputType = builder.inputType("DeleteFileInput", {
  fields: (t) => ({
    fileId: t.string({ required: true }),
  }),
});

export const GetSignedUrlInputType = builder.inputType("GetSignedUrlInput", {
  fields: (t) => ({
    fileId: t.string({ required: true }),
    expiresIn: t.int({ required: false, defaultValue: 3600 }),
  }),
});

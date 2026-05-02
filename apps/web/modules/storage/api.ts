/**
 * Storage GraphQL API (Resolvers)
 *
 * Thin resolvers that delegate to the storage service layer.
 * Handles authentication and GraphQL-specific concerns only.
 */

import { builder } from "@/lib/graphql/builder";
import * as storageService from "./service";
import { NotAuthenticatedError } from "@/modules/shared/errors";
import {
  FileType,
  SignedUrlType,
  UploadFileInputType,
  DeleteFileInputType,
  GetSignedUrlInputType,
} from "./schema";

// === QUERIES ===

/**
 * Get a single file by ID
 */
builder.queryField("file", (t) =>
  t.field({
    type: FileType,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_, { id }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      return storageService.getFile(ctx.session.activeOrganizationId, id);
    },
  })
);

/**
 * List all files for the current organization
 */
builder.queryField("files", (t) =>
  t.field({
    type: [FileType],
    resolve: async (_, __, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      return storageService.listFiles(ctx.session.activeOrganizationId);
    },
  })
);

// === MUTATIONS ===

/**
 * Upload a file
 * Note: In production, you'd typically use a presigned URL approach
 * or handle file uploads via multipart/form-data outside of GraphQL
 */
builder.mutationField("uploadFile", (t) =>
  t.field({
    type: FileType,
    args: {
      input: t.arg({ type: UploadFileInputType, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      // Convert base64 to buffer
      const buffer = Buffer.from(input.base64Data, "base64");

      return storageService.uploadFile(
        ctx.session.activeOrganizationId,
        ctx.session.userId,
        {
          buffer,
          name: input.filename,
          type: input.contentType,
        }
      );
    },
  })
);

/**
 * Delete a file
 */
builder.mutationField("deleteFile", (t) =>
  t.field({
    type: "Boolean",
    args: {
      input: t.arg({ type: DeleteFileInputType, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      await storageService.deleteFile(
        ctx.session.activeOrganizationId,
        input.fileId
      );

      return true;
    },
  })
);

/**
 * Get a signed URL for temporary file access
 */
builder.mutationField("getSignedUrl", (t) =>
  t.field({
    type: SignedUrlType,
    args: {
      input: t.arg({ type: GetSignedUrlInputType, required: true }),
    },
    resolve: async (_, { input }, ctx) => {
      if (!ctx.session) throw new NotAuthenticatedError();

      const url = await storageService.getSignedUrl(
        ctx.session.activeOrganizationId,
        input.fileId,
        input.expiresIn || 3600
      );

      return {
        url,
        expiresIn: input.expiresIn || 3600,
      };
    },
  })
);

import { randomUUID } from 'node:crypto';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { z } from 'zod';
import { env } from '../config.js';
import { parseRoleList, requireIdentity } from '../lib/auth.js';
import { createUploadUrl } from '../lib/document-store.js';
import { jsonResponse } from '../lib/responses.js';
import type { UploadRequest } from '../types.js';

const uploadRequestSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string().trim().min(1).max(255),
        contentType: z.string().trim().min(1).max(255)
      })
    )
    .min(1)
    .max(20)
});

/**
 * Creates presigned upload targets for one or more files.
 */
export async function handler(event: APIGatewayProxyEventV2) {
  try {
    await requireIdentity(event, parseRoleList(env.ENTRA_REQUIRED_SUBMIT_ROLES));
  } catch (error) {
    return jsonResponse(401, { message: error instanceof Error ? error.message : 'Unauthorized' });
  }

  let request: UploadRequest;

  try {
    request = uploadRequestSchema.parse(JSON.parse(event.body ?? '{}'));
  } catch (error) {
    return jsonResponse(400, { message: error instanceof Error ? error.message : 'Invalid upload request.' });
  }

  // Generate one object key + signed upload URL per requested file.
  const targets = await Promise.all(
    request.files.map(async (file) => {
      const objectKey = `${randomUUID()}-${file.fileName}`;
      const uploadUrl = await createUploadUrl(objectKey, file.contentType);
      return {
        fileName: file.fileName,
        objectKey,
        uploadUrl
      };
    })
  );

  return jsonResponse(200, targets);
}

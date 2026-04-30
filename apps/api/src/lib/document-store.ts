import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config.js';
import { s3Client } from './aws.js';

/**
 * Generates a short-lived presigned URL for direct document upload to S3.
 */
export async function createUploadUrl(objectKey: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.DOCUMENT_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType
  });

  return getSignedUrl(s3Client, command, { expiresIn: 900 });
}

/**
 * Reads uploaded document content from S3 as UTF-8 text.
 */
export async function readDocument(objectKey: string): Promise<string> {
  const object = await s3Client.send(
    new GetObjectCommand({
      Bucket: env.DOCUMENT_BUCKET_NAME,
      Key: objectKey
    })
  );

  const body = await object.Body?.transformToString();

  if (!body) {
    throw new Error(`Document ${objectKey} is empty or unavailable.`);
  }

  return body;
}

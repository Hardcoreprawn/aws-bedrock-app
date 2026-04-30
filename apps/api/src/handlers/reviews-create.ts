import { randomUUID } from 'node:crypto';
import { StartExecutionCommand } from '@aws-sdk/client-sfn';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { z } from 'zod';
import { env } from '../config.js';
import { parseRoleList, requireIdentity } from '../lib/auth.js';
import { sfnClient } from '../lib/aws.js';
import { jsonResponse } from '../lib/responses.js';
import { createReview, markReviewRunning } from '../lib/review-store.js';
import type { ReviewRequest } from '../types.js';

const reviewRequestSchema = z.object({
  documentKeys: z.array(z.string().trim().min(1).max(1024)).min(1).max(20)
});

/**
 * Creates a review record and starts Step Functions orchestration.
 */
export async function handler(event: APIGatewayProxyEventV2) {
  let identity;

  try {
    identity = await requireIdentity(event, parseRoleList(env.ENTRA_REQUIRED_SUBMIT_ROLES));
  } catch (error) {
    return jsonResponse(401, { message: error instanceof Error ? error.message : 'Unauthorized' });
  }

  let request: ReviewRequest;

  try {
    request = reviewRequestSchema.parse(JSON.parse(event.body ?? '{}'));
  } catch (error) {
    return jsonResponse(400, { message: error instanceof Error ? error.message : 'Invalid review request.' });
  }

  const reviewId = randomUUID();
  const record = await createReview(reviewId, identity.subject, identity.name);

  // Kick off asynchronous review execution in the workflow state machine.
  await sfnClient.send(
    new StartExecutionCommand({
      stateMachineArn: env.REVIEW_STATE_MACHINE_ARN,
      input: JSON.stringify({
        reviewId,
        documentKeys: request.documentKeys
      })
    })
  );

  await markReviewRunning(reviewId);

  return jsonResponse(202, {
    ...record,
    status: 'RUNNING'
  });
}

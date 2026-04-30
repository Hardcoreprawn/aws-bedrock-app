import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { env } from '../config.js';
import { hasRole, parseRoleList, requireIdentity } from '../lib/auth.js';
import { jsonResponse } from '../lib/responses.js';
import { getReview } from '../lib/review-store.js';

/**
 * Returns one review record, enforcing ownership unless caller has admin role.
 */
export async function handler(event: APIGatewayProxyEventV2) {
  let identity;

  try {
    identity = await requireIdentity(event, parseRoleList(env.ENTRA_REQUIRED_READ_ROLES));
  } catch (error) {
    return jsonResponse(401, { message: error instanceof Error ? error.message : 'Unauthorized' });
  }

  const reviewId = event.pathParameters?.reviewId;

  if (!reviewId) {
    return jsonResponse(400, { message: 'Missing reviewId path parameter.' });
  }

  const review = await getReview(reviewId);

  if (!review) {
    return jsonResponse(404, { message: 'Review not found.' });
  }

  // Non-admin users can only read reviews they submitted.
  const isAdmin = hasRole(identity, 'review.admin');
  if (!isAdmin && review.submittedBy && review.submittedBy !== identity.subject) {
    return jsonResponse(403, { message: 'You are not allowed to access this review.' });
  }

  return jsonResponse(200, review);
}

import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { env } from '../config.js';
import type { AgentResult, ReviewRecord } from '../types.js';
import { dynamoClient } from './aws.js';

/**
 * Creates an initial review record in DynamoDB with SUBMITTED status.
 */
export async function createReview(reviewId: string, submittedBy: string, submittedByName?: string): Promise<ReviewRecord> {
  const record: ReviewRecord = {
    reviewId,
    status: 'SUBMITTED',
    findings: [],
    submittedBy,
    submittedByName,
    createdAt: new Date().toISOString()
  };

  await dynamoClient.send(
    new PutCommand({
      TableName: env.REVIEW_TABLE_NAME,
      Item: record
    })
  );

  return record;
}

/**
 * Loads a review record by ID from DynamoDB.
 */
export async function getReview(reviewId: string): Promise<ReviewRecord | undefined> {
  const response = await dynamoClient.send(
    new GetCommand({
      TableName: env.REVIEW_TABLE_NAME,
      Key: { reviewId }
    })
  );

  return response.Item as ReviewRecord | undefined;
}

/**
 * Marks a review as RUNNING once orchestration starts.
 */
export async function markReviewRunning(reviewId: string) {
  await dynamoClient.send(
    new UpdateCommand({
      TableName: env.REVIEW_TABLE_NAME,
      Key: { reviewId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'RUNNING'
      }
    })
  );
}

/**
 * Writes final findings and summary, then marks the review COMPLETED.
 */
export async function completeReview(reviewId: string, findings: AgentResult[], finalSummary: string) {
  await dynamoClient.send(
    new UpdateCommand({
      TableName: env.REVIEW_TABLE_NAME,
      Key: { reviewId },
      UpdateExpression: 'SET #status = :status, findings = :findings, finalSummary = :finalSummary',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'COMPLETED',
        ':findings': findings,
        ':finalSummary': finalSummary
      }
    })
  );
}

/**
 * Persists failure state and error message for a review.
 */
export async function failReview(reviewId: string, message: string) {
  await dynamoClient.send(
    new UpdateCommand({
      TableName: env.REVIEW_TABLE_NAME,
      Key: { reviewId },
      UpdateExpression: 'SET #status = :status, finalSummary = :message',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'FAILED',
        ':message': message
      }
    })
  );
}

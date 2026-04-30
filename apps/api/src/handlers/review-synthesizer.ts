import type { Handler } from 'aws-lambda';
import { generateReview } from '../lib/bedrock.js';
import { loadPrompt } from '../lib/prompts.js';
import { completeReview, failReview, markReviewRunning } from '../lib/review-store.js';
import type { AgentResult } from '../types.js';

interface SynthesizerEvent {
  reviewId: string;
  findings: AgentResult[];
}

/**
 * Final workflow step: synthesizes agent findings and persists final review output.
 */
export const handler: Handler<SynthesizerEvent> = async (event) => {
  await markReviewRunning(event.reviewId);

  try {
    const systemPrompt = await loadPrompt('system');
    const synthesisPrompt = await loadPrompt('synthesis');
    const finalSummary = await generateReview({
      systemPrompt,
      taskPrompt: synthesisPrompt,
      documentText: JSON.stringify(event.findings, null, 2)
    });

    await completeReview(event.reviewId, event.findings, finalSummary);
    return { reviewId: event.reviewId, status: 'COMPLETED' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown synthesis error';
    await failReview(event.reviewId, message);
    throw error;
  }
};

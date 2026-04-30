import type { Handler } from 'aws-lambda';
import { readDocument } from '../lib/document-store.js';
import { runAgent, type AgentName } from '../lib/agents.js';
import { assertSafeInput } from '../lib/safety.js';

interface WorkerEvent {
  reviewId: string;
  documentKeys: string[];
  agent: AgentName;
}

/**
 * Worker step: loads source documents, applies safety checks, and runs one agent.
 */
export const handler: Handler<WorkerEvent> = async (event) => {
  const documents = await Promise.all(event.documentKeys.map((documentKey) => readDocument(documentKey)));
  assertSafeInput(documents);
  const details = await runAgent(event.agent, documents.join('\n\n---\n\n'));

  return details;
};

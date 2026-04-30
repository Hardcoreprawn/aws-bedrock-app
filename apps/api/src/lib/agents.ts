import type { AgentResult } from '../types.js';
import { generateReview } from './bedrock.js';
import { loadPrompt } from './prompts.js';

const AGENT_CONFIG = {
  grammar: {
    displayName: 'Grammar and spelling',
    prompt: 'grammar-review'
  },
  citation: {
    displayName: 'Citation and bibliography',
    prompt: 'citation-review'
  },
  referencing: {
    displayName: 'Referencing consistency',
    prompt: 'referencing-review'
  },
  policy: {
    displayName: 'Policy and safety risk',
    prompt: 'policy-review'
  }
} as const;

export type AgentName = keyof typeof AGENT_CONFIG;

/**
 * Executes one specialist agent by loading its prompt and invoking model generation.
 */
export async function runAgent(agent: AgentName, documentText: string): Promise<AgentResult> {
  const systemPrompt = await loadPrompt('system');
  const taskPrompt = await loadPrompt(AGENT_CONFIG[agent].prompt);
  const details = await generateReview({
    systemPrompt,
    taskPrompt,
    documentText
  });

  return {
    agent: AGENT_CONFIG[agent].displayName,
    summary: details.split('\n')[0] ?? details.slice(0, 160),
    details
  };
}

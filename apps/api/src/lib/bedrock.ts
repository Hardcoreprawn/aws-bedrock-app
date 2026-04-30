import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { env } from '../config.js';
import { bedrockClient } from './aws.js';

interface GenerateReviewInput {
  systemPrompt: string;
  taskPrompt: string;
  documentText: string;
}

/**
 * Generates review output using Bedrock, or returns deterministic text in mock mode.
 */
export async function generateReview(input: GenerateReviewInput): Promise<string> {
  if (env.USE_MOCK_BEDROCK === 'true') {
    return `Mock response for task: ${input.taskPrompt.slice(0, 80)}`;
  }

  const command = new InvokeModelCommand({
    modelId: env.BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1200,
      system: input.systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${input.taskPrompt}\n\nDocuments:\n${input.documentText}`
            }
          ]
        }
      ]
    })
  });

  const response = await bedrockClient.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));
  const content = body.content?.[0]?.text;

  if (!content) {
    throw new Error('Bedrock response did not include text content.');
  }

  return content;
}

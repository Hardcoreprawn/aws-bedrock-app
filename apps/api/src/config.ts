import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const environmentSchema = z
  .object({
    AWS_REGION: z.string().default('eu-west-2'),
    DOCUMENT_BUCKET_NAME: z.string().default('local-documents'),
    REVIEW_TABLE_NAME: z.string().default('local-review-table'),
    REVIEW_STATE_MACHINE_ARN: z.string().default('arn:aws:states:local:000000000000:stateMachine:local'),
    BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-haiku-20240307-v1:0'),
    PROMPTS_DIR: z.string().default(fileURLToPath(new URL('../../../../prompts', import.meta.url))),
    USE_MOCK_BEDROCK: z.enum(['true', 'false']).default('true'),
    AUTH_ENABLED: z.enum(['true', 'false']).default('false'),
    ENTRA_TENANT_ID: z.string().default(''),
    ENTRA_API_AUDIENCE: z.string().default(''),
    ENTRA_REQUIRED_SUBMIT_ROLES: z.string().default('review.submit,review.admin'),
    ENTRA_REQUIRED_READ_ROLES: z.string().default('review.submit,review.read,review.admin')
  })
  .superRefine((env, context) => {
    if (env.AUTH_ENABLED === 'true') {
      if (!env.ENTRA_TENANT_ID) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ENTRA_TENANT_ID must be set when AUTH_ENABLED=true.',
          path: ['ENTRA_TENANT_ID']
        });
      }

      if (!env.ENTRA_API_AUDIENCE) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ENTRA_API_AUDIENCE must be set when AUTH_ENABLED=true.',
          path: ['ENTRA_API_AUDIENCE']
        });
      }

      if (!env.ENTRA_REQUIRED_SUBMIT_ROLES.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ENTRA_REQUIRED_SUBMIT_ROLES must not be empty when AUTH_ENABLED=true.',
          path: ['ENTRA_REQUIRED_SUBMIT_ROLES']
        });
      }

      if (!env.ENTRA_REQUIRED_READ_ROLES.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ENTRA_REQUIRED_READ_ROLES must not be empty when AUTH_ENABLED=true.',
          path: ['ENTRA_REQUIRED_READ_ROLES']
        });
      }
    }
  });

export const env = environmentSchema.parse(process.env);

# Architecture

This scaffold is designed as a serverless-first document review application.

## Frontend

- React with Vite and TypeScript.
- Hosted in AWS via S3 and CloudFront.
- Uses Entra sign-in when the deployment provides client and scope configuration.
- Calls the backend over a simple HTTP API with bearer tokens in secured environments.

## Backend

- API Gateway exposes upload and review endpoints.
- Lambda handlers provide upload target creation, review submission, and review status reads.
- Lambda code validates Entra-issued JWTs and enforces role-aware access checks.
- Review ownership is stored so non-admin reads can be limited to the submitting user.
- Step Functions orchestrates specialist review workers and the synthesis step.
- DynamoDB stores review status and output.
- S3 stores uploaded documents.

## AI review model

The review flow uses narrow specialist roles:

1. Grammar and spelling.
2. Citation and bibliography.
3. Referencing consistency.
4. Policy and safety risk.
5. Final synthesis.

Prompts are stored outside the code path in `prompts/` so they can be reviewed and changed independently from the application logic.

## Local architecture

For local demos, `apps/mock-api` stands in for the AWS backend. This keeps local development easy while preserving the browser contract used by the real API.

## Container strategy

The default design avoids containers for the primary runtime path. This keeps the operational baseline simple. If review workers later need OS-level dependencies or longer-running workloads, the worker tier is the best place to introduce ECS Fargate.

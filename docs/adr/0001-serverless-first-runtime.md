# ADR 0001: Serverless-First Runtime

- Status: Accepted
- Date: 2026-04-30

## Context

The scaffold needs to be secure enough for a regulated baseline while remaining easy for new teams to operate.

## Decision

Use a serverless-first runtime model:

- React frontend on S3 and CloudFront.
- API endpoints on API Gateway and Lambda.
- Multi-agent orchestration on Step Functions.
- S3 for documents and DynamoDB for review state.

## Consequences

Positive:

- Lower operational burden than a container-first platform.
- Easier environment promotion and smaller runtime surface area.
- Clear path to least-privilege IAM and managed service controls.

Negative:

- Worker behavior is constrained by Lambda limits.
- Some document-processing workloads may later justify ECS Fargate.

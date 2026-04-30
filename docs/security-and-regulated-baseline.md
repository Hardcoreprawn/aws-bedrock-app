# Security And Regulated Baseline

This scaffold is designed to be a sensible starting point, not a complete regulated solution.

## What is already modeled

- Separation of prompts from application logic.
- Narrow specialist agents rather than a single broad prompt.
- A basic safety screen before worker execution.
- Private S3 usage in the infrastructure scaffold.
- CloudFront in front of the static frontend.
- Approval-ready production deployment structure in Azure DevOps.

## What should be hardened next

1. Replace default S3 encryption settings with customer-managed KMS keys if required by policy.
2. Add WAF and logging for public entry points.
3. Tighten IAM and Graph permission scopes.
4. Add retention controls for logs and review data.
5. Add explicit PII detection or redaction before model invocation.
6. Define a human approval policy for high-risk outputs.
7. Validate whether uploaded documents may contain regulated data that must stay in-region.

## Important boundary

The local mock mode is for development convenience only. It is not a substitute for cloud-side security validation, Bedrock guardrails, or compliance review.

## Recommended next reading

1. [hardening-roadmap.md](hardening-roadmap.md)
2. [runbooks/incident-triage.md](runbooks/incident-triage.md)
3. [pipelines-and-identities.md](pipelines-and-identities.md)

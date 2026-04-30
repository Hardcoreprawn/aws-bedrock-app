# Hardening Roadmap

This document translates “internet first, Entra-backed, conditionally accessed, regulated” into concrete engineering controls.

## Design intent

The app should be easy to test and demo, but the production posture must assume hostile traffic, sensitive documents, and strict identity governance.

## Control layers

### 1. Edge and internet exposure

Target state:

1. CloudFront in front of the frontend.
2. AWS WAF attached to CloudFront and API Gateway.
3. Rate limiting and bot filtering at the edge.
4. Strict TLS and secure response headers.

Implementation notes:

- Add WAF managed rules plus app-specific rate rules.
- Add CSP, HSTS, and frame protections at the CDN layer.
- Prefer private origins and origin access control for S3.

### 2. Identity and access

Target state:

1. Entra is the workforce identity provider.
2. Frontend uses Entra sign-in for user authentication.
3. Conditional Access protects user access based on device, network, and risk posture.
4. Application roles or groups control authorization.
5. Preview and production enterprise apps live in the correct tenant boundary with separate lifecycle controls.

Implementation notes:

- Use Entra app registration for the frontend and API trust model.
- Keep production enterprise app separate from preview identities.
- Provision Entra identities declaratively through Terraform, not only through imperative scripts.
- Do not rely on only frontend authentication; enforce authorization in the API as well.

### 3. API protection

Target state:

1. API requires validated bearer tokens.
2. API authorizer enforces issuer, audience, expiry, and tenant rules.
3. Least-privilege access is enforced per endpoint where possible.

Implementation notes:

- Add JWT validation in API Gateway or Lambda.
- Validate Entra claims such as tenant, roles, groups, and auth context.
- Consider separate permissions for upload, review submission, and review read access.

### 4. Data protection

Target state:

1. Customer-managed KMS keys for document and state storage when policy requires it.
2. Tight bucket and table policies.
3. Explicit retention periods.
4. Auditability for who submitted and accessed review data.

Implementation notes:

- Tag data by classification.
- Keep uploaded documents private and time-bound.
- Add lifecycle rules for non-production environments.

### 5. AI safety and human control

Target state:

1. Narrow specialist agents remain in place.
2. Pre-model safety screening for sensitive content and prohibited use.
3. Bedrock guardrails are configured where supported.
4. High-risk or policy-sensitive outputs require human review before downstream use.

Implementation notes:

- Add PII detection and optional redaction before model invocation.
- Log prompt version, model ID, and decision metadata.
- Separate “assistive review” from any automated decision-making.

### 6. Delivery and environment governance

Target state:

1. Preview identities are short-lived and automatically cleaned.
2. Production requires managed approvals.
3. Pipeline credentials use federation where possible.
4. Prompt and infra changes are reviewed with security impact visible.
5. Production enterprise app lifecycle is idempotent and controlled through IaC.

Implementation notes:

- Replace long-lived AWS secrets with federation.
- Make security and identity impact mandatory in PR templates.
- Treat prompt changes as behavior changes, not content-only changes.

## Practical hardening phases

### Phase 1: Safe test baseline

1. Entra sign-in for the web app.
2. JWT validation on the API.
3. WAF on public entry points.
4. KMS-backed storage.
5. Audit logging and retention policy.
6. Preview and production separation.

This is the minimum credible “test but safe” posture.

### Phase 2: Regulated uplift

1. Conditional Access policies enforced for the production enterprise app.
2. PII screening or redaction before Bedrock.
3. Human approval gate for high-risk outputs.
4. Centralized monitoring and alerting.
5. Stronger IAM scoping and key policies.

### Phase 3: Mature production controls

1. Formal threat model.
2. Penetration testing and abuse-case testing.
3. Data classification-driven routing and retention.
4. Runbooks integrated into operational support.
5. Security assertions validated in CI where practical.

## What I would do next in this repo

1. Add Entra-based authentication to the frontend and API.
2. Add WAF and stricter headers in Terraform.
3. Add KMS CMKs, retention, and access logging in Terraform.
4. Add security-focused tests for token validation and prompt safety boundaries.
5. Add a threat-model document and abuse-case checklist.

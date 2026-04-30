# Incident Triage Runbook

## Purpose

Provide a fast first-response path when the application or deployment misbehaves.

## First questions

1. Is the failure local, preview, or production?
2. Is it frontend delivery, API routing, identity, storage, or AI review behavior?
3. Did the failure start after a recent deployment or prompt change?

## Initial checks

1. CloudFront or frontend availability.
2. API Gateway health and request failures.
3. Lambda errors and throttles.
4. Step Functions execution failures.
5. DynamoDB or S3 access issues.
6. Entra sign-in or service principal issues.

## Immediate containment options

1. Roll back the frontend artifact.
2. Disable new review submissions temporarily.
3. Revert prompt changes if the fault is AI-behavior-specific.
4. Pause production promotion until identity or federation issues are resolved.

## After stabilization

1. Record the timeline.
2. Capture the root cause.
3. Update documentation, runbooks, or ADRs if the issue exposed a missing guardrail.

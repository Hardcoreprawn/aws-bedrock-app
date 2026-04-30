# ADR 0004: Local Compose Preview

- Status: Accepted
- Date: 2026-04-30

## Context

Teams need a low-friction local demo path before integrated AWS environments are available.

## Decision

Provide a Docker Compose local preview mode with a mock API that preserves the browser contract used by the cloud backend.

## Consequences

Positive:

- UI work can progress without AWS credentials.
- New teams can demo the flow quickly.
- Devcontainer and Docker Desktop workflows align.

Negative:

- Local preview is not a security or cloud-integration test.
- Mock behavior can drift if not maintained alongside the real API contract.

# ADR 0002: Prompts Outside Code

- Status: Accepted
- Date: 2026-04-30

## Context

Prompt changes should be reviewable and governable without being buried inside handler logic.

## Decision

Store prompts as standalone markdown files under `prompts/` and package them with the API artifact at build time.

## Consequences

Positive:

- Prompt changes are diffable and easier to review.
- Specialist prompts can evolve independently.
- Governance around AI behavior is easier to document.

Negative:

- Prompt versioning discipline becomes part of delivery quality.
- Prompt changes can alter behavior without TypeScript catching it.

# ADR 0003: Azure DevOps And Entra Governance

- Status: Accepted
- Date: 2026-04-30

## Context

The runtime is AWS, but the organization wants identity lifecycle and delivery governance anchored in Azure DevOps and Entra.

## Decision

Use Azure DevOps pipelines for deployment orchestration and automate Entra application plus enterprise application lifecycle for preview and production environments.

## Consequences

Positive:

- Delivery approvals remain in the existing organizational control plane.
- PR environments can use short-lived identities.
- Production identity lifecycle is explicit.

Negative:

- Cross-cloud identity and permissions become a first-class architecture concern.
- Pipeline federation and Graph permissions must be tightly controlled.

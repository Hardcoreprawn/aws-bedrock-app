# Preview Deployment Runbook

## Purpose

Deploy and validate a PR-scoped preview environment.

## Preconditions

1. The pull request pipeline is green.
2. Azure DevOps service connection is valid.
3. Graph permissions allow app and service principal creation.
4. AWS deployment credentials or federation are available to the agent.

## Steps

1. Confirm the pull request ID and branch.
2. Run or re-run the preview stage in Azure DevOps.
3. Verify the `test_<app-name>_<pr-id>` Entra identity was created.
4. Verify Terraform applied successfully.
5. Check the CloudFront endpoint and API endpoint.
6. Exercise at least one document review flow.

## Exit criteria

- Preview app is reachable.
- Mock or real review flow completes as expected.
- No obvious identity, routing, or storage errors remain.

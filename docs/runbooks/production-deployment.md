# Production Deployment Runbook

## Purpose

Promote the application through the managed production environment with approvals.

## Preconditions

1. Required approvals are in place.
2. Preview validation has completed.
3. Production identity permissions are confirmed.
4. Rollback owner is identified.

## Steps

1. Review the pull request and linked work items.
2. Confirm no unreviewed prompt changes are included.
3. Trigger or approve the production deployment.
4. Verify Entra production identity creation or reuse.
5. Verify Terraform apply outcome.
6. Verify frontend publish and CloudFront invalidation.
7. Run smoke tests against production.

## Exit criteria

- Application is reachable.
- Authentication behaves as expected.
- Review submission and completion path work.
- Monitoring shows no immediate regression.

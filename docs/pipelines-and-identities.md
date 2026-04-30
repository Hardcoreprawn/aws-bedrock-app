# Pipelines And Identities

This repo assumes Azure DevOps is the delivery control plane and AWS is the runtime platform.

## Pipeline model

- Pull requests trigger validation and preview deployment.
- Validation runs typecheck, lint, unit tests, build, and a Microsoft Defender for DevOps scan job.
- The preview stage creates a short-lived Entra application and enterprise application in the dev tenant using the `test_` naming convention.
- The production stage is tied to `main`, targets the production tenant, and uses a managed Azure DevOps environment so approvals can be enforced.
- Production infrastructure deployment now runs `terraform plan` then `terraform apply` against the generated plan file in the same job.
- Entra identity objects are provisioned declaratively through Terraform in `infra/terraform/entra`.
- AWS deployment access uses Azure DevOps OIDC to assume an AWS IAM role at runtime.

## Entra identity lifecycle

Terraform under `infra/terraform/entra` creates or updates application objects and service principals. Cleanup automation under `scripts/entra` removes aged preview identities.

Current behavior:

1. PR deployments create `test_<app-name>_<pull-request-id>` style identities.
2. Production deployments create or maintain a long-lived non-`test_` identity in the production tenant.
3. The scheduled cleanup pipeline removes expired preview identities.

## Tenant separation

Recommended baseline:

1. Dev tenant for PR identities and lower-trust preview access.
2. Production tenant for the long-lived enterprise app.
3. Separate Azure service connections for preview and production identity changes.
4. Group-based role assignment for production access rather than direct user assignment at scale.

## Pipeline variables to set

At minimum, define:

1. `DEV_AZURE_SERVICE_CONNECTION`
2. `PROD_AZURE_SERVICE_CONNECTION`
3. `AWS_DEPLOY_ROLE_ARN`
4. `TF_STATE_BUCKET`
5. `TF_LOCK_TABLE`
6. `productionReaderGroupObjectIds`
7. `productionSubmitterGroupObjectIds`
8. `productionAdminGroupObjectIds`

The group variables are expected to be Terraform list literals such as `[]` or `["<group-object-id>"]`.

## AWS authentication note

The scaffold now uses workload identity federation from Azure DevOps to AWS via OIDC and `sts:AssumeRoleWithWebIdentity`, which avoids long-lived AWS access keys in the pipeline.

## Terraform backend bootstrap

Before the first deployment, run the bootstrap Terraform module in `infra/terraform/bootstrap` once per AWS account/region. It creates:

1. S3 bucket for Terraform remote state.
2. DynamoDB table for Terraform state locking.
3. OIDC provider for Azure DevOps.
4. IAM role the pipeline assumes at runtime.

## Before using in production

Confirm:

1. Azure service connections and permission scopes.
2. Microsoft Graph permissions needed for application and service principal lifecycle operations.
3. AWS deployment credentials and trust model.
4. Approval gates on the production-managed environment.
5. Terraform state strategy for Entra resources, especially if preview identities will later be destroyed through IaC instead of age-based cleanup.

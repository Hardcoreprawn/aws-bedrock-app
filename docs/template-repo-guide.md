# Template Repo Guide

This guide explains this repo in plain language, but still covers the real technical details so a team can use it as a template.

## What this project is

This repository is a starter kit for cloud software.

You are building a document review app with:

1. A website where users upload documents.
2. An API that receives requests.
3. A workflow that runs specialist review steps.
4. Storage for files and review results.
5. A deployment pipeline that pushes changes safely.

This repo already has all of those pieces wired together in a practical way.

## Big picture architecture

The app has two main paths: local development path and cloud deployment path.

### Local path (fast demo mode)

1. `apps/web` runs the frontend in Vite dev mode.
2. `apps/mock-api` pretends to be the backend.
3. No AWS credentials are needed.
4. You can test full user flow quickly.

This is intentionally simple so developers can move fast.

### Cloud path (real deployment mode)

1. Frontend is built and uploaded to S3.
2. CloudFront serves the frontend globally.
3. API Gateway exposes HTTP endpoints.
4. Lambda handlers run API logic.
5. Step Functions orchestrates multi-step AI review.
6. DynamoDB stores review state and outputs.
7. S3 stores uploaded documents.

Terraform in `infra/terraform` creates and updates these resources.

## Repo layout and why each part exists

- `apps/web`
Purpose: React UI that users see.

- `apps/api`
Purpose: Lambda handler code for uploads, review creation, review status, worker orchestration, and synthesis.

- `apps/mock-api`
Purpose: Local fake backend so frontend work is not blocked by cloud setup.

- `prompts`
Purpose: Prompt files separated from code so teams can review and update prompts safely.

- `infra/terraform`
Purpose: AWS infrastructure as code.

- `infra/terraform/entra`
Purpose: Entra app registrations and enterprise app roles for auth.

- `infra/terraform/bootstrap`
Purpose: One-time setup for shared Terraform backend and OIDC trust from Azure DevOps to AWS.

- `scripts`
Purpose: Build, packaging, prerequisite checking, and environment bootstrap scripts.

- `docs`
Purpose: Human-readable guidance for setup, operations, security, and runbooks.

## How authentication works

### User authentication

In deployed environments, the frontend signs users in with Entra ID. The API validates Entra tokens and checks roles.

Role model includes:

1. `review.read`
2. `review.submit`
3. `review.admin`

### Pipeline authentication

Pipeline does **not** use long-lived AWS keys.

Instead it uses OIDC federation:

1. Azure DevOps issues an OIDC token at runtime.
2. Pipeline exchanges token with AWS STS (`AssumeRoleWithWebIdentity`).
3. AWS returns temporary credentials.
4. Pipeline runs Terraform and deploy commands with those short-lived credentials.

This is safer and is the recommended enterprise path.

## Terraform state and why bootstrap exists

Terraform needs a state file to remember what already exists.

Without remote state:

1. Pipeline can lose track of resources.
2. Parallel runs can conflict.
3. Deployments become fragile.

So this template uses:

1. S3 bucket for remote state.
2. DynamoDB table for state locking.

The bootstrap module creates those shared foundations once.

After bootstrap, normal Terraform commands pass backend config (`bucket`, `key`, `dynamodb_table`, `region`) during `terraform init`.

## CI/CD pipeline stages

Pipeline is in `azure-pipelines.yml` and has three stages:

### 1) Validate

Runs quality gates before deployment:

1. `npm install`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test`
5. Build checks for API and web
6. Microsoft Defender for DevOps scan job (IaC, secrets, dependencies)

This catches quality and security issues early.

### 2) Preview (PR deployments)

For pull requests:

1. Assume AWS deploy role via OIDC.
2. Provision short-lived Entra identity for that PR.
3. Deploy AWS infra in PR-scoped environment.
4. Build and upload frontend.

Gives reviewers a realistic environment before merge.

### 3) Production

For main branch:

1. Assume AWS deploy role via OIDC.
2. Provision/update production Entra identity.
3. Deploy production infrastructure.
4. Build and publish frontend.

This stage is wired to managed environments so approval gates can be enforced.

## Quality and testing baseline

This template now includes:

1. Type checking (`tsc --noEmit`).
2. ESLint for code quality.
3. Vitest unit tests (starting with API utility tests).

The test suite is intentionally small to start, but the structure is in place so teams can expand it quickly.

## Dependency and image supply chain

This template works well with a staged supply-chain model:

1. Start with direct internet access for npm packages and container base images so the team can prove the workflow quickly.
2. Introduce an internal proxy or mirror, such as Pulp, for npm packages and container images.
3. Move CI and developer environments to the internal endpoints once they are ready.

That approach keeps early adoption easy while still supporting a more controlled environment later.

## Security baseline today

Good defaults already present:

1. OIDC-based pipeline auth to AWS.
2. Infrastructure as code for repeatability.
3. Defender for DevOps scan in pipeline.
4. WAF and response headers in AWS Terraform stack.
5. Prompt files separated from code.
6. Safety screening step in review flow.

Still expected for production hardening:

1. Tighten IAM policies from broad to least privilege.
2. Add more API and workflow tests.
3. Add DR and backup/restore runbooks validation.
4. Add policy-as-code checks and stronger release controls.

## How to use this as a template repo

If you fork this as a new project, do this in order:

1. Rename app and environment naming variables.
2. Run bootstrap module in target AWS account.
3. Set pipeline variables (`AWS_DEPLOY_ROLE_ARN`, `TF_STATE_BUCKET`, `TF_LOCK_TABLE`, service connections).
4. Configure Entra redirect URIs and API audience values.
5. Replace placeholder domain values (`preview.example.com`, `app.example.com`).
6. Add project-specific tests before first production release.

## Simple mental model to remember

If you only remember one summary, use this:

1. Develop locally with mock services.
2. Validate every change with lint/test/typecheck/build/security scan.
3. Deploy through OIDC-authenticated pipeline with Terraform state backend.
4. Treat preview as rehearsal and production as controlled release.

That is exactly what this template is designed to teach and enforce.

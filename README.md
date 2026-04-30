# AWS Bedrock Review Scaffold

This repository provides a TypeScript-first scaffold for an API-led document review application hosted on AWS and delivered through Azure DevOps pipelines.

## What is included

- React web client hosted as a static site.
- Serverless API on AWS Lambda and API Gateway.
- Orchestrated specialist review agents with AWS Step Functions.
- Editable prompt files stored outside the application code path.
- Terraform for AWS infrastructure and Entra identity lifecycle.
- Azure DevOps pipeline stages for validation, PR environments, and managed production deployment.
- Entra enterprise application automation for short-lived PR identities and long-lived production identity.

## Architecture summary

- `apps/web`: Vite + React TypeScript frontend.
- `apps/api`: Lambda handlers, Bedrock client wrapper, review orchestration, and prompt loading.
- `prompts`: Editable markdown prompt files for each specialist agent.
- `infra/terraform`: AWS infrastructure plus Entra identity IaC in `infra/terraform/entra`.
- `scripts/entra`: Microsoft Graph automation for app registrations and enterprise applications.

The default deployment model is:

- CloudFront + S3 for the frontend.
- API Gateway + Lambda for API endpoints.
- Step Functions for multi-agent orchestration.
- S3 for uploaded source documents.
- DynamoDB for review status and output storage.

## Regulated-environment posture

- Serverless-first to reduce operational overhead.
- KMS-backed encryption is modeled for document and review-state storage.
- WAF, response headers, access logging, and log retention are modeled in the AWS Terraform stack.
- Prompts are separated from code so they can be reviewed and changed independently.
- Specialist agents are narrowly scoped to reduce prompt sprawl.
- A safety gate is run before review synthesis.
- Entra sign-in, token validation, and role-aware access checks are wired into the app path.
- Azure DevOps production stage is designed to use a managed environment with approvals.

## Prompt editing

Prompt files are stored in `prompts/`. The API packages them into the Lambda artifact during the build.

## Local development

1. Install dependencies with `npm install`.
2. Build the API and frontend with `npm run build`.
3. Set `USE_MOCK_BEDROCK=true` for local development when AWS Bedrock is not configured.

Quick helpers:

- `npm run check:prereqs`: verify local tooling such as Node, npm, Docker, Docker Compose, and WSL.
- `npm run bootstrap:local`: create `.env` from `.env.example` if it does not already exist.

Auth note:

- Local mock preview works without Entra configuration.
- Deployed environments should set `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_AUTHORITY`, and `VITE_ENTRA_API_SCOPE` at build time.

## Local preview with Docker Compose

For a lightweight local demo path, the repository includes `docker-compose.local.yml` and a mock API service.

- The web app runs on port `5173`.
- The mock API runs on port `3000`.
- Uploaded documents are stored in-memory by the mock service.
- Reviews complete asynchronously with deterministic placeholder findings so teams can exercise the UI flow without AWS infrastructure.

Setup:

1. Run `npm run bootstrap:local` or copy `.env.example` to `.env` manually.
2. Adjust port values if they conflict with local services.
3. Run `docker compose -f docker-compose.local.yml up --build`.
4. Open `http://localhost:5173`.

Useful commands:

- Start stack: `npm run dev:local`
- Stop stack: `npm run dev:local:down`
- Run web only outside Docker: `npm run dev:web`
- Run mock API only outside Docker: `npm run dev:mock-api`

## Dev container

The repository includes a VS Code dev container in `.devcontainer/` so developers can open the workspace with a consistent toolchain.

- Supported Windows host model: Docker Desktop using the WSL 2 engine.
- Base runtime: Node.js 20 on Debian Bookworm.
- Included CLIs: AWS CLI, Terraform, Azure CLI, `jq`, `zip`, and `unzip`.
- Included utilities for isolated environments: `curl`, `wget`, `git`, `make`, `procps`, `bash-completion`, and SSH client tools.
- Default local mode: `USE_MOCK_BEDROCK=true` so the scaffold can run before AWS Bedrock access is configured.
- Post-create bootstrap: `npm ci --prefer-offline` runs automatically. If registry access is unavailable, container creation still succeeds and prints the next step.

To use it:

1. Install Docker Desktop for Windows.
2. In Docker Desktop settings, enable `Use the WSL 2 based engine`.
3. Enable WSL integration for the distro you use for development.
4. Install the VS Code Dev Containers extension.
5. Open the repository in VS Code and run `Dev Containers: Reopen in Container`.

Recommended Windows workflow:

1. Keep the repository in your WSL filesystem for better file I/O and watcher performance.
2. Open the folder from VS Code through WSL, then reopen it in the dev container.
3. If the repository stays on a Windows drive, the container will still work, but frontend file watching can be slower.

Once the container is running, use the integrated terminal for `npm`, `terraform`, `aws`, and `az` commands.

No-internet environments:

1. Build and publish the devcontainer image in a connected CI environment, then replicate it to your internal container registry.
2. Provide an internal npm registry mirror (or pre-populated npm cache) reachable from the isolated network.
3. Open the repo in the prebuilt container image; if dependency install is deferred, run `npm ci` after mirror configuration.

Practical rollout path:

1. Day 1 can use normal internet-backed package access while the team proves out the workflow.
2. In parallel, stand up an internal package proxy such as Pulp for npm artifacts and your container registry mirror.
3. Once the proxy is ready, point developer and CI installs at the internal endpoints so the workflow stays the same but external dependency access is controlled.

The dev container also forwards the local preview ports for the mock API and Vite dev server.

## Guides

- [docs/README.md](docs/README.md): documentation index.
- [docs/template-repo-guide.md](docs/template-repo-guide.md): comprehensive beginner-friendly walkthrough of architecture, dev flow, and pipeline behavior.
- [docs/getting-started.md](docs/getting-started.md): first-day setup for Windows, WSL, devcontainer, and local preview.
- [docs/local-development.md](docs/local-development.md): local run modes, environment variables, and workflow tips.
- [docs/architecture.md](docs/architecture.md): current application and infrastructure design.
- [docs/adr/README.md](docs/adr/README.md): architecture decision records.
- [docs/runbooks/README.md](docs/runbooks/README.md): operating runbooks for preview, production, and incidents.
- [docs/pipelines-and-identities.md](docs/pipelines-and-identities.md): Azure DevOps, OIDC to AWS, Terraform state, and Entra lifecycle model.
- [docs/prompt-authoring.md](docs/prompt-authoring.md): how to edit and validate specialist prompts.
- [docs/security-and-regulated-baseline.md](docs/security-and-regulated-baseline.md): regulated-environment controls and gaps.
- [docs/hardening-roadmap.md](docs/hardening-roadmap.md): staged hardening plan for internet-facing regulated deployment.
- [docs/troubleshooting.md](docs/troubleshooting.md): common setup and runtime issues.

## Deployment notes

- The sample Azure DevOps pipeline provisions PR-scoped `test_` Entra identities in the dev tenant and a long-lived non-`test_` identity in the production tenant.
- The Entra Terraform stack defines the delegated API scope plus `review.read`, `review.submit`, and `review.admin` app roles.
- Group object IDs can be passed into the production pipeline to assign broad access to the correct Entra groups without broadening application permissions.
- Production deployment uses an Azure DevOps environment so approvals can be enforced outside the YAML.
- AWS authentication strategy must be aligned to your platform standard. Prefer workload identity or a tightly controlled managed agent over static secrets.

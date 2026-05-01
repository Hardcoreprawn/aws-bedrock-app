# New Starter Training Course

**Audience:** Engineers joining the team for the first time.  
**Suggested timing:** Spread across your first 12 weeks. Budget roughly one module per week, with reading and self-directed exploration sitting alongside your normal onboarding activities.  
**Total guided time:** ~10–12 hours of structured learning, plus optional extension exercises at the end of each module.

---

## How to use this course

Each module has:

- A **goal** — what you should be able to do or explain by the end.
- **Background reading** — existing docs and code you should read through.
- **Hands-on tasks** — things to run, edit, or trace through in the codebase.
- **Check your understanding** — questions to answer for yourself (no quiz, just reflection).
- **Optional extensions** — deeper dives if time allows.

Do the modules roughly in order. Later modules build on earlier ones, especially around auth and the AI pipeline.

---

## Module 1 — Orientation: What is this system and why does it exist?

**Estimated time:** 1 hour  
**Suggested week:** Week 1–2

### Goal

Understand the purpose of the application, where it sits architecturally, and why its key design decisions were made.

### Background reading

1. [README.md](../README.md) — read the whole thing. Pay attention to the regulated-environment posture section.
2. [docs/architecture.md](architecture.md) — the high-level system picture.
3. [docs/adr/0001-serverless-first-runtime.md](adr/0001-serverless-first-runtime.md) — why Lambda and Step Functions rather than containers.
4. [docs/adr/0002-prompts-outside-code.md](adr/0002-prompts-outside-code.md) — why prompts live in `prompts/` rather than inside handler code.
5. [docs/adr/0003-azure-devops-and-entra-governance.md](adr/0003-azure-devops-and-entra-governance.md) — why Azure DevOps and Entra are in the picture even though the runtime is AWS.
6. [docs/adr/README.md](adr/README.md) — the ADR index.

### Hands-on tasks

1. Walk the top-level folder structure — `apps/`, `prompts/`, `infra/`, `scripts/`, `docs/`. Note which concern lives where.
2. Open the five prompt files under `prompts/`. Read each one. Notice that they are plain markdown with no embedded code.
3. Open [apps/api/src/lib/agents.ts](../apps/api/src/lib/agents.ts) and trace how a prompt file name maps to a specialist agent role.
4. Open [apps/api/src/lib/bedrock.ts](../apps/api/src/lib/bedrock.ts) and read the `generateReview` function. Note the mock mode branch.

### Check your understanding

- What are the five specialist review roles and what does each one check?
- Why are prompts kept outside application code? What governance benefit does that create?
- What is the consequence of the serverless-first choice for long-running document jobs?
- If someone wanted to add a new specialist agent, what two things would they need to create?

### Optional extensions

- Read [docs/adr/0004-local-compose-preview.md](adr/0004-local-compose-preview.md) for context on the local development decision.
- Skim the `prompts/synthesis.md` file and think about how a synthesis step differs from a specialist step.

---

## Module 2 — Local development: getting the stack running

**Estimated time:** 1.5 hours  
**Suggested week:** Week 2–3

### Goal

Have the full local preview stack running on your machine. Understand what each moving part does and where the seams are between the real AWS architecture and the local mock.

### Background reading

1. [docs/getting-started.md](getting-started.md) — the fastest path to a running app.
2. [docs/local-development.md](local-development.md) — both local modes explained, and all environment variables documented.

### Hands-on tasks

1. Run `npm run check:prereqs` and resolve any gaps it reports.
2. Run `npm run bootstrap:local`. Open the generated `.env` file and read every variable. Cross-reference each one against [docs/local-development.md](local-development.md).
3. Run `npm run dev:local` (or `docker compose -f docker-compose.local.yml up --build`). Wait for both services to start.
4. Open `http://localhost:5173`. Upload a plain text or PDF file and step through a review from submission to completion.
5. Open [apps/mock-api/src/server.ts](../apps/mock-api/src/server.ts). Find the handler that simulates the async review completion and trace the delay logic.
6. Open [apps/api/src/lib/bedrock.ts](../apps/api/src/lib/bedrock.ts). Notice what the mock branch returns. This is what the mock API is replacing locally.

### Check your understanding

- What two services does Docker Compose start, and what port does each run on?
- What happens in the UI if `VITE_ENTRA_*` variables are left blank?
- Where is the simulated review delay controlled? Which environment variable sets it?
- What is the key difference between local mock mode and a real deployed environment, from a security standpoint?

### Optional extensions

- Edit `MOCK_REVIEW_DELAY_MS` to a very short value and re-run the stack. Observe the polling behaviour in the browser network tab.
- Try setting `CHOKIDAR_USEPOLLING=true` and restarting. Read the note in [docs/local-development.md](local-development.md) about when this is needed.

---

## Module 3 — The frontend: React, Vite, and authentication

**Estimated time:** 1.5 hours  
**Suggested week:** Week 3–4

### Goal

Understand how the React app is structured, how it communicates with the API, and how Entra sign-in is wired in (and safely bypassed in local mode).

### Background reading

1. [apps/web/src/App.tsx](../apps/web/src/App.tsx) — main component, review flow state machine.
2. [apps/web/src/api.ts](../apps/web/src/api.ts) — all API calls made from the browser.
3. [apps/web/src/auth.ts](../apps/web/src/auth.ts) — Entra MSAL configuration and token acquisition.
4. [apps/web/vite.config.ts](../apps/web/vite.config.ts) — build configuration.

### Hands-on tasks

1. Read `App.tsx` from top to bottom. Trace the `handleSubmit` function — what sequence of API calls does it make?
2. In `api.ts`, find where the bearer token is attached to a request. Trace back into `auth.ts` to see how the token is acquired.
3. Find the guard in `App.tsx` that prevents submission if `isAuthConfigured` is true but the user is not signed in.
4. Add a `console.log` to `handleSubmit` that prints the list of object keys returned by `uploadFiles`. Run `npm run dev:local`, submit a document, and confirm your log line appears.
5. Remove your log line when done.
6. Open `apps/web/src/styles.css` briefly — note that styles are kept minimal.

### Check your understanding

- What is the sequence of API calls the frontend makes to go from "select file" to "review in progress"?
- How does `auth.ts` know whether to use real Entra tokens or skip authentication entirely?
- Why does the frontend poll rather than use a websocket or server-sent events?
- What would break in production if the `VITE_API_BASE_URL` variable was pointed at the wrong URL at build time?

### Optional extensions

- Run `npm run build --workspace @bedrock-app/web` and inspect the contents of the generated `dist/` folder. Note that the HTML file is tiny and all logic is in the bundled JS.
- Look at how `createUploadTargets` returns pre-signed S3 URLs. Consider why the frontend uploads directly to S3 rather than through the API.

---

## Module 4 — The API: Lambda handlers, routing, and data storage

**Estimated time:** 2 hours  
**Suggested week:** Week 4–6

### Goal

Understand how the Lambda-based API is structured, how requests are routed, how data is stored, and how auth is enforced at the API layer.

### Background reading

1. [apps/api/src/handlers/router.ts](../apps/api/src/handlers/router.ts) — the Lambda entry point that dispatches to handlers.
2. [apps/api/src/handlers/uploads.ts](../apps/api/src/handlers/uploads.ts) — pre-signed S3 URL generation.
3. [apps/api/src/handlers/reviews-create.ts](../apps/api/src/handlers/reviews-create.ts) — review submission and Step Functions trigger.
4. [apps/api/src/handlers/reviews-get.ts](../apps/api/src/handlers/reviews-get.ts) — review status read with ownership checks.
5. [apps/api/src/lib/auth.ts](../apps/api/src/lib/auth.ts) — JWT validation and role enforcement.
6. [apps/api/src/lib/review-store.ts](../apps/api/src/lib/review-store.ts) — DynamoDB read/write helpers.
7. [apps/api/src/lib/document-store.ts](../apps/api/src/lib/document-store.ts) — S3 document retrieval.
8. [apps/api/src/config.ts](../apps/api/src/config.ts) — environment variable parsing and validation.
9. [apps/api/src/types.ts](../apps/api/src/types.ts) — shared TypeScript types.

### Hands-on tasks

1. Open `router.ts`. Map out which HTTP method + path combination routes to which handler. Draw this on paper or in a scratch file.
2. Open `auth.ts`. Read `requireIdentity`. Answer: what happens when `AUTH_ENABLED` is `false`? What claims does it verify when auth is enabled?
3. Open `reviews-get.ts`. Find the ownership check. What role allows a user to read any review, regardless of who submitted it?
4. Open `review-store.ts`. Find the function that saves a completed review. Note the DynamoDB attribute names used.
5. Open `config.ts`. Find where `USE_MOCK_BEDROCK` and `AUTH_ENABLED` are read. Note how the config module validates required values.
6. Open [apps/api/src/handlers/__tests__/safety.test.ts](../apps/api/src/handlers/__tests__/safety.test.ts) and [apps/api/src/handlers/__tests__/responses.test.ts](../apps/api/src/handlers/__tests__/responses.test.ts). Run `npm test` and confirm they pass.

### Check your understanding

- What does the `requireIdentity` function return in local (non-auth) mode, and what three roles does it grant?
- Why does the upload endpoint generate a pre-signed URL rather than receiving the file bytes directly?
- What DynamoDB key is used to look up a review record?
- If a non-admin user tries to read a review submitted by someone else, what response do they receive?
- What is the purpose of `config.ts`? What would happen without the validation it provides?

### Optional extensions

- Read `responses.ts` in `apps/api/src/lib/`. Understand how error responses are shaped.
- Trace what happens if `generateReview` throws in `review-worker.ts` — follow the error path back through Step Functions.

---

## Module 5 — The AI pipeline: Bedrock, agents, and Step Functions orchestration

**Estimated time:** 2 hours  
**Suggested week:** Week 6–8

### Goal

Understand how multi-agent AI review works end-to-end: how the workflow is orchestrated, how each specialist agent is invoked, how safety screening works, and how synthesis combines the findings.

### Background reading

1. [apps/api/src/handlers/review-worker.ts](../apps/api/src/handlers/review-worker.ts) — the Lambda that runs one specialist agent.
2. [apps/api/src/handlers/review-synthesizer.ts](../apps/api/src/handlers/review-synthesizer.ts) — the Lambda that produces the final summary.
3. [apps/api/src/lib/agents.ts](../apps/api/src/lib/agents.ts) — the agent registry mapping names to prompts.
4. [apps/api/src/lib/bedrock.ts](../apps/api/src/lib/bedrock.ts) — the Bedrock model invocation wrapper.
5. [apps/api/src/lib/safety.ts](../apps/api/src/lib/safety.ts) — the input safety screen.
6. [apps/api/src/lib/prompts.ts](../apps/api/src/lib/prompts.ts) — prompt file loading at runtime.
7. [docs/prompt-authoring.md](prompt-authoring.md) — guidelines for editing prompts safely.
8. All five files under `prompts/`.
9. [docs/security-and-regulated-baseline.md](security-and-regulated-baseline.md) — the AI safety section.

### Hands-on tasks

1. Open `review-worker.ts`. Trace the full execution path: document retrieval → safety check → agent execution → result storage.
2. Open `safety.ts`. List the four sensitive patterns it checks for. Consider whether this list would be sufficient for production use.
3. Open `bedrock.ts`. Read the Anthropic message format used in the `InvokeModelCommand` body. Note the `system` field versus the `messages` field.
4. Open `prompts/grammar-review.md` and `prompts/synthesis.md`. Compare their tone and scope. Notice how the synthesis prompt is structured to receive agent outputs rather than raw documents.
5. Open `agents.ts`. Add a hypothetical fifth specialist agent entry — for example, a `readability` agent that would use a `readability-review` prompt. Do not save or commit the file; this is just to test your understanding of the pattern.
6. Read [docs/adr/0002-prompts-outside-code.md](adr/0002-prompts-outside-code.md) again after having traced the prompt loading. The ADR should now feel more concrete.

### Check your understanding

- What is the execution order in the Step Functions workflow? (Workers, then what?)
- What does `assertSafeInput` do if it finds a matching pattern? What does it throw?
- How does the synthesizer receive the individual agent findings? What format are they passed in?
- Why does each agent load both `system.md` and its own specialist prompt rather than just its specialist prompt?
- What does `USE_MOCK_BEDROCK=true` change about runtime behaviour? Where is the mock branch?

### Optional extensions

- Read [docs/hardening-roadmap.md](hardening-roadmap.md), specifically the AI safety and human control section. Map each recommended control back to the code you have just read.
- Edit `prompts/grammar-review.md` locally, re-run `npm run dev:local`, submit a document, and observe whether the mock response changes. (It will not — the mock bypasses prompts. Consider why that matters for local testing.)

---

## Module 6 — Infrastructure: Terraform and AWS resources

**Estimated time:** 1.5 hours  
**Suggested week:** Week 8–9

### Goal

Read and navigate the Terraform configuration. Understand which AWS resources back each part of the application and how they relate to each other.

### Background reading

1. [infra/terraform/main.tf](../infra/terraform/main.tf) — core AWS resources.
2. [infra/terraform/variables.tf](../infra/terraform/variables.tf) — input variables.
3. [infra/terraform/outputs.tf](../infra/terraform/outputs.tf) — exposed outputs used by the pipeline.
4. [infra/terraform/providers.tf](../infra/terraform/providers.tf) — provider and backend configuration.
5. [infra/terraform/bootstrap/](../infra/terraform/bootstrap/) — the one-time bootstrap module (read all four files).
6. [docs/pipelines-and-identities.md](pipelines-and-identities.md) — the Terraform backend bootstrap section.

### Hands-on tasks

1. Open `main.tf`. Identify every distinct AWS resource type defined. Group them mentally: storage, compute, networking, security.
2. Find the KMS key resource. Note the `enable_key_rotation` setting. Which resources use this key?
3. Find the CloudFront distribution resource. Trace how it connects to the S3 frontend bucket using origin access control.
4. Find the Step Functions state machine resource. Note how the state machine definition references the worker and synthesizer Lambda ARNs.
5. Open `infra/terraform/bootstrap/main.tf`. Find the OIDC provider resource. This is what enables Azure DevOps to assume the deployment IAM role without long-lived keys.
6. Open `variables.tf`. Find the `auth_enabled` variable. Trace how it flows into the Lambda environment in `main.tf` (hint: look at `common_lambda_environment`).

### Check your understanding

- What S3 buckets exist in the Terraform configuration and what is each one used for?
- What does the bootstrap module create, and why does it only need to run once per account?
- How does the IAM role created in bootstrap relate to the OIDC provider? How does Azure DevOps authenticate to AWS?
- Why are all S3 buckets created with `block_public_acls = true`?
- What would happen if `auth_enabled` was set to `false` in a production deployment?

### Optional extensions

- Read `infra/terraform/entra/` — all four files. Understand what Entra objects are managed through IaC rather than scripts.
- Skim [docs/hardening-roadmap.md](hardening-roadmap.md), sections 1–4. Map each control to a specific Terraform resource or a gap in the current config.

---

## Module 7 — Delivery: Azure DevOps pipelines, identity governance, and security scanning

**Estimated time:** 1.5 hours  
**Suggested week:** Week 10–11

### Goal

Understand the pipeline structure, the identity lifecycle for preview and production environments, and what security controls are applied during delivery.

### Background reading

1. [azure-pipelines.yml](../azure-pipelines.yml) — the main delivery pipeline.
2. [azure-pipelines.cleanup.yml](../azure-pipelines.cleanup.yml) — the scheduled cleanup pipeline.
3. [docs/pipelines-and-identities.md](pipelines-and-identities.md) — the full pipeline and identity model.
4. [scripts/entra/manage-enterprise-app.mjs](../scripts/entra/manage-enterprise-app.mjs) — Entra app automation.
5. [scripts/entra/cleanup-enterprise-apps.mjs](../scripts/entra/cleanup-enterprise-apps.mjs) — scheduled cleanup script.
6. [docs/runbooks/production-deployment.md](runbooks/production-deployment.md) — production runbook.
7. [docs/runbooks/preview-deployment.md](runbooks/preview-deployment.md) — preview runbook.

### Hands-on tasks

1. Open `azure-pipelines.yml`. List all the pipeline stages and the jobs within each stage.
2. Find the Validate stage. List every check it runs (typecheck, lint, tests, build, security scan). Note that all must pass before the preview stage begins.
3. Find where the pipeline assumes the AWS IAM role. Note the mechanism (OIDC / workload identity federation, not a stored secret).
4. Find the security scan job (`SecurityScan`). Read what it runs. Note the `best effort` comment — understand what that implies.
5. Read the `preview` stage. Find where it creates the short-lived `test_` Entra identity. Note the naming convention.
6. Read the cleanup pipeline. Find the age threshold after which preview identities are deleted.
7. In `manage-enterprise-app.mjs`, find where the script decides whether it is operating in preview or production mode.

### Check your understanding

- What is the naming convention for a preview Entra identity created for PR number 42?
- Why does the pipeline use OIDC federation to AWS rather than storing an IAM access key?
- What needs to happen before code can be promoted to production? (Look for the managed environment reference.)
- What pipeline variables must be set before the first real deployment? (See [pipelines-and-identities.md](pipelines-and-identities.md).)
- Why is there a separate cleanup pipeline rather than deleting preview identities at the end of the deployment pipeline?

### Optional extensions

- Read [docs/runbooks/incident-triage.md](runbooks/incident-triage.md). Consider what information you would need to diagnose a failed review in production.
- Read [docs/pipelines-and-identities.md](pipelines-and-identities.md) section on tenant separation. Think about what would go wrong if preview and production shared the same Entra tenant.

---

## Module 8 — Security posture: hardening, regulated baseline, and threat model thinking

**Estimated time:** 1.5 hours  
**Suggested week:** Week 11–12

### Goal

Understand where the current security baseline sits, what is not yet hardened, and how to think about the threat model for a regulated-environment deployment.

### Background reading

1. [docs/security-and-regulated-baseline.md](security-and-regulated-baseline.md) — what is modelled vs what should be hardened.
2. [docs/hardening-roadmap.md](hardening-roadmap.md) — the full six-layer hardening plan.
3. [apps/api/src/lib/auth.ts](../apps/api/src/lib/auth.ts) — the auth enforcement code you already read in Module 4, now through a security lens.
4. [apps/api/src/lib/safety.ts](../apps/api/src/lib/safety.ts) — the safety screening code you read in Module 5.
5. [apps/api/src/handlers/__tests__/safety.test.ts](../apps/api/src/handlers/__tests__/safety.test.ts) — safety test coverage.

### Hands-on tasks

1. Re-read `hardening-roadmap.md` end-to-end. For each of the six control layers, write down one thing the current codebase already does and one thing it does not yet do.
2. Open `safety.ts`. Consider: what categories of sensitive content are not covered by the four current patterns? Write down at least two examples. (No code change needed — this is analysis.)
3. Open `auth.ts`. Find the block that validates issuer, audience, and expiry. Consider: what attack does each of these checks prevent?
4. Open `reviews-get.ts`. Find the ownership and role check. Consider: what would happen if the ownership check was accidentally removed?
5. Read the "Important boundary" section in [docs/security-and-regulated-baseline.md](security-and-regulated-baseline.md). Consider: what security controls exist in the real AWS environment that do not exist locally?

### Check your understanding

- Name two data protection gaps explicitly called out in the hardening roadmap that are not yet implemented.
- What is the purpose of the safety gate before model invocation? Why is it a pre-model check rather than a post-model check?
- What does "narrow specialist agents" mean from a security perspective? What risk does it reduce?
- If a document contained PII such as a national insurance number, what would happen today? What should happen in a hardened deployment?
- Why does the roadmap recommend human approval for high-risk or policy-sensitive outputs?

### Optional extensions

- Read the OWASP Top 10 for LLM Applications (external reading). Map each risk back to something in this codebase — either a control that addresses it or a gap.
- Read [docs/hardening-roadmap.md](hardening-roadmap.md) section 5 (AI safety). Sketch a simple design for how PII detection before model invocation could be added to `review-worker.ts`.

---

## Capstone exercise — end-to-end trace

**Estimated time:** 1 hour  
**Suggested week:** Week 12**

### Goal

Demonstrate that you can trace a single user action from browser to model and back, naming every component along the way.

### Task

Without looking at your notes, trace the following scenario from start to finish, naming every function, file, service, and AWS resource involved:

> A signed-in user with the `review.submit` role uploads a 3-page document and submits it for review. Thirty seconds later, the review status changes to COMPLETED and they can read the findings.

Your trace should cover:

1. Browser interactions and API calls (which endpoints, what data is sent).
2. Lambda handler invocations (which handlers, in what order).
3. S3 and DynamoDB operations (which buckets/tables, read or write).
4. Step Functions workflow (which Lambdas are invoked by the state machine).
5. Bedrock invocations (how many, which prompts, what is returned).
6. Final state (where the findings are stored, how the frontend reads them).

Write this as a numbered list or a diagram. Then check it against the code.

---

## Reference — key files at a glance

| Concern | File |
|---|---|
| App entry point (web) | [apps/web/src/App.tsx](../apps/web/src/App.tsx) |
| API calls from browser | [apps/web/src/api.ts](../apps/web/src/api.ts) |
| Entra auth (web) | [apps/web/src/auth.ts](../apps/web/src/auth.ts) |
| Lambda router | [apps/api/src/handlers/router.ts](../apps/api/src/handlers/router.ts) |
| Upload handler | [apps/api/src/handlers/uploads.ts](../apps/api/src/handlers/uploads.ts) |
| Review create handler | [apps/api/src/handlers/reviews-create.ts](../apps/api/src/handlers/reviews-create.ts) |
| Review get handler | [apps/api/src/handlers/reviews-get.ts](../apps/api/src/handlers/reviews-get.ts) |
| Auth enforcement | [apps/api/src/lib/auth.ts](../apps/api/src/lib/auth.ts) |
| Bedrock wrapper | [apps/api/src/lib/bedrock.ts](../apps/api/src/lib/bedrock.ts) |
| Agent registry | [apps/api/src/lib/agents.ts](../apps/api/src/lib/agents.ts) |
| Safety screen | [apps/api/src/lib/safety.ts](../apps/api/src/lib/safety.ts) |
| DynamoDB helpers | [apps/api/src/lib/review-store.ts](../apps/api/src/lib/review-store.ts) |
| Review worker Lambda | [apps/api/src/handlers/review-worker.ts](../apps/api/src/handlers/review-worker.ts) |
| Synthesis Lambda | [apps/api/src/handlers/review-synthesizer.ts](../apps/api/src/handlers/review-synthesizer.ts) |
| Core Terraform | [infra/terraform/main.tf](../infra/terraform/main.tf) |
| Bootstrap Terraform | [infra/terraform/bootstrap/main.tf](../infra/terraform/bootstrap/main.tf) |
| Main pipeline | [azure-pipelines.yml](../azure-pipelines.yml) |
| Architecture overview | [docs/architecture.md](architecture.md) |
| Hardening roadmap | [docs/hardening-roadmap.md](hardening-roadmap.md) |
| Prompt authoring guide | [docs/prompt-authoring.md](prompt-authoring.md) |
| Pipelines and identities | [docs/pipelines-and-identities.md](pipelines-and-identities.md) |

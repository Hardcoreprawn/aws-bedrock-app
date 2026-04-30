# Getting Started

This guide is for a developer opening the repository for the first time.

## Recommended host setup

For Windows developers, the preferred setup is:

1. WSL 2 enabled.
2. Docker Desktop installed with `Use the WSL 2 based engine` enabled.
3. VS Code with the Dev Containers extension.
4. The repository cloned into the WSL filesystem when practical.

## Fastest path

1. Run `npm run check:prereqs`.
2. Open the repo in VS Code.
3. Reopen in the dev container.
4. Run `npm run bootstrap:local`.
5. Start the preview stack with `npm run dev:local`.
6. Open `http://localhost:5173`.

## Package access rollout

Recommended rollout:

1. Start with normal internet-backed package access so the team can validate the repo quickly.
2. Build an internal proxy or mirror for npm and container images, for example Pulp.
3. Switch the devcontainer and CI environment to the internal package endpoints once they are available.

This keeps day-1 setup simple without losing the longer-term goal of controlled dependency access.

## If you do not want the dev container

1. Install Node.js 20.
2. Install Docker Desktop.
3. Run `npm install`.
4. Run `npm run bootstrap:local`.
5. Run `npm run dev:local`.

## First folders to know

- `apps/web`: React user interface.
- `apps/api`: AWS Lambda-based backend and orchestration logic.
- `apps/mock-api`: local mock backend for demos and UI development.
- `prompts`: editable specialist prompt files.
- `infra/terraform`: AWS infrastructure.
- `scripts/entra`: Entra application automation.

# Local Development

This repo supports two practical local development modes.

## Mode 1: Docker Compose preview

Use this when you want the fastest path to a running UI without provisioning AWS resources.

Command flow:

1. `npm run bootstrap:local`
2. `npm run dev:local`
3. Open `http://localhost:5173`

What this mode does:

- Runs the React app in watch mode.
- Runs a mock API with in-memory upload and review state.
- Simulates asynchronous multi-agent review output.
- Avoids AWS credentials entirely.

## Mode 2: Dev container workflow

Use this when you want a consistent team toolchain inside VS Code.

Command flow:

1. Reopen in the dev container.
2. `npm run check:prereqs`
3. `npm run bootstrap:local`
4. `npm run dev:local`

## Environment variables

The root `.env` file is used for local preview defaults.

Key variables:

- `WEB_PORT`: local React port.
- `MOCK_API_PORT`: local mock API port.
- `VITE_API_BASE_URL`: browser-facing API base URL.
- `VITE_ENTRA_CLIENT_ID`: Entra application client ID for the SPA and API audience.
- `VITE_ENTRA_TENANT_ID`: Entra tenant ID.
- `VITE_ENTRA_AUTHORITY`: Entra authority URL, usually `https://login.microsoftonline.com/<tenant-id>`.
- `VITE_ENTRA_API_SCOPE`: delegated scope value, typically `api://<client-id>/access_as_user`.
- `MOCK_REVIEW_DELAY_MS`: simulated async review latency.
- `CHOKIDAR_USEPOLLING`: set to `true` if file watching is unreliable on mounted volumes.
- `USE_MOCK_BEDROCK`: local flag for mock model behavior.

## Auth behavior in local mode

- If the `VITE_ENTRA_*` values are empty, the UI runs in local preview mode and does not prompt for sign-in.
- If those values are set, the UI will require Entra sign-in before it calls the API.
- The mock API does not validate Entra tokens; deployed AWS environments do.

## When to use the real API

The scaffold includes the AWS-oriented backend in `apps/api`, but the repository does not yet provide a full local AWS emulator path. Use the mock API for local UI work, and use deployed preview infrastructure for integrated cloud testing.

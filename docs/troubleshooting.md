# Troubleshooting

## `npm` is not recognized

Cause:

- Node.js is not installed on the host.
- The terminal session does not have Node.js on `PATH`.

Actions:

1. Use the dev container.
2. Or install Node.js 20 and reopen the terminal.
3. Run `npm run check:prereqs`.

## Docker Compose starts but file watching is slow

Cause:

- The repository is on a Windows-mounted path rather than the WSL filesystem.

Actions:

1. Move the repository into WSL storage when practical.
2. Set `CHOKIDAR_USEPOLLING=true` in `.env` if needed.

## The mock app loads but uploads fail

Actions:

1. Confirm the mock API container is healthy on port `3000`.
2. Confirm `VITE_API_BASE_URL` matches the mock API endpoint.
3. Check whether `.env` overrides the expected ports.

## Preview or production deployment fails in Azure DevOps

Actions:

1. Verify the Azure service connection exists.
2. Verify Graph permissions for application and service principal operations.
3. Verify AWS credentials or federation trust are configured for the pipeline agent.
4. Confirm the managed environment and approvals are configured in Azure DevOps.
5. Confirm the production group-object-id variables are valid Terraform list literals if role assignments are enabled.

## Entra sign-in works in the browser but API calls return unauthorized

Actions:

1. Confirm the deployed web app was built with `VITE_ENTRA_CLIENT_ID`, `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_AUTHORITY`, and `VITE_ENTRA_API_SCOPE`.
2. Confirm the AWS deployment passed `auth_enabled=true`, `entra_tenant_id`, and `entra_api_audience` into Terraform.
3. Confirm the signed-in user is assigned a role such as `review.submit`, `review.read`, or `review.admin`.
4. Confirm the access token audience matches the Entra application client ID.

## Prompt changes behave unexpectedly

Actions:

1. Check the prompt diff, especially scope wording.
2. Re-run local preview to confirm the browser flow still works.
3. Validate the change in a preview deployment before promoting to production.

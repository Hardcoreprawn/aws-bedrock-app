# Entra Identity Terraform

This Terraform stack manages the Entra application and enterprise application objects used by the delivery pipeline.

Intended usage:

1. Preview deployments create `test_<app-name>_<pr-id>` identities in the dev tenant.
2. Production deployments create or maintain a non-`test_` long-lived identity in the production tenant.

Key variables:

- `tenant_id`
- `display_name`
- `redirect_uris`
- `spa_redirect_uris`
- `app_role_assignment_required`
- `access_tier`
- `reader_group_object_ids`
- `submitter_group_object_ids`
- `admin_group_object_ids`

Included identity features:

- Delegated API scope: `access_as_user`
- App roles: `review.read`, `review.submit`, `review.admin`
- Optional group-to-role assignment for enterprise app governance

Operational note:

Preview identities are still cleaned by the scheduled cleanup pipeline. For a stricter model, move preview Terraform state to a remote backend and add explicit destroy automation on PR close.

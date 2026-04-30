data "azuread_client_config" "current" {}

resource "random_uuid" "access_scope_id" {}
resource "random_uuid" "read_role_id" {}
resource "random_uuid" "submit_role_id" {}
resource "random_uuid" "admin_role_id" {}

locals {
  role_assignments = flatten([
    for assignment in [
      {
        role_id = random_uuid.read_role_id.result
        groups  = var.reader_group_object_ids
      },
      {
        role_id = random_uuid.submit_role_id.result
        groups  = var.submitter_group_object_ids
      },
      {
        role_id = random_uuid.admin_role_id.result
        groups  = var.admin_group_object_ids
      }
    ] : [
      for group_id in assignment.groups : {
        key      = "${assignment.role_id}:${group_id}"
        role_id  = assignment.role_id
        group_id = group_id
      }
    ]
  ])
}

resource "azuread_application" "app" {
  display_name     = var.display_name
  sign_in_audience = var.sign_in_audience
  owners           = [data.azuread_client_config.current.object_id]
  group_membership_claims = ["SecurityGroup"]

  api {
    requested_access_token_version = 2

    oauth2_permission_scope {
      admin_consent_description  = "Allow the application to call the document review API on behalf of the signed-in user."
      admin_consent_display_name = "Access document review API"
      enabled                    = true
      id                         = random_uuid.access_scope_id.result
      type                       = "User"
      user_consent_description   = "Allow the application to call the document review API on your behalf."
      user_consent_display_name  = "Access document review API"
      value                      = "access_as_user"
    }
  }

  app_role {
    allowed_member_types = ["User", "Application"]
    description          = "Read existing review results."
    display_name         = "Review Reader"
    enabled              = true
    id                   = random_uuid.read_role_id.result
    value                = "review.read"
  }

  app_role {
    allowed_member_types = ["User", "Application"]
    description          = "Submit documents and run reviews."
    display_name         = "Review Submitter"
    enabled              = true
    id                   = random_uuid.submit_role_id.result
    value                = "review.submit"
  }

  app_role {
    allowed_member_types = ["User", "Application"]
    description          = "Manage and access all reviews."
    display_name         = "Review Administrator"
    enabled              = true
    id                   = random_uuid.admin_role_id.result
    value                = "review.admin"
  }

  dynamic "web" {
    for_each = length(var.redirect_uris) > 0 ? [1] : []
    content {
      redirect_uris = var.redirect_uris
    }
  }

  dynamic "single_page_application" {
    for_each = length(var.spa_redirect_uris) > 0 ? [1] : []
    content {
      redirect_uris = var.spa_redirect_uris
    }
  }

  notes = "Managed by Terraform for aws-bedrock-app. access-tier=${var.access_tier}"
}

resource "azuread_service_principal" "app" {
  client_id                    = azuread_application.app.client_id
  app_role_assignment_required = var.app_role_assignment_required
  owners                       = [data.azuread_client_config.current.object_id]

  feature_tags {
    enterprise = true
    gallery    = false
    hide       = false
  }

  tags = [
    "aws-bedrock-scaffold",
    "access:${var.access_tier}"
  ]
}

resource "azuread_app_role_assignment" "group_assignments" {
  for_each = {
    for assignment in local.role_assignments : assignment.key => assignment
  }

  app_role_id         = each.value.role_id
  principal_object_id = each.value.group_id
  resource_object_id  = azuread_service_principal.app.object_id
}

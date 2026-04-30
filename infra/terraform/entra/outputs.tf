output "tenant_id" {
  value = var.tenant_id
}

output "display_name" {
  value = azuread_application.app.display_name
}

output "client_id" {
  value = azuread_application.app.client_id
}

output "authority" {
  value = "https://login.microsoftonline.com/${var.tenant_id}"
}

output "api_scope" {
  value = "api://${azuread_application.app.client_id}/access_as_user"
}

output "app_role_values" {
  value = ["review.read", "review.submit", "review.admin"]
}

output "application_object_id" {
  value = azuread_application.app.object_id
}

output "service_principal_object_id" {
  value = azuread_service_principal.app.object_id
}

variable "tenant_id" {
  description = "Entra tenant ID for the target environment."
  type        = string
}

variable "display_name" {
  description = "Display name for the Entra application and enterprise application."
  type        = string
}

variable "redirect_uris" {
  description = "Redirect URIs for the web application."
  type        = list(string)
  default     = []
}

variable "spa_redirect_uris" {
  description = "Redirect URIs for SPA clients using PKCE."
  type        = list(string)
  default     = []
}

variable "sign_in_audience" {
  description = "Microsoft identity platform audience."
  type        = string
  default     = "AzureADMyOrg"
}

variable "app_role_assignment_required" {
  description = "Whether users must be explicitly assigned to the enterprise app."
  type        = bool
  default     = false
}

variable "access_tier" {
  description = "Classification tag for the identity lifecycle."
  type        = string
  default     = "preview"
}

variable "reader_group_object_ids" {
  description = "Group object IDs that should receive the review.read role."
  type        = list(string)
  default     = []
}

variable "submitter_group_object_ids" {
  description = "Group object IDs that should receive the review.submit role."
  type        = list(string)
  default     = []
}

variable "admin_group_object_ids" {
  description = "Group object IDs that should receive the review.admin role."
  type        = list(string)
  default     = []
}

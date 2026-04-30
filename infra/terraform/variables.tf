variable "app_name" {
  description = "Base application name."
  type        = string
  default     = "bedrock-review"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "aws_region" {
  description = "AWS region for the deployment."
  type        = string
  default     = "eu-west-2"
}

variable "logs_retention_days" {
  description = "Retention period for CloudWatch log groups."
  type        = number
  default     = 30
}

variable "auth_enabled" {
  description = "Whether API authentication should be enforced."
  type        = bool
  default     = false
}

variable "entra_tenant_id" {
  description = "Entra tenant ID used for token validation."
  type        = string
  default     = ""
}

variable "entra_api_audience" {
  description = "Audience claim expected in Entra-issued API tokens."
  type        = string
  default     = ""
}

variable "api_artifact_path" {
  description = "Path to the packaged API artifact zip."
  type        = string
  default     = "../../build/api.zip"
}

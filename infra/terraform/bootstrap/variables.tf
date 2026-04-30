variable "app_name" {
  description = "Base application name. Used to prefix all bootstrap resources."
  type        = string
  default     = "bedrock-review"
}

variable "environment" {
  description = "Environment name for this bootstrap (e.g. 'shared' or 'production')."
  type        = string
  default     = "shared"
}

variable "aws_region" {
  description = "AWS region for the bootstrap resources."
  type        = string
  default     = "eu-west-2"
}

variable "azure_devops_org" {
  description = "Azure DevOps organisation name, as it appears in dev.azure.com/<org>."
  type        = string
}

variable "azure_devops_oidc_subjects" {
  description = <<EOT
List of OIDC subject claims that may assume the pipeline deploy role.
Format: sc://<org>/<project>/<service-connection-name>
Use wildcards where appropriate, e.g. ["sc://my-org/my-project/*"].
EOT
  type        = list(string)
}

variable "azure_devops_oidc_thumbprints" {
  description = <<EOT
TLS certificate thumbprints for the Azure DevOps OIDC issuer endpoint.
Retrieve with:
  openssl s_client -connect vstoken.dev.azure.com:443 < /dev/null 2>/dev/null \
    | openssl x509 -fingerprint -noout -sha1 \
    | sed 's/://g' | cut -d= -f2 | tr '[:upper:]' '[:lower:]'
EOT
  type        = list(string)
}

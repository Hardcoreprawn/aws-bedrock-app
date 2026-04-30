terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.2"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }

  # Backend is configured at init time via -backend-config flags.
  # Run once per environment:
  #   terraform init \
  #     -backend-config="bucket=<app>-shared-tfstate" \
  #     -backend-config="key=<app>/entra/<env>/terraform.tfstate" \
  #     -backend-config="dynamodb_table=<app>-shared-tflock" \
  #     -backend-config="region=eu-west-2"
  backend "s3" {}
}

provider "azuread" {
  tenant_id = var.tenant_id
}

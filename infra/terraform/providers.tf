terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.97"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
  }

  # Backend is configured at init time via -backend-config flags.
  # Run once per environment:
  #   terraform init \
  #     -backend-config="bucket=<app>-shared-tfstate" \
  #     -backend-config="key=<app>/<env>/terraform.tfstate" \
  #     -backend-config="dynamodb_table=<app>-shared-tflock" \
  #     -backend-config="region=eu-west-2"
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

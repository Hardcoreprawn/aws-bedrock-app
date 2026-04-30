output "tfstate_bucket" {
  description = "S3 bucket name to use as the Terraform backend for this application."
  value       = aws_s3_bucket.tfstate.bucket
}

output "tflock_table" {
  description = "DynamoDB table name used for Terraform state locking."
  value       = aws_dynamodb_table.tflock.name
}

output "pipeline_deploy_role_arn" {
  description = "IAM role ARN the Azure DevOps pipeline should assume via OIDC."
  value       = aws_iam_role.pipeline_deploy.arn
}

output "oidc_provider_arn" {
  description = "ARN of the AWS IAM OIDC provider for Azure DevOps."
  value       = aws_iam_openid_connect_provider.azure_devops.arn
}

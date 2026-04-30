locals {
  name_prefix = "${var.app_name}-${var.environment}"
}

# ---------------------------------------------------------------------------
# Terraform remote state storage
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "tfstate" {
  bucket        = "${local.name_prefix}-tfstate"
  force_destroy = false

  tags = {
    Application = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "tflock" {
  name         = "${local.name_prefix}-tflock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Application = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ---------------------------------------------------------------------------
# OIDC federation — Azure DevOps → AWS
# ---------------------------------------------------------------------------

resource "aws_iam_openid_connect_provider" "azure_devops" {
  url             = "https://vstoken.dev.azure.com/${var.azure_devops_org}"
  client_id_list  = ["api://AzureADTokenExchange"]
  thumbprint_list = var.azure_devops_oidc_thumbprints

  tags = {
    Application = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ---------------------------------------------------------------------------
# IAM deploy role — assumed by pipeline via OIDC
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "pipeline_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.azure_devops.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "vstoken.dev.azure.com/${var.azure_devops_org}:aud"
      values   = ["api://AzureADTokenExchange"]
    }

    # Scope trust to the specific Azure DevOps service connection(s).
    # Subject format: sc://<org>/<project>/<service-connection-name>
    condition {
      test     = "StringLike"
      variable = "vstoken.dev.azure.com/${var.azure_devops_org}:sub"
      values   = var.azure_devops_oidc_subjects
    }
  }
}

resource "aws_iam_role" "pipeline_deploy" {
  name               = "${local.name_prefix}-pipeline-deploy"
  assume_role_policy = data.aws_iam_policy_document.pipeline_assume.json

  tags = {
    Application = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

data "aws_iam_policy_document" "pipeline_deploy_permissions" {
  # S3 — frontend deploy + Terraform state
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = ["arn:aws:s3:::${local.name_prefix}-*", "arn:aws:s3:::${local.name_prefix}-*/*"]
  }

  # DynamoDB — Terraform state lock
  statement {
    effect    = "Allow"
    actions   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem"]
    resources = [aws_dynamodb_table.tflock.arn]
  }

  # CloudFront invalidation
  statement {
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = ["*"]
  }

  # Full infra management — Lambda, IAM, API GW, DynamoDB, SFN, KMS, CloudWatch, WAF
  statement {
    effect = "Allow"
    actions = [
      "lambda:*",
      "apigateway:*",
      "dynamodb:*",
      "states:*",
      "kms:*",
      "logs:*",
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:DeleteRolePolicy",
      "iam:DetachRolePolicy",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:UpdateRole",
      "wafv2:*",
      "bedrock:*",
      "cloudwatch:*"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "pipeline_deploy" {
  name   = "deploy-permissions"
  role   = aws_iam_role.pipeline_deploy.id
  policy = data.aws_iam_policy_document.pipeline_deploy_permissions.json
}

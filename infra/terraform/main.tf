locals {
  name_prefix = "${var.app_name}-${var.environment}"
  common_tags = {
    Application = var.app_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  common_lambda_environment = {
    DOCUMENT_BUCKET_NAME     = aws_s3_bucket.documents.bucket
    REVIEW_TABLE_NAME        = aws_dynamodb_table.reviews.name
    AWS_REGION               = var.aws_region
    PROMPTS_DIR              = "/var/task/prompts"
    USE_MOCK_BEDROCK         = "false"
    REVIEW_STATE_MACHINE_ARN = aws_sfn_state_machine.review.arn
    AUTH_ENABLED             = tostring(var.auth_enabled)
    ENTRA_TENANT_ID          = var.entra_tenant_id
    ENTRA_API_AUDIENCE       = var.entra_api_audience
  }
}

resource "aws_kms_key" "application" {
  description             = "KMS key for regulated application data for ${local.name_prefix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "application" {
  name          = "alias/${local.name_prefix}-application"
  target_key_id = aws_kms_key.application.key_id
}

resource "aws_s3_bucket" "logs" {
  bucket        = "${local.name_prefix}-logs"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "frontend" {
  bucket        = "${local.name_prefix}-frontend"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "documents" {
  bucket        = "${local.name_prefix}-documents"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.application.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_logging" "frontend" {
  bucket        = aws_s3_bucket.frontend.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "frontend/"
}

resource "aws_s3_bucket_logging" "documents" {
  bucket        = aws_s3_bucket.documents.id
  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "documents/"
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}-frontend-oac"
  description                       = "Origin access control for ${local.name_prefix} frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_response_headers_policy" "frontend_security" {
  name = "${local.name_prefix}-frontend-security"

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "same-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }

  custom_headers_config {
    items {
      header   = "Content-Security-Policy"
      override = true
      value    = "default-src 'self'; connect-src 'self' https://login.microsoftonline.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    }
  }
}

resource "aws_wafv2_web_acl" "cloudfront" {
  provider = aws.us_east_1
  name     = "${local.name_prefix}-cloudfront"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CloudfrontCommonRules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimit"
    priority = 20

    action {
      block {}
    }

    statement {
      rate_based_statement {
        aggregate_key_type = "IP"
        limit              = 1000
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CloudfrontRateLimit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${replace(local.name_prefix, "-", "") }CloudfrontAcl"
    sampled_requests_enabled   = true
  }
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  comment             = "${local.name_prefix} frontend"
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "frontend-s3"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.frontend_security.id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontRead"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "s3:GetObject"
        ]
        Resource = [
          "${aws_s3_bucket.frontend.arn}/*"
        ]
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })
}

resource "aws_dynamodb_table" "reviews" {
  name         = "${local.name_prefix}-reviews"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "reviewId"

  attribute {
    name = "reviewId"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.application.arn
  }

  tags = local.common_tags
}

resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "app_access" {
  name = "${local.name_prefix}-app-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.documents.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = [aws_dynamodb_table.reviews.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = [aws_sfn_state_machine.review.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = [aws_kms_key.application.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "*"
      }
    ]
  })
}

data "archive_file" "api_bundle" {
  type        = "zip"
  source_dir  = "../../apps/api/dist"
  output_path = "../../build/api.zip"
}

resource "aws_cloudwatch_log_group" "uploads" {
  name              = "/aws/lambda/${local.name_prefix}-uploads"
  retention_in_days = var.logs_retention_days
}

resource "aws_cloudwatch_log_group" "reviews_create" {
  name              = "/aws/lambda/${local.name_prefix}-reviews-create"
  retention_in_days = var.logs_retention_days
}

resource "aws_cloudwatch_log_group" "reviews_get" {
  name              = "/aws/lambda/${local.name_prefix}-reviews-get"
  retention_in_days = var.logs_retention_days
}

resource "aws_cloudwatch_log_group" "review_worker" {
  name              = "/aws/lambda/${local.name_prefix}-review-worker"
  retention_in_days = var.logs_retention_days
}

resource "aws_cloudwatch_log_group" "review_synthesizer" {
  name              = "/aws/lambda/${local.name_prefix}-review-synthesizer"
  retention_in_days = var.logs_retention_days
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}-http"
  retention_in_days = var.logs_retention_days
}

resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${local.name_prefix}"
  retention_in_days = var.logs_retention_days
}

resource "aws_lambda_function" "uploads" {
  function_name = "${local.name_prefix}-uploads"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "uploads.handler"
  filename      = data.archive_file.api_bundle.output_path
  source_code_hash = data.archive_file.api_bundle.output_base64sha256

  environment {
    variables = local.common_lambda_environment
  }
}

resource "aws_lambda_function" "reviews_create" {
  function_name = "${local.name_prefix}-reviews-create"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "reviews-create.handler"
  filename      = data.archive_file.api_bundle.output_path
  source_code_hash = data.archive_file.api_bundle.output_base64sha256

  environment {
    variables = local.common_lambda_environment
  }
}

resource "aws_lambda_function" "reviews_get" {
  function_name = "${local.name_prefix}-reviews-get"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "reviews-get.handler"
  filename      = data.archive_file.api_bundle.output_path
  source_code_hash = data.archive_file.api_bundle.output_base64sha256

  environment {
    variables = local.common_lambda_environment
  }
}

resource "aws_lambda_function" "review_worker" {
  function_name = "${local.name_prefix}-review-worker"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "review-worker.handler"
  filename      = data.archive_file.api_bundle.output_path
  source_code_hash = data.archive_file.api_bundle.output_base64sha256
  timeout       = 120

  environment {
    variables = local.common_lambda_environment
  }
}

resource "aws_lambda_function" "review_synthesizer" {
  function_name = "${local.name_prefix}-review-synthesizer"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs20.x"
  handler       = "review-synthesizer.handler"
  filename      = data.archive_file.api_bundle.output_path
  source_code_hash = data.archive_file.api_bundle.output_base64sha256
  timeout       = 120

  environment {
    variables = local.common_lambda_environment
  }
}

resource "aws_iam_role" "step_functions_role" {
  name = "${local.name_prefix}-sfn-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "step_functions_policy" {
  name = "${local.name_prefix}-sfn-policy"
  role = aws_iam_role.step_functions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.review_worker.arn,
          aws_lambda_function.review_synthesizer.arn
        ]
      }
    ]
  })
}

resource "aws_sfn_state_machine" "review" {
  name     = "${local.name_prefix}-review"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = jsonencode({
    StartAt = "ParallelReview"
    States = {
      ParallelReview = {
        Type = "Parallel"
        ResultPath = "$.findings"
        Branches = [
          {
            StartAt = "Grammar"
            States = {
              Grammar = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                OutputPath = "$.Payload"
                Parameters = {
                  FunctionName = aws_lambda_function.review_worker.arn
                  Payload = {
                    "reviewId.$"    = "$.reviewId"
                    "documentKeys.$" = "$.documentKeys"
                    agent            = "grammar"
                  }
                }
                End = true
              }
            }
          },
          {
            StartAt = "Citation"
            States = {
              Citation = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                OutputPath = "$.Payload"
                Parameters = {
                  FunctionName = aws_lambda_function.review_worker.arn
                  Payload = {
                    "reviewId.$"    = "$.reviewId"
                    "documentKeys.$" = "$.documentKeys"
                    agent            = "citation"
                  }
                }
                End = true
              }
            }
          },
          {
            StartAt = "Referencing"
            States = {
              Referencing = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                OutputPath = "$.Payload"
                Parameters = {
                  FunctionName = aws_lambda_function.review_worker.arn
                  Payload = {
                    "reviewId.$"    = "$.reviewId"
                    "documentKeys.$" = "$.documentKeys"
                    agent            = "referencing"
                  }
                }
                End = true
              }
            }
          },
          {
            StartAt = "Policy"
            States = {
              Policy = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                OutputPath = "$.Payload"
                Parameters = {
                  FunctionName = aws_lambda_function.review_worker.arn
                  Payload = {
                    "reviewId.$"    = "$.reviewId"
                    "documentKeys.$" = "$.documentKeys"
                    agent            = "policy"
                  }
                }
                End = true
              }
            }
          }
        ]
        Next = "Synthesize"
      }
      Synthesize = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        OutputPath = "$.Payload"
        Parameters = {
          FunctionName = aws_lambda_function.review_synthesizer.arn
          Payload = {
            "reviewId.$" = "$.reviewId"
            "findings.$" = "$.findings"
          }
        }
        End = true
      }
    }
  })

  tags = local.common_tags
}

resource "aws_apigatewayv2_api" "http" {
  name          = "${local.name_prefix}-http"
  protocol_type = "HTTP"
  cors_configuration {
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = ["*"]
    allow_headers = ["authorization", "content-type"]
  }
}

resource "aws_wafv2_web_acl" "api" {
  name  = "${local.name_prefix}-api"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 10

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "ApiCommonRules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimit"
    priority = 20

    action {
      block {}
    }

    statement {
      rate_based_statement {
        aggregate_key_type = "IP"
        limit              = 1000
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "ApiRateLimit"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${replace(local.name_prefix, "-", "") }ApiAcl"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_logging_configuration" "api" {
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
  resource_arn            = aws_wafv2_web_acl.api.arn
}

resource "aws_apigatewayv2_integration" "uploads" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.uploads.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "reviews_create" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.reviews_create.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "reviews_get" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.reviews_get.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "uploads" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /uploads"
  target    = "integrations/${aws_apigatewayv2_integration.uploads.id}"
}

resource "aws_apigatewayv2_route" "reviews_create" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /reviews"
  target    = "integrations/${aws_apigatewayv2_integration.reviews_create.id}"
}

resource "aws_apigatewayv2_route" "reviews_get" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /reviews/{reviewId}"
  target    = "integrations/${aws_apigatewayv2_integration.reviews_get.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
}

resource "aws_wafv2_web_acl_association" "api" {
  resource_arn = aws_apigatewayv2_stage.default.arn
  web_acl_arn  = aws_wafv2_web_acl.api.arn
}

resource "aws_lambda_permission" "uploads" {
  statement_id  = "AllowInvokeUploads"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.uploads.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "reviews_create" {
  statement_id  = "AllowInvokeReviewsCreate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reviews_create.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "reviews_get" {
  statement_id  = "AllowInvokeReviewsGet"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.reviews_get.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

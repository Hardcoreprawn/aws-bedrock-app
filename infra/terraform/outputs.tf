output "api_base_url" {
  value = aws_apigatewayv2_api.http.api_endpoint
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_domain_name" {
  value = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.frontend.id
}

output "documents_bucket_name" {
  value = aws_s3_bucket.documents.bucket
}

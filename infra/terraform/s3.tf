# Backs S3ImageStorageService (studio-service) - see that class's javadoc for why it's not wired
# in yet. Bucket name here is what AWS_S3_BUCKET should be set to once the cutover happens.
resource "aws_s3_bucket" "studio_images" {
  bucket = "${var.project_name}-${var.environment}-studio-images"
}

resource "aws_s3_bucket_public_access_block" "studio_images" {
  bucket = aws_s3_bucket.studio_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Images need to be publicly readable (served directly as <img src>) but never publicly writable.
resource "aws_s3_bucket_policy" "studio_images_public_read" {
  bucket     = aws_s3_bucket.studio_images.id
  depends_on = [aws_s3_bucket_public_access_block.studio_images]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadOnly"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.studio_images.arn}/*"
    }]
  })
}

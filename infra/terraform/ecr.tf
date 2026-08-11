# One ECR repo per service that still exists post-api-gateway.
resource "aws_ecr_repository" "service" {
  for_each = var.services

  name                 = "${var.project_name}/${each.key}"
  image_tag_mutability = "IMMUTABLE" # forces CI to push a new tag per build, never overwrite :latest

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-${var.environment}-${each.key}-ecr" }
}

resource "aws_ecr_lifecycle_policy" "service" {
  for_each   = var.services
  repository = aws_ecr_repository.service[each.key].name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

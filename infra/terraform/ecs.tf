variable "image_tag" {
  description = "Image tag to deploy - CI/CD overrides this per deploy (e.g. the git SHA)."
  type        = string
  default     = "latest"
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Service Connect namespace - replaces what docker-compose's built-in DNS gave every service for
# free (calling "http://booking-service:8083/..." and having it just resolve). Name each ECS
# service's Service Connect entry to match the existing application-docker.properties hostnames
# below and none of that inter-service config needs to change.
resource "aws_service_discovery_http_namespace" "main" {
  name = "${var.project_name}-${var.environment}.local"
}

resource "aws_cloudwatch_log_group" "service" {
  for_each          = var.services
  name              = "/ecs/${var.project_name}-${var.environment}/${each.key}"
  retention_in_days = 30
}

locals {
  # Matches the DB naming already used locally (bcube_user_service, bcube_booking_service, ...).
  db_name_for = { for k in keys(var.services) : k => "bcube_${replace(k, "-", "_")}" }

  common_secrets = [
    { name = "JWT_SECRET", secret = "jwt-secret" },
    { name = "INTERNAL_SERVICE_KEY", secret = "internal-service-key" },
  ]

  # Service-specific extra secrets beyond the common set above.
  extra_secrets = {
    user-service = [
      { name = "GOOGLE_CLIENT_SECRET", secret = "google-client-secret" },
      { name = "SPRING_MAIL_USERNAME", secret = "spring-mail-username" },
      { name = "SPRING_MAIL_PASSWORD", secret = "spring-mail-password" },
    ]
    access-service = [
      { name = "ACCESS_AES_KEY", secret = "access-aes-key" },
      { name = "NUKI_API_TOKEN", secret = "nuki-api-token" },
    ]
    studio-service  = []
    booking-service = []
    payment-service = []
  }
}

resource "aws_ecs_task_definition" "service" {
  for_each                 = var.services
  family                   = "${var.project_name}-${var.environment}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = each.key
    image     = "${aws_ecr_repository.service[each.key].repository_url}:${var.image_tag}"
    essential = true

    portMappings = [{
      name          = each.key
      containerPort = each.value.port
      protocol      = "tcp"
    }]

    environment = [
      { name = "SPRING_PROFILES_ACTIVE", value = "docker" },
      { name = "FRONTEND_URL", value = "https://${var.domain_name}" },
      { name = "SPRING_DATASOURCE_URL", value = "jdbc:postgresql://${aws_db_instance.main.address}:5432/${local.db_name_for[each.key]}" },
      { name = "SPRING_DATASOURCE_USERNAME", value = var.db_master_username },
    ]

    secrets = concat(
      [for s in local.common_secrets : { name = s.name, valueFrom = aws_secretsmanager_secret.app[s.secret].arn }],
      [for s in local.extra_secrets[each.key] : { name = s.name, valueFrom = aws_secretsmanager_secret.app[s.secret].arn }],
      [{ name = "SPRING_DATASOURCE_PASSWORD", valueFrom = aws_secretsmanager_secret.db_password.arn }]
    )

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.service[each.key].name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = each.key
      }
    }
  }])
}

resource "aws_ecs_service" "service" {
  for_each        = var.services
  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.service[each.key].arn
  desired_count   = 1 # PLACEHOLDER - bump once there's real traffic; add an autoscaling target too
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_services.id]
    assign_public_ip = false
  }

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.main.arn

    service {
      port_name      = each.key
      discovery_name = each.key
      client_alias {
        port     = each.value.port
        dns_name = each.key # so "http://booking-service:8083/..." keeps working unchanged
      }
    }
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.service[each.key].arn
    container_name   = each.key
    container_port   = each.value.port
  }

  depends_on = [aws_lb_listener.https]
}

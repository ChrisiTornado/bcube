# All placeholders - update the actual secret VALUE via `aws secretsmanager put-secret-value`
# or the console after apply, never by putting real values in .tf/.tfvars (they'd land in state
# and in this repo's history, exactly the mistake this whole migration is meant to fix).

locals {
  secret_names = [
    "jwt-secret",
    "internal-service-key",
    "access-aes-key",
    "google-client-secret",
    "spring-mail-username",
    "spring-mail-password",
    "nuki-api-token",
  ]
}

resource "aws_secretsmanager_secret" "app" {
  for_each = toset(local.secret_names)
  name     = "${var.project_name}/${var.environment}/${each.key}"
}

resource "aws_secretsmanager_secret_version" "app" {
  for_each      = aws_secretsmanager_secret.app
  secret_id     = each.value.id
  secret_string = "CHANGE_ME"

  lifecycle {
    ignore_changes = [secret_string] # don't let terraform stomp a real value set later via CLI/console
  }
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}/${var.environment}/db-master-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_master_password
}

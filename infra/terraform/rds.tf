# Single RDS instance shared by all 5 services (one Postgres database each), matching the
# "one instance, several DBs" choice from the AWS deployment discussion - cheaper than 5
# instances, still keeps each service's data in its own database/schema.
#
# aws_db_instance only creates ONE initial database (db_name below, = the first service's DB).
# The other 4 databases must be created once, manually, after the instance is up - RDS in a
# private subnet isn't reachable from a local machine without a bastion/VPN/SSM port-forward, so
# this is intentionally NOT automated here. After apply:
#   psql "$(terraform output -raw rds_connection_string)" -c "CREATE DATABASE bcube_booking_service;"
#   ...repeat for bcube_studio_service, bcube_access_service, bcube_payment_service

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnets"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${var.project_name}-${var.environment}-db-subnets" }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "17"
  instance_class = var.db_instance_class

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "bcube_user_service"
  username = var.db_master_username
  password = var.db_master_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az                  = false # PLACEHOLDER - turn on once there's real traffic to protect
  backup_retention_period   = 7
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-${var.environment}-final"

  tags = { Name = "${var.project_name}-${var.environment}-rds" }
}

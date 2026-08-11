output "alb_dns_name" {
  description = "Point domain_name's DNS (A/ALIAS record) at this."
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "rds_connection_string" {
  description = "For the one-time manual step of creating the other 4 databases - see rds.tf."
  value       = "postgresql://${var.db_master_username}@${aws_db_instance.main.address}:5432/bcube_user_service"
  sensitive   = false
}

output "ecr_repository_urls" {
  value = { for k, r in aws_ecr_repository.service : k => r.repository_url }
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "studio_images_bucket" {
  value = aws_s3_bucket.studio_images.bucket
}

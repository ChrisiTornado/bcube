# bcube AWS infrastructure (ECS + ALB + RDS)

Terraform for the target architecture from the AWS deployment discussion: ECS Fargate cluster,
one ALB doing the path-based routing api-gateway used to do (api-gateway itself is retired),
one shared RDS Postgres instance with 5 databases, Secrets Manager for everything currently
sitting in `.env` files, and ECS Service Connect for inter-service calls.

**This has not been applied.** `terraform validate` passes; `terraform plan`/`apply` need real
AWS credentials and the placeholders below filled in first.

## Before the first `apply`

1. **Remote state backend** - uncomment the `backend "s3"` block in `providers.tf` and point it at
   a real bucket + DynamoDB lock table. Local state doesn't work once more than one person (or
   CI) touches this.
2. **`domain_name`** and **`acm_certificate_arn`** in `terraform.tfvars` (copy from
   `terraform.tfvars.example`) - the HTTPS listener in `alb.tf` won't create without a validated
   ACM cert for that domain.
3. **`db_master_password`** - pass via `TF_VAR_db_master_password`, not `terraform.tfvars`.
4. Decide whether `eu-central-1` in `variables.tf` is actually the right region.

## After the first `apply`

- **Point DNS** at the ALB (`terraform output alb_dns_name`).
- **Create the other 4 databases** - `aws_db_instance` only creates one initial database.
  RDS sits in a private subnet, so this needs a bastion/SSM port-forward/VPN, not a direct
  connection from your machine:
  ```
  psql "$(terraform output -raw rds_connection_string)" -c "CREATE DATABASE bcube_booking_service;"
  psql "$(terraform output -raw rds_connection_string)" -c "CREATE DATABASE bcube_studio_service;"
  psql "$(terraform output -raw rds_connection_string)" -c "CREATE DATABASE bcube_access_service;"
  psql "$(terraform output -raw rds_connection_string)" -c "CREATE DATABASE bcube_payment_service;"
  ```
- **Fill in the real secret values** - every `aws_secretsmanager_secret` here is created with the
  literal placeholder `"CHANGE_ME"` (Terraform state deliberately never holds the real values):
  ```
  aws secretsmanager put-secret-value --secret-id bcube/prod/jwt-secret --secret-string '...'
  ```
  Do this for all of: `jwt-secret`, `internal-service-key`, `access-aes-key`,
  `google-client-secret`, `spring-mail-username`, `spring-mail-password`, `nuki-api-token`.
- **Push images to ECR** before the ECS services can actually start - `terraform output
  ecr_repository_urls` gives you the 5 repo URLs. This is what task #12 (CI/CD) automates.

## What's deliberately NOT here yet

- CloudFront / static frontend hosting - open architecture question (see the "Frontend-Hosting
  neu klären" note from the deployment discussion): nginx-in-a-container proxying to the ALB vs.
  S3+CloudFront serving the Angular build directly and routing `/api/*` to the ALB origin.
- AWS WAF on the ALB (rate limiting) - straightforward to add once the ALB exists; skipped here to
  keep the first apply's blast radius smaller.
- Multi-AZ RDS, autoscaling on the ECS services - both are one-line changes (`multi_az = true` in
  `rds.tf`, an `aws_appautoscaling_target`/`policy` pair) worth doing once there's real traffic to
  justify the extra cost, not before.
- A second (staging) environment - this whole config is parameterized by `environment`, so the
  same files stand up a second stack via `terraform workspace` or a separate `.tfvars` + state
  key; per the earlier discussion, provision that only when needed rather than running it
  continuously.

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "eu-central-1" # PLACEHOLDER - confirm this is where you want to run
}

variable "environment" {
  description = "Deployment environment name, used as a suffix on most resource names."
  type        = string
  default     = "prod"
}

variable "project_name" {
  type    = string
  default = "bcube"
}

variable "domain_name" {
  description = "Public domain the frontend/API will be served under. PLACEHOLDER."
  type        = string
  default     = "example.com"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for the ALB HTTPS listener, covering domain_name. PLACEHOLDER - create/validate this in ACM first (or via aws_acm_certificate here once you're ready), then paste the ARN."
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to spread subnets across."
  type        = number
  default     = 2
}

variable "db_instance_class" {
  description = "Single RDS instance shared by all 5 services (one DB each) - see rds.tf. Bump this or switch to 5 separate instances if a service's load actually warrants isolation."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_master_username" {
  type    = string
  default = "bcube_admin"
}

variable "db_master_password" {
  description = "RDS master password. PLACEHOLDER - do not commit a real value; pass via -var or TF_VAR_db_master_password at apply time."
  type        = string
  sensitive   = true
  default     = "CHANGE_ME_AT_APPLY_TIME"
}

variable "services" {
  description = "The 5 services that get an ECS service + ALB target group. api-gateway is intentionally absent - the ALB replaces it."
  type = map(object({
    port        = number
    health_path = string
    api_path    = string # ALB listener rule path pattern
    cpu         = number
    memory      = number
  }))
  default = {
    user-service = {
      port        = 8081
      health_path = "/actuator/health"
      api_path    = "/api/users/*"
      cpu         = 256
      memory      = 512
    }
    studio-service = {
      port        = 8082
      health_path = "/actuator/health"
      api_path    = "/api/studios/*"
      cpu         = 256
      memory      = 512
    }
    booking-service = {
      port        = 8083
      health_path = "/actuator/health"
      api_path    = "/api/bookings/*"
      cpu         = 256
      memory      = 512
    }
    access-service = {
      port        = 8084
      health_path = "/actuator/health"
      api_path    = "/api/access/*"
      cpu         = 256
      memory      = 512
    }
    payment-service = {
      port        = 8085
      health_path = "/actuator/health"
      api_path    = "/api/payments/*"
      cpu         = 256
      memory      = 512
    }
  }
}

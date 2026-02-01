[🏠 Home](../README.md) | [🌍 Terraform Hub](./README.md) | [⬅️ Terraform Guide](./terraform-guide.md) | [➡️ AWS Services](../aws/aws-services-guide.md)

# 🏭 Real-World Project: AWS Production Architecture

> A complete production-grade setup for a highly available web application on AWS.
> **Key Features**: 3-Tier VPC, Auto Scaling, Load Balancing, Modular Layout, Remote State.

---

## 1️⃣ Project Structure (Best Practice Industry Standard)

We separate **Source Code (Modules)** from **Configuration (Environments)**.

```text
my-infrastructure/
├── modules/                   # Reusable Code (The "Blueprints")
│   ├── networking/            # VPC, Subnets, Gateways
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/               # EC2, Auto Scaling, Security Groups
│   │   └── ...
│   └── database/              # RDS, Subnet Groups
│       └── ...
│
└── live/                      # The Actual Infrastructure (The "Houses")
    ├── dev/
    │   ├── main.tf            # Calls modules with Dev settings
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── backend.tf         # Dev State Bucket
    └── prod/
        ├── main.tf            # Calls modules with Prod settings
        └── backend.tf         # Prod State Bucket
```

---

## 2️⃣ Architecture Diagram

**Goal**: Highly Available Web App (Resilient to AZ failure).

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                             AWS VPC (10.0.0.0/16)                        │
│                                                                          │
│   ┌───────────────────────────┐        ┌───────────────────────────┐     │
│   │     Availability Zone A   │        │     Availability Zone B   │     │
│   │                           │        │                           │     │
│   │  ┌─────────────────────┐  │        │  ┌─────────────────────┐  │     │
│   │  │   Public Subnet A   │  │        │  │   Public Subnet B   │  │     │
│   │  │   (NAT Gateway)     │◀─┼────────┼─▶│   (Load Balancer)   │  │     │
│   │  └──────────┬──────────┘  │        │  └──────────┬──────────┘  │     │
│   │             │             │        │             │             │     │
│   │             ▼             │        │             ▼             │     │
│   │  ┌─────────────────────┐  │        │  ┌─────────────────────┐  │     │
│   │  │   Private App A     │  │        │  │   Private App B     │  │     │
│   │  │     (EC2 / ASG)     │  │        │  │     (EC2 / ASG)     │  │     │
│   │  └──────────┬──────────┘  │        │  └──────────┬──────────┘  │     │
│   │             │             │        │             │             │     │
│   │             ▼             │        │             ▼             │     │
│   │  ┌─────────────────────┐  │        │  ┌─────────────────────┐  │     │
│   │  │   Private DB A      │  │        │  │   Private DB B      │  │     │
│   │  │   (RDS - Primary)   │◀─┼──Sync──┼─▶│   (RDS - Replica)   │  │     │
│   │  └─────────────────────┘  │        │  └─────────────────────┘  │     │
│   └───────────────────────────┘        └───────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3️⃣ Implementation Guide

### A. The Networking Module (`modules/networking/main.tf`)

Created generic VPC resource that can be reused for Dev/Prod.

```hcl
variable "env" {}
variable "vpc_cidr" {}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  tags = { Name = "${var.env}-vpc" }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
}
```

### B. The Compute Module (`modules/compute/main.tf`)

Setting up Auto Scaling Group behind a Load Balancer.

```hcl
resource "aws_launch_template" "app_server" {
  name_prefix   = "${var.env}-server"
  image_id      = var.ami_id
  instance_type = var.instance_type
  
  user_data = base64encode(<<-EOF
              #!/bin/bash
              echo "Hello from ${var.env}" > /var/www/html/index.html
              EOF
  )
}

resource "aws_autoscaling_group" "asg" {
  min_size            = 2
  max_size            = 5
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.app_tg.arn]

  launch_template {
    id      = aws_launch_template.app_server.id
    version = "$Latest"
  }
}
```

### C. The Environment Setup (`live/prod/main.tf`)

This is where we glue everything together for the Production environment.

```hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  
  # REMOTE STATE CONFIGURATION
  backend "s3" {
    bucket         = "company-tf-state-prod"
    key            = "web-app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}

# 1. Call Networking Module
module "vpc" {
  source   = "../../modules/networking"
  env      = "prod"
  vpc_cidr = "10.0.0.0/16"
}

# 2. Call Compute Module
module " web_servers" {
  source = "../../modules/compute"
  env    = "prod"
  
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnets
  instance_type      = "t3.large"  # 🚀 Larger instance for Prod
  min_size           = 2
  max_size           = 10
}

# 3. Call Database Module
module "db" {
  source = "../../modules/database"
  env    = "prod"
  
  db_name   = "production_db"
  password  = var.db_password # Never hardcode! Pass via TF_VAR_db_password
}
```

---

## 4️⃣ How to Deploy This

1.  **Configure Credentials**:
    ```bash
    export AWS_ACCESS_KEY_ID="anaccesskey"
    export AWS_SECRET_ACCESS_KEY="asecretkey"
    ```

2.  **Initialize Backend**:
    ```bash
    cd live/prod
    terraform init
    ```

3.  **Review Plan**:
    ```bash
    terraform plan
    ```
    *Look for the green `+` signs. Ensure no accidental `-` destroys.*

4.  **Apply**:
    ```bash
    terraform apply
    ```

---

## 5️⃣ Industry Secrets & Tips

-   **Workspace Separation**: Do NOT use Terraform Workspaces for environments (Dev/Prod). Use the directory structure method (`live/dev`, `live/prod`) shown above. It's safer and clearer.
-   **Locking**: If you get a "Error acquiring the state lock", check if a colleague is running a deployment, or if a previous run crashed. You can force-unlock if absolutely necessary (dangerous!).
-   **`.gitignore`**: ALWAYS ignore `.terraform`, `*.tfstate`, `*.tfstate.backup`, and `*.tfvars` (if they contain secrets).

[🏠 Home](../README.md) | [🌍 Terraform Hub](./README.md) | [➡️ Real World Project](./terraform-real-world-project.md)

# 🌍 Terraform Deep Dive

> A comprehensive guide to Infrastructure as Code (IaC) with Terraform, covering core concepts, state management, and modules.

---

## 📋 Quick Reference: Common Commands

| Command | Description |
| :--- | :--- |
| `terraform init` | Initialize directory, download providers |
| `terraform plan` | Preview changes without applying |
| `terraform apply` | Create/Update infrastructure |
| `terraform destroy` | Delete infrastructure |
| `terraform validate` | Check syntax is valid |
| `terraform fmt` | Auto-format code |
| `terraform state list` | List resources in state file |

---

## 1️⃣ Core Concepts

### Infrastructure as Code (IaC)
> Managing infrastructure (servers, networks, databases) using configuration files rather than graphical user interfaces.

### Architecture Overview

```text
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  TF Config   │         │   TF Core    │         │  Providers   │
│  (.tf files) │────────▶│ (Comparison) │────────▶│ (AWS, Azure) │
└──────────────┘         └──────▲───────┘         └──────┬───────┘
                                │                        │ API Calls
                         ┌──────┴───────┐                ▼
                         │  State File  │         ┌──────────────┐
                         │ (.tfstate)   │         │ Cloud Infra  │
                         └──────────────┘         └──────────────┘
```

### The Three Pillars

1.  **Providers**: Plugins that talk to APIs (AWS, Azure, Google, Kubernetes, Docker).
2.  **Resources**: Components to create (e.g., `aws_instance`, `google_storage_bucket`).
3.  **Data Sources**: Fetching information about *existing* resources.

#### Example: Creating an EC2 Instance

```hcl
# 1. Provider Configuration
provider "aws" {
  region = "us-east-1"
}

# 2. Resource Definition
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  tags = {
    Name = "HelloWorld"
  }
}
```

---

## 2️⃣ Terraform State

### What is State?
> The "Brain" of Terraform. It maps real-world resources to your configuration, checks metadata, and improves performance. stored in `terraform.tfstate`.

### Local vs. Remote State

| Feature | Local State (Default) | Remote State (S3, GCS, Terraform Cloud) |
| :--- | :--- | :--- |
| **Storage** | Local disk (`terraform.tfstate`) | Cloud Storage (S3 Bucket) |
| **Team Access** | Difficult (must share file) | Easy (Access same bucket) |
| **Security** | Low (Text file on laptop) | High (Encrypted at rest) |
| **Locking** | None | Supported (DynamoDB / GCS Locking) |

### ⚠️ IMPORTANT: Remote State Architecture

**Always use remote state for teams/production.**

```text
       Dev A Laptop                   Dev B Laptop
    ┌────────────────┐             ┌────────────────┐
    │ terraform apply│             │ terraform apply│
    └───────┬────────┘             └────────┬───────┘
            │                               │
            │   1. Check Lock (DynamoDB)    │
            │ <───────────────────────────> │
            │                               │
            ▼                               ▼
    ┌────────────────────────────────────────────────┐
    │               Remote Backend (S3)              │
    │  [ terraform.tfstate (Encrypted) ]             │
    └────────────────────────────────────────────────┘
```

**Configuration (`backend.tf`):**

```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state-prod"
    key            = "app/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks" # For Locking
    encrypt        = true
  }
}
```

---

## 3️⃣ Terraform Modules

### Why Modules?
> "Don't Repeat Yourself" (DRY). Modules are containers for multiple resources that are used together.
> Think of them like **Functions** or **Classes** in programming.

### Module Structure

```text
root-directory/
├── main.tf        (Calls the module)
└── modules/
    └── web-server/
        ├── main.tf      (Resources: EC2, SG)
        ├── variables.tf (Inputs: instance_type)
        └── outputs.tf   (Returns: public_ip)
```

### Using a Module

```hcl
module "my_web_server" {
  source = "./modules/web-server"

  # Passing Variables (Arguments)
  instance_type = "t3.medium"
  server_name   = "production-web"
}
```

---

## 4️⃣ Lifecycle & Workflow

The standard workflow for any change:

1.  **Write**: Update `.tf` files.
2.  **`terraform init`**: Initialize backend, modules, and plugins.
3.  **`terraform plan`**: **CRITICAL STEP**. Shows exactly what will change (+ create, - destroy, ~ update).
4.  **`terraform apply`**: Execute changes.
5.  **`terraform destroy`**: Tear down everything (careful!).

---

## 5️⃣ Best Practices Summary

1.  ✅ **Use Remote State**: Always store state in S3/GCS with locking (DynamoDB).
2.  ✅ **Pin Versions**: Pin provider versions to avoid breaking changes.
    ```hcl
    required_providers {
      aws = {
        source  = "hashicorp/aws"
        version = "~> 5.0"
      }
    }
    ```
3.  ✅ **Modularize**: Use a standard directory structure (`modules/` vs `envs/`).
4.  ✅ **Tag Everything**: Use `default_tags` in the provider block.
5.  ❌ **Don't hardcode secrets**: Use variables, environment variables (`TF_VAR_`), or Secret Managers.
6.  ✅ **Use `meta-arguments`**: `depends_on`, `count`, `for_each` for control flow.

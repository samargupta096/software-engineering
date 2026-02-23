# AWS Services — Interactive Visualizer

An interactive web application to learn core AWS services, their use cases, key terminology, and how to combine them in real-world architectures.

## 🚀 Quick Start

```bash
npx -y serve . -l 4567
# Open http://localhost:4567
```

Or just open `index.html` directly in your browser.

## 📚 Sections

| # | Section | Services Covered |
|---|---------|-----------------|
| 01 | VPC & Networking | VPC, Subnets, NAT, IGW, Security Groups, NACLs |
| 02 | IAM | Users, Groups, Roles, Policies, STS |
| 03 | S3 | Storage classes, versioning, lifecycle |
| 04 | SQS | Standard/FIFO queues, DLQ, visibility timeout |
| 05 | SNS | Topics, subscriptions, fan-out |
| 06 | SNS + SQS Fan-Out | Combined event-driven pattern |
| 07 | ECS & EKS | Fargate, EC2, Kubernetes comparison |
| 08 | Step Functions | State machines, error handling |
| 09 | CloudWatch & EventBridge | Metrics, alarms, event rules |
| 10 | Lambda & API Gateway | Serverless, cold starts, request flow |
| 11 | Combined Architectures | 3 real-world patterns |
| 12 | Cheat Sheet | Searchable reference cards |

## 🎨 Interactive Features

- **VPC Diagram** — Click subnets to toggle public/private
- **IAM Policy Simulator** — Select actions and evaluate access
- **S3 Versioning** — Upload objects and see version history
- **SQS Queue Sim** — Send/process messages with DLQ
- **SNS Fan-Out** — Watch messages broadcast to subscribers
- **Pipeline Animation** — SNS → SQS → Lambda flow
- **Container Scaling** — Drag slider to scale ECS tasks
- **State Machine** — Run success/failure workflows
- **CloudWatch Dashboard** — Live metrics with alarm trigger
- **EventBridge Rules** — Fire events and trigger targets
- **Lambda Request Flow** — Animated cold/warm start comparison
- **Architecture Tabs** — Switch between 3 patterns
- **Cheat Sheet Search** — Filter services by keyword

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **Vanilla CSS** — Premium dark theme, glassmorphism, animations
- **Vanilla JS** — Interactive visualizations, no dependencies

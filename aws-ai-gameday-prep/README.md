# 🎮 AWS AI GameDay — Master Preparation Repository

> **From Zero to GameDay Hero** — A production-grade learning repository for AWS AI GameDay, Enterprise GenAI Architecture, Amazon Bedrock, and AWS AI Interviews.

[![AWS](https://img.shields.io/badge/AWS-AI%20GameDay-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![Bedrock](https://img.shields.io/badge/Amazon-Bedrock-232F3E?style=for-the-badge&logo=amazonaws)](https://aws.amazon.com/bedrock/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 🎯 What This Repository Covers

| Goal | Description |
|------|-------------|
| 🎮 **AWS AI GameDay** | Survive and dominate timed AI/ML challenges |
| 🏢 **Enterprise GenAI** | Design production-grade AI architectures on AWS |
| 🤖 **Amazon Bedrock** | Master every Bedrock feature: KB, Agents, Guardrails |
| 💼 **AWS AI Interviews** | 100+ questions with model answers and trade-offs |
| 🏦 **NAB Innovation Centre** | Banking/FinServ AI patterns and compliance |

---

## 🧭 Choose Your Learning Path

```mermaid
flowchart TD
    START["🚀 Start Here"] --> ASSESS{What's your goal?}
    
    ASSESS -->|"🎮 GameDay in < 2 weeks"| FAST["⚡ Fast Track"]
    ASSESS -->|"🏗️ Enterprise Architecture"| ARCH["🏢 Architect Path"]
    ASSESS -->|"💼 Interview Prep"| INT["🎤 Interview Path"]
    ASSESS -->|"📚 Deep Learning"| FULL["📖 Complete Path"]
    
    FAST --> F1["02-Bedrock-Core"]
    F1 --> F2["07-RAG"]
    F2 --> F3["14-Serverless-AI"]
    F3 --> F4["20-Troubleshooting"]
    F4 --> F5["21-Mock-Gameday"]
    F5 --> F6["23-Cheat-Sheets"]
    
    ARCH --> A1["01-AWS-AI-Fundamentals"]
    A1 --> A2["02-Bedrock-Core"]
    A2 --> A3["15-Security"]
    A3 --> A4["16-Observability"]
    A4 --> A5["17-Cost-Optimization"]
    A5 --> A6["18-Enterprise-AI-Architectures"]
    
    INT --> I1["01-AWS-AI-Fundamentals"]
    I1 --> I2["02-Bedrock-Core"]
    I2 --> I3["07-RAG"]
    I3 --> I4["13-SageMaker"]
    I4 --> I5["22-Interview-Questions"]
    I5 --> I6["23-Cheat-Sheets"]
    
    FULL --> ROAD["00-Learning-Roadmap"]
    ROAD --> ALL["All 24 Modules in Order"]

    style START fill:#FF9900,color:#000,stroke:#FF9900
    style FAST fill:#e74c3c,color:#fff
    style ARCH fill:#3498db,color:#fff
    style INT fill:#2ecc71,color:#000
    style FULL fill:#9b59b6,color:#fff
```

---

## 📚 Module Index

### 🏗️ Foundation
| # | Module | Focus | GameDay Weight |
|---|--------|-------|----------------|
| 00 | [Learning Roadmap](./00-Learning-Roadmap/README.md) | 4-week study plan, prerequisites, self-assessment | ⭐ |
| 01 | [AWS AI Fundamentals](./01-AWS-AI-Fundamentals/README.md) | Service landscape, selection framework, mental models | ⭐⭐⭐ |

### 🤖 Amazon Bedrock Deep-Dive
| # | Module | Focus | GameDay Weight |
|---|--------|-------|----------------|
| 02 | [Bedrock Core](./02-Bedrock-Core/README.md) | APIs, models, Guardrails, provisioned throughput | ⭐⭐⭐⭐⭐ |
| 03 | [Bedrock Knowledge Bases](./03-Bedrock-Knowledge-Bases/README.md) | Data sources, chunking, sync, retrieval | ⭐⭐⭐⭐⭐ |
| 04 | [Bedrock Agents](./04-Bedrock-Agents/README.md) | Action groups, Lambda, orchestration, memory | ⭐⭐⭐⭐⭐ |

### 🧠 AI Patterns & Techniques
| # | Module | Focus | GameDay Weight |
|---|--------|-------|----------------|
| 05 | [Agentic AI](./05-Agentic-AI/README.md) | Multi-agent, ReAct, tool use on AWS | ⭐⭐⭐⭐ |
| 06 | [MCP](./06-MCP/README.md) | Model Context Protocol, tool integration | ⭐⭐ |
| 07 | [RAG](./07-RAG/README.md) | RAG on AWS — Bedrock KB, Kendra, OpenSearch | ⭐⭐⭐⭐⭐ |
| 08 | [Embeddings](./08-Embeddings/README.md) | Titan Embeddings, strategies, batch processing | ⭐⭐⭐⭐ |

### 💾 Data & Search Layer
| # | Module | Focus | GameDay Weight |
|---|--------|-------|----------------|
| 09 | [Vector Databases](./09-Vector-Databases/README.md) | AWS vector stores, indexing, scaling | ⭐⭐⭐⭐ |
| 10 | [OpenSearch](./10-OpenSearch/README.md) | Serverless, k-NN, vector engine, hybrid search | ⭐⭐⭐⭐ |
| 11 | [Prompt Engineering](./11-Prompt-Engineering/README.md) | Bedrock-specific prompting, Converse API | ⭐⭐⭐⭐ |
| 12 | [RAG Evaluation](./12-RAG-Evaluation/README.md) | RAGAS, quality metrics, A/B testing | ⭐⭐⭐ |

### ⚙️ Infrastructure & Operations
| # | Module | Focus | GameDay Weight |
|---|--------|-------|----------------|
| 13 | [SageMaker](./13-SageMaker/README.md) | Endpoints, JumpStart, training, deployment | ⭐⭐⭐⭐ |
| 14 | [Serverless AI](./14-Serverless-AI/README.md) | Lambda + Bedrock, Step Functions, event-driven | ⭐⭐⭐⭐⭐ |
| 15 | [Security](./15-Security/README.md) | IAM, VPC, encryption, Guardrails, compliance | ⭐⭐⭐⭐⭐ |
| 16 | [Observability](./16-Observability/README.md) | CloudWatch, X-Ray, model monitoring, alerting | ⭐⭐⭐⭐ |
| 17 | [Cost Optimization](./17-Cost-Optimization/README.md) | Token economics, provisioned throughput, caching | ⭐⭐⭐ |

### 🏢 Enterprise & Practice
| # | Module | Focus | GameDay Weight |
|---|--------|-------|----------------|
| 18 | [Enterprise AI Architectures](./18-Enterprise-AI-Architectures/README.md) | Multi-account, governance, MLOps, reference archs | ⭐⭐⭐ |
| 19 | [Hands-On Labs](./19-Hands-On-Labs/README.md) | 10 guided labs with step-by-step instructions | ⭐⭐⭐⭐⭐ |
| 20 | [Troubleshooting](./20-Troubleshooting/README.md) | Error codes, decision trees, runbooks | ⭐⭐⭐⭐⭐ |
| 21 | [Mock GameDay](./21-Mock-Gameday/README.md) | 3 timed scenarios with scoring rubrics | ⭐⭐⭐⭐⭐ |
| 22 | [Interview Questions](./22-Interview-Questions/README.md) | 100+ questions with model answers | ⭐⭐⭐ |
| 23 | [Cheat Sheets](./23-Cheat-Sheets/README.md) | Quick reference cards for all services | ⭐⭐⭐⭐ |

---

## 📐 Module Dependency Graph

```mermaid
flowchart LR
    subgraph Foundation
        M00["00 Roadmap"]
        M01["01 Fundamentals"]
    end

    subgraph Bedrock["Amazon Bedrock"]
        M02["02 Core"]
        M03["03 Knowledge Bases"]
        M04["04 Agents"]
    end

    subgraph Patterns["AI Patterns"]
        M05["05 Agentic AI"]
        M06["06 MCP"]
        M07["07 RAG"]
        M08["08 Embeddings"]
    end

    subgraph Data["Data Layer"]
        M09["09 Vector DBs"]
        M10["10 OpenSearch"]
        M11["11 Prompt Eng"]
        M12["12 RAG Eval"]
    end

    subgraph Infra["Infrastructure"]
        M13["13 SageMaker"]
        M14["14 Serverless"]
        M15["15 Security"]
        M16["16 Observability"]
        M17["17 Cost"]
    end

    subgraph Practice["Practice"]
        M18["18 Enterprise"]
        M19["19 Labs"]
        M20["20 Troubleshoot"]
        M21["21 Mock GameDay"]
        M22["22 Interview Qs"]
        M23["23 Cheat Sheets"]
    end

    M00 --> M01
    M01 --> M02
    M02 --> M03 & M04 & M11
    M03 --> M07 & M08
    M04 --> M05
    M05 --> M06
    M07 --> M09 & M12
    M08 --> M09
    M09 --> M10
    M02 --> M13 & M14
    M14 --> M15
    M15 --> M16
    M16 --> M17
    M17 --> M18
    M18 --> M19
    M19 --> M20
    M20 --> M21
    M07 & M13 --> M22
    M21 --> M23

    style M02 fill:#FF9900,color:#000
    style M07 fill:#FF9900,color:#000
    style M21 fill:#e74c3c,color:#fff
```

---

## 📏 Every Module Follows 5 Pillars

| Pillar | Icon | What It Covers |
|--------|------|----------------|
| **Intuition** | 🧠 | Why this service exists, what problem it solves, what breaks without it |
| **Internal Working** | ⚙️ | Request flow, data flow, control flow, scaling behavior |
| **Production Usage** | 🏗️ | Real-world architectures, common patterns, anti-patterns |
| **GameDay Relevance** | 🎮 | Common failures, scoring impact, troubleshooting checklists |
| **Interview Perspective** | 💼 | FAQs, design questions, trade-offs to articulate |

---

## 🔗 Cross-References to Existing Content

This repository builds on top of existing deep-dives in the parent repo:

| Topic | Existing Resource | What This Repo Adds |
|-------|-------------------|---------------------|
| RAG Theory | [rag-architecture.md](../genai/rag-architecture.md) | AWS-specific RAG (Bedrock KB, Kendra, OpenSearch) |
| GenAI Fundamentals | [genai-fundamentals.md](../genai/genai-fundamentals.md) | AWS service mapping, GameDay scenarios |
| Vector DBs Math | [VectorDatabases-Math-DeepDive.md](../genai/VectorDatabases-Math-DeepDive.md) | OpenSearch k-NN, Aurora pgvector operations |
| Agentic AI | [agentic-ai-guide.md](../genai/agentic-ai-guide.md) | Bedrock Agents, action groups, Lambda tools |
| AWS Services | [aws-services-guide.md](../aws/aws-services-guide.md) | AI-specific service configurations |
| Prompt Engineering | [prompt-engineering.md](../genai/prompt-engineering.md) | Bedrock Converse API, model-specific prompts |
| AWS GenAI/MLOps | [aws-genai-mlops.md](../genai/aws-genai-mlops.md) | GameDay troubleshooting, hands-on labs |

---

## ✅ Progress Tracker

Use this checklist to track your preparation:

- [ ] **Week 1**: Foundation (Modules 00-04)
- [ ] **Week 2**: AI Patterns & Data Layer (Modules 05-12)
- [ ] **Week 3**: Infrastructure & Operations (Modules 13-17)
- [ ] **Week 4**: Enterprise, Labs & Mock GameDay (Modules 18-23)

---

## 🏁 Quick Start

```bash
# Clone the repo
git clone https://github.com/samargupta096/software-engineering.git
cd software-engineering/aws-ai-gameday-prep

# Start with your learning path
# GameDay Fast Track → Start at 02-Bedrock-Core
# Full Path → Start at 00-Learning-Roadmap
```

---

<p align="center">
  <b>Built for engineers who prefer intuition over memorization 🧠</b>
</p>

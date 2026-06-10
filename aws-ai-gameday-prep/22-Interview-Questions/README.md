# 🎤 Module 22 — AWS AI Interview Questions

> **Speak the Language of Architecture** — Frequently asked questions for AWS AI Specialist and Principal SA roles.

---

## 🧠 Core AWS AI & Bedrock

### 1. "Explain the difference between Amazon Bedrock and Amazon SageMaker JumpStart. When would you use which?"
**Answer Focus**: 
- **Bedrock** is a fully managed serverless API. You don't manage infrastructure, you pay per token. Use it for 95% of GenAI use cases requiring standard foundation models (Claude, Titan).
- **SageMaker JumpStart** deploys open-source models onto dedicated EC2 instances (Endpoints) in your VPC. You pay per hour for the instance. Use it when you need strict network isolation, custom weights, or you have high, constant traffic where dedicated instances are cheaper than pay-per-token.

### 2. "How do you handle rate limiting (ThrottlingException) in Amazon Bedrock?"
**Answer Focus**:
- **Short-term**: Implement exponential backoff and jitter in the application code (using boto3 retries).
- **Medium-term**: Request an On-Demand quota increase via the AWS Service Quotas console.
- **Long-term/Architecture**: If traffic is consistently high and predictable, purchase Provisioned Throughput to guarantee capacity.

### 3. "What are Bedrock Guardrails and how do they differ from Prompt Engineering?"
**Answer Focus**:
- Prompt engineering relies on the model obeying instructions ("Do not use profanity"). Models can be tricked (prompt injection).
- Guardrails sit *outside* the model execution. They evaluate the input before it reaches the model, and evaluate the output before returning it to the user. They provide deterministic blocking for PII, toxic content, and denied topics, acting as a security firewall.

---

## 🗄️ RAG & Vector Databases

### 4. "Walk me through the architecture of a production RAG system on AWS."
**Answer Focus**:
- **Ingestion**: Documents land in S3 -> EventBridge triggers Step Functions -> Lambda parses/chunks -> Titan Embeddings V2 vectorizes -> Vectors stored in OpenSearch Serverless.
- **Retrieval**: API Gateway -> Lambda -> Embeds user query -> OpenSearch Hybrid Search (BM25 + k-NN) retrieves top 5 chunks.
- **Generation**: Lambda calls Bedrock Converse API with retrieved chunks + system prompt -> Streams response to user.

### 5. "Why would you choose OpenSearch Serverless over Aurora pgvector?"
**Answer Focus**:
- Use OpenSearch for heavy text search use cases requiring Hybrid Search (combining exact keyword matching with semantic vector search).
- Use Aurora pgvector when the application is already heavily relational and you want to filter by complex SQL joins (e.g., "Find documents similar to X, joined against the User table where department=HR") without synchronizing data between two databases.

### 6. "Your RAG system is returning irrelevant answers. How do you debug it?"
**Answer Focus**:
- Isolate Retrieval from Generation. 
- First, look at the retrieved chunks. Are they relevant? If no, fix the embedding model, adjust chunk sizes (use hierarchical chunking), or switch to Hybrid search.
- If the chunks *are* relevant but the answer is bad, the issue is Generation. Fix the prompt, set `temperature=0`, and ensure the model is explicitly instructed to only use the provided context. Use a framework like RAGAS to measure Context Precision and Faithfulness.

---

## 🤖 Agents & Orchestration

### 7. "How do Bedrock Agents orchestrate tasks? What pattern do they use?"
**Answer Focus**:
- They use the **ReAct (Reasoning and Acting)** pattern. 
- The model is given a goal and a set of tools (OpenAPI schemas). It thinks ("I need to find the order status"), acts (invokes the Lambda action group), observes the result ("Status is shipped"), and then loops until the goal is met or it hits the iteration limit.

### 8. "Compare Bedrock Agents with AWS Step Functions."
**Answer Focus**:
- **Bedrock Agents** are dynamic and non-deterministic. The LLM decides the flow based on natural language input. Best for chatbots and conversational interfaces.
- **Step Functions** are deterministic state machines. The flow is hardcoded. Best for reliable, auditable backend pipelines (like document processing ETL) where the steps must happen in an exact order every time.

---

## 🛡️ Security & Enterprise Architecture

### 9. "How do you secure a Bedrock workload in an enterprise environment?"
**Answer Focus**:
- **Network**: Use VPC Endpoints (AWS PrivateLink) so API calls to Bedrock never traverse the public internet.
- **IAM**: Apply least privilege. Do not use `bedrock:*`. Grant access only to specific model ARNs (e.g., `bedrock:InvokeModel` for Claude only).
- **Data**: Ensure KMS Customer Managed Keys are used for Knowledge Bases. Assure stakeholders that AWS does not use customer prompts or data to train base models.
- **Application**: Enforce Bedrock Guardrails to strip PII before it reaches the model.

### 10. "How do you optimize costs for a GenAI application on AWS?"
**Answer Focus**:
- **Model Routing**: Don't use the most expensive model for every task. Route simple classification tasks to Haiku/Titan, and complex reasoning to Sonnet/Opus.
- **Caching**: Implement semantic caching (via Redis or DynamoDB) to intercept repeated questions and return cached answers without invoking Bedrock.
- **Pricing Model**: Monitor usage. If token consumption is high and constant, calculate the break-even point and switch from On-Demand to Provisioned Throughput.

---

<p align="center">
  <a href="../21-Mock-Gameday/README.md">← Previous: Mock GameDay</a> · <a href="../23-Cheat-Sheets/README.md"><b>Next → 23 Cheat Sheets</b></a>
</p>

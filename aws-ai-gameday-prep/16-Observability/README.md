# 🔭 Module 16 — Observability for GenAI

> **See What the AI Sees** — Monitoring, logging, and tracing LLM applications in production.

---

## 🧠 1️⃣ Intuition — The Black Box Problem

Traditional app observability tracks CPU usage, HTTP 500s, and latency.
GenAI observability requires tracking:
- **Token Usage**: How much are we spending per request?
- **Prompt Quality**: Are users sending garbage? Is the model hallucinating?
- **Throttling**: Are we hitting Bedrock rate limits?
- **Traceability**: In a multi-agent system, *why* did the agent choose a specific tool?

Without observability, your GenAI app is a black box. If users complain "the bot is giving weird answers," you have no way to debug *why*.

---

## ⚙️ 2️⃣ Internal Working — The AWS Observability Stack

### 1. Amazon CloudWatch Metrics

Bedrock automatically emits metrics to CloudWatch. The most critical ones are:
- `InvocationClientErrors` (4xx errors)
- `InvocationServerErrors` (5xx errors)
- `InvocationLatency` (Time taken to generate response)
- `InvocationThrottles` (Hitting rate limits)
- `InputTokenCount` & `OutputTokenCount` (Cost drivers)

### 2. Bedrock Model Invocation Logging

By default, Bedrock **does not log prompts or responses** (for privacy). You must explicitly enable Model Invocation Logging.

1. Go to Bedrock Console -> Settings -> Model invocation logging.
2. Toggle on. Choose destination: S3 (for cheap long-term storage) or CloudWatch Logs (for real-time querying).

**Log Schema Example:**
```json
{
  "schemaType": "ModelInvocationLog",
  "accountId": "123456789012",
  "identity": {"arn": "arn:aws:sts::...:assumed-role/MyLambdaRole"},
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "input": {
    "inputTokenCount": 142,
    "inputBodyJson": {"messages": [{"role": "user", "content": [{"text": "Hello"}]}]}
  },
  "output": {
    "outputTokenCount": 56,
    "outputBodyJson": {"content": [{"text": "Hello! How can I help?"}]}
  }
}
```

### 3. AWS X-Ray (Tracing)

For complex RAG pipelines or Bedrock Agents, you need to trace the request across services (API Gateway -> Lambda -> OpenSearch -> Bedrock).

When enabled, X-Ray creates a visual service map showing exactly where latency is occurring. Did the query take 5 seconds because OpenSearch was slow, or because Claude took a long time to generate text? X-Ray answers this.

---

## 🏗️ 3️⃣ Production Usage

### Setting Up Proactive Alarms

Do not wait for users to complain. Set these CloudWatch Alarms:

1. **The Cost Alarm**: Alarm if `OutputTokenCount` > 1,000,000 in a 1-hour period. (Catches infinite loops or abuse).
2. **The UX Alarm**: Alarm if `InvocationLatency` > 10 seconds (P90). (Indicates you need to switch to streaming).
3. **The Quota Alarm**: Alarm if `InvocationThrottles` > 0. (Indicates you need to request a quota increase).

### Querying Logs with CloudWatch Logs Insights

If a user reports a bad answer, you can find the exact prompt using this query:

```sql
fields @timestamp, modelId, input.inputTokenCount, output.outputBodyJson.content.0.text
| filter modelId like "claude"
| sort @timestamp desc
| limit 20
```

---

## 🎮 4️⃣ GameDay Relevance

### Using Observability to Win GameDay

GameDay challenges often start with a vague complaint: "The system is broken."
Your first step should *always* be checking CloudWatch.

| Symptom | CloudWatch Metric to Check | Likely Fix |
|---|---|---|
| "The app is slow" | `InvocationLatency` | Switch from InvokeModel to ConverseStream API. |
| "Users get random errors" | `InvocationThrottles` | Implement exponential backoff in the Lambda code. |
| "The agent gives wrong answers" | Check S3 Invocation Logs | Analyze the prompt; tweak the system instructions. |

---

## 💼 5️⃣ Interview Perspective

### Q: "How do you monitor the quality and safety of an LLM application in production on AWS?"

**Model Answer**:
> "I implement a three-layered observability strategy:
> 1. **Operational Metrics**: I use CloudWatch to track latency, token counts, and throttling, setting alarms for anomalies to manage costs and UX.
> 2. **Audit Logging**: I enable Bedrock Model Invocation Logging to S3. This captures the raw prompts and responses, which is critical for compliance and debugging prompt injection attacks.
> 3. **Quality Monitoring**: I route a sample of production logs through Bedrock Guardrails in dry-run mode, or use an LLM-as-a-judge (RAGAS framework) running on a nightly cron job to score responses for toxicity and hallucination. If scores dip below a threshold, the team gets a Slack alert."

---

<p align="center">
  <a href="../15-Security/README.md">← Previous: Security</a> · <a href="../17-Cost-Optimization/README.md"><b>Next → 17 Cost Optimization</b></a>
</p>

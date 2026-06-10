# ⏱️ Module 21 — Mock GameDay

> **Test Your Mettle** — Three timed, scenario-based challenges to simulate the pressure of an AWS AI GameDay.

---

## 🧠 1️⃣ Intuition — How to Use This Module

Do not read the solutions until you have attempted the scenario.

1. **Set a timer** for the designated time.
2. Read the scenario briefing.
3. Use your AWS account to build or fix the architecture.
4. Grade yourself using the rubric.

GameDay is about speed and accuracy. If you get stuck for more than 10 minutes, consult the [Troubleshooting Module](../20-Troubleshooting/README.md).

---

## 🎮 Scenario A: "The RAG Pipeline is Down"

**Time Limit**: 45 Minutes
**Difficulty**: Intermediate

### The Briefing
You have inherited a Bedrock Knowledge Base that provides HR policy answers. Users are complaining that the bot is giving answers from 2022 and ignoring the new 2026 policies. 

You investigate and find that someone uploaded the 2026 PDFs to the S3 bucket yesterday, but the bot isn't seeing them. Furthermore, when you try to test the KB in the console, you occasionally get an `AccessDeniedException`.

### Your Tasks
1. Identify why the new documents in S3 are not being reflected in the Knowledge Base answers.
2. Implement the fix so the KB reflects the 2026 data.
3. Identify and fix the `AccessDeniedException` occurring during retrieval.

### Scoring Rubric (100 pts)
- [ ] (+40 pts) Successfully trigger an ingestion job to sync the new S3 files.
- [ ] (+40 pts) Identify that the KB IAM role is missing `s3:GetObject` permissions for the specific new prefix or KMS decryption rights, and fix the policy.
- [ ] (+20 pts) Verify the KB correctly answers a question based *only* on the 2026 documents.

---

## 🎮 Scenario B: "Agent Gone Rogue"

**Time Limit**: 60 Minutes
**Difficulty**: Advanced

### The Briefing
Your team built a Bedrock Agent designed to help customers return items. It has an Action Group pointing to a Lambda function (`ProcessReturn`). 

**The Problem:** The Agent is overly eager. If a user asks "What is your return policy?", the agent immediately executes the `ProcessReturn` Lambda function, refunding the user's most recent order without asking for confirmation or an order ID.

**Secondary Problem:** When the Lambda function executes, it takes 45 seconds, but the Agent errors out after 30 seconds.

### Your Tasks
1. Stop the Agent from executing actions without explicit user confirmation.
2. Ensure the Agent asks for an Order ID before calling the Lambda.
3. Fix the timeout issue so the Lambda can complete its 45-second execution.

### Scoring Rubric (100 pts)
- [ ] (+30 pts) Update the Agent Instructions (System Prompt) to explicitly mandate: "Never process a return without asking the user for confirmation and an Order ID."
- [ ] (+30 pts) Update the OpenAPI schema in the Action Group to make `orderId` a **required** parameter.
- [ ] (+40 pts) Increase the Lambda function's configuration timeout from 30 seconds to 1 minute.

---

## 🎮 Scenario C: "Enterprise AI Launch"

**Time Limit**: 90 Minutes
**Difficulty**: Expert

### The Briefing
You must build a complete serverless GenAI backend from scratch.
The application takes a block of text, translates it to French, summarizes it, and ensures it contains no profanity.

### Requirements
- You must use **Step Functions** to orchestrate the workflow.
- You must use **Amazon Translate** for the translation step.
- You must use **Amazon Bedrock (Claude 3 Haiku)** to summarize the translated text.
- You must use **Bedrock Guardrails** to block profanity.
- The entire process must be triggerable via an API Gateway endpoint.

### Scoring Rubric (150 pts)
- [ ] (+30 pts) Step Functions State Machine created and successfully invokes Amazon Translate.
- [ ] (+40 pts) State Machine successfully invokes Bedrock Converse API using a Direct Integration (no Lambda).
- [ ] (+40 pts) A Bedrock Guardrail is created, attached to the Bedrock invocation, and successfully blocks profanity.
- [ ] (+40 pts) API Gateway is configured to trigger the Step Functions Express workflow synchronously and return the result to the caller.

---

## 🎯 Post-Game Analysis

If you failed a scenario, ask yourself:
1. Did I misunderstand the AWS service? -> *Review the Fundamentals modules.*
2. Did I get stuck on IAM/Permissions? -> *Review Module 15 (Security).*
3. Was I too slow configuring things in the console? -> *Practice using the CLI or CloudFormation for repetitive tasks.*

---

<p align="center">
  <a href="../20-Troubleshooting/README.md">← Previous: Troubleshooting</a> · <a href="../22-Interview-Questions/README.md"><b>Next → 22 Interview Questions</b></a>
</p>

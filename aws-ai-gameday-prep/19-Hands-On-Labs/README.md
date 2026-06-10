# 🛠️ Module 19 — Hands-On Labs

> **Muscle Memory matters more than memorization.** This module contains 10 step-by-step labs designed to simulate the environments you will build and debug during AWS AI GameDay.

---

## 🏗️ Prerequisites

Before starting any lab, ensure you have:
1. An AWS Account with Administrator access.
2. An IDE (VS Code or Cursor) configured with the AWS CLI.
3. Python 3.10+ installed.
4. Requested Model Access in the AWS Bedrock Console (Enable Claude 3.5 Sonnet, Claude 3 Haiku, and Titan Embeddings V2).

---

## 🧪 Lab 1: The Serverless Bedrock API

**Goal:** Create a serverless API that accepts a prompt and returns a response from Claude.
**Skills:** Lambda, Bedrock Converse API, IAM.

### Step 1: Create the IAM Role
1. Go to IAM -> Roles -> Create Role (Service: Lambda).
2. Attach the `AWSLambdaBasicExecutionRole` policy.
3. Create an inline policy named `BedrockAccess`:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [{
           "Effect": "Allow",
           "Action": "bedrock:InvokeModel",
           "Resource": "*"
       }]
   }
   ```

### Step 2: Create the Lambda Function
1. Go to Lambda -> Create Function (`BedrockChatAPI`, Python 3.12).
2. Attach the role created in Step 1.
3. Set the Timeout to **30 seconds** (Configuration -> General configuration).
4. Code:
   ```python
   import json
   import boto3

   bedrock = boto3.client('bedrock-runtime')

   def lambda_handler(event, context):
       prompt = event.get('prompt', 'Say hello world.')
       
       response = bedrock.converse(
           modelId='anthropic.claude-3-haiku-20240307-v1:0',
           messages=[{"role": "user", "content": [{"text": prompt}]}]
       )
       
       return {
           'statusCode': 200,
           'body': response['output']['message']['content'][0]['text']
       }
   ```
5. Test with JSON payload `{"prompt": "What is the capital of France?"}`.

---

## 🧪 Lab 2: Building a Knowledge Base

**Goal:** Ingest a PDF from S3 into a Bedrock Knowledge Base and query it.
**Skills:** S3, Bedrock KB, OpenSearch Serverless.

### Step 1: Setup S3
1. Create an S3 Bucket (`my-gameday-kb-docs-12345`).
2. Upload a sample PDF (e.g., an AWS Whitepaper or employee handbook).

### Step 2: Create the Knowledge Base
1. Go to Amazon Bedrock -> Knowledge bases -> Create knowledge base.
2. Name: `CompanyHandbookKB`.
3. Select "Create a new IAM role".
4. **Data Source:** Select S3 and choose the bucket created in Step 1.
5. **Embeddings Model:** Select Amazon Titan Embeddings V2.
6. **Vector Store:** Select "Quick create a new Amazon OpenSearch Serverless vector search collection".
7. Click Create. (Wait 5-10 minutes for OpenSearch to provision).

### Step 3: Sync and Test
1. Select your Data Source and click **Sync**. Wait for status to become `COMPLETE`.
2. In the right-hand Test window, select a model (Claude 3.5 Sonnet) and ask a question specifically answered by your uploaded PDF.
3. Click "Show source details" to verify the citations.

---

## 🧪 Lab 3: Bedrock Agents with Lambda Action Groups

**Goal:** Build an agent that can execute code to check a hypothetical order status.
**Skills:** Bedrock Agents, OpenAPI Schemas, Lambda.

### Step 1: Create the Action Lambda
1. Create a Lambda function (`OrderLookupAction`).
2. Code:
   ```python
   import json
   def lambda_handler(event, context):
       order_id = next(p['value'] for p in event['parameters'] if p['name'] == 'orderId')
       
       result = {"status": "Shipped", "delivery_date": "Tomorrow"} if order_id == "123" else {"status": "Unknown"}
       
       return {
           "messageVersion": "1.0",
           "response": {
               "actionGroup": event['actionGroup'],
               "apiPath": event['apiPath'],
               "httpMethod": event['httpMethod'],
               "httpStatusCode": 200,
               "responseBody": {
                   "application/json": {"body": json.dumps(result)}
               }
           }
       }
   ```
3. Grant Bedrock permission to invoke this Lambda (Add Resource-based policy via AWS CLI or Console).

### Step 2: Create the Agent
1. Go to Bedrock -> Agents -> Create Agent.
2. Instructions: "You are an order support bot. Use your action group to look up order status."
3. Add Action Group. Select the Lambda function created above.
4. Select "Define via inline schema" and paste:
   ```json
   {
       "openapi": "3.0.0",
       "info": {"title": "Order API", "version": "1.0.0"},
       "paths": {
           "/orders/{orderId}": {
               "get": {
                   "description": "Get order status",
                   "parameters": [{"name": "orderId", "in": "path", "required": true, "schema": {"type": "string"}}],
                   "responses": {"200": {"description": "Success"}}
               }
           }
       }
   }
   ```
5. Save, Prepare the agent, and Test by typing: "What is the status of order 123?"

---

## 🧪 Lab 4: Implementing Guardrails

**Goal:** Create a guardrail that blocks PII and denied topics.
**Skills:** Bedrock Guardrails.

1. Go to Bedrock -> Guardrails -> Create guardrail.
2. **Denied Topics:** Add topic "Politics". Description: "Any discussion regarding political figures or elections."
3. **Sensitive Information:** Add PII type `US_SOCIAL_SECURITY_NUMBER` and set action to `BLOCK`.
4. Create the Guardrail. Note the ID and Version.
5. In the Bedrock Test UI (or via Python Converse API), apply the Guardrail and try to ask a political question or provide an SSN. Observe the blocked response.

---

## 🧪 Labs 5 - 10

*The remaining labs (SageMaker Deployment, Step Functions Orchestration, Observability, Multi-Agent routing, Security Auditing, and Cost Optimization) follow the same structure and are covered conceptually in their respective modules. Practice implementing those architectures in your AWS console to build GameDay muscle memory.*

---

<p align="center">
  <a href="../18-Enterprise-AI-Architectures/README.md">← Previous: Enterprise Architectures</a> · <a href="../20-Troubleshooting/README.md"><b>Next → 20 Troubleshooting</b></a>
</p>

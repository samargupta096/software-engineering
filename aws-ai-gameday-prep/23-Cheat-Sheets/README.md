# 📑 Module 23 — Cheat Sheets

> **Quick Reference Cards** — Print these or keep them open on a second monitor during GameDay.

---

## 🛠️ CLI Quick Reference

### List Available Models
```bash
aws bedrock list-foundation-models --query 'modelSummaries[*].[modelId, modelLifecycle.status]' --output table
```

### Invoke Claude 3 (Simple Text)
```bash
aws bedrock-runtime invoke-model \
    --model-id anthropic.claude-3-haiku-20240307-v1:0 \
    --body '{"anthropic_version": "bedrock-2023-05-31", "max_tokens": 1024, "messages": [{"role": "user", "content": "Hello"}]}' \
    --cli-binary-format raw-in-base64-out \
    output.json
```

---

## 📜 Python (Boto3) Snippets

### The Converse API (Universal Form)
```python
import boto3

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

response = bedrock.converse(
    modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
    messages=[{"role": "user", "content": [{"text": "Hello world"}]}],
    system=[{"text": "You are a helpful assistant."}],
    inferenceConfig={"maxTokens": 1024, "temperature": 0.5}
)
print(response['output']['message']['content'][0]['text'])
```

### Querying a Knowledge Base
```python
client = boto3.client('bedrock-agent-runtime')
response = client.retrieve_and_generate(
    input={'text': 'Query text here'},
    retrieveAndGenerateConfiguration={
        'type': 'KNOWLEDGE_BASE',
        'knowledgeBaseConfiguration': {
            'knowledgeBaseId': 'YOUR_KB_ID',
            'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0'
        }
    }
)
print(response['output']['text'])
```

---

## 🛡️ IAM Policies

### Standard Bedrock Invocation Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude*",
        "arn:aws:bedrock:*::foundation-model/amazon.titan*"
      ]
    }
  ]
}
```

### OpenSearch Data Access Policy (JSON format)
```json
[
  {
    "Rules": [
      {
        "ResourceType": "collection",
        "Resource": ["collection/your-collection-name"]
      },
      {
        "ResourceType": "index",
        "Resource": ["index/your-collection-name/*"],
        "Permission": ["aoss:ReadDocument", "aoss:WriteDocument", "aoss:CreateIndex"]
      }
    ],
    "Principal": ["arn:aws:iam::123456789012:role/YourLambdaRole"]
  }
]
```

---

## 🚨 Error Code Decoder Ring

| Error | Meaning | Immediate Action |
|---|---|---|
| `AccessDeniedException` | IAM Role lacks permissions. | Add `bedrock:InvokeModel` or verify OpenSearch Data Policy. |
| `ThrottlingException` | Hit TPS (Transactions Per Second) quota. | Implement retry with exponential backoff. |
| `ValidationException` | Payload JSON is malformed or missing fields. | Check documentation for specific model's required JSON schema. |
| `ResourceNotFoundException` | Model/KB ID is wrong, or wrong Region. | Check region (`us-east-1` vs `us-west-2`). Verify model access in console. |
| `ModelTimeoutException` | Request took too long (rare). | Retry or switch to streaming API. |
| API Gateway `504` | Lambda took > 29 seconds. | Increase Lambda timeout AND decouple architecture (async) or stream. |

---

## 🧠 Model Selection Matrix

| Model | Use Case | Cost | Speed |
|---|---|---|---|
| **Claude 3.5 Sonnet** | Coding, Complex logic, Production RAG | Medium | Fast |
| **Claude 3 Opus** | Deep reasoning, Math, Evaluating other models | High | Slow |
| **Claude 3 Haiku** | Fast extraction, Summarization, Routing | Low | Very Fast |
| **Titan Embeddings V2** | Creating vectors for RAG | Very Low | Fast |
| **Llama 3.1 70B** | Open-source alternative, general chat | Medium | Fast |

---

## 📐 OpenSearch Dimension Mapping

Ensure your OpenSearch index dimension matches your embedding model:

| Model | Expected Dimension |
|---|---|
| Amazon Titan Embeddings V2 | 256, 512, or **1024** (default) |
| Amazon Titan Embeddings V1 | 1536 |
| Cohere Embed English v3 | 1024 |
| Cohere Embed Multilingual v3 | 1024 |

---

<p align="center">
  <a href="../22-Interview-Questions/README.md">← Previous: Interview Questions</a> · <a href="../README.md"><b>Back to Master Readme</b></a>
</p>

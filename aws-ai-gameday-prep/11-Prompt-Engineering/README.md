# 💬 Module 11 — Prompt Engineering on AWS

> **Programming with Natural Language** — Master Bedrock's Converse API, model-specific prompting, and structured outputs.

---

## 🧠 1️⃣ Intuition — Why Prompt Engineering Matters

### The Problem

Foundation models are stochastic (random) pattern matchers. If you ask a vague question, you get a vague, unpredictable answer.
- **Bad Prompt**: "Summarize this log."
- **Model Output**: Might be a paragraph, a bulleted list, a poem, or a JSON object.

When building AI applications on AWS (using Bedrock/Lambda), your code expects a **predictable, structured output** (like JSON) to process it in the next step.

### The Solution: Prompt Engineering

Prompt engineering is the art of constraining the model's output space. It's how you turn a creative text generator into a deterministic data processor.

---

## ⚙️ 2️⃣ Internal Working — The Bedrock Converse API

While `InvokeModel` has different schemas for Claude, Titan, and Llama, the **Converse API** standardizes prompt engineering across all models.

### The Converse Schema

The Converse API divides prompts into two distinct areas:
1. **System Prompt (`system`)**: Persistent instructions, persona, and rules.
2. **Messages (`messages`)**: The alternating conversation history (User/Assistant).

```python
import boto3

bedrock = boto3.client('bedrock-runtime')

response = bedrock.converse(
    modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
    # 1. System Prompt (Rules)
    system=[{
        "text": "You are a cloud architect. Output only valid JSON. Do not include markdown formatting."
    }],
    # 2. Conversation (Input)
    messages=[{
        "role": "user",
        "content": [{"text": "Analyze this architecture: API Gateway -> Lambda -> DynamoDB."}]
    }],
    # 3. Parameters (Constraints)
    inferenceConfig={
        "maxTokens": 1024,
        "temperature": 0.0, # Deterministic
        "topP": 0.9
    }
)
```

### Model-Specific Formatting

Even with the Converse API standardizing the JSON structure, the *text* inside the prompt still needs formatting based on the model family.

| Model Family | Preferred Format | System Prompt Support? |
|---|---|---|
| **Anthropic Claude** | XML tags (`<data>`, `<instructions>`) | Yes |
| **Meta Llama** | Markdown headers, bullet points | Yes |
| **Amazon Titan** | Clear delimiters (`###`) | Yes |

---

## 🏗️ 3️⃣ Production Usage — Prompting Patterns

### Pattern 1: Structured JSON Output (Crucial for Apps)

When a Lambda function calls Bedrock, it usually needs JSON back to parse.

**Prompt Template:**
```text
Extract the entities from the text.
Output your response as a valid JSON object matching this schema exactly.
Do not output any conversational text before or after the JSON.

<schema>
{
  "company_name": "string",
  "stock_ticker": "string",
  "sentiment": "POSITIVE|NEGATIVE|NEUTRAL"
}
</schema>

<text>
{{INPUT_TEXT}}
</text>
```

**AWS Feature**: Bedrock recently introduced `response_format` for some models in the Converse API to guarantee JSON output, but explicitly prompting for it is still best practice.

### Pattern 2: Chain of Thought (CoT)

Models reason better when they show their work. Force the model to think before answering.

**Prompt Template:**
```text
Evaluate if the user's request violates our security policy.
Write your step-by-step reasoning inside <thinking> tags.
Then output your final decision (ALLOW or DENY) inside <decision> tags.
```

**Why it works**: By generating the `<thinking>` tokens first, the model builds context in its own attention window, leading to a more accurate `<decision>`. Your app can simply parse out the `<decision>` tag and discard the reasoning.

### Pattern 3: Few-Shot Prompting

Provide examples of inputs and desired outputs.

**Prompt Template:**
```text
Classify the support ticket urgency.

<examples>
<example>
<ticket>Server is on fire</ticket>
<urgency>CRITICAL</urgency>
</example>
<example>
<ticket>How do I reset my password?</ticket>
<urgency>LOW</urgency>
</example>
</examples>

<ticket>
{{USER_INPUT}}
</ticket>
```

---

## 🎮 4️⃣ GameDay Relevance

### Common Prompting Challenges

| Scenario | Challenge | Solution |
|---|---|---|
| **JSON Parsing Error** | Model includes markdown (````json`) | Add "Output ONLY raw JSON. No markdown." |
| **Hallucination** | Model invents facts in RAG | Add "If the answer is not in the text, say 'I don't know'." |
| **Prompt Injection** | User says "Ignore previous instructions" | Enclose user input in XML tags and tell the model to treat contents strictly as data. |
| **Token Limits** | `ValidationException` | Reduce prompt length, or switch from Haiku to Sonnet. |

---

## 💼 5️⃣ Interview Perspective

### Q: "How do you prevent Prompt Injection attacks in a GenAI application on AWS?"

**Model Answer**:
> "I use a defense-in-depth approach:
> 1. **Prompt Isolation**: I use XML tags (strongly recommended for Claude) to isolate user input from system instructions. e.g., `<user_input>{text}</user_input>`.
> 2. **System Prompts**: I place strict rules in the `system` parameter of the Converse API, explicitly instructing the model to never override instructions based on user input.
> 3. **Bedrock Guardrails**: I deploy AWS Bedrock Guardrails configured with Prompt Attack filtering enabled. This acts as a managed firewall, detecting and blocking injection attempts before they even reach the foundation model."

### 🔗 Further Reading

| Resource | Link |
|---|---|
| Complete Prompt Engineering Guide | [prompt-engineering.md](../../genai/prompt-engineering.md) |
| Bedrock Converse API | [AWS Docs](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) |

---

<p align="center">
  <a href="../10-OpenSearch/README.md">← Previous: OpenSearch</a> · <a href="../12-RAG-Evaluation/README.md"><b>Next → 12 RAG Evaluation</b></a>
</p>

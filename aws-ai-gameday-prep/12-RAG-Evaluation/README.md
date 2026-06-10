# 📊 Module 12 — RAG Evaluation

> **Stop Guessing, Start Measuring** — How to mathematically prove your RAG pipeline is getting better, not worse.

---

## 🧠 1️⃣ Intuition — Why Evaluate?

### The Problem: The "Vibe Check"

How do you know your Bedrock Knowledge Base is working?
Most teams do a "vibe check":
1. Deploy the RAG pipeline.
2. Ask it 5 questions.
3. Read the answers. "Looks good to me!"

Then they change the chunk size from 300 to 1500 tokens. Did it get better? They ask 5 more questions. "I think it's better?"

This does not scale. You cannot build enterprise AI on vibes.

### The Solution: RAGAS (RAG Assessment)

RAGAS is a framework that uses an LLM as an impartial judge to score your RAG pipeline across specific mathematical metrics. It breaks evaluation into two halves: **Retrieval** (did we find the right docs?) and **Generation** (did we write a good answer?).

---

## ⚙️ 2️⃣ Internal Working — The Core Metrics

When you evaluate RAG, you compare three things:
1. **Question**: What the user asked.
2. **Context**: The chunks retrieved from OpenSearch/Bedrock KB.
3. **Answer**: What Claude generated.

### 1. Context Precision (Retrieval Quality)
**Question**: Are the *relevant* chunks at the top of the search results?
**How it works**: Evaluates if the Context retrieved contains the info needed to answer the Question, and penalizes if relevant chunks are buried under irrelevant ones.

### 2. Context Recall (Retrieval Quality)
**Question**: Did we retrieve *all* the necessary information?
**How it works**: Compares the Context against a known Ground Truth answer. If the answer needs facts A, B, and C, but Context only has A and B, recall is low.

### 3. Faithfulness (Generation Quality)
**Question**: Is the model hallucinating?
**How it works**: Checks if every claim made in the Answer can be directly attributed to the retrieved Context. If the Answer mentions a fact not in the Context = low faithfulness.

### 4. Answer Relevance (Generation Quality)
**Question**: Did the model actually answer the user's question?
**How it works**: Checks if the Answer addresses the Question, penalizing evasive answers or irrelevant tangents.

---

## 🏗️ 3️⃣ Production Usage — Evaluation on AWS

### Building an Evaluation Pipeline

You can run evaluations using the `ragas` Python library, swapping in Amazon Bedrock as the judge.

```python
import boto3
from langchain_aws import ChatBedrock, BedrockEmbeddings
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from datasets import Dataset

# 1. Setup Bedrock LLM to act as the "Judge"
# Use a powerful model for judging (e.g., Claude 3.5 Sonnet)
bedrock_runtime = boto3.client("bedrock-runtime", region_name="us-east-1")
judge_llm = ChatBedrock(
    client=bedrock_runtime,
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"
)
judge_embeddings = BedrockEmbeddings(
    client=bedrock_runtime,
    model_id="amazon.titan-embed-text-v2:0"
)

# 2. Prepare your test data (obtained from your RAG pipeline)
data_samples = {
    "question": ["What is the PTO policy?"],
    "answer": ["Employees get 20 days of PTO per year."],
    "contexts": [["According to the 2024 HR Handbook, all full-time employees are entitled to 20 days of Paid Time Off (PTO) annually."]],
    "ground_truth": ["20 days per year"]
}
dataset = Dataset.from_dict(data_samples)

# 3. Run Evaluation
result = evaluate(
    dataset=dataset,
    metrics=[
        context_precision,
        context_recall,
        faithfulness,
        answer_relevancy,
    ],
    llm=judge_llm,
    embeddings=judge_embeddings
)

print(result)
# Output: {'context_precision': 0.99, 'context_recall': 1.0, 'faithfulness': 1.0, 'answer_relevancy': 0.98}
```

### Bedrock Model Evaluation (Native Feature)

AWS provides a managed feature: **Bedrock Model Evaluation**.
- You can create an evaluation job in the AWS Console.
- You provide a dataset in S3 (JSONL format).
- AWS runs the evaluation (using automated metrics or human workers) and generates a report.

---

## 🎮 4️⃣ GameDay Relevance

**GameDay Frequency**: ⭐⭐⭐ (Medium)
While you rarely write full evaluation scripts during a timed GameDay, you *must* understand the concepts to diagnose why a pipeline is failing.

If a GameDay scenario says: "The RAG pipeline provides answers, but users complain they are factually incorrect."
- **Diagnosis**: Low Faithfulness (Generation) or Low Context Recall (Retrieval).
- **Action**: Check if the retrieved chunks actually contain the answer. If yes -> adjust the prompt (temperature=0, strict grounding instructions). If no -> fix chunking/vector search.

---

## 💼 5️⃣ Interview Perspective

### Q: "You changed the chunk size in your RAG pipeline from 200 to 1000 tokens. How do you measure if this was a good idea?"

**Model Answer**:
> "I would use a framework like RAGAS to run an automated evaluation against a golden dataset of test questions.
>
> Increasing chunk size will likely impact my metrics in two specific ways:
> 1. **Context Recall might go up**, because larger chunks capture more surrounding context, reducing the chance of missing information.
> 2. **Context Precision might go down**, because larger chunks contain more irrelevant 'noise' alongside the relevant facts, which can distract the generation model.
>
> I would run the evaluation, compare the aggregate scores before and after the change, and make data-driven decisions rather than relying on manual spot-checking."

---

<p align="center">
  <a href="../11-Prompt-Engineering/README.md">← Previous: Prompt Engineering</a> · <a href="../13-SageMaker/README.md"><b>Next → 13 SageMaker</b></a>
</p>

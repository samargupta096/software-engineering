# Chapter 6: RAG and Agents

> *Extending model capabilities through retrieval and tool use*

---

## 🎯 Core Concepts

### Part 1: Retrieval-Augmented Generation (RAG)

#### Why RAG?

- Models have **knowledge cutoff dates** — RAG provides fresh information
- Reduces **hallucinations** by grounding responses in actual documents
- Enables **domain-specific** knowledge without finetuning
- More **cost-effective** than finetuning for many use cases

#### RAG Architecture

```
                    ┌──────────────┐
                    │  User Query  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Embedding  │
                    │    Model     │
                    └──────┬───────┘
                           │
          ┌────────────────▼────────────────┐
          │        Vector Store             │
          │  (Similarity Search / Hybrid)   │
          └────────────────┬────────────────┘
                           │
                    ┌──────▼───────┐
                    │  Top-K Docs  │
                    │  Retrieved   │
                    └──────┬───────┘
                           │
              ┌────────────▼────────────────┐
              │  Augmented Prompt           │
              │  = System + Context + Query │
              └────────────┬────────────────┘
                           │
                    ┌──────▼───────┐
                    │     LLM      │
                    │   Response   │
                    └──────────────┘
```

#### Key RAG Components

| Component | Options | Considerations |
|-----------|---------|----------------|
| **Chunking** | Fixed-size, semantic, sentence, recursive | Chunk size affects retrieval quality |
| **Embeddings** | OpenAI, Cohere, open-source | Dimension size, multilingual support |
| **Vector Store** | Pinecone, Weaviate, Chroma, pgvector | Scale, latency, cost |
| **Retrieval** | Dense, sparse (BM25), hybrid | Combine semantic + keyword search |
| **Reranking** | Cross-encoders, Cohere Rerank | Improves precision after retrieval |

#### RAG Strategies

- **Naive RAG**: Simple retrieve → generate
- **Advanced RAG**: Query transformation, re-ranking, iterative retrieval
- **Modular RAG**: Composable retrieval pipelines
- **Multi-hop RAG**: Multiple retrieval steps for complex questions
- **Agentic RAG**: Agent decides when and how to retrieve

---

### Part 2: Agents

#### What is an Agent?

- An AI system that can **plan**, **reason**, and **take actions** using tools
- Goes beyond simple Q&A — can break down tasks and execute steps
- Uses the model as a **reasoning engine**, not just a text generator

#### Agent Architecture

```
┌──────────────────────────────────────────┐
│                 AGENT                     │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Planning  │→ │ Reasoning│→ │ Action │ │
│  └──────────┘  └──────────┘  └────────┘ │
│       ↑              ↑           │       │
│       │         ┌────┴────┐      ▼       │
│       │         │ Memory  │  ┌────────┐  │
│       │         └─────────┘  │ Tools  │  │
│       └──────────────────────┤        │  │
│            Observation       │ • Search│  │
│                              │ • Code  │  │
│                              │ • APIs  │  │
│                              │ • DB    │  │
│                              └────────┘  │
└──────────────────────────────────────────┘
```

#### Agent Patterns

- **ReAct**: Reasoning + Acting alternating loop
- **Plan-and-Execute**: Plan all steps first, then execute
- **Tool Use**: Model decides which tools to call and with what params
- **Multi-Agent**: Multiple specialized agents collaborating

#### Evaluating Agents

- Task completion rate
- Number of steps / efficiency
- Tool usage accuracy
- Cost per task
- Failure mode analysis

---

## 📝 My Notes

<!-- Add your own notes, insights, and questions as you read -->



---

## ❓ Questions to Reflect On

1. When is RAG sufficient vs. when do you need finetuning?
2. How do you choose the right chunk size and overlap for your documents?
3. What makes agents reliable enough for production use?
4. How do you handle agent failures gracefully?

---

## 🔗 Key Takeaways

1. 
2. 
3. 

---

## 🛠️ Practice Ideas

- [ ] Build a RAG pipeline with a small document set — measure retrieval quality
- [ ] Compare naive RAG vs. RAG with reranking on the same queries
- [ ] Build a simple agent with 2-3 tools (search, calculator, code exec)
- [ ] Evaluate agent performance: success rate, steps, cost analysis


---

<div align="center">

[⬅️ Previous Chapter](./chapter-05-prompt-engineering.md) | [🏠 Home](./README.md) | [Next Chapter ➡️](./chapter-07-finetuning.md)

</div>

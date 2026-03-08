# 🧠 RAG, Fine-Tuning & LLM Mastery — Practical README

> A comprehensive guide to **Retrieval-Augmented Generation (RAG)**, **Fine-Tuning**, **Prompt Engineering**, and related LLM concepts — with architecture diagrams, code examples, decision frameworks, and interview-ready explanations.  
> *Last updated: March 2026*

---

## 📑 Table of Contents

| # | Section | What you'll learn |
|---|---------|-------------------|
| 1 | [The Big Picture](#1-the-big-picture) | How RAG, fine-tuning, and prompt engineering fit together |
| 2 | [Vector Embeddings](#2-vector-embeddings--semantic-search) | How text becomes math the model can search |
| 3 | [RAG Architecture](#3-rag-architecture) | End-to-end retrieval-augmented generation pipeline |
| 4 | [Advanced RAG Techniques](#4-advanced-rag-techniques) | Reranking, query rewriting, hybrid search, GraphRAG, Agentic RAG |
| 5 | [Chunking Strategies](#5-chunking-strategies) | How to split documents for optimal retrieval |
| 6 | [Fine-Tuning Fundamentals](#6-fine-tuning-fundamentals) | Full fine-tuning, PEFT, LoRA, QLoRA |
| 7 | [Alignment Techniques](#7-alignment-techniques-rlhf--dpo) | RLHF, DPO, and human preference optimization |
| 8 | [RAG vs Fine-Tuning](#8-rag-vs-fine-tuning--decision-framework) | When to use which, and when to combine both |
| 9 | [Prompt Engineering](#9-prompt-engineering) | Zero-shot, few-shot, CoT, system prompts |
| 10 | [The LLM Application Stack](#10-the-llm-application-stack) | Full architecture from model to production |
| 11 | [Code Examples](#11-code-examples) | Python code for RAG, fine-tuning, and prompting |
| 12 | [Evaluation & Metrics](#12-evaluation--metrics) | How to measure RAG and fine-tuning quality |
| 13 | [Common Mistakes](#13-common-mistakes) | Pitfalls to avoid |
| 14 | [Interview-Ready Explanations](#14-interview-ready-explanations) | Concise answers for technical interviews |
| 15 | [Learning Roadmap](#15-learning-roadmap) | Stage-by-stage progression |
| 16 | [Glossary](#16-glossary) | Quick reference for all key terms |

---

## 1) The Big Picture

There are **three main strategies** for making an LLM more useful for your specific needs:

```mermaid
flowchart TB
    LLM["🧠 Base LLM
    (GPT-4, Claude, Llama, Gemini)"]

    LLM --> PE["📝 Prompt Engineering
    Change HOW you ask"]
    LLM --> RAG["📚 RAG
    Give it the RIGHT context"]
    LLM --> FT["⚙️ Fine-Tuning
    Change WHAT it knows / HOW it behaves"]

    PE --> R1["Zero cost
    No training needed
    Quick iteration"]
    RAG --> R2["Moderate cost
    No model change
    Always up-to-date"]
    FT --> R3["Higher cost
    Permanent model change
    Deep domain knowledge"]

    style PE fill:#3498DB,color:#fff
    style RAG fill:#2ECC71,color:#fff
    style FT fill:#E67E22,color:#fff
```

### 💡 One-line intuition for each

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│  📝 Prompt Engineering  →  "Ask smarter questions"                │
│  📚 RAG                 →  "Give the model a cheat sheet"         │
│  ⚙️ Fine-Tuning         →  "Send the model back to school"       │
│                                                                   │
│  🔗 Combine them        →  "Best of all worlds"                   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 🤔 When to use what (quick reference)

| Scenario | Best approach |
|---|---|
| Need latest/real-time data | 📚 RAG |
| Need to change model's tone/style | ⚙️ Fine-tuning |
| Quick experiment, no infra | 📝 Prompt engineering |
| Domain-specific jargon/reasoning | ⚙️ Fine-tuning + 📚 RAG |
| Reduce hallucinations with source citations | 📚 RAG |
| Lower inference latency | ⚙️ Fine-tuning (no retrieval step) |
| Enterprise with proprietary docs | 📚 RAG (data stays in your infra) |

---

## 2) Vector Embeddings & Semantic Search

Before understanding RAG, you need to understand **how text becomes searchable math**.

### What are embeddings?

Embeddings convert unstructured data (text, images, audio) into **dense numerical vectors** — lists of numbers where similar meanings are **close together** in vector space.

```mermaid
flowchart LR
    subgraph INPUT["📄 Text Input"]
        T1["'I love programming'"]
        T2["'I enjoy coding'"]
        T3["'The weather is nice'"]
    end

    subgraph MODEL["🧠 Embedding Model"]
        EM["text-embedding-3-small
        or sentence-transformers"]
    end

    subgraph OUTPUT["📊 Vector Space"]
        V1["[0.12, 0.85, -0.33, ...]"]
        V2["[0.14, 0.82, -0.31, ...]"]
        V3["[-0.67, 0.22, 0.91, ...]"]
    end

    T1 --> EM --> V1
    T2 --> EM --> V2
    T3 --> EM --> V3

    V1 -.-|"cosine sim = 0.97 ✅"| V2
    V1 -.-|"cosine sim = 0.23 ❌"| V3
```

### 🔍 Keyword search vs Semantic search

```
┌─────────────────────────────────┬──────────────────────────────────┐
│  🔤 Keyword Search (BM25)       │  🧠 Semantic Search (Vectors)    │
├─────────────────────────────────┼──────────────────────────────────┤
│  Matches exact words            │  Matches meaning/intent          │
│  "car" ≠ "automobile"          │  "car" ≈ "automobile" ✅          │
│  Fast, simple                   │  More compute, richer results    │
│  Great for precise terms        │  Great for natural questions     │
│  No understanding of context    │  Understands paraphrasing        │
├─────────────────────────────────┴──────────────────────────────────┤
│  💡 BEST PRACTICE: Use HYBRID SEARCH (combine both)               │
│     BM25 for precision + vectors for semantic recall              │
└───────────────────────────────────────────────────────────────────┘
```

### 🗄️ Popular vector databases

| Database | Type | Key features |
|---|---|---|
| **Pinecone** | Managed cloud | Fully managed, scales to billions |
| **Weaviate** | Open-source | Hybrid search, multimodal |
| **Qdrant** | Open-source | Rust-based, fast, filtered search |
| **Chroma** | Open-source | Lightweight, great for prototyping |
| **Milvus** | Open-source | Enterprise-grade, GPU acceleration |
| **PostgreSQL + pgvector** | Extension | Familiar SQL, good for small-medium scale |
| **Elasticsearch** | Hybrid | Dense + sparse vectors, k-NN search |

### Similarity metrics

```
 Cosine Similarity  →  Measures angle between vectors (most common)
 Euclidean Distance →  Measures straight-line distance
 Dot Product        →  Measures both magnitude and direction
 
 💡 Use cosine similarity for text. It normalizes for length,
    so short and long texts can still match well.
```

---

## 3) RAG Architecture

RAG = **Retrieval-Augmented Generation**. It gives the LLM access to external knowledge **at inference time** without changing the model's weights.

### 🏗️ End-to-end RAG pipeline

```mermaid
flowchart TB
    subgraph INGESTION["📥 Ingestion Pipeline (offline)"]
        direction TB
        D["📄 Documents
        PDFs, docs, APIs, DBs"]
        D --> CH["✂️ Chunking
        Split into chunks"]
        CH --> EM["🧠 Embedding Model
        text → vectors"]
        EM --> VDB["🗄️ Vector Database
        Store embeddings + metadata"]
    end

    subgraph RETRIEVAL["🔍 Retrieval Pipeline (runtime)"]
        direction TB
        Q["❓ User Query"]
        Q --> QE["🧠 Query Embedding
        query → vector"]
        QE --> SS["🔎 Similarity Search
        Find top-K chunks"]
        SS --> RR["📊 Reranker (optional)
        Re-score for relevance"]
    end

    subgraph GENERATION["💬 Generation Pipeline (runtime)"]
        direction TB
        CTX["📋 Context Assembly
        Query + retrieved chunks"]
        CTX --> LLM["🧠 LLM
        Generate grounded answer"]
        LLM --> ANS["✅ Answer
        With source citations"]
    end

    VDB -.->|"indexed vectors"| SS
    RR --> CTX

    style INGESTION fill:#1a1a2e,color:#fff
    style RETRIEVAL fill:#16213e,color:#fff
    style GENERATION fill:#0f3460,color:#fff
```

### 🔄 Step-by-step RAG flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant APP as 🖥️ Application
    participant EMB as 🧠 Embedding Model
    participant VDB as 🗄️ Vector DB
    participant LLM as 🧠 LLM

    U->>APP: "What's our refund policy?"
    APP->>EMB: Embed query
    EMB-->>APP: Query vector [0.23, 0.87, ...]
    APP->>VDB: Similarity search (top 5)
    VDB-->>APP: 5 relevant chunks + metadata

    Note over APP: Assemble prompt with context
    APP->>LLM: System: "Answer using only the provided context"<br/>Context: [5 chunks]<br/>Question: "What's our refund policy?"
    LLM-->>APP: "Our refund policy allows returns within 30 days..."
    APP-->>U: Answer + source citations
```

### Why RAG works

| Problem with base LLMs | How RAG solves it |
|---|---|
| **Knowledge cutoff** — model doesn't know recent info | Retrieves from updated knowledge base |
| **Hallucinations** — model confidently makes things up | Grounds answers in real documents |
| **No access to private data** — model never saw your docs | Retrieves from your private knowledge base |
| **No source attribution** — "trust me bro" | Can cite exact documents and passages |
| **Expensive to update** — retraining costs $$$  | Just update the knowledge base |

---

## 4) Advanced RAG Techniques

Basic RAG (query → retrieve → generate) has limitations. Advanced techniques address them:

### 🗺️ Advanced RAG landscape

```mermaid
flowchart TB
    BASIC["📦 Basic RAG
    query → retrieve → generate"] --> ADV["🚀 Advanced RAG"]

    ADV --> QR["🔄 Query Enhancement"]
    ADV --> RE["📊 Better Retrieval"]
    ADV --> GEN["🧠 Better Generation"]
    ADV --> ARCH["🏗️ Architecture Patterns"]

    QR --> QR1["Query rewriting (LLM reformulates)"]
    QR --> QR2["Query expansion (add related terms)"]
    QR --> QR3["HyDE (hypothetical document)"]

    RE --> RE1["Hybrid search (BM25 + vector)"]
    RE --> RE2["Reranking (cross-encoder rescoring)"]
    RE --> RE3["Metadata filtering (date, author, type)"]
    RE --> RE4["Context compression (remove noise)"]

    GEN --> GEN1["Self-consistency (multiple paths)"]
    GEN --> GEN2["Source grounding (enforce citations)"]
    GEN --> GEN3["Answer verification (fact-check loop)"]

    ARCH --> A1["🕸️ GraphRAG"]
    ARCH --> A2["🤖 Agentic RAG"]
    ARCH --> A3["📸 Multimodal RAG"]
    ARCH --> A4["💾 Memory-Augmented RAG"]
```

### 🔑 Key techniques explained

#### 🔄 Query rewriting
The user's raw query is often suboptimal for retrieval. An LLM **rewrites** the query before searching.

```
User query:    "why is my app slow?"
Rewritten:     "common causes of application performance degradation 
                in microservices architecture including database latency 
                and memory leaks"
```

#### 📊 Reranking
Initial retrieval finds ~20 candidates. A **cross-encoder reranker** (like Cohere Rerank or a fine-tuned model) rescores them for relevance, keeping only the best 3-5.

```mermaid
flowchart LR
    Q["❓ Query"] --> BI["🔎 Bi-encoder
    Fast, approximate
    Retrieve 20 docs"]
    BI --> RR["📊 Cross-encoder
    Slow, accurate
    Rescore all 20"]
    RR --> TOP["✅ Top 3-5 docs
    Highly relevant"]
```

#### 🔀 HyDE (Hypothetical Document Embeddings)
Instead of embedding the query, ask the LLM to generate a **hypothetical answer**, then embed *that* to find similar real documents.

```
Query: "How does Kafka ensure message ordering?"

Step 1: LLM generates hypothetical answer:
  "Kafka ensures message ordering within a partition by assigning
   monotonically increasing offsets. Producers can specify partition 
   keys to ensure related messages go to the same partition..."

Step 2: Embed this hypothetical answer → search vector DB
  (Better semantic match than the short query alone)
```

#### 🕸️ GraphRAG
Uses a **knowledge graph** instead of (or alongside) flat text chunks. Entities and relationships enable **multi-hop reasoning**.

```mermaid
flowchart LR
    subgraph KG["🕸️ Knowledge Graph"]
        E1["Kafka"] -->|"uses"| E2["ZooKeeper"]
        E1 -->|"has"| E3["Partitions"]
        E3 -->|"ensures"| E4["Message Ordering"]
        E1 -->|"supports"| E5["Exactly-once Semantics"]
        E5 -->|"requires"| E6["Idempotent Producer"]
    end

    Q["❓ 'How does Kafka
    ensure ordering?'"] --> KG
    KG -->|"traverse relationships"| ANS["Kafka → Partitions → Message Ordering
    (structured reasoning path)"]
```

#### 🤖 Agentic RAG
An **autonomous agent** orchestrates retrieval: it plans, retrieves, evaluates, and iterates until it has enough context.

```mermaid
sequenceDiagram
    participant Q as ❓ Query
    participant A as 🤖 Agent
    participant R as 🔍 Retriever
    participant LLM as 🧠 LLM

    Q->>A: Complex question
    A->>A: Plan: "I need info about X and Y"
    A->>R: Search for X
    R-->>A: Results for X
    A->>A: Evaluate: "Sufficient for X? Yes. Now need Y"
    A->>R: Search for Y
    R-->>A: Results for Y
    A->>A: Evaluate: "Need more detail on Y.sub_topic"
    A->>R: Refined search for Y.sub_topic
    R-->>A: Better results
    A->>LLM: All collected context + query
    LLM-->>A: Comprehensive answer
```

#### 📸 Multimodal RAG
Retrieves and reasons across **text, images, tables, and diagrams** — not just plain text.

#### 💾 Memory-Augmented RAG
Adds **conversation history** to the retrieval context, enabling multi-turn dialogue where the model remembers previous answers.

---

## 5) Chunking Strategies

How you split documents into chunks **dramatically affects** retrieval quality.

### 📐 Chunking comparison

```mermaid
flowchart TB
    DOC["📄 Full Document"] --> CS["✂️ Chunking Strategies"]

    CS --> FIX["📏 Fixed-size
    Split every N tokens"]
    CS --> SENT["📝 Sentence-based
    Respect sentence boundaries"]
    CS --> STRUCT["📑 Structure-based
    Use headings/paragraphs"]
    CS --> SEM["🧠 Semantic
    Group by meaning"]

    FIX --> FIX1["✅ Simple, predictable
    ❌ May cut mid-sentence"]
    SENT --> SENT1["✅ Natural boundaries
    ❌ Variable sizes"]
    STRUCT --> STRUCT1["✅ Preserves document structure
    ❌ Depends on formatting"]
    SEM --> SEM1["✅ Most semantically coherent
    ❌ Most complex to implement"]
```

### 📊 Chunking strategy details

| Strategy | Chunk size | Overlap | Best for |
|---|---|---|---|
| **Fixed token window** | 200-400 tokens | 10-20% overlap | General purpose, quick setup |
| **Sentence-based** | Group sentences to ~300 tokens | Full sentence overlap | Well-written prose, articles |
| **Paragraph/heading** | Natural paragraphs | None (natural boundaries) | Structured documents (docs, wikis) |
| **Semantic chunking** | Variable | Based on similarity threshold | Complex documents, technical content |
| **Recursive splitting** | Hierarchical (try paragraphs → sentences → words) | Configurable | Mixed document types |

### ⚖️ The chunk size tradeoff

```
 Too small (50-100 tokens)          Too large (1000+ tokens)
 ┌──────────────────────┐          ┌──────────────────────┐
 │ ✅ Precise retrieval  │          │ ✅ More context       │
 │ ❌ Missing context    │          │ ❌ Noisy retrieval    │
 │ ❌ Fragmented meaning │          │ ❌ Diluted relevance  │
 │ ❌ More API calls     │          │ ❌ Hits context limits│
 └──────────────────────┘          └──────────────────────┘
                     
                 🎯 Sweet spot: 200-500 tokens
                    (experiment for your domain)
```

### 💡 Chunking best practices

```
 ✅  Always add metadata (source, page, section, date)
 ✅  Use overlap (10-20%) to prevent context loss at boundaries
 ✅  Match chunk size to your embedding model's optimal input
 ✅  Test with your actual queries — there's no universal best
 ✅  Consider parent-child chunking: small chunks for retrieval,
     return the parent (larger context) for generation
```

---

## 6) Fine-Tuning Fundamentals

Fine-tuning **modifies the model's weights** so it internalizes domain knowledge, tone, or behavior.

### 🎯 Full fine-tuning vs PEFT

```mermaid
flowchart TB
    FT["⚙️ Fine-Tuning Approaches"] --> FULL["💪 Full Fine-Tuning
    Update ALL parameters"]
    FT --> PEFT["🎯 PEFT
    Update SMALL subset"]

    FULL --> FULL1["✅ Maximum performance
    ❌ Massive compute needed
    ❌ Need full model copy
    ❌ Risk of catastrophic forgetting"]

    PEFT --> LORA["🔧 LoRA"]
    PEFT --> QLORA["📦 QLoRA"]
    PEFT --> ADAPT["🔌 Adapter layers"]
    PEFT --> PREFIX["📝 Prefix tuning"]

    style FULL fill:#E74C3C,color:#fff
    style PEFT fill:#2ECC71,color:#fff
```

### 🔧 LoRA — How it works

**LoRA (Low-Rank Adaptation)** freezes all original model weights and injects small trainable matrices into specific layers.

```mermaid
flowchart LR
    subgraph ORIGINAL["Original Weight Matrix W"]
        W["W (frozen)
        d × d dimensions
        e.g., 4096 × 4096"]
    end

    subgraph LORA["LoRA Adapters"]
        A["A matrix
        d × r
        (4096 × 16)"]
        B["B matrix
        r × d
        (16 × 4096)"]
        A -->|"multiply"| B
    end

    W --> ADD["➕ W + AB"]
    B --> ADD

    ADD --> OUT["Output
    W' = W + AB"]
```

```
┌─────────────────────────────────────────────────────────────────┐
│  LoRA Key Insight                                               │
│  ─────────────────                                              │
│  Original: 4096 × 4096 = 16.7M parameters per layer            │
│  LoRA:     4096 × 16 + 16 × 4096 = 131K parameters per layer   │
│                                                                  │
│  That's ~128× fewer trainable parameters!                       │
│  r (rank) is a hyperparameter: typically 4, 8, 16, or 32       │
└─────────────────────────────────────────────────────────────────┘
```

### 📦 QLoRA — LoRA + Quantization

QLoRA makes fine-tuning even more accessible by **quantizing the base model to 4-bit** before applying LoRA:

```mermaid
flowchart LR
    BASE["🧠 Base Model
    (16-bit, 26 GB for 7B)"] -->|"Quantize to 4-bit"| Q4["📦 Quantized Model
    (4-bit, ~3.5 GB for 7B)"]
    Q4 -->|"+ LoRA adapters"| TRAINABLE["🔧 Trainable
    Only adapter parameters
    ~0.1% of total"]

    style Q4 fill:#9B59B6,color:#fff
    style TRAINABLE fill:#2ECC71,color:#fff
```

### 📊 Fine-tuning methods comparison

| Method | Trainable params | GPU memory | Training time | Performance |
|---|---|---|---|---|
| **Full fine-tuning** | 100% | Very high (4-8× A100s) | Days-weeks | 🏆 Best (theoretical) |
| **LoRA** | ~0.1-1% | Moderate (1× A100) | Hours-days | 🥈 Near full FT |
| **QLoRA** | ~0.1-1% | Low (1× consumer GPU) | Hours-days | 🥉 Slightly below LoRA |
| **Adapter layers** | ~1-5% | Moderate | Hours | Good for classification |
| **Prefix tuning** | ~0.1% | Low | Hours | Good for generation |

### When to fine-tune

```
 ✅ Fine-tune when you need to:
    • Change the model's tone/style/personality permanently
    • Teach domain-specific jargon and reasoning patterns
    • Improve performance on a narrow, well-defined task
    • Reduce inference cost (fine-tuned model needs shorter prompts)
    • Enforce specific output formats consistently

 ❌ Don't fine-tune when:
    • Your data changes frequently (use RAG instead)
    • You need source attribution (use RAG instead)
    • You have very little training data (<100 examples)
    • A good prompt can solve the problem (try prompt engineering first)
```

---

## 7) Alignment Techniques: RLHF & DPO

After initial training/fine-tuning, models need **alignment** — teaching them to produce outputs humans actually prefer.

### 🔄 RLHF (Reinforcement Learning from Human Feedback)

```mermaid
flowchart TB
    subgraph S1["Phase 1: Supervised Fine-Tuning"]
        SFT["Train on high-quality
        instruction-response pairs"]
    end

    subgraph S2["Phase 2: Reward Model Training"]
        direction TB
        PAIRS["Human annotators compare
        output pairs: A vs B"]
        PAIRS --> RM["🏅 Reward Model
        Learns to score responses
        based on human preferences"]
    end

    subgraph S3["Phase 3: RL Optimization (PPO)"]
        direction TB
        GEN["Model generates response"]
        GEN --> SCORE["Reward model scores it"]
        SCORE --> UPDATE["Update policy to maximize
        reward while staying close
        to original model (KL penalty)"]
        UPDATE -->|"iterate"| GEN
    end

    S1 --> S2 --> S3

    style S1 fill:#3498DB,color:#fff
    style S2 fill:#E67E22,color:#fff
    style S3 fill:#E74C3C,color:#fff
```

### 🎯 DPO (Direct Preference Optimization)

DPO simplifies RLHF by **eliminating the reward model entirely**:

```mermaid
flowchart LR
    subgraph RLHF_FLOW["🔄 RLHF (complex)"]
        direction TB
        RH1["Preference data"] --> RH2["Train reward model"] --> RH3["RL with PPO"] --> RH4["Updated model"]
    end

    subgraph DPO_FLOW["🎯 DPO (simple)"]
        direction TB
        D1["Preference data"] --> D2["Direct optimization
        (supervised learning)"] --> D3["Updated model"]
    end
```

### RLHF vs DPO comparison

| Feature | RLHF | DPO |
|---|---|---|
| **Complexity** | High (3 phases, RL loop) | Low (single training phase) |
| **Reward model needed?** | ✅ Yes | ❌ No |
| **Stability** | Sensitive to hyperparameters | More stable |
| **Compute cost** | High | Lower (~50% of RLHF) |
| **Implementation** | Complex (PPO is tricky) | Simple (supervised loss) |
| **Performance** | Excellent with good reward model | Comparable or slightly better |
| **2025 trend** | Still used for complex cases | **Becoming the default** |

### 💡 Practical recommendation (2025)

```
┌───────────────────────────────────────────────────────────┐
│  The winning combo in 2025:                               │
│                                                           │
│  1. SFT (Supervised Fine-Tuning) on your task data        │
│  2. QLoRA to keep compute manageable                      │
│  3. DPO for preference alignment                          │
│                                                           │
│  This gives you domain expertise + aligned behavior       │
│  on a single consumer GPU (24-48 GB VRAM)                 │
└───────────────────────────────────────────────────────────┘
```

---

## 8) RAG vs Fine-Tuning — Decision Framework

### 🎯 Decision flowchart

```mermaid
flowchart TD
    START["🤔 How should I customize
    my LLM?"] --> Q1{"Does your data
    change frequently?"}

    Q1 -->|"Yes"| RAG["📚 Use RAG"]
    Q1 -->|"No"| Q2{"Need to change model's
    behavior/style/format?"}

    Q2 -->|"Yes"| FT["⚙️ Use Fine-Tuning"]
    Q2 -->|"No"| Q3{"Need source
    citations?"}

    Q3 -->|"Yes"| RAG
    Q3 -->|"No"| Q4{"Is a good prompt
    sufficient?"}

    Q4 -->|"Yes"| PE["📝 Prompt Engineering"]
    Q4 -->|"No"| HYBRID["🔗 Use RAG + Fine-Tuning"]

    style RAG fill:#2ECC71,color:#fff
    style FT fill:#E67E22,color:#fff
    style PE fill:#3498DB,color:#fff
    style HYBRID fill:#9B59B6,color:#fff
```

### 📊 Head-to-head comparison

| Dimension | 📚 RAG | ⚙️ Fine-Tuning |
|---|---|---|
| **How it works** | Retrieves external data at query time | Modifies model weights permanently |
| **Data freshness** | ✅ Always up-to-date (update KB) | ❌ Locked at training time |
| **Cost** | ✅ Lower (no training, just infra) | ❌ Higher (GPU training costs) |
| **Setup time** | ✅ Hours-days | ❌ Days-weeks |
| **Latency** | ❌ Higher (retrieval step) | ✅ Lower (no retrieval) |
| **Source citations** | ✅ Built-in | ❌ Not natively supported |
| **Behavior change** | ❌ Limited (can't change style) | ✅ Full control over tone/format |
| **Domain knowledge** | Surface-level (retrieves, doesn't internalize) | ✅ Deep internalization |
| **Hallucination risk** | ✅ Lower (grounded in docs) | ❌ Can still hallucinate |
| **Data requirement** | Knowledge base (any format) | Curated training dataset |
| **Privacy** | ✅ Data stays in your infra | ❌ Data used in training |

### 🔗 The Hybrid Approach (2025 best practice)

The most sophisticated systems in 2025 combine both:

```mermaid
flowchart LR
    subgraph FINETUNE["⚙️ Fine-Tuning Layer"]
        FT["Fine-tune for:
        • Domain jargon
        • Output format (JSON, markdown)
        • Brand voice/tone
        • Reasoning patterns"]
    end

    subgraph RAG_LAYER["📚 RAG Layer"]
        RAG["RAG provides:
        • Current product data
        • Policy documents
        • Real-time pricing
        • Source citations"]
    end

    FT --> COMBINED["🧠 Combined System
    Deep domain understanding
    + current, cited knowledge"]
    RAG --> COMBINED
```

**Example**: A legal AI assistant:
- **Fine-tuned** on legal reasoning patterns, citation formats, and case law terminology
- **RAG** retrieves the latest statutes, case law, and firm-specific briefs at query time

---

## 9) Prompt Engineering

Prompt engineering is the art of crafting inputs to get the best outputs from an LLM — **no training required**.

### 📊 Technique overview

```mermaid
flowchart TB
    PE["📝 Prompt Engineering"] --> BASIC["🔤 Basic Techniques"]
    PE --> ADV["🧠 Advanced Techniques"]
    PE --> SYS["⚙️ System Prompts"]

    BASIC --> ZS["Zero-shot
    Direct instruction, no examples"]
    BASIC --> FS["Few-shot
    Include input-output examples"]

    ADV --> COT["Chain-of-Thought (CoT)
    'Think step by step'"]
    ADV --> TOT["Tree-of-Thoughts
    Explore multiple reasoning paths"]
    ADV --> SC["Self-consistency
    Generate multiple, pick best"]
    ADV --> PC["Prompt chaining
    Output of one → input of next"]

    SYS --> ROLE["Role definition"]
    SYS --> CONST["Constraints & rules"]
    SYS --> FMT["Format specification"]
```

### 🔤 Zero-shot prompting

Direct instruction without examples. Relies on the model's pre-trained knowledge.

```
 ┌──────────────────────────────────────────────────────────┐
 │  Prompt:                                                  │
 │  "Classify this customer email as positive, negative,     │
 │  or neutral: 'The product arrived late but works great'"  │
 │                                                           │
 │  Output: "Mixed/Neutral — negative delivery experience,   │
 │  positive product satisfaction"                            │
 └──────────────────────────────────────────────────────────┘
```

**Best for**: Simple, well-defined tasks. Quick prototyping.

### 📋 Few-shot prompting

Include **examples** in the prompt to show the model the desired format and reasoning:

```
 ┌──────────────────────────────────────────────────────────┐
 │  Prompt:                                                  │
 │                                                           │
 │  Classify customer emails:                                │
 │                                                           │
 │  Email: "Love it! Best purchase ever!"                    │
 │  Classification: POSITIVE                                 │
 │                                                           │
 │  Email: "It broke on day one. Want a refund."             │
 │  Classification: NEGATIVE                                 │
 │                                                           │
 │  Email: "The product arrived late but works great"        │
 │  Classification:                                          │
 │                                                           │
 │  Output: MIXED                                            │
 └──────────────────────────────────────────────────────────┘
```

**Best for**: Tasks where format/style matters. When zero-shot isn't accurate enough.

### 🧠 Chain-of-Thought (CoT) prompting

Ask the model to **show its reasoning step by step**. Dramatically improves accuracy on math, logic, and multi-step problems.

```
 ┌──────────────────────────────────────────────────────────┐
 │  ❌ Without CoT:                                          │
 │  Q: "If a shirt costs ₹800 and is 25% off, what's the   │
 │  price after 18% GST on the discounted price?"           │
 │  A: "₹629"  (wrong!)                                     │
 │                                                           │
 │  ✅ With CoT:                                              │
 │  Q: "...Think step by step."                              │
 │  A: "Step 1: Original price = ₹800                        │
 │      Step 2: Discount = 25% of 800 = ₹200                │
 │      Step 3: Discounted price = 800 - 200 = ₹600         │
 │      Step 4: GST = 18% of 600 = ₹108                     │
 │      Step 5: Final price = 600 + 108 = ₹708"  ✅         │
 └──────────────────────────────────────────────────────────┘
```

### 🌳 Tree-of-Thoughts (ToT)

For complex planning, explore **multiple reasoning paths** and evaluate each:

```mermaid
flowchart TB
    Q["❓ Complex Problem"] --> P1["Path 1: Approach A"]
    Q --> P2["Path 2: Approach B"]
    Q --> P3["Path 3: Approach C"]

    P1 --> E1["Evaluate: 4/10"]
    P2 --> E2["Evaluate: 8/10 ✅"]
    P3 --> E3["Evaluate: 6/10"]

    E2 --> D1["Deepen path B"]
    D1 --> D2["Sub-step B.1"]
    D1 --> D3["Sub-step B.2 ✅"]
    D3 --> FINAL["Final answer"]
```

### ⚙️ System prompt best practices

```
 ✅  Define a clear role and persona
     "You are a senior Java backend engineer with 10 years of experience..."

 ✅  Set explicit output format
     "Respond in JSON with keys: analysis, recommendation, confidence"

 ✅  Include constraints and boundaries
     "Never make up statistics. If unsure, say 'I don't know'."

 ✅  Provide guidelines and anti-patterns
     "Use strong, specific verbs. Avoid vague phrases like 'it depends'."

 ✅  Use delimiters for sections
     "Context will be enclosed in <context></context> tags."

 ✅  Add examples of desired output
     "Here is an example of a good response: ..."
```

---

## 10) The LLM Application Stack

How all these concepts fit together in a production system:

```mermaid
flowchart TB
    subgraph USER_LAYER["👤 User Interface Layer"]
        UI["Chat UI / API / CLI"]
    end

    subgraph ORCHESTRATION["🎼 Orchestration Layer"]
        AG["Agent / Chain
        (LangChain, LlamaIndex, custom)"]
        PE["Prompt Templates
        + System Prompts"]
        MEM["Memory / History
        (conversation context)"]
    end

    subgraph RETRIEVAL_LAYER["🔍 Retrieval Layer (RAG)"]
        EMB["Embedding Model"]
        VDB["Vector Database"]
        RR["Reranker"]
        META["Metadata Store"]
    end

    subgraph MODEL_LAYER["🧠 Model Layer"]
        BASE["Base LLM
        (GPT-4, Claude, Llama)"]
        FT["Fine-Tuned Model
        (LoRA adapters)"]
        GUARD["Guardrails
        (input/output filters)"]
    end

    subgraph DATA_LAYER["📦 Data Layer"]
        DOCS["Documents"]
        APIs["External APIs"]
        DBS["Databases"]
        KG["Knowledge Graphs"]
    end

    UI --> AG
    AG --> PE
    AG --> MEM
    AG --> EMB
    EMB --> VDB
    VDB --> RR
    AG --> BASE
    AG --> FT
    BASE --> GUARD
    FT --> GUARD
    DATA_LAYER --> RETRIEVAL_LAYER

    style USER_LAYER fill:#3498DB,color:#fff
    style ORCHESTRATION fill:#9B59B6,color:#fff
    style RETRIEVAL_LAYER fill:#2ECC71,color:#fff
    style MODEL_LAYER fill:#E67E22,color:#fff
    style DATA_LAYER fill:#1ABC9C,color:#fff
```

---

## 11) Code Examples

### 📚 Basic RAG with Python

```python
# ── RAG Pipeline using LangChain + ChromaDB ──────────

from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA

# ============================
# Step 1: Load & chunk documents
# ============================
loader = TextLoader("company_policies.txt")
documents = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # ~500 tokens per chunk
    chunk_overlap=50,    # 50 token overlap for context continuity
    separators=["\n\n", "\n", ". ", " "],  # Try paragraph → sentence → word
)
chunks = splitter.split_documents(documents)
print(f"Split into {len(chunks)} chunks")

# ============================
# Step 2: Embed & store in vector DB
# ============================
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# ============================
# Step 3: Query with RAG
# ============================
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # stuff = inject all retrieved chunks into prompt
    retriever=vectorstore.as_retriever(
        search_kwargs={"k": 5}  # retrieve top 5 chunks
    ),
    return_source_documents=True,
)

result = qa_chain.invoke({"query": "What is our refund policy?"})
print(result["result"])
for doc in result["source_documents"]:
    print(f"  Source: {doc.metadata['source']}")
```

### ⚙️ Fine-Tuning with QLoRA

```python
# ── QLoRA Fine-Tuning with Hugging Face + PEFT ──────

from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    BitsAndBytesConfig,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset
import torch

# ============================
# Step 1: Load model in 4-bit (QLoRA)
# ============================
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",          # NormalFloat4 quantization
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,     # Double quantization for even less memory
)

model_name = "meta-llama/Llama-3.2-3B-Instruct"
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
)
tokenizer = AutoTokenizer.from_pretrained(model_name)

# ============================
# Step 2: Configure LoRA adapters
# ============================
model = prepare_model_for_kbit_training(model)

lora_config = LoraConfig(
    r=16,               # Rank — higher = more capacity, more memory
    lora_alpha=32,       # Scaling factor
    target_modules=[     # Which layers to adapt
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# → "trainable params: 13.1M || all params: 3.21B || trainable%: 0.41%"

# ============================
# Step 3: Train
# ============================
dataset = load_dataset("your-dataset", split="train")

training_args = TrainingArguments(
    output_dir="./lora-finetuned",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    fp16=True,
    logging_steps=10,
    save_strategy="epoch",
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    tokenizer=tokenizer,
)
trainer.train()

# ============================
# Step 4: Save & load adapter
# ============================
model.save_pretrained("./my-lora-adapter")
# Only the adapter weights are saved (~50 MB vs ~6 GB for full model)
```

### 📝 Prompt engineering examples

```python
# ── Prompt Engineering Patterns ──────────────────────

# Zero-shot
zero_shot = """Classify the following text as POSITIVE, NEGATIVE, or NEUTRAL.
Text: "The new update made the app much slower"
Classification:"""

# Few-shot  
few_shot = """Classify customer feedback.

Text: "Absolutely love it!" → POSITIVE
Text: "Worst purchase ever" → NEGATIVE  
Text: "It's okay, nothing special" → NEUTRAL

Text: "Great features but buggy interface" → """

# Chain-of-Thought
cot_prompt = """Solve this step by step:

A Kafka cluster has 3 brokers and a topic with 12 partitions.
If consumer group A has 4 consumers and consumer group B has 6 consumers,
how many partitions does each consumer in each group handle?

Think through this step by step:"""

# System prompt for a backend engineering assistant
system_prompt = """You are a senior Java/Spring Boot backend engineer 
with 10+ years of experience in distributed systems, Kafka, and AWS.

Rules:
- Always consider scalability, reliability, and security
- Use industry-standard patterns (CQRS, event sourcing, saga pattern)
- Provide code examples in Java 21+ with Spring Boot 3.x
- When suggesting architecture, include trade-offs
- Never guess — if unsure, explicitly say so
- Format code with clear comments

Output format:
1. Brief analysis of the problem
2. Recommended approach with justification
3. Code example (if applicable)
4. Trade-offs and considerations"""
```

---

## 12) Evaluation & Metrics

### 📚 RAG evaluation metrics

```mermaid
flowchart TB
    EVAL["📊 RAG Evaluation"] --> RET["🔍 Retrieval Quality"]
    EVAL --> GEN["💬 Generation Quality"]

    RET --> R1["Precision@K
    What % of retrieved docs are relevant?"]
    RET --> R2["Recall@K
    What % of relevant docs were retrieved?"]
    RET --> R3["MRR (Mean Reciprocal Rank)
    How high is the first relevant result?"]
    RET --> R4["NDCG
    Quality of ranking order"]

    GEN --> G1["Faithfulness
    Is the answer grounded in context?"]
    GEN --> G2["Answer Relevancy
    Does it answer the question?"]
    GEN --> G3["Hallucination Rate
    % of claims not in context"]
    GEN --> G4["RAGAS Score
    Combined RAG quality metric"]
```

### ⚙️ Fine-tuning evaluation

| Metric | What it measures | Tools |
|---|---|---|
| **Perplexity** | How surprised the model is by test data (lower = better) | Built into training |
| **BLEU / ROUGE** | Overlap with reference outputs | `evaluate` library |
| **Human eval** | Real humans rate quality | Labeling platform |
| **Task-specific accuracy** | Correct answers on your test set | Custom eval script |
| **Win rate** | % of time fine-tuned beats base in A/B test | Side-by-side comparison |

### 📊 The evaluation pyramid

```
                    ┌───────────────┐
                    │  Human Eval   │  Most reliable, most expensive
                    │  (gold std)   │
                ┌───┴───────────────┴───┐
                │  LLM-as-Judge         │  Use GPT-4 / Claude to evaluate
                │  (scalable + cheap)   │
            ┌───┴───────────────────────┴───┐
            │  Automated Metrics            │  BLEU, ROUGE, RAGAS, etc.
            │  (fast + free)                │
        ┌───┴───────────────────────────────┴───┐
        │  Retrieval Metrics                    │  Precision, Recall, MRR
        │  (RAG-specific, measure pipeline)     │
        └───────────────────────────────────────┘
```

---

## 13) Common Mistakes

```
 ❌  Jumping to fine-tuning before trying RAG or prompt engineering
     → Try the cheapest approach first, escalate only if needed

 ❌  Using tiny chunks without overlap
     → Results in fragmented, context-less retrieval

 ❌  Ignoring metadata in your vector DB
     → Metadata filtering is one of the biggest accuracy boosters

 ❌  Not evaluating retrieval quality separately from generation
     → Bad retrieval = bad answers, regardless of LLM quality

 ❌  Fine-tuning on too little data
     → Need at minimum ~100-500 high-quality examples

 ❌  Not using hybrid search (BM25 + vector)
     → Pure vector search misses exact-match scenarios

 ❌  Stuffing too much context into the prompt
     → More context ≠ better answers. Use reranking to filter

 ❌  Treating RAG as set-and-forget
     → Need continuous evaluation, feedback loops, and KB updates

 ❌  Ignoring the chunk size ↔ embedding model relationship
     → Match your chunk size to your embedding model's sweet spot

 ❌  Using RLHF when DPO would suffice
     → DPO is simpler, more stable, and often better in practice

 ❌  Not having a system prompt
     → System prompts are the highest-leverage prompt engineering tool
```

---

## 14) Interview-Ready Explanations

### "What is RAG?"

> RAG connects an LLM to an external knowledge base at query time. When a user asks a question, the system embeds the query, searches a vector database for relevant document chunks, and injects them as context into the LLM's prompt — so the model answers based on real, citable data rather than its training knowledge alone.

### "How is RAG different from fine-tuning?"

> RAG gives the model **access to information** at query time without changing it. Fine-tuning **changes the model itself** by modifying its weights. RAG is like giving someone a reference book during an exam; fine-tuning is like making them study the material beforehand. In 2025, the best systems combine both: fine-tune for behavior/style, RAG for fresh knowledge.

### "What is LoRA?"

> LoRA freezes all the original model weights and injects small trainable matrices into specific layers. These low-rank adapter matrices have ~100-1000× fewer parameters than the full model. This means you can fine-tune a 7B parameter model on a single consumer GPU and store the adapter in ~50MB instead of ~14GB.

### "Explain embeddings to a non-ML person"

> Embeddings convert text into lists of numbers where similar meanings are close together, like coordinates on a map. "happy" and "joyful" would be near each other, while "happy" and "database" would be far apart. This lets computers understand that two differently-worded sentences can mean the same thing.

### "When would you use RAG vs fine-tuning vs prompt engineering?"

> Start with **prompt engineering** — it's free and instant. If the model lacks knowledge, add **RAG** — it retrieves the right context without retraining. If the model's *behavior* or *style* needs to change (jargon, format, personality), then **fine-tune**. For complex production systems, use **all three**: fine-tune the base behavior, RAG for fresh knowledge, and careful prompts to orchestrate the flow.

### "What is Chain-of-Thought prompting?"

> Chain-of-Thought asks the model to break down complex problems into intermediate reasoning steps before giving a final answer — literally "think step by step." This dramatically improves accuracy on math, logic, and multi-step problems because the model allocates compute to each sub-step rather than jumping to a conclusion.

---

## 15) Learning Roadmap

```mermaid
flowchart LR
    S1["🎯 Stage 1
    FOUNDATIONS"] --> S2["📚 Stage 2
    BUILD RAG"] --> S3["⚙️ Stage 3
    FINE-TUNING"] --> S4["🚀 Stage 4
    PRODUCTION"]

    style S1 fill:#3498DB,color:#fff
    style S2 fill:#2ECC71,color:#fff
    style S3 fill:#E67E22,color:#fff
    style S4 fill:#E74C3C,color:#fff
```

### 🎯 Stage 1: Foundations (Week 1-2)
- Understand embeddings, vector spaces, similarity search
- Learn prompt engineering: zero-shot, few-shot, CoT
- Experiment with system prompts on Claude/ChatGPT
- Read about transformer architecture (attention is all you need)

### 📚 Stage 2: Build RAG (Week 3-4)
- Build a basic RAG pipeline with LangChain + ChromaDB
- Experiment with chunking strategies
- Add hybrid search (BM25 + vector)
- Implement reranking with a cross-encoder
- Evaluate with RAGAS metrics

### ⚙️ Stage 3: Fine-Tuning (Week 5-6)
- Fine-tune a small model (Llama 3.2-3B) with QLoRA
- Prepare training data in instruction-response format
- Train on a specific task (classification, Q&A, style transfer)
- Compare fine-tuned vs base + RAG performance

### 🚀 Stage 4: Production systems (Week 7+)
- Build a hybrid system: fine-tuned model + RAG
- Add guardrails (input validation, output filtering)
- Implement evaluation and monitoring
- Deploy with proper auth, rate limiting, and observability
- Build an Agentic RAG system with tool use

---

## 16) Glossary

| Term | Definition |
|---|---|
| **RAG** | Retrieval-Augmented Generation — retrieve docs, inject into LLM prompt |
| **Embedding** | Numerical vector representation of text capturing semantic meaning |
| **Vector Database** | Database optimized for storing and searching embeddings (Pinecone, Chroma, Weaviate) |
| **Chunking** | Splitting documents into smaller pieces for embedding and retrieval |
| **Reranking** | Rescoring retrieved results with a more accurate model before passing to LLM |
| **Fine-Tuning** | Further training a pre-trained model on task-specific data |
| **LoRA** | Low-Rank Adaptation — inject small trainable matrices, freeze base model |
| **QLoRA** | LoRA + 4-bit quantization — fine-tune large models on consumer GPUs |
| **PEFT** | Parameter-Efficient Fine-Tuning — umbrella term for LoRA, adapters, prefix tuning |
| **RLHF** | Reinforcement Learning from Human Feedback — train reward model, optimize with RL |
| **DPO** | Direct Preference Optimization — align model directly from preference data, no reward model |
| **SFT** | Supervised Fine-Tuning — train on instruction-response pairs |
| **CoT** | Chain-of-Thought — prompting technique: "think step by step" |
| **ToT** | Tree-of-Thoughts — explore multiple reasoning paths |
| **HyDE** | Hypothetical Document Embeddings — embed a generated answer to find similar real docs |
| **GraphRAG** | RAG using knowledge graphs for multi-hop reasoning |
| **Agentic RAG** | Autonomous agent that plans, retrieves, evaluates, and iterates |
| **Hybrid Search** | Combining keyword (BM25) + semantic (vector) search |
| **Cross-Encoder** | Model that scores query-document pairs together (used for reranking) |
| **Bi-Encoder** | Model that embeds query and documents separately (used for retrieval) |
| **Cosine Similarity** | Measures angle between vectors — standard similarity metric |
| **Quantization** | Reducing model precision (32-bit → 4-bit) to save memory |
| **Catastrophic Forgetting** | Model forgets general knowledge after fine-tuning on narrow data |
| **Context Window** | Maximum number of tokens an LLM can process at once |
| **Guardrails** | Input/output validation to keep LLM responses safe and on-topic |
| **RAGAS** | Framework for evaluating RAG pipeline quality |

---

*Last updated: March 2026 | Covers RAG, fine-tuning, alignment, and prompt engineering through 2025-2026*

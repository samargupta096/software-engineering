# 🏗️ RAG Architecture — A Complete Guide

> **Retrieval-Augmented Generation (RAG)** is an architecture pattern that enhances LLM responses by retrieving relevant external knowledge at inference time, grounding outputs in real, up-to-date data instead of relying solely on the model's training data.

---

## Table of Contents

1. [What RAG Is and the Problem It Solves](#1-what-rag-is-and-the-problem-it-solves)
2. [Indexing Pipeline Design](#2-indexing-pipeline-design)
3. [Query Pipeline Design](#3-query-pipeline-design)
4. [Fixed-Size Chunking](#4-fixed-size-chunking)
5. [Semantic Chunking](#5-semantic-chunking)
6. [Recursive Chunking](#6-recursive-chunking)
7. [Choosing the Right Chunking Strategy](#7-choosing-the-right-chunking-strategy)
8. [Document Parsing Across PDFs, Markdown, and HTML](#8-document-parsing-across-pdfs-markdown-and-html)
9. [Picking the Right Embedding Model](#9-picking-the-right-embedding-model)

---

## 1. What RAG Is and the Problem It Solves

### The Core Problem

Large Language Models have three fundamental limitations:

| Limitation | Description |
|------------|-------------|
| **Knowledge Cutoff** | Models only know what they were trained on — they can't answer about events or data after their training date |
| **Hallucination** | Models confidently generate plausible-sounding but factually incorrect information when they don't know the answer |
| **No Private Data Access** | Models have no access to your company's internal docs, databases, or proprietary knowledge |

### What RAG Is

RAG is an architecture that **retrieves relevant documents** from an external knowledge base and **augments** the LLM's prompt with that context before **generating** a response.

```
Traditional LLM:
  User Question ──▶ LLM ──▶ Answer (from training data only)

RAG:
  User Question ──▶ Retrieve Relevant Docs ──▶ LLM + Context ──▶ Grounded Answer
```

### How RAG Works — The Big Picture

```
                        ┌─────────────────────────────────────┐
                        │         INDEXING PIPELINE           │
                        │  (Offline / Batch)                  │
                        │                                     │
                        │  Documents ──▶ Parse ──▶ Chunk      │
                        │                           │         │
                        │                      Embed (vectors)│
                        │                           │         │
                        │                    Vector Database   │
                        └───────────────────────┬─────────────┘
                                                │
                                                │ stored embeddings
                                                ▼
┌──────────────────────────────────────────────────────────────┐
│                      QUERY PIPELINE                          │
│  (Online / Per Request)                                      │
│                                                              │
│  User Query ──▶ Embed Query ──▶ Similarity Search            │
│                                       │                      │
│                                 Top-K Documents              │
│                                       │                      │
│                        ┌──────────────┘                      │
│                        ▼                                     │
│              Construct Prompt:                                │
│              "Given this context: {docs}                     │
│               Answer this: {query}"                          │
│                        │                                     │
│                        ▼                                     │
│                       LLM                                    │
│                        │                                     │
│                        ▼                                     │
│                  Grounded Answer                             │
└──────────────────────────────────────────────────────────────┘
```

### Why RAG Over Other Approaches?

| Approach | Pros | Cons |
|----------|------|------|
| **Fine-Tuning** | Deeply learned knowledge, fast inference | Expensive, static, needs retraining for updates |
| **Long Context Window** | Simple — just dump everything in | Token costs explode, "lost in the middle" problem, context limits |
| **RAG** | Dynamic, updatable, cost-effective, verifiable | More infrastructure, retrieval quality matters |
| **RAG + Fine-Tuning** | Best of both worlds | Most complex to build and maintain |

### Key Benefits of RAG

- **Reduced Hallucination** — Answers are grounded in retrieved evidence.
- **Up-to-Date Knowledge** — Update the knowledge base without retraining.
- **Source Attribution** — You can cite exactly which documents informed the answer.
- **Cost Efficient** — Only retrieve and process relevant chunks, not entire corpora.
- **Data Privacy** — Your data stays in your vector database, not in model weights.

---

## 2. Indexing Pipeline Design

The indexing pipeline is the **offline** process that transforms raw documents into searchable vector embeddings stored in a vector database.

### Pipeline Stages

```
Raw Documents
     │
     ▼
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│  Ingest  │───▶│  Parse   │───▶│   Clean   │───▶│  Chunk   │───▶│  Embed    │
│          │    │          │    │           │    │          │    │           │
│ Load raw │    │ Extract  │    │ Normalize │    │ Split    │    │ Convert   │
│ files    │    │ text &   │    │ text,     │    │ into     │    │ chunks to │
│ from     │    │ metadata │    │ remove    │    │ smaller  │    │ vectors   │
│ sources  │    │          │    │ noise     │    │ pieces   │    │           │
└──────────┘    └──────────┘    └───────────┘    └──────────┘    └───────────┘
                                                                       │
                                                                       ▼
                                                              ┌───────────────┐
                                                              │ Vector Store  │
                                                              │               │
                                                              │ Store vectors │
                                                              │ + metadata    │
                                                              │ + raw text    │
                                                              └───────────────┘
```

### Stage 1: Ingestion

Load documents from various sources:

```python
# Example sources
sources = {
    "local_files": "/data/documents/",
    "s3_bucket": "s3://company-docs/",
    "confluence": "https://company.atlassian.net/wiki/",
    "google_drive": "drive://shared-folder/",
    "database": "postgresql://host/knowledge_base",
    "web_crawl": "https://docs.example.com/"
}
```

**Best Practices:**
- Track document versions and last-modified timestamps.
- Implement incremental indexing — only re-process changed documents.
- Store a hash of each document to detect changes.

### Stage 2: Parsing

Extract text and metadata from different file formats (covered in detail in [Section 8](#8-document-parsing-across-pdfs-markdown-and-html)).

### Stage 3: Cleaning & Normalization

```python
def clean_text(text: str) -> str:
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters that add no meaning
    text = re.sub(r'[^\w\s.,;:!?\'\"()\-/]', '', text)
    
    # Normalize unicode
    text = unicodedata.normalize('NFKD', text)
    
    # Remove headers/footers (common in PDFs)
    text = remove_repeated_headers_footers(text)
    
    return text.strip()
```

**What to clean:**
- Redundant whitespace and line breaks.
- Page numbers, headers, footers (PDFs).
- Navigation elements, boilerplate (HTML).
- Encoding artifacts and special characters.

**What NOT to clean:**
- Meaningful formatting (tables, lists, code blocks).
- Technical terms and domain-specific notation.
- Structural markers that aid chunking.

### Stage 4: Chunking

Split documents into smaller pieces for embedding. This is critical — covered extensively in [Sections 4–7](#4-fixed-size-chunking).

### Stage 5: Embedding

Convert text chunks into dense vector representations:

```python
from openai import OpenAI

client = OpenAI()

def embed_chunks(chunks: list[str], model: str = "text-embedding-3-small") -> list[list[float]]:
    response = client.embeddings.create(
        input=chunks,
        model=model
    )
    return [item.embedding for item in response.data]
```

### Stage 6: Storage

Store embeddings along with metadata in a vector database:

```python
# Example: Storing in ChromaDB
import chromadb

client = chromadb.PersistentClient(path="./chroma_db")
collection = client.get_or_create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"}  # distance metric
)

collection.add(
    ids=[chunk.id for chunk in chunks],
    embeddings=[chunk.embedding for chunk in chunks],
    documents=[chunk.text for chunk in chunks],
    metadatas=[{
        "source": chunk.source_file,
        "page": chunk.page_number,
        "section": chunk.section_title,
        "date_indexed": datetime.now().isoformat(),
        "chunk_index": chunk.index
    } for chunk in chunks]
)
```

### Metadata to Store With Each Chunk

| Metadata Field | Purpose |
|----------------|---------|
| `source_file` | Citation and traceability |
| `page_number` | Precise source location |
| `section_title` | Contextual understanding |
| `chunk_index` | Ordering for context windows |
| `date_created` | Freshness filtering |
| `document_type` | Filter by category |
| `author` | Provenance tracking |
| `parent_chunk_id` | Hierarchical retrieval |

### Vector Database Options

| Database | Type | Best For |
|----------|------|----------|
| **ChromaDB** | Embedded | Prototyping, small-scale |
| **Pinecone** | Managed Cloud | Production, zero-ops |
| **Weaviate** | Self-hosted / Cloud | Hybrid search (vector + keyword) |
| **Qdrant** | Self-hosted / Cloud | High performance, filtering |
| **pgvector** | PostgreSQL extension | When already using PostgreSQL |
| **Milvus** | Self-hosted | Large-scale, enterprise |
| **FAISS** | In-memory library | Research, benchmarking |

---

## 3. Query Pipeline Design

The query pipeline is the **online** process that runs for every user query, retrieves relevant context, and generates a grounded answer.

### Pipeline Stages

```
User Query
     │
     ▼
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  Query     │───▶│  Retrieve  │───▶│  Rerank    │───▶│  Generate  │
│ Transform  │    │            │    │            │    │            │
│            │    │ Vector     │    │ Cross-     │    │ LLM with   │
│ Expand,    │    │ similarity │    │ encoder    │    │ context    │
│ rewrite,   │    │ search     │    │ scoring    │    │ produces   │
│ decompose  │    │ top-K      │    │ top-N      │    │ answer     │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
                                                            │
                                                            ▼
                                                     ┌────────────┐
                                                     │  Post-     │
                                                     │ Process    │
                                                     │            │
                                                     │ Citations, │
                                                     │ guardrails │
                                                     └────────────┘
```

### Stage 1: Query Transformation

Raw user queries are often suboptimal for retrieval. Transform them before searching.

#### a) Query Rewriting

```
Original:  "How do I fix that error we talked about yesterday?"
Rewritten: "How to fix the ConnectionTimeout error in the payment service?"
```

```python
def rewrite_query(user_query: str, chat_history: list) -> str:
    prompt = f"""Given the conversation history and the latest user query,
rewrite the query to be a standalone, search-optimized question.

Chat History:
{format_history(chat_history)}

User Query: {user_query}

Rewritten Query:"""
    return call_llm(prompt)
```

#### b) Query Decomposition

Break complex queries into sub-queries:

```
Original:  "Compare the pricing and features of AWS Lambda vs Google Cloud Functions"

Sub-queries:
  1. "AWS Lambda pricing model and tiers"
  2. "Google Cloud Functions pricing model and tiers"
  3. "AWS Lambda key features and limitations"
  4. "Google Cloud Functions key features and limitations"
```

#### c) HyDE (Hypothetical Document Embeddings)

Generate a hypothetical answer first, then use that to search:

```python
def hyde_search(query: str):
    # Step 1: Generate a hypothetical answer
    hypothetical = call_llm(
        f"Write a short paragraph that would answer this question: {query}"
    )
    
    # Step 2: Embed the hypothetical answer (not the query)
    embedding = embed(hypothetical)
    
    # Step 3: Search with the hypothetical embedding
    results = vector_db.search(embedding, top_k=10)
    return results
```

### Stage 2: Retrieval

#### Vector Search (Semantic)

```python
# Embed the query
query_embedding = embed(query)

# Search for similar chunks
results = vector_db.similarity_search(
    query_embedding,
    top_k=20,       # retrieve more, rerank later
    filter={         # metadata filtering
        "document_type": "technical_docs",
        "date_created": {"$gte": "2024-01-01"}
    }
)
```

#### Hybrid Search (Vector + Keyword)

Combine semantic similarity with traditional keyword matching (BM25):

```
Hybrid Score = α × Vector Score + (1 - α) × BM25 Score

where α is typically 0.5 – 0.7
```

```python
# Weaviate hybrid search example
results = client.query.get("Document", ["text", "source"]) \
    .with_hybrid(
        query="kubernetes pod scheduling",
        alpha=0.6  # 60% semantic, 40% keyword
    ) \
    .with_limit(20) \
    .do()
```

**When to use hybrid search:**
- Queries contain specific technical terms, product names, or codes.
- Domain-specific jargon that embeddings may not capture well.
- You need both conceptual similarity AND exact keyword matching.

### Stage 3: Reranking

The initial retrieval casts a wide net (top-20). Reranking uses a **cross-encoder** to score each query-document pair more accurately and select the best top-5.

```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-12-v2")

def rerank(query: str, documents: list[str], top_n: int = 5) -> list:
    pairs = [(query, doc) for doc in documents]
    scores = reranker.predict(pairs)
    
    # Sort by score descending
    ranked = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_n]
```

**Why reranking matters:**

| Stage | Model Type | Speed | Accuracy |
|-------|-----------|-------|----------|
| Retrieval (Bi-encoder) | Embed query & docs separately | ⚡ Fast | 🟡 Good |
| Reranking (Cross-encoder) | Process query + doc together | 🐢 Slow | 🟢 Excellent |

The bi-encoder is fast but approximate. The cross-encoder is slow but much more accurate. Using both gives you **speed AND accuracy**.

### Stage 4: Generation

Construct the prompt with retrieved context and generate:

```python
def generate_answer(query: str, context_chunks: list[dict]) -> str:
    context = "\n\n---\n\n".join([
        f"[Source: {c['source']}, Page {c['page']}]\n{c['text']}"
        for c in context_chunks
    ])
    
    prompt = f"""Answer the user's question based ONLY on the provided context.
If the context doesn't contain enough information, say "I don't have enough
information to answer this question."

Always cite your sources using [Source: filename, Page X] format.

Context:
{context}

Question: {query}

Answer:"""
    
    return call_llm(prompt, temperature=0.1)
```

### Stage 5: Post-Processing

```python
def post_process(answer: str, context_chunks: list) -> dict:
    return {
        "answer": answer,
        "sources": [
            {
                "file": chunk["source"],
                "page": chunk["page"],
                "relevance_score": chunk["score"],
                "snippet": chunk["text"][:200]
            }
            for chunk in context_chunks
        ],
        "confidence": calculate_confidence(answer, context_chunks),
        "has_sufficient_context": "I don't have enough" not in answer
    }
```

### Advanced Query Pipeline Patterns

| Pattern | Description |
|---------|-------------|
| **Multi-step retrieval** | First retrieve broadly, then retrieve specifically within results |
| **Iterative retrieval** | LLM reads context, asks for more specific retrieval, reads again |
| **Corrective RAG (CRAG)** | Check retrieval quality; if poor, fall back to web search |
| **Self-RAG** | Model decides when to retrieve, evaluates retrieval relevance |
| **Agentic RAG** | An agent decides which tools/DBs to query and how to combine results |

---

## 4. Fixed-Size Chunking

### What Is It?

Fixed-size chunking splits text into chunks of a **predetermined, uniform size** — measured in characters, words, or tokens. It's the simplest and most common chunking strategy.

### How It Works

```
Document: "The quick brown fox jumps over the lazy dog. Pack my box with..."

Chunk Size: 5 words
Overlap: 2 words

Chunk 1: "The quick brown fox jumps"
Chunk 2: "fox jumps over the lazy"      ← 2-word overlap
Chunk 3: "the lazy dog. Pack my"
Chunk 4: "Pack my box with..."
```

### Implementation

```python
def fixed_size_chunk(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    unit: str = "tokens"  # "chars", "words", or "tokens"
) -> list[str]:
    
    if unit == "chars":
        elements = list(text)
    elif unit == "words":
        elements = text.split()
    elif unit == "tokens":
        elements = tokenizer.encode(text)
    
    chunks = []
    start = 0
    
    while start < len(elements):
        end = start + chunk_size
        
        if unit == "chars":
            chunk = ''.join(elements[start:end])
        elif unit == "words":
            chunk = ' '.join(elements[start:end])
        elif unit == "tokens":
            chunk = tokenizer.decode(elements[start:end])
        
        chunks.append(chunk)
        start += chunk_size - chunk_overlap  # step forward with overlap
    
    return chunks
```

### Why Overlap Matters

Without overlap, important context at chunk boundaries gets split:

```
Without overlap (BAD):
  Chunk 1: "...the recommended dosage is 500mg"
  Chunk 2: "twice daily with food. Side effects include..."
  → Query about "500mg dosage instructions" misses the full answer

With overlap (GOOD):
  Chunk 1: "...the recommended dosage is 500mg twice daily"
  Chunk 2: "500mg twice daily with food. Side effects include..."
  → Both chunks contain the complete dosage instruction
```

**Rule of thumb**: Set overlap to **10–20%** of chunk size.

### Choosing Chunk Size

| Chunk Size | Pros | Cons | Best For |
|------------|------|------|----------|
| **128–256 tokens** | Precise retrieval, less noise | May lose context | Sentence-level Q&A, FAQ |
| **256–512 tokens** | Good balance of precision & context | General purpose | Most RAG applications |
| **512–1024 tokens** | Rich context per chunk | May include irrelevant text | Long-form documents, reports |
| **1024+ tokens** | Maximum context | Poor retrieval precision | Summarization tasks |

### Pros & Cons

| ✅ Pros | ❌ Cons |
|---------|---------|
| Dead simple to implement | Breaks mid-sentence, mid-paragraph |
| Predictable chunk sizes | Ignores document structure |
| Fast processing | Splits related information apart |
| Easy to estimate costs | No semantic awareness |
| Works with any document type | Arbitrary boundaries hurt retrieval |

---

## 5. Semantic Chunking

### What Is It?

Semantic chunking uses **embedding similarity** to determine where to split text. It groups sentences that are **semantically related** together and splits at points where the topic shifts.

### How It Works

```
Step 1: Split text into sentences
Step 2: Embed each sentence
Step 3: Compute similarity between consecutive sentences
Step 4: Split where similarity drops below a threshold

Sentence Embeddings:
  S1: "Python is a programming language."     → [0.2, 0.8, ...]
  S2: "It was created by Guido van Rossum."   → [0.3, 0.7, ...]  ← Similar to S1
  S3: "Python supports multiple paradigms."   → [0.25, 0.75, ...] ← Similar to S2
  S4: "The weather today is sunny and warm."  → [0.9, 0.1, ...]  ← DIFFERENT! → Split here
  S5: "Temperatures will reach 30 degrees."   → [0.85, 0.15, ...] ← Similar to S4

Result:
  Chunk 1: S1 + S2 + S3 (about Python)
  Chunk 2: S4 + S5 (about weather)
```

### Implementation

```python
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

def semantic_chunk(
    text: str,
    breakpoint_threshold: float = 0.3,
    min_chunk_size: int = 100,
    max_chunk_size: int = 1500
) -> list[str]:
    
    # Step 1: Split into sentences
    sentences = split_into_sentences(text)
    
    # Step 2: Embed all sentences
    embeddings = model.encode(sentences)
    
    # Step 3: Calculate cosine similarity between consecutive sentences
    similarities = []
    for i in range(len(embeddings) - 1):
        sim = cosine_similarity(embeddings[i], embeddings[i + 1])
        similarities.append(sim)
    
    # Step 4: Find breakpoints where similarity drops
    chunks = []
    current_chunk = [sentences[0]]
    
    for i, sim in enumerate(similarities):
        if sim < breakpoint_threshold and len(' '.join(current_chunk)) >= min_chunk_size:
            # Topic shift detected — start new chunk
            chunks.append(' '.join(current_chunk))
            current_chunk = [sentences[i + 1]]
        else:
            current_chunk.append(sentences[i + 1])
        
        # Force split if chunk gets too large
        if len(' '.join(current_chunk)) > max_chunk_size:
            chunks.append(' '.join(current_chunk))
            current_chunk = []
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

### Breakpoint Detection Methods

| Method | Description |
|--------|-------------|
| **Percentile** | Split at points where similarity is below the Nth percentile (e.g., bottom 25%) |
| **Standard Deviation** | Split where similarity is more than 1σ below the mean |
| **Fixed Threshold** | Split where similarity drops below a hard threshold (e.g., 0.3) |
| **Gradient** | Split where the rate of similarity change is largest |

### Pros & Cons

| ✅ Pros | ❌ Cons |
|---------|---------|
| Chunks are semantically coherent | Slower — requires embedding each sentence |
| Respects topic boundaries | Variable chunk sizes (harder to predict) |
| Better retrieval quality | Needs tuning of threshold parameter |
| Preserves meaning within chunks | Expensive for large documents |
| Works across document types | Embedding model quality affects results |

---

## 6. Recursive Chunking

### What Is It?

Recursive chunking splits documents by **hierarchically trying different separators** — it first tries to split on the largest structural boundary (e.g., `\n\n` for paragraphs), then falls back to smaller boundaries (e.g., `\n` for lines, `. ` for sentences) until each chunk is within the target size.

### How It Works

```
Hierarchy of separators (tried in order):
  1. "\n\n"  — Paragraph breaks
  2. "\n"    — Line breaks
  3. ". "    — Sentence endings
  4. ", "    — Clause boundaries
  5. " "     — Word boundaries
  6. ""      — Character level (last resort)

Document:
  "Paragraph 1 text...\n\nParagraph 2 text...\n\nVery long paragraph 3..."
  
Step 1: Split on "\n\n" → [Para 1, Para 2, Para 3]
Step 2: Para 1 fits in chunk_size? → Yes ✅ → Keep as chunk
Step 3: Para 2 fits in chunk_size? → Yes ✅ → Keep as chunk  
Step 4: Para 3 fits in chunk_size? → No ❌ → Split on "\n"
        → Sub-parts fit? → No ❌ → Split on ". "
        → Sub-parts fit? → Yes ✅ → Keep as chunks
```

### Implementation

```python
def recursive_chunk(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    separators: list[str] = None
) -> list[str]:
    
    if separators is None:
        separators = ["\n\n", "\n", ". ", ", ", " ", ""]
    
    # Base case: text fits in chunk_size
    if len(text) <= chunk_size:
        return [text]
    
    # Try each separator in order
    for separator in separators:
        if separator in text:
            splits = text.split(separator)
            
            chunks = []
            current = ""
            
            for split in splits:
                # If adding this split exceeds chunk_size
                if len(current) + len(split) + len(separator) > chunk_size:
                    if current:
                        chunks.append(current.strip())
                    
                    # If the split itself is too large, recurse with next separator
                    if len(split) > chunk_size:
                        remaining_separators = separators[separators.index(separator) + 1:]
                        sub_chunks = recursive_chunk(split, chunk_size, chunk_overlap, remaining_separators)
                        chunks.extend(sub_chunks)
                        current = ""
                    else:
                        current = split
                else:
                    current = current + separator + split if current else split
            
            if current:
                chunks.append(current.strip())
            
            return chunks
    
    # Fallback: character-level split
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - chunk_overlap)]
```

### LangChain's RecursiveCharacterTextSplitter

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# General purpose
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ". ", ", ", " ", ""]
)

# For Python code
code_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=500,
    chunk_overlap=50
    # Uses: ["\nclass ", "\ndef ", "\n\n", "\n", " ", ""]
)

# For Markdown
md_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.MARKDOWN,
    chunk_size=500,
    chunk_overlap=50
    # Uses: ["\n## ", "\n### ", "\n#### ", "\n\n", "\n", ". ", " ", ""]
)

chunks = splitter.split_text(document_text)
```

### Language-Specific Separator Hierarchies

| Language | Separators (in order) |
|----------|----------------------|
| **Plain Text** | `\n\n` → `\n` → `. ` → `, ` → ` ` |
| **Markdown** | `\n## ` → `\n### ` → `\n#### ` → `\n\n` → `\n` → `. ` |
| **Python** | `\nclass ` → `\ndef ` → `\n\n` → `\n` → ` ` |
| **JavaScript** | `\nfunction ` → `\nconst ` → `\n\n` → `\n` → `. ` |
| **HTML** | `<div` → `<p` → `<br` → `\n\n` → `\n` → `. ` |

### Pros & Cons

| ✅ Pros | ❌ Cons |
|---------|---------|
| Respects document structure | More complex than fixed-size |
| Keeps paragraphs intact when possible | Separator list may need tuning |
| Degrades gracefully to smaller units | Not truly semantic — structural only |
| Works great for well-formatted docs | Poorly formatted docs may not benefit |
| Battle-tested (LangChain default) | Doesn't understand content meaning |

---

## 7. Choosing the Right Chunking Strategy

### Decision Framework

```
                        Start Here
                            │
                    Is your document
                    well-structured?
                    (clear headings,
                     paragraphs, etc.)
                       /         \
                     Yes          No
                     /              \
              ┌──────────┐    ┌──────────┐
              │Recursive │    │Is semantic│
              │Chunking  │    │coherence  │
              │          │    │critical?  │
              └──────────┘    └──────────┘
                                /      \
                              Yes       No
                              /          \
                    ┌───────────┐    ┌──────────┐
                    │ Semantic  │    │Fixed-Size │
                    │ Chunking  │    │Chunking   │
                    └───────────┘    └──────────┘
```

### Comparison Table

| Factor | Fixed-Size | Semantic | Recursive |
|--------|-----------|----------|-----------|
| **Implementation** | ⭐ Trivial | ⭐⭐⭐ Complex | ⭐⭐ Moderate |
| **Speed** | ⚡⚡⚡ Fastest | ⚡ Slowest | ⚡⚡ Fast |
| **Chunk Quality** | 🟡 Okay | 🟢 Best | 🟢 Very Good |
| **Cost** | 💰 Cheapest | 💰💰💰 Most expensive | 💰 Cheap |
| **Predictability** | Uniform sizes | Variable sizes | Semi-uniform |
| **Structure Aware** | ❌ No | ❌ No (content-aware) | ✅ Yes |
| **Semantic Aware** | ❌ No | ✅ Yes | ❌ No |

### When to Use What

| Strategy | Best For |
|----------|----------|
| **Fixed-Size** | Prototyping, homogeneous text (news articles, blog posts), when speed matters |
| **Semantic** | Research papers, mixed-topic documents, when retrieval quality is paramount |
| **Recursive** | Technical docs, code, Markdown/HTML, well-structured content |
| **Hybrid (Recursive + Semantic)** | Production systems that need both structure and semantic awareness |

### Real-World Recommendations

| Document Type | Recommended Strategy | Chunk Size | Overlap |
|---------------|---------------------|------------|---------|
| FAQ / Q&A pairs | Fixed-size (small) | 128–256 tokens | 0 |
| Technical documentation | Recursive (Markdown-aware) | 512 tokens | 50 tokens |
| Legal contracts | Semantic or Recursive | 512–1024 tokens | 100 tokens |
| Code repositories | Recursive (language-aware) | 256–512 tokens | 50 tokens |
| Research papers | Semantic | 512 tokens | 50 tokens |
| Chat logs / transcripts | Fixed-size | 256 tokens | 25 tokens |
| Product manuals | Recursive | 512 tokens | 50 tokens |

### Advanced: Combining Strategies

```python
def hybrid_chunk(document: str, doc_type: str) -> list[str]:
    # Step 1: Structure-aware split (Recursive)
    structural_chunks = recursive_chunk(
        document,
        chunk_size=1500,  # larger initial chunks
        separators=get_separators(doc_type)
    )
    
    # Step 2: Semantic refinement on large chunks
    final_chunks = []
    for chunk in structural_chunks:
        if len(chunk) > 800:  # only semantically split large chunks
            sub_chunks = semantic_chunk(chunk, breakpoint_threshold=0.4)
            final_chunks.extend(sub_chunks)
        else:
            final_chunks.append(chunk)
    
    return final_chunks
```

---

## 8. Document Parsing Across PDFs, Markdown, and HTML

### The Challenge

Raw documents come in many formats, each with unique challenges:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   PDFs   │     │ Markdown │     │   HTML   │
├──────────┤     ├──────────┤     ├──────────┤
│ Scanned  │     │ Headers  │     │ Nested   │
│ Tables   │     │ Code     │     │ Tags     │
│ Images   │     │ Links    │     │ Scripts  │
│ Columns  │     │ Tables   │     │ Styles   │
│ Fonts    │     │ Images   │     │ Nav/Ads  │
└──────────┘     └──────────┘     └──────────┘
      │                │                │
      └────────────────┼────────────────┘
                       ▼
              ┌────────────────┐
              │ Clean, Chunked │
              │ Plain Text +   │
              │ Metadata       │
              └────────────────┘
```

---

### PDF Parsing

PDFs are the hardest format to parse reliably. They store visual layout, not semantic structure.

#### Common Challenges

| Challenge | Example |
|-----------|---------|
| Multi-column layout | Academic papers with 2-column text |
| Tables | Financial reports, data sheets |
| Scanned documents | Older docs that are images of text |
| Headers / footers | Repeated on every page |
| Embedded images | Diagrams, charts, figures |
| Mixed content | Text + tables + images on one page |

#### Tool Comparison

| Tool | Type | Tables | Scanned | Layout | Speed |
|------|------|--------|---------|--------|-------|
| **PyPDF2 / pypdf** | Rule-based | ❌ Poor | ❌ No OCR | ❌ Basic | ⚡⚡⚡ |
| **pdfplumber** | Rule-based | ✅ Good | ❌ No OCR | 🟡 Better | ⚡⚡ |
| **PyMuPDF (fitz)** | Rule-based | 🟡 Okay | ❌ No OCR | ✅ Good | ⚡⚡⚡ |
| **Unstructured** | Hybrid | ✅ Good | ✅ Via OCR | ✅ Good | ⚡ |
| **LlamaParse** | LLM-powered | ✅ Excellent | ✅ Yes | ✅ Excellent | 🐢 |
| **Docling (IBM)** | ML-powered | ✅ Excellent | ✅ Yes | ✅ Excellent | ⚡ |
| **Marker** | ML-powered | ✅ Good | ✅ Yes | ✅ Good | ⚡ |

#### Example: PyMuPDF

```python
import fitz  # PyMuPDF

def parse_pdf(file_path: str) -> list[dict]:
    doc = fitz.open(file_path)
    pages = []
    
    for page_num, page in enumerate(doc):
        text = page.get_text("text")  # plain text extraction
        
        # Extract tables separately
        tables = page.find_tables()
        table_data = [table.extract() for table in tables] if tables else []
        
        pages.append({
            "page_number": page_num + 1,
            "text": text,
            "tables": table_data,
            "metadata": {
                "width": page.rect.width,
                "height": page.rect.height,
            }
        })
    
    doc.close()
    return pages
```

#### Example: Unstructured

```python
from unstructured.partition.pdf import partition_pdf

elements = partition_pdf(
    filename="report.pdf",
    strategy="hi_res",         # Use ML models for layout detection
    infer_table_structure=True, # Extract tables as HTML
    extract_images_in_pdf=True  # Extract embedded images
)

for element in elements:
    print(f"Type: {element.category}")   # Title, NarrativeText, Table, etc.
    print(f"Text: {element.text[:100]}")
    print(f"Metadata: {element.metadata}")
    print("---")
```

---

### Markdown Parsing

Markdown is the **easiest** format to parse because it's already semi-structured text.

#### Strategy

Leverage the inherent structure — headers define sections, code blocks are delimited, lists are explicit.

```python
import re

def parse_markdown(text: str) -> list[dict]:
    sections = []
    current_section = {"title": "Introduction", "level": 0, "content": ""}
    
    for line in text.split("\n"):
        # Detect headers
        header_match = re.match(r'^(#{1,6})\s+(.*)', line)
        
        if header_match:
            # Save current section
            if current_section["content"].strip():
                sections.append(current_section.copy())
            
            level = len(header_match.group(1))
            title = header_match.group(2)
            current_section = {
                "title": title,
                "level": level,
                "content": ""
            }
        else:
            current_section["content"] += line + "\n"
    
    # Don't forget the last section
    if current_section["content"].strip():
        sections.append(current_section)
    
    return sections
```

#### Handling Special Markdown Elements

| Element | Handling Strategy |
|---------|-------------------|
| **Code blocks** | Keep intact — never split a code block across chunks |
| **Tables** | Keep intact — convert to text or structured format |
| **Links** | Preserve `[text](url)` format for context |
| **Images** | Extract alt text `![alt](url)`, optionally describe with vision model |
| **Lists** | Keep list items together when possible |
| **Frontmatter (YAML)** | Parse as metadata, don't include in chunk text |

---

### HTML Parsing

HTML requires stripping away presentation layers to get clean content.

#### Strategy

```
Raw HTML
    │
    ▼
Remove: <script>, <style>, <nav>, <footer>, <header>, ads
    │
    ▼
Extract: <article>, <main>, <section>, <p>, <h1-h6>, <table>
    │
    ▼
Convert to clean text with structure preserved
```

#### Example: BeautifulSoup

```python
from bs4 import BeautifulSoup, NavigableString

def parse_html(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove non-content elements
    for tag in soup.find_all(["script", "style", "nav", "footer",
                              "header", "aside", "iframe", "noscript"]):
        tag.decompose()
    
    # Extract metadata
    metadata = {
        "title": soup.title.string if soup.title else "",
        "description": "",
        "language": soup.html.get("lang", "en") if soup.html else "en"
    }
    
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc:
        metadata["description"] = meta_desc.get("content", "")
    
    # Extract main content
    main_content = soup.find("main") or soup.find("article") or soup.body or soup
    
    # Convert to structured sections
    sections = []
    current_section = {"heading": "", "content": "", "level": 0}
    
    for element in main_content.descendants:
        if element.name and element.name in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            if current_section["content"].strip():
                sections.append(current_section.copy())
            current_section = {
                "heading": element.get_text(strip=True),
                "content": "",
                "level": int(element.name[1])
            }
        elif element.name == "p":
            current_section["content"] += element.get_text(strip=True) + "\n\n"
        elif element.name == "li":
            current_section["content"] += "• " + element.get_text(strip=True) + "\n"
        elif element.name == "table":
            current_section["content"] += html_table_to_text(element) + "\n\n"
    
    if current_section["content"].strip():
        sections.append(current_section)
    
    return {"metadata": metadata, "sections": sections}
```

#### Recommended Libraries

| Library | Best For |
|---------|----------|
| **BeautifulSoup** | General HTML parsing, full control |
| **Trafilatura** | Web article extraction (removes boilerplate) |
| **newspaper3k** | News article extraction |
| **html2text** | Quick HTML to Markdown conversion |
| **readability-lxml** | Reader-mode content extraction |
| **Unstructured** | Unified pipeline for all formats |

---

### Universal Parsing Pipeline

```python
from pathlib import Path

def parse_document(file_path: str) -> dict:
    """Universal document parser that routes to the right parser."""
    ext = Path(file_path).suffix.lower()
    
    parsers = {
        ".pdf": parse_pdf,
        ".md": parse_markdown,
        ".markdown": parse_markdown,
        ".html": parse_html,
        ".htm": parse_html,
        ".txt": parse_plain_text,
        ".docx": parse_docx,
        ".csv": parse_csv,
        ".json": parse_json,
    }
    
    parser = parsers.get(ext)
    if not parser:
        raise ValueError(f"Unsupported file format: {ext}")
    
    return {
        "source": file_path,
        "format": ext,
        "content": parser(file_path),
        "parsed_at": datetime.now().isoformat()
    }
```

---

## 9. Picking the Right Embedding Model

### What Embedding Models Do

Embedding models convert text into **dense numerical vectors** (arrays of floats) that capture semantic meaning. Texts with similar meanings produce vectors that are close together in vector space.

```
"The cat sat on the mat"  →  [0.12, -0.34, 0.56, ..., 0.78]  (768 dimensions)
"A feline rested on a rug" → [0.11, -0.33, 0.55, ..., 0.77]  (very similar vector!)
"Stock prices rose sharply" → [0.89, 0.12, -0.45, ..., -0.23] (very different vector)
```

### Key Factors for Choosing

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMBEDDING MODEL SELECTION                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Quality     │  │  Cost        │  │  Latency     │          │
│  │  (MTEB score)│  │  (per token) │  │  (ms/query)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐          │
│  │  Dimensions  │  │  Max Tokens  │  │  Hosting     │          │
│  │  (storage)   │  │  (context)   │  │  (API/local) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Popular Embedding Models (2024–2025)

#### Proprietary (API-Based)

| Model | Provider | Dimensions | Max Tokens | Relative Quality | Relative Cost |
|-------|----------|-----------|------------|---------|------|
| **text-embedding-3-large** | OpenAI | 3072 (flexible) | 8191 | 🟢 Very High | 💰💰 |
| **text-embedding-3-small** | OpenAI | 1536 (flexible) | 8191 | 🟢 High | 💰 |
| **text-embedding-004** | Google | 768 | 2048 | 🟢 Very High | 💰 |
| **voyage-3** | Voyage AI | 1024 | 32000 | 🟢 Very High | 💰💰 |
| **embed-v4.0** | Cohere | 1024 | 512 | 🟢 High | 💰 |

#### Open Source (Self-Hosted)

| Model | Dimensions | Max Tokens | Relative Quality | Size |
|-------|-----------|------------|---------|------|
| **all-MiniLM-L6-v2** | 384 | 256 | 🟡 Good | 80MB |
| **bge-large-en-v1.5** | 1024 | 512 | 🟢 Very High | 1.3GB |
| **e5-large-v2** | 1024 | 512 | 🟢 High | 1.3GB |
| **gte-large** | 1024 | 512 | 🟢 High | 1.3GB |
| **nomic-embed-text** | 768 | 8192 | 🟢 High | 550MB |
| **mxbai-embed-large** | 1024 | 512 | 🟢 Very High | 1.3GB |
| **Snowflake Arctic Embed** | 1024 | 512 | 🟢 Very High | 1.3GB |

### How to Evaluate: MTEB Benchmark

The **Massive Text Embedding Benchmark (MTEB)** is the standard leaderboard for evaluating embedding models across tasks like retrieval, classification, and clustering.

Check the leaderboard: [https://huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard)

**Key MTEB tasks for RAG:**
- **Retrieval** — Most important for RAG (measures how well the model finds relevant documents).
- **STS (Semantic Textual Similarity)** — How well the model captures meaning similarity.
- **Clustering** — How well embeddings group similar documents.

### Decision Matrix

| Scenario | Recommended Model | Why |
|----------|-------------------|-----|
| **Prototyping / Learning** | `all-MiniLM-L6-v2` | Free, fast, small, good enough |
| **Production (budget)** | `text-embedding-3-small` | Cheap API, good quality |
| **Production (quality)** | `text-embedding-3-large` | Best quality-to-cost ratio |
| **Long documents** | `voyage-3` or `nomic-embed-text` | 32K / 8K context windows |
| **On-premise / Air-gapped** | `bge-large-en-v1.5` | Top open-source quality |
| **Multi-lingual** | `text-embedding-3-large` or `e5-mistral` | Strong cross-lingual support |
| **Code search** | `voyage-code-3` | Optimized for code |
| **Low latency** | `all-MiniLM-L6-v2` | 80MB, runs on CPU |

### Dimensions vs. Quality vs. Cost Trade-off

```
        Quality
          ▲
          │     ● 3072d (text-embedding-3-large)
          │    ● 1024d (bge-large, voyage-3)
          │   ● 768d (gte-base, text-embedding-004)
          │  ● 384d (MiniLM)
          │
          └──────────────────────────▶ Cost / Storage
              Low                  High

Higher dimensions = better quality but more storage and slower search.
```

**Matryoshka embeddings** (supported by `text-embedding-3-*`) let you truncate vectors to smaller dimensions after generation:

```python
# OpenAI: Generate 3072d, but store only 256d
response = openai.Embedding.create(
    input="Hello world",
    model="text-embedding-3-large",
    dimensions=256  # Truncate to 256 dimensions
)
```

### Critical Rules

> [!CAUTION]
> **Never mix embedding models.** If you indexed your documents with Model A, you MUST query with Model A. Vectors from different models are incompatible — they live in different vector spaces.

> [!IMPORTANT]
> **Chunk size must fit within the model's max token limit.** If your model supports 512 tokens and your chunk is 800 tokens, the excess gets silently truncated — losing information without any error.

> [!TIP]
> **Test with YOUR data.** MTEB scores are on academic benchmarks. A model that ranks #1 on MTEB may not be best for your specific domain. Always evaluate on a representative sample of your actual queries and documents.

### Evaluation on Your Own Data

```python
def evaluate_embedding_model(model, test_queries, relevant_docs):
    """
    Evaluate an embedding model on your domain-specific data.
    
    Metrics:
    - Recall@K: % of relevant docs in top-K results
    - MRR: Mean Reciprocal Rank of first relevant result
    - nDCG@K: Normalized Discounted Cumulative Gain
    """
    results = {"recall@5": [], "recall@10": [], "mrr": []}
    
    for query, expected_doc_ids in zip(test_queries, relevant_docs):
        query_embedding = model.encode(query)
        retrieved = vector_db.search(query_embedding, top_k=10)
        retrieved_ids = [r.id for r in retrieved]
        
        # Recall@5
        top5_hits = len(set(retrieved_ids[:5]) & set(expected_doc_ids))
        results["recall@5"].append(top5_hits / len(expected_doc_ids))
        
        # Recall@10
        top10_hits = len(set(retrieved_ids[:10]) & set(expected_doc_ids))
        results["recall@10"].append(top10_hits / len(expected_doc_ids))
        
        # MRR
        for rank, doc_id in enumerate(retrieved_ids, 1):
            if doc_id in expected_doc_ids:
                results["mrr"].append(1.0 / rank)
                break
        else:
            results["mrr"].append(0.0)
    
    return {k: sum(v) / len(v) for k, v in results.items()}
```

---

## 🏁 Quick Reference — End-to-End RAG Checklist

| Stage | Key Decision | Recommendation |
|-------|-------------|----------------|
| **Parsing** | Which parser? | Unstructured or Docling for PDFs; native parsing for MD/HTML |
| **Cleaning** | How aggressively? | Remove boilerplate, keep structure |
| **Chunking** | Which strategy? | Recursive for structured docs, Semantic for mixed content |
| **Chunk Size** | How big? | 256–512 tokens with 10–20% overlap |
| **Embedding** | Which model? | `text-embedding-3-small` (API) or `bge-large` (self-hosted) |
| **Vector DB** | Which store? | ChromaDB (prototype) → Qdrant/Pinecone (production) |
| **Retrieval** | How many? | Retrieve top-20, rerank to top-5 |
| **Search Type** | Vector or hybrid? | Hybrid (vector + BM25) for production |
| **Reranking** | Which model? | `cross-encoder/ms-marco-MiniLM-L-12-v2` |
| **Generation** | Which LLM? | GPT-4o / Claude / Gemini with low temperature (0.1) |

---

## 📚 Further Reading

- [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)
- [LlamaIndex Documentation](https://docs.llamaindex.ai/)
- [Chunking Strategies by Pinecone](https://www.pinecone.io/learn/chunking-strategies/)
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard)
- [Unstructured.io Documentation](https://docs.unstructured.io/)
- Original Papers:
  - [RAG (Lewis et al., 2020)](https://arxiv.org/abs/2005.11401)
  - [Self-RAG (Asai et al., 2023)](https://arxiv.org/abs/2310.11511)
  - [Corrective RAG (Yan et al., 2024)](https://arxiv.org/abs/2401.15884)

---

> *"RAG is not just about retrieval — it's about building a bridge between your data and your language model."*

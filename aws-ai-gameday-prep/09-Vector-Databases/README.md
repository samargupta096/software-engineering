# 🗄️ Module 09 — Vector Databases on AWS

> **The Memory Bank of AI** — Store, index, and retrieve millions of embeddings in milliseconds.

---

## 🧠 1️⃣ Intuition — Why Vector Databases Exist

### The Problem

If you have 1 million documents, and a user asks a question, how do you find the most relevant ones?
- **Keyword search** (SQL `LIKE '%cloud%'`) misses synonyms and context.
- **Comparing vectors one-by-one** (Exact Nearest Neighbor) takes too long. If comparing two vectors takes 0.1ms, comparing 1 million takes 100 seconds per query.

### The Solution: Approximate Nearest Neighbor (ANN)

Vector databases use ANN algorithms to organize vectors so they don't have to check every single one. They trade a tiny bit of accuracy for massive speed gains.

**Analogy**: Finding a book in a library.
- **Exact Search**: Check every single book on every shelf. (Perfect accuracy, very slow)
- **ANN Search**: Go to the "Science Fiction" section, then the "Cyberpunk" aisle, and check those books. (Might miss a mis-shelved book, but extremely fast)

---

## ⚙️ 2️⃣ Internal Working — AWS Vector Database Options

### The AWS Landscape

| Option | Managed Level | Best For | GameDay Frequency |
|---|---|---|---|
| **OpenSearch Serverless (Vector Engine)** | High | General RAG, Bedrock KB default | ⭐⭐⭐⭐⭐ |
| **Amazon Aurora PostgreSQL (pgvector)** | Medium | Apps already using SQL + vectors | ⭐⭐⭐ |
| **Amazon Neptune Analytics** | High | Graph + Vector (GraphRAG) | ⭐ |
| **Amazon MemoryDB for Redis** | Medium | Ultra-low latency (<1ms), caching | ⭐⭐ |

### Option 1: OpenSearch Serverless (The Default)

OpenSearch is the most common vector store in AWS GenAI architectures.

**How it works**:
1. You create a `VECTORSEARCH` collection
2. You define an index with a `knn_vector` field
3. You specify an engine (`nmslib` or `faiss`) and an algorithm (`hnsw` or `ivf`)
4. OpenSearch builds an in-memory graph of the vectors

```json
// OpenSearch Index Mapping
{
  "settings": {
    "index": {
      "knn": true,
      "knn.algo_param.ef_search": 100
    }
  },
  "mappings": {
    "properties": {
      "embedding": {
        "type": "knn_vector",
        "dimension": 1024,
        "method": {
          "name": "hnsw",
          "engine": "nmslib",
          "space_type": "cosinesimil"
        }
      },
      "text": { "type": "text" },
      "metadata": { "type": "object" }
    }
  }
}
```

### Option 2: Aurora PostgreSQL (pgvector)

Best when you want to combine relational data queries with vector search.

**How it works**:
1. Install the `pgvector` extension
2. Create a table with a `vector` column type
3. Create an index (`HNSW` or `IVFFlat`)
4. Query using SQL distance operators (`<=>` for cosine distance)

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table
CREATE TABLE documents (
    id bigserial PRIMARY KEY,
    content text,
    embedding vector(1024)
);

-- Create HNSW index for fast search
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- Query: Find top 5 similar documents
SELECT id, content, 1 - (embedding <=> '[0.1, 0.2, ...]') AS similarity
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;
```

---

### Indexing Algorithms (The Tech Under the Hood)

When you create a vector index, you must choose an algorithm:

| Algorithm | How It Works | Speed | Accuracy | Memory Cost | Build Time |
|---|---|---|---|---|---|
| **HNSW** (Hierarchical Navigable Small World) | Builds a multi-layer graph. Search drops down through layers. | Very Fast | High | Very High | Slow |
| **IVF** (Inverted File) | Clusters vectors. Search finds nearest clusters, then checks those. | Fast | Medium | Low | Fast |
| **Flat** (Exact Search) | Brute-force comparison against all vectors. | Slow | Perfect | Zero | Zero |

**GameDay Rule of Thumb**: Always use **HNSW** for OpenSearch and pgvector unless memory is severely constrained.

---

## 🏗️ 3️⃣ Production Usage

### ✅ Best Practices

1. **Match Dimensions**: Ensure your vector column/field dimension exactly matches your embedding model output (e.g., Titan V2 = 1024).
2. **Choose the Right Distance Metric**:
   - If vectors are normalized: Use `Inner Product` (fastest)
   - If not normalized: Use `Cosine Similarity`
3. **Use HNSW**: It's the industry standard for low-latency, high-recall search.
4. **Metadata Filtering**: Always store metadata (doc type, date, author) alongside vectors. Filter by metadata *before* vector search (pre-filtering) to improve speed and relevance.

### ❌ Anti-Patterns

| Anti-Pattern | Consequence | Fix |
|---|---|---|
| Using Flat/Exact search on 1M+ vectors | High latency (seconds per query) | Create an HNSW index |
| Storing 10MB document in the vector DB | Bloats the DB, high costs | Store text in S3/DynamoDB, only store vector + ID in vector DB |
| Changing embedding model without re-indexing | 0 search results, dimension errors | Must completely re-embed and re-index all data |

---

## 🎮 4️⃣ GameDay Relevance

### Common Vector DB Failures

| # | Error/Symptom | Root Cause | Fix |
|---|---|---|---|
| 1 | **Dimension mismatch error** | Index expects 256 dims, model outputs 1024 | Recreate index or reconfigure model |
| 2 | **OpenSearch capacity error** | OCU limits reached | Increase max OCUs in OpenSearch Serverless settings |
| 3 | **Slow queries** | Missing index | Ensure HNSW index is created (pgvector) or knn=true (OpenSearch) |

---

## 💼 5️⃣ Interview Perspective

### Q: "Compare OpenSearch Serverless and Aurora pgvector for a RAG architecture."

**Model Answer**:
> "I choose **OpenSearch Serverless** when the primary use case is text/semantic search. It provides out-of-the-box hybrid search (BM25 + k-NN), scales automatically based on compute units (OCUs), and integrates seamlessly as the default store for Bedrock Knowledge Bases.
>
> I choose **Aurora pgvector** when the application is already heavily relational, and vector search is a feature, not the entire product. For example, an e-commerce site where I want to filter by price/category (SQL) AND semantic similarity (vector) in the same query. It avoids the operational overhead of syncing data between a relational DB and a separate search engine."

### 🔗 Further Reading

| Resource | Link |
|---|---|
| Vector DBs Math Deep Dive | [VectorDatabases-Math-DeepDive.md](../../genai/VectorDatabases-Math-DeepDive.md) |
| OpenSearch Deep Dive | [10-OpenSearch](../10-OpenSearch/README.md) |

---

<p align="center">
  <a href="../08-Embeddings/README.md">← Previous: Embeddings</a> · <a href="../10-OpenSearch/README.md"><b>Next → 10 OpenSearch</b></a>
</p>

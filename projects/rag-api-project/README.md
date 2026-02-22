# RAG API Project

> Production-Ready Retrieval-Augmented Generation API with FastAPI & AWS

## 🎯 Project Overview

A complete end-to-end RAG system demonstrating:
- **FastAPI** for REST APIs with streaming
- **LangChain** for LLM orchestration
- **FAISS/Pinecone** for vector storage
- **AWS Bedrock** for LLM inference
- **MLflow** for experiment tracking
- **Docker** for containerization

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   FastAPI    │────▶│   Bedrock    │
│   (Web/App)  │     │   Server     │     │   (Claude)   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  FAISS/      │
                     │  Pinecone    │
                     └──────────────┘
```

## 📁 Project Structure

```
rag-api-project/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Settings & env vars
│   ├── models/              # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── requests.py
│   │   └── responses.py
│   ├── routers/             # API endpoints
│   │   ├── __init__.py
│   │   ├── chat.py
│   │   ├── documents.py
│   │   └── health.py
│   └── services/            # Business logic
│       ├── __init__.py
│       ├── llm_service.py
│       ├── vector_service.py
│       └── rag_service.py
├── data/                    # Sample documents
├── tests/
│   ├── test_chat.py
│   └── test_rag.py
├── scripts/
│   └── ingest.py            # Document ingestion
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd projects/rag-api-project

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit with your keys
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

### 3. Ingest Documents

```bash
python scripts/ingest.py --source ./data/documents
```

### 4. Run the API

```bash
# Development
uvicorn app.main:app --reload

# Production
docker-compose up -d
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Chat without RAG
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is machine learning?"}'

# RAG query
curl -X POST http://localhost:8000/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Explain our refund policy", "top_k": 5}'
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/v1/chat` | Direct LLM chat |
| POST | `/v1/chat/stream` | Streaming chat |
| POST | `/v1/rag/query` | RAG query with sources |
| POST | `/v1/documents/upload` | Upload documents |
| GET | `/v1/documents` | List documents |
| DELETE | `/v1/documents/{id}` | Delete document |

## 📚 Key Learnings

This project demonstrates:

1. **FastAPI Patterns**: Async endpoints, Pydantic models, dependency injection
2. **LangChain Integration**: Chains, retrievers, prompt templates
3. **Vector Databases**: FAISS (local) and Pinecone (production)
4. **AWS Bedrock**: Using Claude via AWS SDK
5. **Streaming**: Server-Sent Events for token streaming
6. **Production**: Docker, health checks, error handling

## 🔧 Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | `openai`, `bedrock`, `local` | `bedrock` |
| `VECTOR_STORE` | `faiss`, `pinecone` | `faiss` |
| `EMBEDDING_MODEL` | Model for embeddings | `text-embedding-3-small` |
| `CHUNK_SIZE` | Document chunk size | `500` |
| `CHUNK_OVERLAP` | Chunk overlap | `50` |

## 🧪 Testing

```bash
# Run all tests
pytest

# With coverage
pytest --cov=app tests/

# Specific test
pytest tests/test_rag.py -v
```

## 🐳 Docker Deployment

```bash
# Build image
docker build -t rag-api .

# Run container
docker run -p 8000:8000 --env-file .env rag-api

# Or use docker-compose
docker-compose up -d
```

## ☁️ AWS Deployment

See [AWS Deployment Guide](docs/aws-deployment.md) for:
- Lambda + API Gateway (serverless)
- ECS Fargate (containers)
- EC2 with Auto Scaling

---

*Part of the [GenAI Learning Curriculum](../../assets/animations/genai.png)*

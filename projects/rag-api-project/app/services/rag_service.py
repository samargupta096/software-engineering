"""
RAG Service - Orchestrates retrieval and generation
"""

import logging
import uuid
from typing import List, Dict, AsyncGenerator

logger = logging.getLogger(__name__)


RAG_PROMPT_TEMPLATE = """You are a helpful assistant that answers questions based on the provided context.
If the answer cannot be found in the context, say "I don't have enough information to answer that question."
Always cite which parts of the context support your answer.

Context:
{context}

Question: {question}

Answer:"""


class RAGService:
    """Retrieval-Augmented Generation Service"""
    
    def __init__(self, llm_service, vector_service, settings):
        self.llm_service = llm_service
        self.vector_service = vector_service
        self.settings = settings
        logger.info("Initialized RAG service")
    
    async def query(
        self,
        query: str,
        top_k: int = 5,
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Dict:
        """
        Execute RAG query:
        1. Retrieve relevant documents
        2. Build context
        3. Generate answer
        """
        # Step 1: Retrieve relevant documents
        retrieved_docs = self.vector_service.search(query, k=top_k)
        
        if not retrieved_docs:
            return {
                "id": str(uuid.uuid4()),
                "answer": "I don't have any documents to search. Please upload some documents first.",
                "sources": [],
                "model": "none",
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }
        
        # Step 2: Build context
        context = "\n\n---\n\n".join([
            f"[Source {i+1}]: {doc['content']}"
            for i, doc in enumerate(retrieved_docs)
        ])
        
        # Step 3: Build prompt
        prompt = RAG_PROMPT_TEMPLATE.format(
            context=context,
            question=query
        )
        
        # Step 4: Generate answer
        response = await self.llm_service.generate(
            query=prompt,
            system_prompt="",  # Prompt already includes instructions
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Step 5: Format response
        return {
            "id": str(uuid.uuid4()),
            "answer": response["content"],
            "sources": [
                {
                    "content": doc["content"][:300] + "..." if len(doc["content"]) > 300 else doc["content"],
                    "metadata": doc.get("metadata", {}),
                    "score": doc.get("score")
                }
                for doc in retrieved_docs
            ],
            "model": response["model"],
            "usage": response["usage"]
        }
    
    async def query_stream(
        self,
        query: str,
        top_k: int = 5,
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        """Stream RAG query response"""
        # Retrieve documents
        retrieved_docs = self.vector_service.search(query, k=top_k)
        
        if not retrieved_docs:
            yield "I don't have any documents to search. Please upload some documents first."
            return
        
        # Build context
        context = "\n\n---\n\n".join([
            f"[Source {i+1}]: {doc['content']}"
            for i, doc in enumerate(retrieved_docs)
        ])
        
        # Build prompt
        prompt = RAG_PROMPT_TEMPLATE.format(
            context=context,
            question=query
        )
        
        # Stream response
        async for chunk in self.llm_service.generate_stream(
            query=prompt,
            system_prompt="",
            temperature=temperature,
            max_tokens=max_tokens
        ):
            yield chunk

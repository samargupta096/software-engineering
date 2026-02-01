"""
Pydantic Response Models
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Usage(BaseModel):
    """Token usage information"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    id: str
    content: str
    model: str
    usage: Usage
    finish_reason: str


class Source(BaseModel):
    """Source document reference"""
    content: str = Field(..., description="Relevant excerpt")
    metadata: Optional[dict] = None
    score: Optional[float] = Field(None, description="Relevance score")


class RAGResponse(BaseModel):
    """Response from RAG query endpoint"""
    id: str
    answer: str
    sources: List[Source]
    model: str
    usage: Usage


class DocumentResponse(BaseModel):
    """Response for document operations"""
    id: str
    filename: str
    chunks: int
    created_at: datetime


class DocumentListResponse(BaseModel):
    """Response for listing documents"""
    documents: List[DocumentResponse]
    total: int


class ErrorResponse(BaseModel):
    """Error response"""
    error: str
    message: str
    request_id: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    llm_provider: str
    vector_store: str
    documents_indexed: int

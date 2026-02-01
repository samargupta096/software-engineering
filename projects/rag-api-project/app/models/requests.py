"""
Pydantic Request Models
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class Role(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class Message(BaseModel):
    """Chat message"""
    role: Role
    content: str = Field(..., min_length=1, max_length=100000)


class ChatRequest(BaseModel):
    """Request for chat endpoint"""
    query: str = Field(..., min_length=1, max_length=10000)
    system_prompt: Optional[str] = Field(
        default="You are a helpful assistant.",
        max_length=2000
    )
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=1024, ge=1, le=4096)
    stream: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "query": "What is machine learning?",
                "temperature": 0.7,
                "max_tokens": 1024
            }
        }


class RAGRequest(BaseModel):
    """Request for RAG query endpoint"""
    query: str = Field(..., min_length=1, max_length=10000)
    top_k: int = Field(default=5, ge=1, le=20)
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=1024, ge=1, le=4096)
    include_sources: bool = True
    stream: bool = False

    class Config:
        json_schema_extra = {
            "example": {
                "query": "What is our refund policy?",
                "top_k": 5,
                "include_sources": True
            }
        }


class DocumentUploadRequest(BaseModel):
    """Request for document upload"""
    content: str = Field(..., min_length=1)
    filename: str = Field(..., min_length=1, max_length=255)
    metadata: Optional[dict] = None

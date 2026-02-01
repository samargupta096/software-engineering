"""
RAG API Configuration
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # API Keys
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    
    # AWS Configuration
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    
    # LLM Settings
    llm_provider: Literal["openai", "bedrock", "local"] = "bedrock"
    default_model: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    
    # Vector Store
    vector_store: Literal["faiss", "pinecone"] = "faiss"
    pinecone_api_key: str = ""
    pinecone_index: str = "rag-index"
    faiss_index_path: str = "./data/faiss_index"
    
    # Embedding
    embedding_model: str = "text-embedding-3-small"
    
    # App Settings
    debug: bool = False
    log_level: str = "INFO"
    
    # RAG Settings
    chunk_size: int = 500
    chunk_overlap: int = 50
    top_k: int = 5
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

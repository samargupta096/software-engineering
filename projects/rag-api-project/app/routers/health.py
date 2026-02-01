"""
Health Check Router
"""

from fastapi import APIRouter, Request
from app.models.responses import HealthResponse
from app.config import get_settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """Health check endpoint"""
    settings = get_settings()
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        llm_provider=settings.llm_provider,
        vector_store=settings.vector_store,
        documents_indexed=request.app.state.vector_service.document_count
    )

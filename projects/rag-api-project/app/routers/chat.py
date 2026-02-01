"""
Chat Router - Direct LLM and RAG endpoints
"""

import uuid
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.models.requests import ChatRequest, RAGRequest
from app.models.responses import ChatResponse, RAGResponse, Usage, Source

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest):
    """
    Direct LLM chat without RAG
    """
    llm_service = request.app.state.llm_service
    
    try:
        result = await llm_service.generate(
            query=body.query,
            system_prompt=body.system_prompt,
            temperature=body.temperature,
            max_tokens=body.max_tokens
        )
        
        return ChatResponse(
            id=str(uuid.uuid4()),
            content=result["content"],
            model=result["model"],
            usage=Usage(**result["usage"]),
            finish_reason=result["finish_reason"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(request: Request, body: ChatRequest):
    """
    Streaming chat endpoint
    """
    llm_service = request.app.state.llm_service
    
    async def generate():
        async for chunk in llm_service.generate_stream(
            query=body.query,
            system_prompt=body.system_prompt,
            temperature=body.temperature,
            max_tokens=body.max_tokens
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )


@router.post("/rag/query", response_model=RAGResponse)
async def rag_query(request: Request, body: RAGRequest):
    """
    RAG query - retrieves relevant documents and generates answer
    """
    rag_service = request.app.state.rag_service
    
    try:
        result = await rag_service.query(
            query=body.query,
            top_k=body.top_k,
            temperature=body.temperature,
            max_tokens=body.max_tokens
        )
        
        return RAGResponse(
            id=result["id"],
            answer=result["answer"],
            sources=[Source(**s) for s in result["sources"]],
            model=result["model"],
            usage=Usage(**result["usage"])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/query/stream")
async def rag_query_stream(request: Request, body: RAGRequest):
    """
    Streaming RAG query
    """
    rag_service = request.app.state.rag_service
    
    async def generate():
        async for chunk in rag_service.query_stream(
            query=body.query,
            top_k=body.top_k,
            temperature=body.temperature,
            max_tokens=body.max_tokens
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

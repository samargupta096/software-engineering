"""
Documents Router - Document management endpoints
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from app.models.requests import DocumentUploadRequest
from app.models.responses import DocumentResponse, DocumentListResponse
from app.services.vector_service import Document

router = APIRouter()


@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(request: Request, body: DocumentUploadRequest):
    """
    Upload a document for indexing
    """
    vector_service = request.app.state.vector_service
    
    doc = Document(
        content=body.content,
        metadata={
            "filename": body.filename,
            "uploaded_at": datetime.utcnow().isoformat(),
            **(body.metadata or {})
        }
    )
    
    chunks_added = vector_service.add_documents([doc])
    
    return DocumentResponse(
        id=str(uuid.uuid4()),
        filename=body.filename,
        chunks=chunks_added,
        created_at=datetime.utcnow()
    )


@router.post("/documents/upload-file", response_model=DocumentResponse)
async def upload_file(request: Request, file: UploadFile = File(...)):
    """
    Upload a file for indexing
    """
    vector_service = request.app.state.vector_service
    
    # Read file content
    content = await file.read()
    
    # Handle different file types
    if file.filename.endswith(".txt"):
        text_content = content.decode("utf-8")
    elif file.filename.endswith(".pdf"):
        # Requires pypdf
        from pypdf import PdfReader
        from io import BytesIO
        
        reader = PdfReader(BytesIO(content))
        text_content = "\n".join([page.extract_text() for page in reader.pages])
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.filename}"
        )
    
    doc = Document(
        content=text_content,
        metadata={
            "filename": file.filename,
            "uploaded_at": datetime.utcnow().isoformat()
        }
    )
    
    chunks_added = vector_service.add_documents([doc])
    
    return DocumentResponse(
        id=str(uuid.uuid4()),
        filename=file.filename,
        chunks=chunks_added,
        created_at=datetime.utcnow()
    )


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(request: Request):
    """
    List indexed documents (limited info for FAISS)
    """
    vector_service = request.app.state.vector_service
    
    return DocumentListResponse(
        documents=[],  # FAISS doesn't track individual docs well
        total=vector_service.document_count
    )


@router.delete("/documents/{doc_id}")
async def delete_document(request: Request, doc_id: str):
    """
    Delete a document by ID
    """
    vector_service = request.app.state.vector_service
    
    success = vector_service.delete(doc_id)
    
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Delete not supported for this vector store"
        )
    
    return {"status": "deleted", "id": doc_id}

"""
Vector Store Service - FAISS and Pinecone support
"""

import os
import logging
from typing import List, Dict, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class Document:
    """Simple document class"""
    def __init__(self, content: str, metadata: Optional[Dict] = None):
        self.content = content
        self.metadata = metadata or {}


class BaseVectorService(ABC):
    """Abstract base class for vector stores"""
    
    @abstractmethod
    def add_documents(self, documents: List[Document]) -> int:
        pass
    
    @abstractmethod
    def search(self, query: str, k: int = 5) -> List[Dict]:
        pass
    
    @abstractmethod
    def delete(self, doc_id: str) -> bool:
        pass


class FAISSVectorService(BaseVectorService):
    """FAISS-based vector store"""
    
    def __init__(self, settings):
        from langchain_community.vectorstores import FAISS
        from langchain_openai import OpenAIEmbeddings
        
        self.settings = settings
        self.index_path = settings.faiss_index_path
        self.embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            openai_api_key=settings.openai_api_key
        )
        self.vector_store = None
        self._document_count = 0
        
        logger.info("Initialized FAISS vector service")
    
    def load_index(self):
        """Load existing index from disk"""
        from langchain_community.vectorstores import FAISS
        
        if os.path.exists(self.index_path):
            self.vector_store = FAISS.load_local(
                self.index_path,
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            self._document_count = len(self.vector_store.docstore._dict)
            logger.info(f"Loaded FAISS index with {self._document_count} documents")
        else:
            logger.info("No existing FAISS index found")
    
    def add_documents(self, documents: List[Document]) -> int:
        """Add documents to the index"""
        from langchain_community.vectorstores import FAISS
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain.schema import Document as LCDocument
        
        # Convert to LangChain documents
        lc_docs = [
            LCDocument(page_content=doc.content, metadata=doc.metadata)
            for doc in documents
        ]
        
        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.settings.chunk_size,
            chunk_overlap=self.settings.chunk_overlap
        )
        chunks = splitter.split_documents(lc_docs)
        
        # Add to vector store
        if self.vector_store is None:
            self.vector_store = FAISS.from_documents(chunks, self.embeddings)
        else:
            self.vector_store.add_documents(chunks)
        
        # Save to disk
        self.vector_store.save_local(self.index_path)
        
        self._document_count = len(self.vector_store.docstore._dict)
        logger.info(f"Added {len(chunks)} chunks, total: {self._document_count}")
        
        return len(chunks)
    
    def search(self, query: str, k: int = 5) -> List[Dict]:
        """Search for similar documents"""
        if self.vector_store is None:
            return []
        
        results = self.vector_store.similarity_search_with_score(query, k=k)
        
        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            }
            for doc, score in results
        ]
    
    def delete(self, doc_id: str) -> bool:
        """Delete document by ID (limited support in FAISS)"""
        logger.warning("FAISS has limited delete support")
        return False
    
    @property
    def document_count(self) -> int:
        return self._document_count


class PineconeVectorService(BaseVectorService):
    """Pinecone-based vector store"""
    
    def __init__(self, settings):
        from pinecone import Pinecone
        from langchain_openai import OpenAIEmbeddings
        
        self.settings = settings
        self.embeddings = OpenAIEmbeddings(
            model=settings.embedding_model,
            openai_api_key=settings.openai_api_key
        )
        
        # Initialize Pinecone
        pc = Pinecone(api_key=settings.pinecone_api_key)
        self.index = pc.Index(settings.pinecone_index)
        
        logger.info(f"Initialized Pinecone with index: {settings.pinecone_index}")
    
    def load_index(self):
        """Pinecone is always connected"""
        pass
    
    def add_documents(self, documents: List[Document]) -> int:
        """Add documents to Pinecone"""
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        import uuid
        
        # Split documents
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.settings.chunk_size,
            chunk_overlap=self.settings.chunk_overlap
        )
        
        vectors = []
        for doc in documents:
            chunks = splitter.split_text(doc.content)
            for chunk in chunks:
                embedding = self.embeddings.embed_query(chunk)
                vectors.append({
                    "id": str(uuid.uuid4()),
                    "values": embedding,
                    "metadata": {"content": chunk, **doc.metadata}
                })
        
        # Upsert in batches
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            self.index.upsert(vectors=vectors[i:i+batch_size])
        
        logger.info(f"Added {len(vectors)} vectors to Pinecone")
        return len(vectors)
    
    def search(self, query: str, k: int = 5) -> List[Dict]:
        """Search Pinecone"""
        embedding = self.embeddings.embed_query(query)
        
        results = self.index.query(
            vector=embedding,
            top_k=k,
            include_metadata=True
        )
        
        return [
            {
                "content": match.metadata.get("content", ""),
                "metadata": match.metadata,
                "score": match.score
            }
            for match in results.matches
        ]
    
    def delete(self, doc_id: str) -> bool:
        """Delete from Pinecone"""
        self.index.delete(ids=[doc_id])
        return True
    
    @property
    def document_count(self) -> int:
        stats = self.index.describe_index_stats()
        return stats.total_vector_count


class VectorService:
    """Factory for vector services"""
    
    def __init__(self, settings):
        self.settings = settings
        
        if settings.vector_store == "faiss":
            self._service = FAISSVectorService(settings)
        elif settings.vector_store == "pinecone":
            self._service = PineconeVectorService(settings)
        else:
            raise ValueError(f"Unknown vector store: {settings.vector_store}")
    
    def load_index(self):
        self._service.load_index()
    
    def add_documents(self, documents: List[Document]) -> int:
        return self._service.add_documents(documents)
    
    def search(self, query: str, k: int = 5) -> List[Dict]:
        return self._service.search(query, k)
    
    def delete(self, doc_id: str) -> bool:
        return self._service.delete(doc_id)
    
    @property
    def document_count(self) -> int:
        return self._service.document_count

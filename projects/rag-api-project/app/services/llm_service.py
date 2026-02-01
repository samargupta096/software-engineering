"""
LLM Service - Supports OpenAI and AWS Bedrock
"""

import json
import logging
from typing import List, Dict, AsyncGenerator, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class BaseLLMService(ABC):
    """Abstract base class for LLM services"""
    
    @abstractmethod
    async def generate(
        self,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Dict:
        pass
    
    @abstractmethod
    async def generate_stream(
        self,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        pass


class BedrockLLMService(BaseLLMService):
    """AWS Bedrock LLM Service"""
    
    def __init__(self, settings):
        import boto3
        
        self.settings = settings
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key
        )
        self.model_id = settings.default_model
        logger.info(f"Initialized Bedrock LLM with model: {self.model_id}")
    
    async def generate(
        self,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Dict:
        """Generate response using Bedrock"""
        import asyncio
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages
        })
        
        # Run sync boto3 call in executor
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.client.invoke_model(
                modelId=self.model_id,
                body=body
            )
        )
        
        result = json.loads(response["body"].read())
        
        return {
            "content": result["content"][0]["text"],
            "model": self.model_id,
            "usage": {
                "prompt_tokens": result["usage"]["input_tokens"],
                "completion_tokens": result["usage"]["output_tokens"],
                "total_tokens": result["usage"]["input_tokens"] + result["usage"]["output_tokens"]
            },
            "finish_reason": result["stop_reason"]
        }
    
    async def generate_stream(
        self,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        """Stream response using Bedrock"""
        import asyncio
        
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages
        })
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.client.invoke_model_with_response_stream(
                modelId=self.model_id,
                body=body
            )
        )
        
        for event in response["body"]:
            chunk = json.loads(event["chunk"]["bytes"])
            if chunk["type"] == "content_block_delta":
                yield chunk["delta"]["text"]


class OpenAILLMService(BaseLLMService):
    """OpenAI LLM Service"""
    
    def __init__(self, settings):
        from openai import AsyncOpenAI
        
        self.settings = settings
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o"
        logger.info(f"Initialized OpenAI LLM with model: {self.model}")
    
    async def generate(
        self,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Dict:
        """Generate response using OpenAI"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return {
            "content": response.choices[0].message.content,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            },
            "finish_reason": response.choices[0].finish_reason
        }
    
    async def generate_stream(
        self,
        messages: List[Dict],
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        """Stream response using OpenAI"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        
        async for chunk in response:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class LLMService:
    """Factory and facade for LLM services"""
    
    def __init__(self, settings):
        self.settings = settings
        
        if settings.llm_provider == "bedrock":
            self._service = BedrockLLMService(settings)
        elif settings.llm_provider == "openai":
            self._service = OpenAILLMService(settings)
        else:
            raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")
    
    async def generate(
        self,
        query: str,
        system_prompt: str = "You are a helpful assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> Dict:
        """Generate response from query"""
        messages = [
            {"role": "system", "content": system_prompt} if system_prompt else None,
            {"role": "user", "content": query}
        ]
        messages = [m for m in messages if m]  # Remove None
        
        return await self._service.generate(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    async def generate_stream(
        self,
        query: str,
        system_prompt: str = "You are a helpful assistant.",
        temperature: float = 0.7,
        max_tokens: int = 1024
    ) -> AsyncGenerator[str, None]:
        """Stream response from query"""
        messages = [
            {"role": "system", "content": system_prompt} if system_prompt else None,
            {"role": "user", "content": query}
        ]
        messages = [m for m in messages if m]
        
        async for chunk in self._service.generate_stream(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        ):
            yield chunk

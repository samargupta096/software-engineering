# 🐍 Python for AI/ML/Agentic Coding - Architect's Guide

> A comprehensive guide covering Python fundamentals, internals, and AI/ML ecosystem for aspiring architects.

---

## 📑 Table of Contents

1. [Python Fundamentals](#1-python-fundamentals)
2. [Python Internals & Architecture](#2-python-internals--architecture)
3. [Memory Management](#3-memory-management)
4. [Concurrency & Parallelism](#4-concurrency--parallelism)
5. [Advanced Python Patterns](#5-advanced-python-patterns)
6. [AI/ML Ecosystem](#6-aiml-ecosystem)
7. [Agentic AI Development](#7-agentic-ai-development)
8. [Best Practices for Architects](#8-best-practices-for-architects)

---

## 1. Python Fundamentals

### 1.1 Data Types & Structures

```python
# Immutable Types
integer = 42
floating = 3.14
string = "Hello, AI!"
tuple_data = (1, 2, 3)
frozen = frozenset([1, 2, 3])

# Mutable Types
list_data = [1, 2, 3, 4, 5]
dict_data = {"name": "Agent", "type": "AI"}
set_data = {1, 2, 3}

# Type Hints (Python 3.9+)
from typing import List, Dict, Optional, Union

def process_data(items: List[int]) -> Dict[str, int]:
    return {"sum": sum(items), "count": len(items)}
```

### 1.2 Functions & Closures

```python
# First-class functions
def create_multiplier(n: int):
    """Closure example - inner function captures 'n'"""
    def multiplier(x: int) -> int:
        return x * n
    return multiplier

double = create_multiplier(2)
print(double(5))  # Output: 10

# Lambda & Higher-order functions
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

# Decorators
from functools import wraps
import time

def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} took {end - start:.4f}s")
        return result
    return wrapper

@timing_decorator
def slow_function():
    time.sleep(1)
```

### 1.3 Object-Oriented Programming

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List

# Abstract Base Class
class Agent(ABC):
    @abstractmethod
    def process(self, input_data: str) -> str:
        pass
    
    @abstractmethod
    def learn(self, feedback: dict) -> None:
        pass

# Dataclass (Python 3.7+)
@dataclass
class Message:
    role: str
    content: str
    metadata: dict = field(default_factory=dict)

# Concrete Implementation
class ChatAgent(Agent):
    def __init__(self, name: str, model: str):
        self.name = name
        self.model = model
        self.history: List[Message] = []
    
    def process(self, input_data: str) -> str:
        self.history.append(Message(role="user", content=input_data))
        response = f"Processed by {self.name}: {input_data}"
        self.history.append(Message(role="assistant", content=response))
        return response
    
    def learn(self, feedback: dict) -> None:
        print(f"Learning from feedback: {feedback}")

# Dunder/Magic Methods
class Vector:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
    
    def __add__(self, other: 'Vector') -> 'Vector':
        return Vector(self.x + other.x, self.y + other.y)
    
    def __repr__(self) -> str:
        return f"Vector({self.x}, {self.y})"
    
    def __eq__(self, other: 'Vector') -> bool:
        return self.x == other.x and self.y == other.y
```

### 1.4 Generators & Iterators

```python
# Generator function
def fibonacci(limit: int):
    a, b = 0, 1
    while a < limit:
        yield a
        a, b = b, a + b

# Generator expression
squares = (x**2 for x in range(1000000))  # Memory efficient

# Custom Iterator
class DataStream:
    def __init__(self, data: list):
        self.data = data
        self.index = 0
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.index >= len(self.data):
            raise StopIteration
        value = self.data[self.index]
        self.index += 1
        return value
```

### 1.5 Context Managers

```python
from contextlib import contextmanager

# Class-based
class DatabaseConnection:
    def __enter__(self):
        print("Opening connection...")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Closing connection...")
        return False  # Don't suppress exceptions

# Decorator-based
@contextmanager
def timer(name: str):
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        print(f"{name}: {elapsed:.4f}s")

# Usage
with timer("Training"):
    # ML training code
    pass
```

---

## 2. Python Internals & Architecture

### 2.1 CPython Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Python Source Code (.py)                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          LEXER/TOKENIZER                         │
│              Converts source code into tokens                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                             PARSER                               │
│              Creates Abstract Syntax Tree (AST)                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                           COMPILER                               │
│              Generates Bytecode (.pyc files)                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHON VIRTUAL MACHINE (PVM)                  │
│              Stack-based interpreter executes bytecode           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Bytecode & Disassembly

```python
import dis

def add_numbers(a, b):
    result = a + b
    return result

# Disassemble to see bytecode
dis.dis(add_numbers)
"""
Output:
  2           0 LOAD_FAST                0 (a)
              2 LOAD_FAST                1 (b)
              4 BINARY_ADD
              6 STORE_FAST               2 (result)

  3           8 LOAD_FAST                2 (result)
             10 RETURN_VALUE
"""

# Access code object directly
code = add_numbers.__code__
print(f"Constants: {code.co_consts}")
print(f"Variable names: {code.co_varnames}")
print(f"Bytecode: {code.co_code.hex()}")
```

### 2.3 PyObject - Everything is an Object

```
┌─────────────────────────────────────────┐
│              PyObject (C struct)         │
├─────────────────────────────────────────┤
│  Py_ssize_t ob_refcnt   (reference cnt) │
│  PyTypeObject *ob_type  (type pointer)  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         PyVarObject (variable size)      │
├─────────────────────────────────────────┤
│  PyObject base                           │
│  Py_ssize_t ob_size     (element count) │
└─────────────────────────────────────────┘
```

```python
import sys

# Every object has reference count & type
x = [1, 2, 3]
print(sys.getrefcount(x))  # Reference count
print(type(x))             # Type object
print(id(x))               # Memory address

# Integer interning (small integers cached)
a = 256
b = 256
print(a is b)  # True - same object

c = 257
d = 257
print(c is d)  # False - different objects
```

### 2.4 Global Interpreter Lock (GIL)

```
┌──────────────────────────────────────────────────────────────┐
│                         GIL (Mutex)                           │
│                                                               │
│    Thread 1        Thread 2        Thread 3                  │
│    ┌─────┐         ┌─────┐         ┌─────┐                   │
│    │ Run │ ←GIL    │Wait │         │Wait │                   │
│    └─────┘         └─────┘         └─────┘                   │
│                                                               │
│  Only ONE thread can execute Python bytecode at a time       │
└──────────────────────────────────────────────────────────────┘
```

**Key Points:**
- GIL is a mutex that protects Python objects
- Prevents race conditions in reference counting
- Limits true parallelism for CPU-bound tasks
- Released during I/O operations (network, file)

**Solutions for CPU-bound parallelism:**
```python
# 1. Multiprocessing (separate processes, no GIL sharing)
from multiprocessing import Pool

def cpu_intensive(n):
    return sum(i*i for i in range(n))

with Pool(4) as pool:
    results = pool.map(cpu_intensive, [10**7] * 4)

# 2. C extensions (NumPy releases GIL)
import numpy as np
# NumPy operations release GIL for parallelism

# 3. Alternative interpreters
# - PyPy (JIT compiled)
# - Jython (no GIL)
# - Python 3.13+ (PEP 703 - optional GIL-free mode)
```

### 2.5 Name Resolution - LEGB Rule

```
┌─────────────────────────────────────────────────────────────┐
│  B - Built-in (print, len, range, etc.)                     │
├─────────────────────────────────────────────────────────────┤
│  G - Global (module level names)                            │
├─────────────────────────────────────────────────────────────┤
│  E - Enclosing (outer function in nested functions)         │
├─────────────────────────────────────────────────────────────┤
│  L - Local (inside current function)                        │
└─────────────────────────────────────────────────────────────┘
           ↑ Search order (bottom to top)
```

```python
x = "global"

def outer():
    x = "enclosing"
    
    def inner():
        x = "local"
        print(x)  # "local" - L
    
    def inner2():
        print(x)  # "enclosing" - E
    
    inner()
    inner2()

outer()
print(x)  # "global" - G
print(len)  # <built-in function len> - B
```

---

## 3. Memory Management

### 3.1 Memory Allocation Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Python Memory                             │
├──────────────────────────────────────────────────────────────────┤
│  Layer 3: Object-specific allocators (list, dict, etc.)          │
├──────────────────────────────────────────────────────────────────┤
│  Layer 2: Python Object Allocator (pymalloc)                      │
│           - Manages small objects (≤512 bytes)                    │
│           - Uses memory pools and arenas                          │
├──────────────────────────────────────────────────────────────────┤
│  Layer 1: Python Memory Allocator                                 │
│           - Wraps C malloc/realloc/free                           │
├──────────────────────────────────────────────────────────────────┤
│  Layer 0: OS Memory Allocator (malloc, mmap)                      │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Reference Counting

```python
import sys

# Every object tracks its references
a = [1, 2, 3]
print(sys.getrefcount(a))  # 2 (a + getrefcount arg)

b = a  # Increment refcount
print(sys.getrefcount(a))  # 3

del b  # Decrement refcount
print(sys.getrefcount(a))  # 2

# When refcount → 0, object is deallocated immediately
```

### 3.3 Garbage Collection (Cycle Detector)

```python
import gc

# Circular reference - can't be freed by refcount alone
class Node:
    def __init__(self):
        self.ref = None

a = Node()
b = Node()
a.ref = b
b.ref = a  # Circular!

del a, b  # refcount won't reach 0

# GC detects and collects cycles
gc.collect()  # Force collection

# GC uses generational collection
# Generation 0 (young) → 1 → 2 (old)
print(gc.get_threshold())  # (700, 10, 10)
```

### 3.4 Memory Profiling

```python
# Using tracemalloc
import tracemalloc

tracemalloc.start()

# Your code here
data = [i**2 for i in range(100000)]

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')

for stat in top_stats[:5]:
    print(stat)

# Using memory_profiler (pip install memory-profiler)
# @profile decorator shows line-by-line memory usage
```

---

## 4. Concurrency & Parallelism

### 4.1 Threading (I/O-bound)

```python
import threading
import concurrent.futures
import requests

urls = [
    "https://api.github.com",
    "https://httpbin.org/get",
    "https://jsonplaceholder.typicode.com/posts/1"
]

def fetch_url(url: str) -> str:
    response = requests.get(url, timeout=10)
    return f"{url}: {response.status_code}"

# Using ThreadPoolExecutor
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(fetch_url, url): url for url in urls}
    for future in concurrent.futures.as_completed(futures):
        print(future.result())
```

### 4.2 Multiprocessing (CPU-bound)

```python
from multiprocessing import Pool, cpu_count
import numpy as np

def heavy_computation(arr: np.ndarray) -> float:
    """CPU-intensive task"""
    return np.sum(np.sqrt(arr ** 2 + arr ** 3))

if __name__ == "__main__":
    data_chunks = [np.random.rand(1000000) for _ in range(cpu_count())]
    
    with Pool(cpu_count()) as pool:
        results = pool.map(heavy_computation, data_chunks)
    
    print(f"Total: {sum(results)}")
```

### 4.3 Asyncio (Coroutines)

```python
import asyncio
import aiohttp

async def fetch_data(session: aiohttp.ClientSession, url: str) -> dict:
    async with session.get(url) as response:
        return await response.json()

async def main():
    urls = [
        "https://api.github.com/users/python",
        "https://api.github.com/users/google",
    ]
    
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_data(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        
    for result in results:
        print(result.get("login", "N/A"))

# Run the async main
asyncio.run(main())
```

### 4.4 Concurrency Comparison

| Feature | Threading | Multiprocessing | Asyncio |
|---------|-----------|-----------------|---------|
| **Best for** | I/O-bound | CPU-bound | I/O-bound (many connections) |
| **GIL Impact** | Limited by GIL | Bypasses GIL | N/A (single thread) |
| **Memory** | Shared | Separate (copy) | Shared |
| **Overhead** | Low | High (process spawn) | Very Low |
| **Use Case** | File I/O, simple APIs | ML training, data processing | Web scraping, APIs |

---

## 5. Advanced Python Patterns

### 5.1 Metaclasses

```python
class SingletonMeta(type):
    """Metaclass that creates singleton instances"""
    _instances = {}
    
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self):
        self.connection = "Connected"

db1 = Database()
db2 = Database()
print(db1 is db2)  # True
```

### 5.2 Descriptors

```python
class Validated:
    """Descriptor for validated attributes"""
    def __init__(self, min_value=None, max_value=None):
        self.min_value = min_value
        self.max_value = max_value
    
    def __set_name__(self, owner, name):
        self.name = name
        self.storage_name = f"__{name}"
    
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.storage_name, None)
    
    def __set__(self, obj, value):
        if self.min_value is not None and value < self.min_value:
            raise ValueError(f"{self.name} must be >= {self.min_value}")
        if self.max_value is not None and value > self.max_value:
            raise ValueError(f"{self.name} must be <= {self.max_value}")
        setattr(obj, self.storage_name, value)

class Model:
    learning_rate = Validated(min_value=0.0, max_value=1.0)
    epochs = Validated(min_value=1)
    
    def __init__(self, lr, epochs):
        self.learning_rate = lr
        self.epochs = epochs
```

### 5.3 Protocol Classes (Structural Subtyping)

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Trainable(Protocol):
    def fit(self, X, y) -> None: ...
    def predict(self, X) -> list: ...

class MyModel:
    def fit(self, X, y) -> None:
        print("Training...")
    
    def predict(self, X) -> list:
        return [0] * len(X)

def train_model(model: Trainable, X, y):
    model.fit(X, y)
    return model.predict(X)

# Works without inheritance!
model = MyModel()
print(isinstance(model, Trainable))  # True
```

---

## 6. AI/ML Ecosystem

### 6.1 Essential Libraries

| Library | Purpose | Key Features |
|---------|---------|--------------|
| **NumPy** | Numerical computing | N-dimensional arrays, vectorization |
| **Pandas** | Data manipulation | DataFrames, data cleaning |
| **Scikit-learn** | Classical ML | Preprocessing, models, evaluation |
| **PyTorch** | Deep Learning | Dynamic graphs, GPU acceleration |
| **TensorFlow** | Deep Learning | Production-ready, TFServing |
| **Transformers** | NLP/LLMs | Pre-trained models, fine-tuning |
| **LangChain** | LLM Apps | Chains, agents, retrieval |

### 6.2 NumPy Internals & Vectorization

```python
import numpy as np

# NumPy arrays are contiguous C arrays
arr = np.array([1, 2, 3, 4, 5], dtype=np.float64)

# Vectorized operations (no Python loops, releases GIL)
result = arr * 2 + np.sin(arr)  # Much faster than Python loops

# Broadcasting
matrix = np.random.rand(1000, 1000)
vector = np.random.rand(1000)
result = matrix + vector  # Auto-broadcasts

# Memory layout matters!
c_order = np.array([[1,2],[3,4]], order='C')   # Row-major
f_order = np.array([[1,2],[3,4]], order='F')   # Column-major
```

### 6.3 PyTorch Deep Learning

```python
import torch
import torch.nn as nn
import torch.optim as optim

class NeuralNetwork(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, output_size)
        )
    
    def forward(self, x):
        return self.layers(x)

# Device-agnostic code
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = NeuralNetwork(784, 256, 10).to(device)
optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = nn.CrossEntropyLoss()

# Training loop
def train(model, dataloader, epochs=10):
    model.train()
    for epoch in range(epochs):
        for batch_x, batch_y in dataloader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
```

### 6.4 Transformers & LLMs

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Load model and tokenizer
model_name = "microsoft/DialoGPT-medium"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

def generate_response(prompt: str, max_length: int = 100) -> str:
    inputs = tokenizer.encode(prompt + tokenizer.eos_token, return_tensors="pt")
    
    outputs = model.generate(
        inputs,
        max_length=max_length,
        pad_token_id=tokenizer.eos_token_id,
        do_sample=True,
        temperature=0.7,
        top_p=0.9
    )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return response[len(prompt):].strip()
```

---

## 7. Agentic AI Development

### 7.1 Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AGENT SYSTEM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │  TOOLS   │    │   LLM    │    │ MEMORY   │                   │
│  │ (Actions)│◄──►│ (Brain)  │◄──►│ (Context)│                   │
│  └──────────┘    └──────────┘    └──────────┘                   │
│       │               │               │                          │
│       └───────────────┼───────────────┘                          │
│                       ▼                                          │
│              ┌──────────────┐                                    │
│              │  PLANNING &  │                                    │
│              │  REASONING   │                                    │
│              └──────────────┘                                    │
│                       │                                          │
│                       ▼                                          │
│              ┌──────────────┐                                    │
│              │   OUTPUT     │                                    │
│              └──────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Building Agents with LangChain

```python
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool, StructuredTool
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from pydantic import BaseModel, Field

# Define tools
class SearchInput(BaseModel):
    query: str = Field(description="The search query")

def search_web(query: str) -> str:
    """Search the web for information"""
    return f"Search results for: {query}"

def calculate(expression: str) -> str:
    """Evaluate a mathematical expression"""
    try:
        return str(eval(expression))
    except:
        return "Error evaluating expression"

tools = [
    StructuredTool.from_function(
        func=search_web,
        name="search",
        description="Search the web for information",
        args_schema=SearchInput
    ),
    Tool.from_function(
        func=calculate,
        name="calculator",
        description="Evaluate mathematical expressions"
    )
]

# Create agent
llm = ChatOpenAI(model="gpt-4", temperature=0)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful AI assistant."),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad")
])

agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Run agent
result = agent_executor.invoke({"input": "What is 25 * 4?"})
```

### 7.3 Multi-Agent Systems with CrewAI

```python
from crewai import Agent, Task, Crew, Process

# Define agents
researcher = Agent(
    role="Research Analyst",
    goal="Find and analyze information",
    backstory="Expert at finding relevant information",
    verbose=True,
    allow_delegation=False
)

writer = Agent(
    role="Content Writer",
    goal="Create engaging content",
    backstory="Skilled writer with technical expertise",
    verbose=True,
    allow_delegation=False
)

# Define tasks
research_task = Task(
    description="Research the latest trends in AI agents",
    agent=researcher,
    expected_output="A summary of AI agent trends"
)

writing_task = Task(
    description="Write a blog post based on the research",
    agent=writer,
    expected_output="A complete blog post",
    context=[research_task]
)

# Create crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, writing_task],
    process=Process.sequential,
    verbose=True
)

# Run
result = crew.kickoff()
```

### 7.4 RAG (Retrieval-Augmented Generation)

```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA

# 1. Load and split documents
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)
documents = text_splitter.split_documents(raw_documents)

# 2. Create embeddings and vector store
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(documents, embeddings)

# 3. Create retrieval chain
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
qa_chain = RetrievalQA.from_chain_type(
    llm=ChatOpenAI(model="gpt-4"),
    chain_type="stuff",
    retriever=retriever
)

# 4. Query
response = qa_chain.invoke({"query": "What is the main topic?"})
```

---

## 8. Best Practices for Architects

### 8.1 Code Organization

```
my_ml_project/
├── src/
│   ├── __init__.py
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── implementations/
│   ├── models/
│   │   ├── __init__.py
│   │   └── neural_network.py
│   ├── data/
│   │   ├── __init__.py
│   │   ├── loaders.py
│   │   └── preprocessors.py
│   └── utils/
│       ├── __init__.py
│       └── helpers.py
├── tests/
│   ├── unit/
│   └── integration/
├── configs/
│   └── config.yaml
├── notebooks/
├── pyproject.toml
└── README.md
```

### 8.2 Type Safety & Validation

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import yaml

class ModelConfig(BaseModel):
    """Configuration with validation"""
    model_name: str
    learning_rate: float = Field(gt=0, le=1)
    epochs: int = Field(ge=1, le=1000)
    batch_size: int = Field(default=32, ge=1)
    hidden_layers: List[int]
    dropout: Optional[float] = Field(default=0.2, ge=0, le=1)
    
    @field_validator('hidden_layers')
    @classmethod
    def validate_layers(cls, v):
        if len(v) < 1:
            raise ValueError('Must have at least one hidden layer')
        return v
    
    @classmethod
    def from_yaml(cls, path: str) -> 'ModelConfig':
        with open(path) as f:
            return cls(**yaml.safe_load(f))
```

### 8.3 Performance Optimization Checklist

| Area | Optimization | Impact |
|------|-------------|--------|
| **Loops** | Use NumPy vectorization | 100x faster |
| **Memory** | Use generators for large data | Constant memory |
| **I/O** | Use async for network calls | 10x throughput |
| **CPU** | Use multiprocessing | Linear scaling |
| **GPU** | Batch operations | 50x faster |
| **Caching** | Use `@lru_cache` | Avoid recomputation |

### 8.4 Monitoring & Observability

```python
import logging
from functools import wraps
import time

# Structured logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def log_execution(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        logger.info(f"Starting {func.__name__}")
        try:
            result = func(*args, **kwargs)
            logger.info(f"Completed {func.__name__} in {time.time()-start:.2f}s")
            return result
        except Exception as e:
            logger.error(f"Failed {func.__name__}: {e}")
            raise
    return wrapper
```

---

## 📚 Learning Path

### Beginner (Weeks 1-4)
- [ ] Python syntax & data types
- [ ] Functions, classes, modules
- [ ] File I/O & exception handling
- [ ] Basic NumPy & Pandas

### Intermediate (Weeks 5-8)
- [ ] Decorators & context managers
- [ ] Generators & iterators
- [ ] Concurrency basics
- [ ] Scikit-learn fundamentals

### Advanced (Weeks 9-12)
- [ ] Python internals (bytecode, GIL)
- [ ] Memory management
- [ ] PyTorch/TensorFlow
- [ ] Transformers & LLMs

### Architect (Weeks 13-16)
- [ ] Agentic AI frameworks
- [ ] Multi-agent systems
- [ ] System design for ML
- [ ] Production deployment

---

## 🔗 Resources

- [Python Official Docs](https://docs.python.org/3/)
- [Real Python](https://realpython.com/)
- [PyTorch Tutorials](https://pytorch.org/tutorials/)
- [LangChain Docs](https://python.langchain.com/)
- [CrewAI Docs](https://docs.crewai.com/)
- [Hugging Face Course](https://huggingface.co/course)

---

*Last Updated: February 2026*

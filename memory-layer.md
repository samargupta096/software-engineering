# 🧠 Memory Layer — A Complete Guide

> **Memory** is what transforms an LLM from a stateless text predictor into a continuous companion. By implementing architectural patterns outside the model, we can give agents episodic memory of past events, semantic memory of facts, and the ability to retrieve context deterministically using knowledge graphs.

---

## Table of Contents

### Part 1: Architecture
1. [Why LLMs are Stateless by Default](#1-why-llms-are-stateless-by-default)
2. [Short-Term Memory and the Context Window](#2-short-term-memory-and-the-context-window)
3. [Long-Term Memory Stored Outside the Model](#3-long-term-memory-stored-outside-the-model)
4. [Episodic Memory for Past Interactions](#4-episodic-memory-for-past-interactions)
5. [Semantic Memory for Facts and User Knowledge](#5-semantic-memory-for-facts-and-user-knowledge)
6. [Memory Write, Update, and Forget Policies](#6-memory-write-update-and-forget-policies)

### Part 2: Implementations
7. [Integrating Mem0 into an Existing Agent](#7-integrating-mem0-into-an-existing-agent)
8. [Writing and Retrieving Personal Memories](#8-writing-and-retrieving-personal-memories)
9. [What a Knowledge Graph is and Why It Fits Memory](#9-what-a-knowledge-graph-is-and-why-it-fits-memory)
10. [Setting Up Neo4j and Connecting It to Your Agent](#10-setting-up-neo4j-and-connecting-it-to-your-agent)
11. [Storing Memory as Nodes and Relationships](#11-storing-memory-as-nodes-and-relationships)
12. [Querying Connected Memories Across Sessions](#12-querying-connected-memories-across-sessions)
13. [Building a Personal AI that Remembers You](#13-building-a-personal-ai-that-remembers-you)

---

## Part 1: Architecture

### 1. Why LLMs are Stateless by Default

Under the hood, Large Language Models (LLMs) based on the Transformer architecture are pure mathematical functions: `f(tokens) -> next_token`. 
When you chat with ChatGPT, the model doesn't "remember" what you said 5 minutes ago. Instead, the application layer (the UI) is re-sending your *entire conversation history* to the model with every new message.

```ascii
Call 1: [User: Hi] -> LLM -> [Asst: Hello!]
Call 2: [User: Hi] [Asst: Hello!] [User: What is my name?] -> LLM -> [Asst: I don't know]
```

This statelessness is a feature, not a bug—it allows massive parallelization and scaling across millions of users without managing session state inside the GPU.

### 2. Short-Term Memory and the Context Window

To give the illusion of memory during a session, we use **Short-Term Memory**. This relies entirely on the model's Context Window (e.g., 128k tokens for GPT-4o).

#### Strategies for Context Window Management:
1. **Conversation Buffer:** Keep appending messages until the context window is full. (Naive approach, eventually crashes).
2. **Sliding Window:** Keep only the last `N` messages. (Old context is lost).
3. **Summary Buffer:** Keep the last `N` messages raw, but use a secondary LLM call to continuously summarize the older messages into a dense "Running Summary".

```python
# Summary Buffer Example (Conceptual)
history = [
    {"role": "system", "content": "Summary of chat so far: The user is planning a trip to Japan in October. They like sushi."},
    {"role": "user", "content": "What hotels do you recommend?"} # Latest messages
]
```

### 3. Long-Term Memory Stored Outside the Model

When the conversation ends, or the context window gets too large, short-term memory fails. **Long-Term Memory** requires writing state to an external database (Vector DB, SQL, Graph DB) and retrieving it in future sessions via RAG or Tool Calling.

### 4. Episodic Memory for Past Interactions

**Episodic Memory** is the "memory of events". It answers: *"What did we talk about last Tuesday regarding the database migration?"*

**Implementation:**
- Store raw conversational turns grouped by "Session" or "Episode".
- Create embeddings for chunks of the conversation.
- When the user references the past ("Remember when we debugged that issue?"), query the Vector DB for similar past episodes and inject them into the prompt.

### 5. Semantic Memory for Facts and User Knowledge

**Semantic Memory** is "knowledge of facts". It answers: *"What is the user's name? What programming language do they prefer? Do they have allergies?"*

**Implementation:**
- Extract discrete facts from the conversation using an LLM.
- Store these as key-value pairs or Knowledge Graph relationships.
- Inject these facts into the System Prompt on every invocation.

### 6. Memory Write, Update, and Forget Policies

Memory isn't just appending to a database. It requires lifecycle management.

- **Write:** Extract facts asynchronously in the background. (e.g., User: "I just got a dog!" -> `Fact: User has a dog`).
- **Update:** Resolve conflicts. (e.g., User: "My dog passed away." -> Update `Fact: User had a dog` or create a new event).
- **Forget (Decay):** Humans forget irrelevant details. Implement TTL (Time-To-Live) or relevance decay scoring so the agent doesn't bring up a pizza order from 3 years ago when discussing dinner plans.

---

## Part 2: Implementations

### 7. Integrating Mem0 into an Existing Agent

[Mem0](https://github.com/mem0ai/mem0) (Memory Zero) is a dedicated memory layer for AI assistants that handles extraction, storage, and retrieval automatically.

#### Installation
```bash
pip install mem0ai
```

#### Configuration & Usage
```python
import os
from mem0 import Memory

# Initialize Mem0 (defaults to Qdrant/SQLite locally)
m = Memory()

user_id = "user_samarpit_123"

# 1. Store a memory from a conversation
messages = [
    {"role": "user", "content": "Hi, I'm Samarpit. I'm a software engineer working on agentic AI."},
    {"role": "assistant", "content": "Nice to meet you, Samarpit! Agentic AI is fascinating."}
]

# Mem0 will use an LLM under the hood to extract facts and store them
m.add(messages, user_id=user_id)

# 2. Retrieve memories for a new session
relevant_memories = m.search("What does the user do?", user_id=user_id)

for mem in relevant_memories:
    print(f"Memory: {mem['text']} (Confidence: {mem['score']})")
    
# Output:
# Memory: Name is Samarpit (Confidence: 0.92)
# Memory: Profession is software engineer (Confidence: 0.89)
# Memory: Works on agentic AI (Confidence: 0.88)
```

### 8. Writing and Retrieving Personal Memories

You can build a custom memory extractor if you don't want a heavy framework.

```python
from openai import OpenAI
import json

client = OpenAI()

def extract_semantic_memories(user_input: str) -> list[str]:
    """Uses an LLM to extract persistent facts from user input."""
    prompt = f"""
    Extract any persistent facts, preferences, or personal details about the user from the input.
    If there are no facts, return an empty list.
    Format as JSON: {{"facts": ["fact 1", "fact 2"]}}
    
    Input: {user_input}
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "system", "content": prompt}]
    )
    
    return json.loads(response.choices[0].message.content).get("facts", [])

# Example usage:
# facts = extract_semantic_memories("I'm allergic to peanuts and I love Python.")
# Result: ["User is allergic to peanuts", "User loves the Python programming language"]
# -> Save these to a database!
```

### 9. What a Knowledge Graph is and Why It Fits Memory

Vector databases struggle with relationships. If memory is `User -> loves -> Python` and `User -> hates -> Java`, a vector search for "Java" might return the "loves Python" memory because the embeddings for programming languages are close.

A **Knowledge Graph (KG)** models data as Nodes (Entities) and Edges (Relationships).

```ascii
(User: Samarpit) ──[WORKS_ON]──▶ (Project: AutoWiki)
       │
       └──[KNOWS_LANGUAGE]──▶ (Language: Python)
```
KGs allow deterministic retrieval: *"Get all languages Samarpit knows."*

### 10. Setting Up Neo4j and Connecting It to Your Agent

Neo4j is the leading graph database.

#### Docker Setup
```bash
docker run \
    --name neo4j \
    -p 7474:7474 -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/password123 \
    neo4j:latest
```

#### Connecting in Python
```bash
pip install neo4j
```

```python
from neo4j import GraphDatabase

URI = "bolt://localhost:7687"
AUTH = ("neo4j", "password123")

driver = GraphDatabase.driver(URI, auth=AUTH)

def run_query(query, parameters=None):
    with driver.session() as session:
        result = session.run(query, parameters)
        return [record.data() for record in result]
```

### 11. Storing Memory as Nodes and Relationships

Let's design a schema for Semantic Memory and write it using Cypher (Neo4j's query language).

```python
def add_user_preference(user_id: str, topic: str, sentiment: str):
    """Stores a user preference in the knowledge graph."""
    query = """
    // Find or create the User node
    MERGE (u:User {id: $user_id})
    
    // Find or create the Topic node
    MERGE (t:Topic {name: $topic})
    
    // Create the relationship based on sentiment
    MERGE (u)-[r:HAS_PREFERENCE {sentiment: $sentiment}]->(t)
    
    // Update timestamp
    SET r.last_updated = timestamp()
    """
    
    run_query(query, {"user_id": user_id, "topic": topic, "sentiment": sentiment})

# Usage:
add_user_preference("user_123", "Python", "Loves")
add_user_preference("user_123", "Java", "Dislikes")
```

### 12. Querying Connected Memories Across Sessions

When the user starts a new session, we query the graph to build the context.

```python
def get_user_context(user_id: str) -> str:
    """Retrieves all semantic knowledge about the user to inject into prompt."""
    query = """
    MATCH (u:User {id: $user_id})-[r:HAS_PREFERENCE]->(t:Topic)
    RETURN t.name as topic, r.sentiment as sentiment
    ORDER BY r.last_updated DESC
    """
    
    results = run_query(query, {"user_id": user_id})
    
    if not results:
        return "No prior memory about this user."
        
    context_lines = []
    for row in results:
        context_lines.append(f"- User {row['sentiment'].lower()} {row['topic']}.")
        
    return "\n".join(context_lines)
```

### 13. Building a Personal AI that Remembers You

Let's combine everything into a complete, end-to-end agent implementation.

```python
import os
from openai import OpenAI
from typing import List, Dict

client = OpenAI()

class PersonalAgent:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.short_term_memory: List[Dict] = [] # Session buffer
        
    def chat(self, user_message: str) -> str:
        # 1. BACKGROUND MEMORY EXTRACTION
        # (In production, run this asynchronously)
        new_facts = extract_semantic_memories(user_message)
        for fact in new_facts:
            # Assume we parse "fact" into topic/sentiment here for Neo4j
            # or just use Mem0 to handle it automatically.
            print(f"[Memory Layer] Storing new fact: {fact}")
            
        # 2. RETRIEVE LONG-TERM MEMORY
        kg_context = get_user_context(self.user_id)
        
        # 3. CONSTRUCT PROMPT
        system_prompt = f"""
        You are a personalized AI assistant.
        
        BACKGROUND KNOWLEDGE ABOUT THE USER:
        {kg_context}
        
        Use this knowledge naturally. Do not explicitly say "I see from my memory that...".
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.short_term_memory)
        messages.append({"role": "user", "content": user_message})
        
        # 4. GENERATE RESPONSE
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        
        assistant_message = response.choices[0].message.content
        
        # 5. UPDATE SHORT-TERM MEMORY
        self.short_term_memory.append({"role": "user", "content": user_message})
        self.short_term_memory.append({"role": "assistant", "content": assistant_message})
        
        # Keep buffer small (e.g., last 10 messages)
        if len(self.short_term_memory) > 10:
            self.short_term_memory = self.short_term_memory[-10:]
            
        return assistant_message

# --- Example Run ---
if __name__ == "__main__":
    agent = PersonalAgent("sam_001")
    
    # Session 1
    print("User: Can you help me write a backend service?")
    print("Agent:", agent.chat("Can you help me write a backend service?"))
    
    # Let's manually inject a preference to simulate past extraction
    add_user_preference("sam_001", "Python / FastAPI", "Loves")
    
    # Session 2 (Later)
    print("\nUser: How should I structure the API routes?")
    # Because of the KG fetch, the agent will immediately suggest Python/FastAPI structures!
    print("Agent:", agent.chat("How should I structure the API routes?"))
```

---

> *"Memory is not a database of the past; it is a context engine for the future."*

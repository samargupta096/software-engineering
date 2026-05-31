# 🤖 Agentic Workflows — A Complete Guide

> **Agentic Workflows** move AI from passive response generators to active, autonomous problem solvers. By embedding LLMs within a "perceive-decide-act" loop and arming them with tools, agents can interact with the environment, recover from errors, and execute complex, multi-step tasks that traditional prompt chains cannot handle.

---

## Table of Contents

1. [Agent Fundamentals](#1-agent-fundamentals)
    - [The Difference Between a Chain and an Agent](#the-difference-between-a-chain-and-an-agent)
    - [The Perceive-Decide-Act Loop in Code](#the-perceive-decide-act-loop-in-code)
2. [Designing Tools with Strict JSON Schemas](#2-designing-tools-with-strict-json-schemas)
3. [Parallel vs Sequential Tool Calls](#3-parallel-vs-sequential-tool-calls)
4. [Guardrails and Safe Tool Execution](#4-guardrails-and-safe-tool-execution)
5. [Retries and Error Recovery](#5-retries-and-error-recovery)
6. [Preventing Infinite Loops and Runaway Agents](#6-preventing-infinite-loops-and-runaway-agents)

---

## 1. Agent Fundamentals

### The Difference Between a Chain and an Agent

Many developers confuse chains with agents. The distinction lies in **control flow**.

#### The Chain (Deterministic)
A chain is a hardcoded sequence of steps. The developer decides the path; the LLM merely fills in the blanks.
*Flow: Input → Prompt A → Tool X → Prompt B → Tool Y → Output*

```python
# A Chain
def research_chain(topic):
    # Step 1 is ALWAYS search
    search_results = duckduckgo_search(topic)
    
    # Step 2 is ALWAYS summarize
    summary = llm_summarize(search_results)
    
    # Step 3 is ALWAYS save
    save_to_file(summary)
    return "Done"
```
**Pros:** Predictable, fast, easy to debug, low token usage.
**Cons:** Brittle. If the search fails, the whole chain fails. It cannot adapt.

#### The Agent (Autonomous)
An agent is given a goal and a set of tools. The LLM decides **which** tools to use, in **what** order, and **how many times**, until the goal is met.
*Flow: Input → LLM (Decides Tool X) → Exec Tool X → LLM (Decides Tool Y) → Exec Tool Y → LLM (Decides Done) → Output*

```python
# An Agent (Conceptual)
def research_agent(topic, tools):
    state = f"Goal: Research {topic}"
    while not goal_achieved(state):
        action = llm_choose_action(state, tools)
        result = execute(action)
        state += f"\nObservation: {result}"
    return final_answer(state)
```
**Pros:** Resilient, adaptable, can solve open-ended problems.
**Cons:** Unpredictable, slower, expensive (many LLM calls), requires guardrails.

### The Perceive-Decide-Act Loop in Code

An agent operates in a continuous loop, often called the ReAct (Reason + Act) loop.

```ascii
      ┌─────────────────────────────────────────┐
      │                                         │
      ▼                                         │
┌────────────┐     ┌────────────┐        ┌──────┴─────┐
│  PERCEIVE  │ ──▶ │   DECIDE   │ ───▶   │    ACT     │
│ (Context + │     │ (LLM Tool  │        │ (Execute   │
│  History)  │     │  Calling)  │        │  Function) │
└────────────┘     └────────────┘        └────────────┘
```

#### Full Implementation of an Agent Loop

Here is a pure Python implementation of an agent loop using the OpenAI tool-calling API format:

```python
import json
import logging
from openai import OpenAI

client = OpenAI()
logging.basicConfig(level=logging.INFO)

# 1. Define our actual python functions (The Environment)
def get_weather(location: str) -> str:
    """Mock weather API"""
    if "london" in location.lower():
        return "It is raining and 15°C in London."
    return f"It is sunny and 22°C in {location}."

def calculate(expression: str) -> str:
    """Mock calculator"""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"Error: {str(e)}"

# A dictionary mapping tool names to python functions
AVAILABLE_TOOLS = {
    "get_weather": get_weather,
    "calculate": calculate
}

def run_agent(user_prompt: str, tools_schema: list, max_steps: int = 5):
    messages = [
        {"role": "system", "content": "You are a helpful assistant with access to tools."},
        {"role": "user", "content": user_prompt}
    ]
    
    for step in range(max_steps):
        logging.info(f"--- Step {step + 1} ---")
        
        # DECIDE: Call LLM
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=tools_schema,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        messages.append(message) # Append assistant's response to history
        
        # Check if LLM decided to use a tool
        if not message.tool_calls:
            # LLM decided it has the final answer
            logging.info("Agent reached final answer.")
            return message.content
            
        # ACT: Execute tools
        for tool_call in message.tool_calls:
            function_name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)
            
            logging.info(f"Calling tool: {function_name} with args: {arguments}")
            
            # Execute the python function
            if function_name in AVAILABLE_TOOLS:
                func_result = AVAILABLE_TOOLS[function_name](**arguments)
            else:
                func_result = f"Error: Tool {function_name} not found."
                
            logging.info(f"Tool Result: {func_result}")
            
            # PERCEIVE: Append tool result back to history
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": str(func_result)
            })
            
    return "Error: Max steps reached without final answer."
```

---

## 2. Designing Tools with Strict JSON Schemas

For the agent to understand *how* to use a tool, you must define it using JSON Schema. A good schema is the equivalent of prompt engineering for tools.

### The Schema Format
```python
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a specific location. Use this when the user asks about weather.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and country, e.g., 'London, UK' or 'Tokyo, Japan'."
                    }
                },
                "required": ["location"],
                "additionalProperties": False # Strict adherence
            }
        }
    }
]
```

### Best Practices for Tool Design
1. **Descriptive Names:** Use `search_internal_wiki` instead of `search`.
2. **Clear Descriptions:** The `description` field is read by the LLM. Explain *when* to use it and *what* it returns.
3. **Enums for Strictness:** If a parameter has fixed options, use `enum: ["celsius", "fahrenheit"]`.
4. **Single Responsibility:** A tool should do one thing well. Don't create a `manage_database` tool; create `query_db`, `insert_row`, etc.
5. **Strict Mode:** For OpenAI, use Structured Outputs (`"strict": True`) to guarantee the JSON matches your schema perfectly.

---

## 3. Parallel vs Sequential Tool Calls

Modern LLMs can invoke multiple tools in a single response. You must design your agent loop to handle this.

### Parallel Tool Calls
**Scenario:** "What is the weather in New York, London, and Tokyo?"
The LLM can output three tool calls simultaneously:
`get_weather("New York")`, `get_weather("London")`, `get_weather("Tokyo")`.

**Implementation:**
In the agent loop shown earlier, the `for tool_call in message.tool_calls:` block naturally handles this. If performance matters, execute these functions asynchronously:

```python
import asyncio

async def act_parallel(tool_calls):
    tasks = []
    for tc in tool_calls:
        func = AVAILABLE_TOOLS[tc.function.name]
        args = json.loads(tc.function.arguments)
        # Assuming functions are async
        tasks.append(func(**args))
    
    results = await asyncio.gather(*tasks)
    return results
```

### Sequential Tool Calls (Dependency Graph)
**Scenario:** "Find the CEO of Apple, then find their current net worth."
The LLM *cannot* call these in parallel. It must:
1. Call `search("CEO of Apple")` → Result: Tim Cook
2. Wait for the result.
3. Call `search("Tim Cook net worth")`

The ReAct loop inherently handles this by doing one generation per step. The LLM will output the first tool call, receive the observation, and in the next iteration, output the second tool call.

---

## 4. Guardrails and Safe Tool Execution

Giving an LLM access to tools (like bash execution or database writing) is dangerous. You must implement guardrails at the tool boundary.

### 1. Sandboxing
Never run LLM-generated code or terminal commands directly on the host machine.
- Use **Docker containers** (e.g., E2B, Firecracker microVMs) to execute code.
- If running SQL, use a read-only database replica.

### 2. Input Validation (Pydantic)
Even if the LLM schema requests an integer, it might send a string. Validate inputs *before* executing the function.

```python
from pydantic import BaseModel, ValidationError

class WriteFileArgs(BaseModel):
    filepath: str
    content: str

def safe_write_file(raw_args: dict):
    try:
        # Validate schema
        args = WriteFileArgs(**raw_args)
        
        # Validate path traversal attack
        if ".." in args.filepath or args.filepath.startswith("/"):
            return "Error: Invalid path. Must be relative to workspace."
            
        with open(args.filepath, 'w') as f:
            f.write(args.content)
        return "Success"
        
    except ValidationError as e:
        return f"Schema Error: {e.json()}"
```

### 3. Human-in-the-Loop (HITL) Permission System
For destructive actions (e.g., `drop_table`, `send_email`), pause the agent loop and request human approval.

```python
def send_email_tool(to: str, body: str):
    print(f"\nAGENT WANTS TO SEND EMAIL TO: {to}")
    print(f"BODY:\n{body}")
    approval = input("Approve? (y/n): ")
    if approval.lower() != 'y':
        return "Action cancelled by human."
    
    # Actually send email...
    return "Email sent successfully."
```

---

## 5. Retries and Error Recovery

One of the greatest strengths of an agent is its ability to recover from errors. If a tool fails, you should return the error *back to the LLM* so it can try again.

### Graceful Degradation in Tools

```python
def query_database(sql: str):
    try:
        cursor.execute(sql)
        return cursor.fetchall()
    except Exception as e:
        # DO NOT crash the program.
        # Return the error to the LLM so it can fix its SQL.
        return f"SQL Error: {str(e)}. Please check your syntax and schema."
```

### Handling LLM Refusals or Malformed Outputs
Sometimes the LLM refuses to answer or outputs invalid JSON (if not using strict mode).

```python
# Inside the agent loop
try:
    arguments = json.loads(tool_call.function.arguments)
except json.JSONDecodeError:
    # Feed the error back to the LLM
    messages.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": "Error: Your tool arguments were not valid JSON. Please try again."
    })
    continue # Let the LLM retry in the next loop iteration
```

---

## 6. Preventing Infinite Loops and Runaway Agents

Agents can get stuck in loops (e.g., querying the same failing SQL over and over). You must implement strict limits.

### 1. Max Iterations (The Hard Stop)
Always wrap your agent loop in a `for` loop with a maximum step count, NOT a `while True` loop.

```python
max_steps = 10
for step in range(max_steps):
    # loop logic...
    
# If the loop finishes without returning:
return "Agent terminated: Exceeded maximum allowed steps."
```

### 2. Token and Cost Budgets
Track the cumulative token usage of the conversation. If it exceeds a budget, terminate the agent.

```python
total_cost = 0.0
MAX_BUDGET = 0.50 # $0.50 max per run

# After each LLM call:
tokens = response.usage.total_tokens
cost = calculate_cost(tokens, model="gpt-4o")
total_cost += cost

if total_cost > MAX_BUDGET:
    return "Agent terminated: Cost budget exceeded."
```

### 3. The Watchdog Pattern (Loop Detection)
Keep track of the exact tool calls made. If the agent makes the exact same tool call with the exact same arguments 3 times in a row, it's stuck.

```python
history_of_calls = []

# inside loop:
call_signature = f"{function_name}({arguments})"
history_of_calls.append(call_signature)

# Check last 3 calls
if len(history_of_calls) >= 3:
    if history_of_calls[-1] == history_of_calls[-2] == history_of_calls[-3]:
        # Intervene!
        messages.append({
            "role": "user",
            "content": "SYSTEM WARNING: You are repeating the exact same action. You must try a different approach or conclude the task."
        })
```

---

> *"A chain is only as strong as its weakest prompt. An agent is as strong as its ability to recover from failure."*

# 🏗️ Domain 1: Agentic Architecture & Orchestration (27%)

> **This is the HEAVIEST domain — ~16 questions.** Master this first.

### 📊 Exam Weight Distribution

```mermaid
pie title Exam Domain Weights
    "D1: Agentic Architecture (27%)" : 27
    "D2: Tool Design & MCP (18%)" : 18
    "D3: Claude Code Config (20%)" : 20
    "D4: Prompt Engineering (20%)" : 20
    "D5: Context & Reliability (15%)" : 15
```

---

## 📘 Topic 1.1: The Agentic Loop — The Foundation of Everything

### What Is It?

The agentic loop is the fundamental pattern that makes Claude "do things" rather than just "say things." Without it, Claude is just a chatbot. With it, Claude becomes an autonomous agent that can reason, act, and iterate.

### The Mental Model

Think of the agentic loop like a **chef in a kitchen**:
1. 📋 **Receive the order** (user request)
2. 🧠 **Decide what to do** (Claude thinks)
3. 🔪 **Take an action** (call a tool — chop vegetables, check the oven)
4. 👀 **Check the result** (did the food burn? is it ready?)
5. 🔄 **Decide next step** — either take another action or serve the dish

The loop continues until the meal is complete (`end_turn`) or something goes wrong.

### The Flow in Detail

```mermaid
flowchart TD
    A["📋 User Request"] --> B["🧠 Send to Claude API"]
    B --> C{"Check stop_reason"}
    C -->|"tool_use"| D["🔧 Execute Tool"]
    D --> E["📤 Return tool_result"]
    E --> B
    C -->|"end_turn"| F["✅ Return Response to User"]
    C -->|"max_tokens"| G["⚠️ Handle Overflow"]
    G --> H["Summarize / Chunk / Compact"]
    H --> B
    C -->|"refusal"| I["🚫 Safety Guardrail - Report to User"]

    style A fill:#4CAF50,color:#fff
    style F fill:#4CAF50,color:#fff
    style I fill:#f44336,color:#fff
    style G fill:#FF9800,color:#fff
    style D fill:#2196F3,color:#fff
```

### The Four `stop_reason` Values — Know Them Cold

| `stop_reason` | What Happened | What You Do |
|---|---|---|
| `end_turn` | Claude finished its response naturally | Deliver the response to the user. The loop exits. |
| `tool_use` | Claude wants to call one or more tools | Execute the tool(s), send results back, **continue the loop** |
| `max_tokens` | The response hit the maximum output token limit | **Handle gracefully** — do NOT just "increase max_tokens." Use progressive summarization, chunk the work, or `/compact` |
| `refusal` | Claude's safety guidelines prevented a response | Report to the user; do not retry the same request |

### 🧱 Stop Reason Actions — Quick Reference Box

```mermaid
graph TB
    subgraph STOP_REASONS["📦 stop_reason Response Actions"]
        direction LR
        subgraph END["✅ end_turn"]
            E1["Return response\nto user"]
            E2["Exit the loop"]
        end
        subgraph TOOL["🔧 tool_use"]
            T1["Execute the\nrequested tool"]
            T2["Send result back\nto Claude"]
            T3["Continue the loop"]
        end
        subgraph MAX["⚠️ max_tokens"]
            M1["DO NOT increase\nmax_tokens"]
            M2["Use /compact or\nsubagents"]
            M3["Break into\nsmaller chunks"]
        end
        subgraph REF["🚫 refusal"]
            R1["Safety guardrail\ntriggered"]
            R2["Report to user"]
            R3["DO NOT retry"]
        end
    end

    style END fill:#4CAF50,color:#fff
    style TOOL fill:#2196F3,color:#fff
    style MAX fill:#FF9800,color:#fff
    style REF fill:#f44336,color:#fff
    style STOP_REASONS fill:#1a1a2e,color:#fff
```

### ⚠️ Critical Exam Trap: `max_tokens`

**Wrong answer that sounds right:** "Increase the max_tokens parameter."

**Why it's wrong:** `max_tokens` controls the **output length**, not the context window size. If Claude hits this, the solution is architectural:
- Use `/compact` to summarize conversation history
- Break the task into smaller chunks
- Delegate to subagents
- Use progressive summarization

This is one of the most commonly tested traps.

### Real-World Example: An Order Processing Agent

```python
# Pseudocode — The Agentic Loop
def run_agent(user_request):
    messages = [{"role": "user", "content": user_request}]
    
    while True:
        response = claude.messages.create(
            model="claude-sonnet-4-20250514",
            messages=messages,
            tools=available_tools
        )
        
        if response.stop_reason == "end_turn":
            # Claude is done — return the final response
            return response.content
        
        elif response.stop_reason == "tool_use":
            # Claude wants to call a tool
            for tool_call in response.tool_use_blocks:
                result = execute_tool(tool_call.name, tool_call.input)
                messages.append({
                    "role": "tool",
                    "tool_use_id": tool_call.id,
                    "content": result
                })
            # Continue the loop — Claude will decide what to do next
        
        elif response.stop_reason == "max_tokens":
            # Handle gracefully — summarize, don't just increase limit
            messages.append(create_summary_request())
        
        elif response.stop_reason == "refusal":
            # Safety guardrail — report to user
            return "Unable to process this request due to safety guidelines."
```

### 🎯 Key Takeaway

The agentic loop is an **infinite loop with exit conditions**. Claude is in the driver's seat — it decides when to use tools, when to stop, and what to do with errors. Your job as the architect is to:
1. Provide the right tools
2. Handle each `stop_reason` correctly
3. Never silently ignore `max_tokens` or `refusal`

### 🔄 Agentic Loop — State Diagram

```mermaid
stateDiagram-v2
    [*] --> ReceiveRequest: User sends request
    ReceiveRequest --> SendToClaude: Build messages array
    SendToClaude --> CheckStopReason: API response received

    CheckStopReason --> ExecuteTool: stop_reason = tool_use
    CheckStopReason --> ReturnResponse: stop_reason = end_turn
    CheckStopReason --> HandleOverflow: stop_reason = max_tokens
    CheckStopReason --> ReportSafety: stop_reason = refusal

    ExecuteTool --> SendToClaude: Append tool_result
    HandleOverflow --> SendToClaude: Summarize & compact
    ReturnResponse --> [*]: Deliver to user
    ReportSafety --> [*]: Notify user
```

---

## 📘 Topic 1.2: Claude Agent SDK Core Concepts

### `query()` vs `ClaudeSDKClient`

| Feature | `query()` | `ClaudeSDKClient` |
|---|---|---|
| Session model | **One-shot** — new session per call | **Persistent** — maintains conversation |
| Context | Fresh context each time | Continuous context preservation |
| Use case | Simple, stateless tasks | Complex, multi-turn workflows |
| Tools | Passed per call | Configured once, used across session |

### Built-in Tools

Claude Code comes with powerful built-in tools. Know what each does:

| Tool | Purpose | When to Use |
|---|---|---|
| `Read` | Read file contents | Viewing code, configs, logs |
| `Write` | Create/overwrite entire files | New files, complete rewrites |
| `Edit` | Modify specific parts of a file | Targeted changes (safer than Write) |
| `Bash` | Execute shell commands | Running tests, builds, scripts |
| `Grep` | Search file **contents** by pattern | "Find all files containing X" |
| `Glob` | Search file **names** by pattern | "Find all .tsx files in src/" |
| `WebSearch` | Search the web | External docs, package info |

### Exam Trap: `Grep` vs `Glob`

- **Grep** = search inside files (by content)
- **Glob** = search file names/paths (by pattern)

When the question asks "find files containing a specific API endpoint," the answer is **Grep**, not Glob.

### Tool Control: `allowedTools` / `disallowedTools`

You can restrict which tools an agent can access:
- **`allowedTools`**: Whitelist — only these tools are available
- **`disallowedTools`**: Blacklist — everything EXCEPT these

**Principle of least privilege**: Give agents only the tools they need. A research agent doesn't need `Write`. A code review agent doesn't need `Bash`.

---

## 📘 Topic 1.3: Multi-Agent Orchestration Patterns

### Why Multi-Agent?

A single agent with 20 tools and a massive context window becomes:
- **Confused** — too many tools to choose from
- **Forgetful** — important context gets lost in the middle
- **Risky** — one mistake affects everything

Multi-agent architectures solve this by dividing responsibility.

### The Four Patterns You Must Know

#### 1. Hub-and-Spoke (Coordinator-Subagent)

```mermaid
graph TD
    C["🎯 Coordinator Agent"] -->|"Task 1"| S1["🔍 Search Agent"]
    C -->|"Task 2"| S2["📊 Analysis Agent"]
    C -->|"Task 3"| S3["✍️ Writer Agent"]
    S1 -->|"Summary"| C
    S2 -->|"Results"| C
    S3 -->|"Draft"| C

    style C fill:#9C27B0,color:#fff
    style S1 fill:#2196F3,color:#fff
    style S2 fill:#2196F3,color:#fff
    style S3 fill:#2196F3,color:#fff
```

**When?** Multiple independent subtasks that need combining.

**Real-world analogy:** A project manager assigns tasks to team members. Each member works independently and reports back with a summary, not their entire day's notes.

#### 2. Evaluator-Optimizer

```mermaid
graph LR
    G["✍️ Generator Agent"] -->|"Draft"| E["🔍 Evaluator Agent"]
    E -->|"❌ Feedback"| G
    E -->|"✅ Quality Met"| D["🎉 Done"]

    style G fill:#FF9800,color:#fff
    style E fill:#2196F3,color:#fff
    style D fill:#4CAF50,color:#fff
```

**When?** Quality matters more than speed. Code review, writing, design.

**Real-world analogy:** An author writes a draft, gives it to an editor. The editor sends back feedback, the author revises. They loop until the editor approves.

#### 3. Pipeline (Sequential)

```mermaid
graph LR
    A["📥 Extract"] --> B["🏷️ Classify"]
    B --> C["✓ Validate"]
    C --> D["📤 Output"]

    style A fill:#2196F3,color:#fff
    style B fill:#9C27B0,color:#fff
    style C fill:#FF9800,color:#fff
    style D fill:#4CAF50,color:#fff
```

**When?** Each step depends on the previous step's output.

**Real-world analogy:** An assembly line — each station adds something specific, and the product flows forward.

#### 4. Parallel Fan-Out

```mermaid
graph TD
    C["🎯 Coordinator"] --> W["🌐 Web Search"]
    C --> CS["💻 Code Search"]
    C --> D["📚 Docs Search"]
    C --> SL["💬 Slack Search"]
    W --> SYN["🔄 Synthesize Results"]
    CS --> SYN
    D --> SYN
    SL --> SYN

    style C fill:#9C27B0,color:#fff
    style SYN fill:#4CAF50,color:#fff
    style W fill:#2196F3,color:#fff
    style CS fill:#2196F3,color:#fff
    style D fill:#2196F3,color:#fff
    style SL fill:#2196F3,color:#fff
```

**When?** Independent research tasks that can run simultaneously.

**Real-world analogy:** A detective sending officers to interview different witnesses at the same time.

### 📊 Pattern Selection — Quadrant Chart

```mermaid
quadrantChart
    title Multi-Agent Pattern Selection Guide
    x-axis "Sequential" --> "Parallel"
    y-axis "Simple" --> "Complex"
    quadrant-1 "Parallel Fan-Out"
    quadrant-2 "Evaluator-Optimizer"
    quadrant-3 "Pipeline"
    quadrant-4 "Hub-and-Spoke"
    "Web scraping 5 sites": [0.8, 0.3]
    "Code review pipeline": [0.2, 0.6]
    "Research synthesis": [0.7, 0.8]
    "Draft-review loop": [0.3, 0.7]
    "ETL pipeline": [0.15, 0.3]
    "Multi-source search": [0.85, 0.5]
```

### 🗺️ Visual Guide: Choosing the Right Pattern

```mermaid
flowchart TD
    Q1{"Are subtasks independent?"}
    Q1 -->|"Yes"| Q2{"Can they run simultaneously?"}
    Q1 -->|"No"| Q3{"Does output A feed into B?"}
    Q2 -->|"Yes"| P1["✅ Parallel Fan-Out"]
    Q2 -->|"No"| P2["✅ Hub-and-Spoke"]
    Q3 -->|"Yes"| P3["✅ Pipeline"]
    Q3 -->|"No"| Q4{"Need iterative quality?"}
    Q4 -->|"Yes"| P4["✅ Evaluator-Optimizer"]
    Q4 -->|"No"| P2

    style P1 fill:#4CAF50,color:#fff
    style P2 fill:#4CAF50,color:#fff
    style P3 fill:#4CAF50,color:#fff
    style P4 fill:#4CAF50,color:#fff
    style Q1 fill:#FF9800,color:#fff
    style Q2 fill:#FF9800,color:#fff
    style Q3 fill:#FF9800,color:#fff
    style Q4 fill:#FF9800,color:#fff
```

### The 5 Golden Rules of Multi-Agent Architecture

These rules are **heavily tested**. Know them by heart.

| # | Rule | Why |
|---|---|---|
| 1 | **Context isolation** — each subagent has its OWN context window | Prevents one agent's noise from confusing another |
| 2 | **Pass summaries, not histories** | Full histories waste context and introduce confusion |
| 3 | **Manifest files for crash recovery** | If a subagent crashes, the coordinator can resume from the last good state |
| 4 | **Subagents cannot share memory** | They communicate ONLY through the coordinator |
| 5 | **Limit tool count: 4-5 per agent** | More tools = more selection ambiguity = more errors |

### 🧱 5 Golden Rules — Layered Architecture View

```mermaid
graph TB
    subgraph ARCH["🏗️ Multi-Agent Architecture Layers"]
        direction TB
        subgraph LAYER1["Layer 1: Communication"]
            L1["📨 Pass summaries, NOT histories"]
            L1B["🚫 Subagents cannot share memory"]
        end
        subgraph LAYER2["Layer 2: Isolation"]
            L2["🔒 Each subagent has its OWN context window"]
            L2B["📋 Communicate ONLY through coordinator"]
        end
        subgraph LAYER3["Layer 3: Tool Design"]
            L3["🔧 Max 4-5 tools per agent"]
            L3B["More tools = more ambiguity = more errors"]
        end
        subgraph LAYER4["Layer 4: Reliability"]
            L4["💾 Manifest files for crash recovery"]
            L4B["Resume from last good state on failure"]
        end
    end

    LAYER1 --> LAYER2 --> LAYER3 --> LAYER4

    style LAYER1 fill:#2196F3,color:#fff
    style LAYER2 fill:#9C27B0,color:#fff
    style LAYER3 fill:#FF9800,color:#fff
    style LAYER4 fill:#4CAF50,color:#fff
    style ARCH fill:#1a1a2e,color:#fff
```

### ⚠️ Critical Exam Trap: Context Isolation

**Wrong answer that sounds right:** "Pass the entire conversation history to subagents for full context."

**Why it's wrong:** This defeats the entire purpose of subagents! It pollutes their context, wastes tokens, and reduces accuracy. Always pass **only what the subagent needs** — a focused summary or specific data points.

---

## 📘 Topic 1.4: Session Management

### Key Commands and Concepts

| Concept | What It Does | When to Use |
|---|---|---|
| `--resume` | Continue a previous session | Multi-day work, picking up where you left off |
| `fork_session` | Create a branch from current session | **Exploration** — try something without polluting the main session |
| Named sessions | Label sessions by feature/task | Organizing work (e.g., "auth-refactor", "bug-123") |
| `/compact` | Summarize context to free space | Session is getting long, Claude starts forgetting |

### The Session Strategy Decision Tree

```mermaid
flowchart TD
    A{"Continuing previous work?"}
    A -->|"Yes"| B["🔄 --resume"]
    A -->|"No"| C{"Exploring something risky?"}
    C -->|"Yes"| D["🔀 fork_session"]
    C -->|"No"| E{"Conversation too long?"}
    E -->|"Yes"| F["📦 /compact"]
    E -->|"No"| G["▶️ Continue"]

    style B fill:#2196F3,color:#fff
    style D fill:#FF9800,color:#fff
    style F fill:#9C27B0,color:#fff
    style G fill:#4CAF50,color:#fff
```

### 🗺️ Session Lifecycle Visual

```mermaid
graph LR
    S1["🆕 New Session"] --> W["💻 Working..."]
    W -->|"Long session"| CO["📦 /compact"]
    CO --> W
    W -->|"End of day"| SAVE["💾 Session Saved"]
    SAVE -->|"Next day"| R["🔄 --resume"]
    R --> W
    W -->|"Try risky idea"| FORK["🔀 fork_session"]
    FORK --> EXP["🧪 Experiment"]
    EXP -->|"Worked!"| MERGE["✅ Apply to main"]
    EXP -->|"Failed"| DISCARD["🗑️ Discard"]

    style S1 fill:#4CAF50,color:#fff
    style FORK fill:#FF9800,color:#fff
    style MERGE fill:#4CAF50,color:#fff
    style DISCARD fill:#f44336,color:#fff
```

### Exam Trap: Session Strategy

**Wrong answer:** "Use a single continuous session for a multi-day project."

**Why:** Context windows overflow. Use `--resume` for continuity and `fork_session` for safe exploration.

---

## 📘 Topic 1.5: Spawning Subagents

### Defining Subagents

There are **three ways** to define subagents:

1. **Programmatically** — via `agents` parameter in `query()` options
2. **Markdown files** — `.claude/agents/` directory containing agent definitions
3. **Built-in `Agent` tool** — must be explicitly added to `allowedTools`

### Key Design Principles

- **Clear descriptions**: Subagents can't be selected correctly without clear descriptions
- **Focused scope**: Each subagent should have a specific purpose
- **Prevent infinite recursion**: Restrict what types of subagents they can spawn
- **Single session**: Subagents operate within a single session lifecycle

---

## 🧠 Think Like an Architect: Domain 1 Practice Scenarios

### Scenario: You're building a code review system for 500+ daily PRs.

```mermaid
graph LR
    PR["📋 PR Submitted"] --> COORD["🎯 Coordinator"]
    COORD --> SEC["🔒 Security Pass"]
    COORD --> LOGIC["🧠 Logic Pass"]
    COORD --> STYLE["🎨 Style Pass"]
    SEC --> AGG["📊 Aggregate & Dedupe"]
    LOGIC --> AGG
    STYLE --> AGG
    AGG --> REPORT["📄 Review Report"]

    style SEC fill:#f44336,color:#fff
    style LOGIC fill:#FF9800,color:#fff
    style STYLE fill:#2196F3,color:#fff
    style AGG fill:#4CAF50,color:#fff
```

**Think through:**
1. Should you use a single agent or multi-agent? → Multi-agent (scale, focus)
2. What pattern? → Pipeline (Security → Logic → Style → Aggregate)
3. How many tools per agent? → 4-5 focused tools each
4. Context strategy? → Each reviewer gets only the relevant diff, not the full repo
5. Error handling? → If a review subagent crashes, manifest file lets coordinator continue with remaining reviews

### Scenario: An agent keeps "forgetting" instructions during a long session.

**Think through:**
1. Root cause? → Context window filling up, lost-in-the-middle effect
2. Solution? → Use `/compact` for progressive summarization
3. NOT the solution? → "Increase max_tokens" (that's output limit, not context)
4. Prevention? → Delegate deep tasks to subagents, keep coordinator context clean

---

## 📊 Visual Summary: Domain 1 at a Glance

```mermaid
mindmap
  root(("🏗️ Domain 1: Agentic Architecture 27%"))
    Agentic Loop
      stop_reason values
        end_turn
        tool_use
        max_tokens
        refusal
      Loop pattern
    Agent SDK
      query vs ClaudeSDKClient
      Built-in tools
      allowedTools / disallowedTools
    Multi-Agent Patterns
      Hub-and-Spoke
      Evaluator-Optimizer
      Pipeline
      Parallel Fan-Out
    5 Golden Rules
      Context isolation
      Pass summaries only
      Manifest files
      No shared memory
      4-5 tools per agent
    Session Management
      --resume
      fork_session
      /compact
      Named sessions
```

---

## 📝 Domain 1 Key Terms Glossary

| Term | Definition |
|---|---|
| **Agentic loop** | The core pattern: send to Claude → check stop_reason → act → loop |
| **stop_reason** | API field indicating why Claude stopped generating |
| **Hub-and-spoke** | Coordinator delegates to independent subagents |
| **Evaluator-optimizer** | One agent generates, another evaluates, loop until quality |
| **Pipeline** | Sequential chain where output A = input B |
| **Fan-out** | Parallel independent subagents |
| **Context isolation** | Each subagent has its own context window |
| **Manifest file** | State persistence for crash recovery |
| **Progressive summarization** | Compressing older context to free space |
| **fork_session** | Safe branching for exploration |

# 🤖 Claude 101 — A Complete Guide

> **Claude** by Anthropic has emerged as a premier LLM family for developer workflows, particularly for agentic AI, coding, and heavy document processing. Its unique API primitives—like native PDF parsing, prompt caching, extended thinking, and robust tool use—make it uniquely suited for complex engineering tasks.

---

## Table of Contents

### Part 1: Claude's Unique Primitives
1. [Long Context Window and What It Makes Possible](#1-long-context-window-and-what-it-makes-possible)
2. [Sending PDFs Directly Without Any Parsing](#2-sending-pdfs-directly-without-any-parsing)
3. [Getting Inline Citations from Claude Responses](#3-getting-inline-citations-from-claude-responses)
4. [What Prompt Caching Is and How It Works](#4-what-prompt-caching-is-and-how-it-works)
5. [Setting Up Manual Prompt Caching in API Calls](#5-setting-up-manual-prompt-caching-in-api-calls)
6. [Measuring Cost Savings from Caching](#6-measuring-cost-savings-from-caching)
7. [Extended Thinking and When to Use It](#7-extended-thinking-and-when-to-use-it)
8. [Structured Tool Use and Output Schemas](#8-structured-tool-use-and-output-schemas)
9. [Message Batches for Bulk Processing](#9-message-batches-for-bulk-processing)

### Part 2: Claude Agent SDK
10. [Setting Up the Claude Agent SDK in Node.js](#10-setting-up-the-claude-agent-sdk-in-nodejs)
11. [Defining Tools and Writing System Prompts](#11-defining-tools-and-writing-system-prompts)
12. [Building a Full Agent Loop End-to-End](#12-building-a-full-agent-loop-end-to-end)
13. [Managing Multi-Turn Conversations](#13-managing-multi-turn-conversations)
14. [Picking the Right Claude Model per Task](#14-picking-the-right-claude-model-per-task)
15. [Claude vs OpenAI for Agentic Workloads](#15-claude-vs-openai-for-agentic-workloads)

---

## Part 1: Claude's Unique Primitives

### 1. Long Context Window and What It Makes Possible

Claude 3.5 models support a **200,000-token context window** (roughly 150,000 words, or a 500-page book). Claude 3 models even introduced "needle in a haystack" retrieval perfection across this massive window.

#### What this enables:
- **Many-Shot Prompting:** Instead of few-shot (3-5 examples), you can pass *many-shot* (100-1000 examples) to perfectly align tone and formatting.
- **Full Codebase Context:** You can dump entire repositories (up to mid-sized ones) into the prompt instead of relying on complex RAG pipelines.
- **Book-Length Summarization:** Summarizing, critiquing, or querying entire legal documents or books in a single pass.

```javascript
// Example: Sending 100k tokens of codebase context
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  messages: [
    {
      role: "user",
      content: `Here is our entire frontend codebase:\n\n${hugeCodebaseString}\n\nWhere is the authentication bug?`
    }
  ]
});
```

### 2. Sending PDFs Directly Without Any Parsing

Historically, developers had to use tools like PyPDF2, Unstructured, or OCR to parse PDFs before sending the text to an LLM. Claude's API supports **native PDF ingestion**. The model uses its vision capabilities to read the PDF as it actually appears, capturing layout, charts, and text flawlessly.

```javascript
import fs from 'fs';

// Read the PDF as a base64 string
const pdfBuffer = fs.readFileSync('financial_report.pdf');
const pdfBase64 = pdfBuffer.toString('base64');

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: pdfBase64
          }
        },
        {
          type: "text",
          text: "Extract the Q3 revenue numbers from this document."
        }
      ]
    }
  ]
});
```
*Note: PDFs are billed based on the number of pages and text density, using token approximations.*

### 3. Getting Inline Citations from Claude Responses

When dealing with large documents, you want to know *where* Claude got its information. Claude supports document citations, allowing you to trace claims back to specific chunks of the source document.

```javascript
// You can prompt Claude to use citation tags
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: `Read this contract: <contract>${contractText}</contract>\n\nWhat are the termination clauses? Cite the exact paragraph using <cite> tags.`
    }
  ]
});

// Response might look like:
// "The contract can be terminated with 30 days notice <cite>Section 4.2</cite>."
```
Anthropic is also continually updating native citation objects within the API response schema to programmatically link back to document offsets.

### 4. What Prompt Caching Is and How It Works

**Prompt Caching** is Anthropic's game-changing feature for reducing costs and latency when sending large, repeated contexts (like system prompts, documents, or codebases).

Instead of paying to process a 100k-token codebase on every single chat turn, you cache it.
- **Cache Hit Latency:** Drastically reduced (time-to-first-token drops from 10s to <1s).
- **Cache Hit Cost:** ~90% cheaper than regular input tokens.
- **Cache Lifecycle:** Caches live for 5 minutes. Every time you hit the cache, the 5-minute timer resets.

### 5. Setting Up Manual Prompt Caching in API Calls

To use Prompt Caching, you add `cache_control: { "type": "ephemeral" }` to the specific block of text you want to cache. You can place up to 4 cache breakpoints in a single prompt.

```javascript
const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: "You are an expert code reviewer. Here is the documentation you must follow:",
    },
    {
      type: "text",
      text: massiveDocumentationString,
      cache_control: { type: "ephemeral" } // <-- Cache everything up to here
    }
  ],
  messages: [
    {
      role: "user",
      content: "Review this new PR: " + prDiff
    }
  ]
});
```

### 6. Measuring Cost Savings from Caching

The API response includes a `usage` object that explicitly tells you how many tokens were read from cache vs. newly processed.

```javascript
console.log(response.usage);
/*
{
  input_tokens: 150,                 // New tokens you pay full price for
  cache_creation_input_tokens: 0,    // Tokens that created the cache (if miss)
  cache_read_input_tokens: 100000,   // Cached tokens you pay 10% price for
  output_tokens: 256
}
*/
```

**Cost Math (Example: Sonnet 3.5):**
- Standard Input: $3.00 / 1M tokens
- Cache Write: $3.75 / 1M tokens (25% premium to create)
- Cache Read: $0.30 / 1M tokens (90% discount!)

If you do 10 turns of conversation with a 100k context:
- Without cache: 1M tokens = $3.00
- With cache: 100k write + 900k read = $0.375 + $0.27 = $0.645 (Huge savings!)

### 7. Extended Thinking and When to Use It

Anthropic models support **Extended Thinking**, allowing the model to "think out loud" (generate chain-of-thought tokens) before returning a final answer. This dramatically improves performance on math, coding, and logic puzzles.

In the API, this is exposed as an explicit block that you can inspect, but is kept separate from the final response text.

*(Note: Extended thinking features map closely to specific models like Claude 3.5 Sonnet's coding abilities or future reasoning-focused models. It allows the model to output a `thinking` block before its `text` response.)*

```javascript
// A conceptual example of how extended thinking output looks:
/*
[
  {
    "type": "thinking",
    "thinking": "First, I need to parse the user's request. They want a React component..."
  },
  {
    "type": "text",
    "text": "Here is the React component you requested..."
  }
]
*/
```

### 8. Structured Tool Use and Output Schemas

Claude supports native tool calling (function calling). You define JSON schemas, and Claude returns structured JSON.

```javascript
const tools = [
  {
    name: "get_weather",
    description: "Get the current weather in a given location",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA"
        }
      },
      required: ["location"]
    }
  }
];

const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  tools: tools,
  messages: [{ role: "user", content: "What's the weather in Seattle?" }]
});

// Claude's response indicates it wants to use a tool:
if (response.stop_reason === "tool_use") {
  const toolCall = response.content.find(c => c.type === "tool_use");
  console.log(`Claude wants to call ${toolCall.name} with:`, toolCall.input);
  // { location: "Seattle, WA" }
}
```

### 9. Message Batches for Bulk Processing

If you have 10,000 documents to summarize and you don't need real-time latency, use the **Message Batches API**. Batches are processed asynchronously over 24 hours at a massive discount (often 50% cheaper).

```javascript
const batch = await anthropic.messages.batches.create({
  requests: [
    {
      custom_id: "req_1",
      params: {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Summarize doc A..." }]
      }
    },
    {
      custom_id: "req_2",
      params: {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: "Summarize doc B..." }]
      }
    }
  ]
});

console.log("Batch ID:", batch.id);
// You poll or use webhooks to get the results later.
```

---

## Part 2: Claude Agent SDK

While you can build agent loops from scratch, Anthropic and the community provide powerful abstractions. Here, we'll look at building a Claude-powered agent in Node.js using standard patterns.

### 10. Setting Up the Claude Agent SDK in Node.js

Let's set up the official `@anthropic-ai/sdk`.

```bash
npm install @anthropic-ai/sdk dotenv
```

```javascript
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### 11. Defining Tools and Writing System Prompts

An agent requires a clear system prompt detailing its persona and its tools.

```javascript
const systemPrompt = `You are an autonomous DevOps agent. Your job is to 
diagnose server issues. You have tools to check CPU, memory, and logs.
Always explain your reasoning before taking action.`;

const tools = [
  {
    name: "get_cpu_usage",
    description: "Returns the current CPU usage percentage.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "get_server_logs",
    description: "Fetches the last N lines of a specific log file.",
    input_schema: {
      type: "object",
      properties: {
        service: { type: "string", enum: ["nginx", "database", "app"] },
        lines: { type: "integer", default: 50 }
      },
      required: ["service"]
    }
  }
];

// Mock tool execution
async function executeTool(name, args) {
  if (name === "get_cpu_usage") return "CPU is currently at 95%.";
  if (name === "get_server_logs") return "[ERROR] Database connection timeout.";
  return `Error: Unknown tool ${name}`;
}
```

### 12. Building a Full Agent Loop End-to-End

Here is a robust, multi-step agent loop. It continues running until Claude returns a normal text response instead of a tool call.

```javascript
async function runDevOpsAgent(userQuery) {
  let messages = [
    { role: "user", content: userQuery }
  ];

  let isComplete = false;
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (!isComplete && iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`\n--- Agent Step ${iterations} ---`);

    // 1. Call Claude
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      tools: tools,
      messages: messages
    });

    // Append Claude's response (which may contain text + tool_use blocks)
    messages.push({ role: "assistant", content: response.content });

    // 2. Check what Claude wants to do
    if (response.stop_reason === "tool_use") {
      const toolResults = [];

      for (const block of response.content) {
        if (block.type === "text") {
          console.log(`[Claude Thinks]: ${block.text}`);
        } else if (block.type === "tool_use") {
          console.log(`[Calling Tool]: ${block.name}(${JSON.stringify(block.input)})`);
          
          // Execute the tool
          const resultText = await executeTool(block.name, block.input);
          console.log(`[Tool Result]: ${resultText}`);
          
          // Prepare the tool result for the next loop
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: resultText
          });
        }
      }

      // Append the tool results to the conversation
      messages.push({ role: "user", content: toolResults });

    } else {
      // Claude is done and just returned text
      isComplete = true;
      const finalMessage = response.content.find(c => c.type === "text").text;
      console.log(`\n[Final Answer]:\n${finalMessage}`);
      return finalMessage;
    }
  }

  if (!isComplete) {
    console.log("Error: Agent hit max iterations limit.");
  }
}

// Run it!
// runDevOpsAgent("The website is down, can you figure out why?");
```

### 13. Managing Multi-Turn Conversations

If you want the agent to converse with a user over multiple turns, you must maintain the `messages` array globally for that session. 

**Important rule for Claude API:** The `messages` array must strictly alternate between `user` and `assistant`. A `tool_result` is sent as a `user` message.

```javascript
class AgentSession {
  constructor() {
    this.history = [];
  }

  async sendMessage(userText) {
    this.history.push({ role: "user", content: userText });
    
    // ... run the agent loop from above using this.history ...
    // ... update this.history with assistant replies and tool results ...
    
    return finalAnswer;
  }
}
```

### 14. Picking the Right Claude Model per Task

Anthropic offers three sizes in the Claude 3 family. Choosing the right one optimizes cost and speed.

| Model | Cost (Input/Output per 1M) | Speed | Best For |
|-------|----------------------------|-------|----------|
| **Claude 3.5 Haiku** | $0.25 / $1.25 | ⚡⚡⚡ Fastest | Fast routing, moderation, simple JSON extraction, quick tool calls. |
| **Claude 3.5 Sonnet** | $3.00 / $15.00 | ⚡⚡ Fast | **The default for agents.** Unmatched coding ability, complex tool use, reasoning. |
| **Claude 3 Opus** | $15.00 / $75.00 | ⚡ Slower | Highly complex logical synthesis, deep strategic thinking, creative writing. |

*Recommendation:* **Start with Claude 3.5 Sonnet.** It punches vastly above its weight class in coding and agentic workflows, often beating Opus and GPT-4o while being significantly cheaper.

### 15. Claude vs OpenAI for Agentic Workloads

How does Claude (specifically 3.5 Sonnet) compare to OpenAI (GPT-4o) for building agents?

#### 🏆 Where Claude Wins:
1. **Coding Tasks:** Claude 3.5 Sonnet is widely considered the best coding model in the world. For agents that write or refactor code (like AutoGPTs), Claude dominates.
2. **Prompt Caching:** Claude's explicit prompt caching makes long-context agents (where the system prompt includes massive documentation) incredibly cheap and fast.
3. **Nuance and Refusals:** Claude tends to follow complex, nuanced instructions better and refuses false positives less aggressively than older Claude models.
4. **Tool Use Syntax:** Claude allows combining text ("thinking") and tool calls in the exact same response cleanly.

#### 🏆 Where OpenAI Wins:
1. **Structured Outputs:** OpenAI's "Strict Mode" for Structured Outputs guarantees 100% adherence to JSON schemas without retries.
2. **Ecosystem & Audio/Vision:** OpenAI's Realtime API and deep vision integration offer more multimodel flexibility.
3. **Rate Limits:** OpenAI generally offers higher Tier 1 rate limits for new developers.

#### The Verdict
If your agent deals with **code, large documents, or heavy text analysis**, Claude 3.5 Sonnet is currently the gold standard. If you need **strict JSON constraints, audio, or mass scalability from day one**, OpenAI provides a stronger framework.

---

> *"The best agentic systems don't just use large models; they use the right primitives. Caching, native tools, and massive contexts turn Claude from a chatbot into a developer's OS."*

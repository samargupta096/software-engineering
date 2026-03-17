# 📝 Claude Certified Architect – Practice Questions

> These questions mimic the **scenario-based MCQ format** of the real exam. Each question has 4 options with one best answer. Answers with explanations are at the bottom.

---

## Scenario A: Customer Support Resolution Agent

You are building an AI-powered customer support agent using the Claude Agent SDK. The agent handles billing inquiries, account modifications, and escalation to human agents.

### Q1. Loop Termination
Your agentic loop processes customer requests. Which `stop_reason` value indicates Claude wants to execute a tool before continuing?

- A) `end_turn`
- B) `tool_use`
- C) `max_tokens`
- D) `refusal`

### Q2. Error Handling Strategy
A customer's account lookup tool returns a "User not found" error. How should your agent handle this?

- A) Retry the lookup 3 times with exponential backoff
- B) Escalate immediately to a human agent
- C) Return the business logic error to Claude for decision-making
- D) Terminate the conversation and ask the customer to try again

### Q3. Escalation Decision
Which situation should trigger an escalation to a human agent?

- A) A transient database timeout on the first attempt
- B) The customer asks to cancel a subscription (standard procedure exists)
- C) The agent encounters a refund request but no refund policy exists for this product type
- D) The customer's account balance is zero

### Q4. Confidence-Based Routing
You've implemented field-level confidence scoring for extracted customer data. Your validation set shows 92% accuracy for names but only 68% accuracy for account IDs. What's the best approach?

- A) Set a single confidence threshold of 0.80 for all fields
- B) Set different thresholds per field type based on stratified accuracy data
- C) Always route everything to human review
- D) Increase the number of few-shot examples for all fields equally

---

## Scenario B: Code Generation with Claude Code

You're configuring Claude Code for a large enterprise monorepo with frontend (React), backend (Python), and infrastructure (Terraform) code.

### Q5. CLAUDE.md Hierarchy
Where should you place rules that apply only to React component files?

- A) In the global `~/.claude/CLAUDE.md` file
- B) In the project root `./CLAUDE.md` file
- C) In `.claude/rules/frontend.md` with `globs: ["src/components/**/*.tsx"]`
- D) In `./src/components/CLAUDE.md` only

### Q6. Plan Mode Decision
A developer asks Claude Code to rename a widely-used utility function across 47 files. What approach is most appropriate?

- A) Direct execution — it's a simple rename
- B) Plan mode — the scope is large and could have side effects
- C) Direct execution with `--print` flag for CI validation
- D) Create a custom skill for renaming

### Q7. Context Management
During a long Claude Code session, the agent starts forgetting earlier instructions from CLAUDE.md. What's the best remedy?

- A) Increase `max_tokens` to expand the context window
- B) Use `/compact` to summarize the conversation and free context space
- C) Restart the session and repeat all instructions
- D) Add the instructions redundantly at multiple points in the conversation

### Q8. Custom Skills
You're creating a skill to run database migrations. Which `SKILL.md` frontmatter is most appropriate?

- A) `context: fork` and `allowed-tools: [Bash, Read]`
- B) `context: fork` and no tool restrictions
- C) No frontmatter, just instructions
- D) `allowed-tools: [Write, Edit]` without context fork

---

## Scenario C: Multi-Agent Research System

You're building a research system that spawns multiple subagents to analyze different document sources and synthesize findings.

### Q9. Subagent Context
What is the primary benefit of using subagents for deep document analysis?

- A) Subagents are faster than a single agent
- B) Subagents have their own context windows, preventing pollution of the main context
- C) Subagents can use tools that the main agent cannot
- D) Subagents automatically share memory with each other

### Q10. Context Passing
When a research subagent finishes analyzing a 50-page document, what should it return to the coordinator?

- A) The entire document content for the coordinator to process
- B) A structured summary with key findings and source citations
- C) Only the document title and a success/failure flag
- D) A link to the original document

### Q11. Information Provenance
Your research agent synthesizes findings from 3 sources that partially contradict each other. What's the correct approach?

- A) Use the most recent source and ignore the others
- B) Average the findings across all sources
- C) Map each claim to its source, annotate conflicts, and report coverage gaps
- D) Ask Claude to determine which source is most authoritative

### Q12. Lost-in-the-Middle
You're passing 15 research documents to Claude for synthesis. Where should you place the most critical documents?

- A) In the middle, where Claude focuses most attention
- B) At the beginning and end, due to the U-shaped attention pattern
- C) Randomly, since position doesn't affect processing
- D) Only at the beginning, since Claude reads sequentially

---

## Scenario D: Structured Data Extraction Pipeline

You're building a pipeline to extract structured data from thousands of invoices using Claude with the Message Batches API.

### Q13. Schema Design
How should you handle a field like "payment_method" where most invoices use standard types (credit card, wire, check) but some have unusual methods?

- A) `"type": "string"` with no constraints
- B) `"enum": ["credit_card", "wire", "check"]` — strict enumeration
- C) `"enum": ["credit_card", "wire", "check", "other"]` with an additional `"payment_method_detail"` string field
- D) `"type": "array"` to capture multiple possible values

### Q14. Preventing Hallucination
For optional fields that may not be present in an invoice, what schema pattern best prevents Claude from hallucinating values?

- A) Mark all fields as `required`
- B) Use `"type": ["string", "null"]` so Claude can return `null` for uncertain fields
- C) Add a `"default": ""` for all optional fields
- D) Use few-shot examples with every possible field combination

### Q15. Batch Processing
You need to process 10,000 invoices. Which statement about the Message Batches API is correct?

- A) Results are returned in the same order as submitted
- B) Each request needs a unique `custom_id` for result correlation
- C) Multi-turn tool calling is supported within batch requests
- D) Processing is guaranteed within 1 hour

### Q16. Validation-Retry Loop
Your Pydantic validation catches that Claude returned a negative number for `total_amount`. What's the best approach?

- A) Replace the negative with its absolute value
- B) Return the validation error to Claude and request a corrected extraction
- C) Skip this invoice and move to the next
- D) Use a default value of 0.00

### Q17. Batch Failure Handling
15 out of 10,000 batch requests fail. How should you handle this?

- A) Resubmit the entire batch of 10,000
- B) Use `custom_id` to identify failed requests and retry only those
- C) Ignore the 15 failures since the error rate is low
- D) Switch to real-time API for all requests

---

## Scenario E: MCP Tool Integration

You're designing MCP servers for a developer productivity platform with GitHub, Jira, and Confluence integrations.

### Q18. Tool vs Resource
Which MCP primitive should expose a list of all Jira projects?

- A) Tool — because it requires an API call
- B) Resource — because it's read-only data browsing
- C) Prompt — because it structures the project list
- D) Tool — because all MCP interactions are tools

### Q19. Tool Description Quality
Two MCP tools have similar names: `search_issues` (Jira) and `search_issues` (GitHub). What's the best solution?

- A) Rename both to generic `search_items_1` and `search_items_2`
- B) Add detailed descriptions differentiating scope, capabilities, and return formats
- C) Remove one tool and have the remaining tool search both platforms
- D) Rely on the user to specify which platform in their request

### Q20. MCP Configuration Scope
A team shares a common GitHub MCP server, but individual developers have personal Confluence credentials. Where should each be configured?

- A) Both in project `.mcp.json`
- B) Both in user `~/.claude/.mcp.json`
- C) GitHub in project `.mcp.json`, Confluence in user `~/.claude/.mcp.json`
- D) GitHub in user config, Confluence in project config

---

## General Architecture Questions

### Q21. Iterative Refinement
You're using Claude for code review on a 500-file PR. Which strategy is most effective?

- A) Pass all 500 files to Claude in a single request
- B) Use prompt chaining with sequential focused passes (security, logic, style)
- C) Ask Claude to randomly sample 50 files for review
- D) Only review files that were modified more than 10 lines

### Q22. Few-Shot Prompting
When designing few-shot examples for a classification task, which approach reduces false positives?

- A) Include only positive examples
- B) Include both positive and negative examples, especially edge cases
- C) Use as many examples as possible (20+)
- D) Use examples from only one category

### Q23. Session Management
You're running a complex multi-day refactoring with Claude Code. What's the best session strategy?

- A) Use a single continuous session for everything
- B) Use `--resume` to continue previous sessions and `fork_session` for exploratory branches
- C) Start a fresh session each day and re-explain context
- D) Use only `/memory` to persist everything across sessions

### Q24. Built-in Tools Selection
You need to find all files containing a specific API endpoint string. Which built-in tool is most appropriate?

- A) `Read` — read each file and search manually
- B) `Glob` — find files by name pattern
- C) `Grep` — search file contents for patterns
- D) `Bash` — run a custom find command

### Q25. Hooks
You want to automatically format code after Claude writes to a file. Which hook pattern is correct?

- A) Use a `PreToolUse` hook on the `Write` tool
- B) Use a `PostToolUse` hook on the `Write` tool to run the formatter
- C) Add formatting instructions to CLAUDE.md
- D) Create a custom tool that combines write + format

---

## ✅ Answer Key

| Q | Answer | Explanation |
|---|---|---|
| 1 | **B** | `tool_use` is the stop_reason that signals Claude wants to execute a tool. The agentic loop should execute the tool, return the result, and continue. |
| 2 | **C** | "User not found" is a business logic error, not transient. Return it to Claude to make an informed decision (e.g., ask user to verify their info). Don't retry (it won't change), don't auto-escalate. |
| 3 | **C** | Escalate when there's a **policy gap** — no clear rule exists for the situation. Transient errors should be retried; standard procedures should be followed; zero balance isn't an escalation trigger. |
| 4 | **B** | Stratified accuracy analysis shows different fields have different reliability. Set field-specific thresholds based on actual measured accuracy, not a one-size-fits-all threshold. |
| 5 | **C** | `.claude/rules/` with YAML frontmatter glob patterns is the designed mechanism for path-scoped rules. This auto-loads only when working on matching paths. |
| 6 | **B** | 47-file rename has large blast radius. Plan mode lets Claude map dependencies, identify potential issues, and get approval before executing. |
| 7 | **B** | `/compact` triggers progressive summarization — it condenses conversation history to free context space while retaining critical information. |
| 8 | **A** | `context: fork` isolates the migration's context (safety), and `allowed-tools: [Bash, Read]` restricts to only necessary tools (Bash for running migrations, Read for checking files). |
| 9 | **B** | Subagent context isolation is the primary architectural benefit — each subagent works in its own context window, returning only a summary to the coordinator. |
| 10 | **B** | Return structured summaries with citations. Full document content wastes coordinator context; too little info is unhelpful; links bypass the context-saving benefit. |
| 11 | **C** | Information provenance requires claim-source mappings, conflict annotation, and coverage gap reporting. This gives the human reviewer full transparency. |
| 12 | **B** | The lost-in-the-middle effect means LLMs have U-shaped attention — they attend most to content at the beginning and end. Place critical info at those positions. |
| 13 | **C** | The `"other"` + detail string pattern handles unexpected values gracefully without losing specificity for common cases, and prevents Claude from forcing unusual methods into existing categories. |
| 14 | **B** | Nullable fields (`"type": ["string", "null"]`) let Claude legitimately return `null` for uncertain fields instead of hallucinating a value. |
| 15 | **B** | Each batch request needs a unique `custom_id` because results are NOT returned in submission order. `custom_id` is the correlation mechanism. |
| 16 | **B** | Validation-retry loops feed errors back to Claude for self-correction. Don't silently fix data — Claude may have misread the source document entirely. |
| 17 | **B** | Track failures by `custom_id` and retry only those 15 requests. Resubmitting all 10,000 wastes money; ignoring failures loses data. |
| 18 | **B** | Listing Jira projects is read-only data browsing with no side effects — this is the textbook use case for MCP **Resources**. |
| 19 | **B** | Detailed descriptions that differentiate scope, capabilities, and return formats help Claude correctly select between similar tools. Renaming obscures purpose. |
| 20 | **C** | Shared tools go in project config (team-accessible); personal credentials go in user config (not committed to repo). |
| 21 | **B** | Prompt chaining with focused passes manages context effectively and produces higher-quality results than dumping 500 files into one request. |
| 22 | **B** | Including negative/edge-case examples helps Claude learn the decision boundary, reducing false positives. Only positive examples leads to over-triggering. |
| 23 | **B** | `--resume` maintains continuity; `fork_session` enables safe exploration without polluting the main session. Fresh starts lose context; single sessions overflow. |
| 24 | **C** | `Grep` is purpose-built for searching file contents by pattern. `Glob` finds files by name. `Read` is inefficient for search. `Bash` works but `Grep` is the built-in for this. |
| 25 | **B** | `PostToolUse` hooks fire after a tool completes — perfect for running formatters after Write operations. `PreToolUse` would run before the write happens. |

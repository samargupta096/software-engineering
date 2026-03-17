# 🎯 Claude Certified Architect – Exam Day Cheat Sheet

> **Last-minute revision guide.** This covers the high-yield concepts with exact domain weights, exam traps, and decision rules you need to know cold.

---

## Exam Quick Facts

| 📊 | Detail |
|---|---|
| **Time** | 120 minutes |
| **Questions** | 60 MCQs |
| **Pass** | 720 / 1000 scaled |
| **Scenarios** | 4 of 6 randomly selected |
| **Resources** | ❌ None (closed-book, no breaks) |
| **Validity** | 6 months |

---

## Domain Weights — Know Where Points Are

```
 Agentic Architecture & Orchestration   ████████████████░░░░  27%  ← HEAVIEST
 Claude Code Config & Workflows         ████████████░░░░░░░░  20%
 Prompt Engineering & Structured Output  ████████████░░░░░░░░  20%
 Tool Design & MCP Integration          ███████████░░░░░░░░░  18%
 Context Management & Reliability       █████████░░░░░░░░░░░  15%
```

> [!TIP]
> Domain 1 alone is **27%** (~16 questions). Master agentic loops, multi-agent patterns, and session management first.

---

## 🧠 Domain 1: Agentic Architecture (27%)

### The Agentic Loop — THE Core Pattern

```
User Request → Send to Claude → Check stop_reason
  ├── "tool_use"    → Execute tool → Return result → LOOP ↑
  ├── "end_turn"    → Return response ✅
  ├── "max_tokens"  → Handle overflow (summarize/chunk)
  └── "refusal"     → Safety guardrail triggered
```

**Exam trap:** `max_tokens` ≠ "increase the limit." It means handle gracefully (progressive summarization, context trimming).

### Multi-Agent Orchestration Cheat Code

| Pattern | When | Key Principle |
|---|---|---|
| **Hub-and-spoke** | Multiple independent subtasks | Coordinator delegates, subagents return summaries |
| **Evaluator-optimizer** | Quality matters | One generates, one evaluates, loops until quality met |
| **Pipeline** | Sequential dependencies | Output of agent A = input of agent B |
| **Parallel fan-out** | Independent research tasks | Spawn N subagents simultaneously |

### Critical Multi-Agent Rules

1. **Context isolation** — Each subagent has its OWN context window
2. **Pass summaries, not entire histories** — prevents context pollution
3. **Manifest files** for crash recovery — coordinator resumes from last good state
4. **Subagents cannot share memory** — only communicate through coordinator
5. **Limit tool count per subagent** — 4-5 tools max for reliable selection

### Session Management

| Concept | Purpose |
|---|---|
| `--resume` | Continue a previous session |
| `fork_session` | Branch off for exploration without polluting main session |
| Named sessions | Organize work by feature/task |
| `/compact` | Summarize to free context space |

---

## 🔧 Domain 2: Tool Design & MCP (18%)

### Tool `stop_reason: "tool_use"` Flow

```json
{
  "stop_reason": "tool_use",
  "content": [{
    "type": "tool_use",
    "id": "toolu_abc",
    "name": "get_customer",
    "input": { "customer_id": "C-123" }
  }]
}
```

Execute → Return with `tool_result` → Continue loop.

### `tool_choice` Option Matrix

| Option | Behavior | When to Use |
|---|---|---|
| `"auto"` | Claude decides | Default, most flexible |
| `"any"` | Must use some tool | Ensure at least one action taken |
| `{"type":"tool","name":"X"}` | Forces specific tool | Structured output extraction |
| `"none"` | No tools allowed | Pure text response needed |

### Error Categories — THE Decision Rule

| Error Type | Example | Action |
|---|---|---|
| **Transient** | Timeout, rate limit | Retry with backoff |
| **Business logic** | "User not found" | Return to Claude for decision |
| **Permission** | "Access denied" | Escalate, never retry |

**Signal errors with `isError: true`** in tool results. Include structured error objects, not just strings.

### MCP Three Primitives

| | Tools | Resources | Prompts |
|---|---|---|---|
| **Does** | Actions (side effects) | Data catalog (read-only) | Reusable templates |
| **Example** | `create_issue` | `list_repos` | Structured interaction |
| **Key** | Mutations | Browsing | Patterns |

> **Golden rule:** Resources = read. Tools = write/act.

### MCP Config Scoping

| Scope | File | For |
|---|---|---|
| **Project** | `.mcp.json` (repo root) | Shared with team |
| **User** | `~/.claude/.mcp.json` | Personal, global |

**Exam trap:** GitHub (shared) → project config. Personal credentials → user config. Don't mix them.

---

## ⚙️ Domain 3: Claude Code Config (20%)

### CLAUDE.md Hierarchy — Specificity Wins

```
~/.claude/CLAUDE.md          ← Global (lowest priority)
./CLAUDE.md                   ← Project root
./src/CLAUDE.md              ← Directory-specific (loaded on demand)
.claude/rules/*.md           ← Path-scoped with globs (YAML frontmatter)
```

**Best practices:**
- Keep under **200 lines** — longer = more context consumed
- Focus on **decision rules**, not folder descriptions
- Reference files, don't embed code snippets
- Use `@import` for modularity

### Path-Scoped Rules

```yaml
# .claude/rules/frontend.md
---
globs: ["src/components/**/*.tsx", "src/pages/**/*.tsx"]
---
- Use React functional components only
- TypeScript strict mode required
```

Auto-loads when Claude works on matching paths.

### Skills (SKILL.md)

| Frontmatter | Purpose |
|---|---|
| `context: fork` | Isolate skill in subagent context |
| `allowed-tools` | Restrict tool access |
| `argument-hint` | Describe expected input |

### Plan Mode vs Direct

| Plan Mode | Direct |
|---|---|
| Multi-file changes | Single file edits |
| Architectural decisions | Obvious bug fixes |
| Need user approval | Low-risk changes |
| Multiple approaches possible | Clear, unambiguous |

### Key CLI Flags

| Flag | Use |
|---|---|
| `-p` / `--print` | Non-interactive (CI/CD!) |
| `--output-format json` | Machine-readable output |
| `--json-schema` | Validate CI output |
| `--resume` | Continue session |

### Hooks — Workflow Enforcement

| Hook Type | When | Example |
|---|---|---|
| `PreToolUse` | Before tool executes | Block dangerous commands |
| `PostToolUse` | After tool completes | Auto-format after Write |
| `Notification` | When needs user input | Send Slack notification |
| `Stop` | Session ends | Clean up, audit log |

**Exam trap:** `PostToolUse` on `Write` = auto-format. `PreToolUse` on `Write` = validate before writing.

### CI/CD Integration Pattern

```yaml
# GitHub Actions example
- name: Claude PR Review
  run: claude -p --output-format json "Review this PR for security issues"
```

Key: Use `-p` for non-interactive, `--output-format json` for parsing, `--json-schema` for validation.

---

## 💬 Domain 4: Prompt Engineering & Structured Output (20%)

### Structured Output via Forced Tool Use

1. Define a "tool" with your output JSON Schema
2. Set `tool_choice: {"type": "tool", "name": "extract_X"}`
3. Claude MUST return data matching the schema

### Schema Anti-Hallucination Patterns

| Pattern | Why |
|---|---|
| `"type": ["string", "null"]` | Claude returns `null` instead of guessing |
| `"enum": [..., "other"]` + detail field | Handles unexpected values |
| Required vs optional fields | Explicit about what must exist |
| Nested objects for structure | Organized extraction |

### Validation-Retry Loop (Pydantic Pattern)

```
Claude generates → Validate (Pydantic/JSON Schema) → Valid? 
  ├── Yes → Done ✅
  └── No  → Send errors back to Claude → Loop ↑ (max retries)
```

**NEVER silently fix Claude's output.** Always send errors back — Claude may have misread the source entirely.

### Few-Shot Best Practices

- **2–5 examples** (not exhaustive)
- Include **positive AND negative** examples
- Show **edge cases** and tricky scenarios
- Keep format consistent
- Reduces false positives in classification

### Prompt Chaining (Multi-Pass)

```
Pass 1: Extract raw data
Pass 2: Classify and categorize
Pass 3: Validate and cross-reference
Pass 4: Final structured output
```

**For code review:** Security → Logic → Style → Aggregate + deduplicate.

---

## 🛡️ Domain 5: Context Management & Reliability (15%)

### Lost-in-the-Middle Effect

```
Attention: HIGH ──── LOW ──── HIGH
Position:  Start    Middle    End
           ↑ Put critical info here ↑
```

**Mitigation:** Place critical context at START and END, never only in the middle.

### Token Budget Strategies

| Strategy | How |
|---|---|
| Trim tool outputs | Extract only relevant fields |
| Fact extraction | Convert prose → key-value pairs |
| Position-aware ordering | Critical first and last |
| Progressive summarization | Compress older context |
| Scratchpad files | Save to disk, retrieve on demand |
| Subagent delegation | Own context, return summaries |

### Escalation Decision Rule

| ✅ Escalate | ❌ Don't Escalate |
|---|---|
| Policy gap — no rule exists | Standard procedure available |
| Customer requests human | Repeatable task |
| N attempts exhausted | Transient/retryable error |
| High-impact/irreversible | Low-risk/reversible |
| Conflicting information | Unambiguous data |

### Confidence Scoring

- **Field-level**, not document-level
- Compare predicted vs actual accuracy on validation set
- **Stratified** by document type and field type
- Set thresholds for auto-approve vs human review
- Different thresholds for different fields (names ≠ IDs)

### Batch Processing (Message Batches API)

| Fact | Value |
|---|---|
| Cost | **50% cheaper** than real-time |
| Max size | 100K requests or 256 MB |
| SLA | Up to 24h (usually <1h) |
| Correlation | `custom_id` per request |
| **Limitation** | ❌ No multi-turn tool calling |
| Failure handling | Track by `custom_id`, retry only failed |

---

## ⚠️ Top 10 Exam Anti-Patterns (Wrong Answers That Sound Right)

| # | Anti-Pattern | Why It's Wrong |
|---|---|---|
| 1 | "Increase max_tokens" to fix context overflow | `max_tokens` is output limit, not context. Use `/compact` or subagents |
| 2 | "Retry business logic errors" | "User not found" won't change with retries. Return to Claude for decision |
| 3 | "Pass entire conversation to subagents" | Defeats context isolation purpose. Pass only relevant summaries |
| 4 | "Use vague prompts to be flexible" | Vague prompts cause inconsistency. Be explicit about criteria |
| 5 | "Single confidence threshold for all fields" | Different fields have different accuracy. Use stratified thresholds |
| 6 | "Silently fix Claude's output errors" | Send errors back — Claude may have fundamentally misread the source |
| 7 | "Put all rules in global CLAUDE.md" | Use path-scoped `.claude/rules/` for targeted, maintainable config |
| 8 | "One massive tool that does everything" | Split by purpose and permission level. Limit 4-5 tools per agent |
| 9 | "Auto-escalate every error to humans" | Only escalate policy gaps, conflicts, exhausted retries |
| 10 | "Resubmit entire batch for 15 failures" | Track by `custom_id`, retry only the failed requests |

---

## 🎯 Decision Trees for the Exam

### "How should we handle this error?"

```
Is it transient (timeout, rate limit)?
  ├── Yes → Retry with exponential backoff
  └── No → Is it a business logic error?
      ├── Yes → Return to Claude for decision
      └── No → Is it a permission error?
          ├── Yes → Escalate (never retry)
          └── No → Log + handle gracefully
```

### "Where should this configuration go?"

```
Is it shared across ALL projects?
  ├── Yes → ~/.claude/CLAUDE.md (global)
  └── No → Is it for the whole team?
      ├── Yes → ./CLAUDE.md or .mcp.json (project)
      └── No → Is it path-specific?
          ├── Yes → .claude/rules/*.md with globs
          └── No → ~/.claude/.mcp.json (user personal)
```

### "Should we use plan mode?"

```
Is it multi-file or architectural?
  ├── Yes → Plan mode
  └── No → Is it high-risk or ambiguous?
      ├── Yes → Plan mode
      └── No → Direct execution
```

---

## 📝 Last-Minute Reminders

1. **Read ALL answer options** before choosing — the "best" answer may be a tradeoff, not the most obvious
2. **"What would a senior architect recommend?"** — think production, not hackathon
3. **Watch for "always" and "never"** — these are usually wrong in architecture questions
4. **Domain 1 is 27%** — spend extra time on agentic loop and multi-agent questions
5. **All 6 scenarios are fair game** — don't skip studying any
6. **Time management:** 2 min/question average, flag hard ones and return
7. **The exam tests judgment, not syntax** — focus on WHY, not HOW

> 🏆 **You've got this. Think like an architect, not a coder. Every answer should reflect production-grade thinking.**

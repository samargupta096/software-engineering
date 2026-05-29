# 🚀 Cursor AI — Hands-On Mastery Guide
> **Practice project:** `kafka-visualizer` — your real codebase, not toy examples.

---

## 📐 Table of Contents
1. [The 3 Tools You'll Use Daily](#the-3-tools)
2. [Week 1 — Ctrl+K (Inline Edit)](#week-1--ctrlk)
3. [Week 2 — Ctrl+L (AI Chat)](#week-2--ctrll)
4. [Week 3 — Ctrl+I (Composer / Agent)](#week-3--ctrli)
5. [Week 4 — Context System (@-mentions)](#week-4--context-system)
6. [Setting Up .cursor/rules/](#setting-up-cursor-rules)
7. [The Golden Prompting Framework](#the-golden-prompting-framework)
8. [Real Exercises on Your Kafka Visualizer](#real-exercises)
9. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
10. [Quick Reference Cheatsheet](#quick-reference-cheatsheet)

---

## The 3 Tools

> Master these in order. Don't skip ahead.

| Tool | Shortcut | Mental Model | When to Use |
|------|----------|--------------|-------------|
| **Inline Edit** | `Ctrl+K` | Scalpel | Single function, one file |
| **AI Chat** | `Ctrl+L` | Pair programmer | Questions, debugging, understanding code |
| **Composer** | `Ctrl+I` | Junior dev | Multi-file features, big refactors |

---

## Week 1 — Ctrl+K

**Goal:** Get comfortable with surgical, single-file edits.

### How it works
1. Select code (or place cursor without selecting)
2. Press `Ctrl+K`
3. Type your instruction in plain English
4. Review the diff → `Accept` or `Reject`

### Exercise 1A — Add a JSDoc comment
Open `index.js` → find `renderCluster()` (line 73).
Select the entire function → `Ctrl+K` → type:

```
Add JSDoc with @description, @returns, and one @example
```

### Exercise 1B — Refactor a function
In `index.js`, find `sendMessage()` (line 178).
Select it → `Ctrl+K` → type:

```
Extract the key-color mapping into a separate const object at the top
of this function. Don't change the logic.
```

### Exercise 1C — Generate new code from scratch
Place cursor at the bottom of `index.js` (after all code).
Press `Ctrl+K` (nothing selected) → type:

```
Write a function resetAll() that clears all visualizations:
calls initProducerPartitions(), renderCluster(), renderReplication(),
and renderConsumerGroup(). Add a keyboard shortcut 'r' to trigger it.
```

### Exercise 1D — Convert style
Select the `drawCgArrows()` function → `Ctrl+K` → type:

```
Add detailed inline comments explaining what each calculation does
(especially the x1, y1, x2, y2, midX bezier math). Don't change any logic.
```

### ✅ Mastery Signal
You can use `Ctrl+K` without thinking about it. You review diffs before accepting.

---

## Week 2 — Ctrl+L

**Goal:** Use Chat for everything you'd previously Google.

### How it works
- Press `Ctrl+L` → opens the chat panel
- Drag files into chat or use `@file:` mentions
- Never actually *changes* code — it explains and suggests
- Press `Ctrl+N` to start a fresh chat for each new topic

### Exercise 2A — Understand unfamiliar code
Open chat (`Ctrl+L`) → drag `index.js` into it → ask:

```
Walk me through how the consumer group rebalancing simulation works.
What state does it track? How does it handle the "Crash Consumer" case?
```

### Exercise 2B — Debug with error context
Paste this into chat:

```
In renderConsumerGroup(), if sliderCgC has value 6 and sliderCgP has value 1,
the ASSIGNMENT_COLORS array is indexed out of bounds. How does this happen
and what's the safest fix?
```

### Exercise 2C — Architecture discussion
Ask in Chat:

```
@file:index.js — This file is 2700 lines. What are the top 3 ways
to split it into modules without breaking anything? Give me a file
structure and explain the refactoring order.
```

### Exercise 2D — Use @terminal
1. Open a terminal → run any command that produces output
2. In Chat: mention `@terminal` → ask:

```
@terminal — summarize what just happened and tell me if there are any errors
```

### ✅ Mastery Signal
You reach for `Ctrl+L` before Googling. You start fresh chats per topic.

---

## Week 3 — Ctrl+I (Composer)

**Goal:** Let the agent handle multi-file, multi-step work.

### ⚠️ Always use Plan Mode first
Before the agent executes, describe the task and ask it to plan:

```
Before you make any changes, show me a bullet-point plan of every
file you'll touch and every change you'll make. Wait for my approval.
```

### Exercise 3A — Add a new section to the visualizer
Open Composer (`Ctrl+I`) → type:

```
Goal: Add a new Section 08 "Log Retention & Cleanup Policies" 
to the kafka-visualizer.

Context: @file:index.html @file:index.js @file:index.css

The section should:
- Follow the exact same structure as existing sections (section__header, 
  section__number, section__desc, viz-card)
- Add a nav link in the TOC (between sections 07 and 09)
- Include an interactive slider for "retention.ms" (1h to 7d)
- Visually show which log segments get deleted as retention shrinks
- Use the existing CSS design system — NO new class names unless necessary

Do NOT change any existing sections.

Plan first, then execute.
```

### Exercise 3B — Extract JS into modules
Open Composer (`Ctrl+Shift+I` for full-screen) → type:

```
Goal: Extract the producer simulation code from index.js into a 
separate file called producer.js

Context: @file:index.js @file:index.html

Constraints:
- Move ONLY: PRODUCER_PARTITIONS, producerState, initProducerPartitions(),
  sendMessage(), and the 3 event listeners for strategy/send/burst buttons
- Export nothing (it's vanilla JS, use IIFE or just reference DOM directly)
- Update index.html to load producer.js BEFORE index.js
- Do NOT change any logic

Plan first, get my approval, then execute.
```

### Exercise 3C — Add dark/light theme toggle
```
Goal: Add a theme toggle button to the kafka-visualizer.

Context: @file:index.html @file:index.css @file:index.js

Requirements:
- A sun/moon toggle button fixed in bottom-right corner
- Light theme overrides the CSS custom properties in :root
- Persist choice in localStorage
- Smooth transition (use existing --transition-smooth variable)
- Button must use existing .send-btn style as base

Do not use any external libraries.
```

### ✅ Mastery Signal
You always review diffs file-by-file before accepting. You never let the
agent run without a plan. You check the terminal after each run.

---

## Week 4 — Context System

**Goal:** Give the AI exactly the right context — no more, no less.

### The @-mention Toolkit

```
@file:path/to/file.js     — share one specific file
@folder:src/              — share all files in a directory
@codebase                 — semantic search across everything (slow but powerful)
@web                      — live web search (for new APIs, docs)
@git                      — git history, diffs, commits
@terminal                 — last terminal output
@docs                     — your custom docs (add in Settings → Docs)
```

### Exercise 4A — Git-powered commit message
Stage some changes in git. Open Chat:

```
@git — write a clear, conventional commit message for these staged changes.
Use the format: type(scope): description
```

### Exercise 4B — Cross-file investigation
```
@file:index.js @file:index.css — The .cg-consumer.idle::after pseudo-element
shows "IDLE" text but it's getting cut off on small screens. Find the root
cause across both files and suggest a fix.
```

### Exercise 4C — Research integration
```
@web — What's the Kafka 3.7 change to default replication settings?
Then suggest how I'd update the replication demo in @file:index.js 
to reflect the new defaults.
```

### ✅ Mastery Signal
You stop dumping entire files into context. You give the minimum
context needed for the AI to do the job well.

---

## Setting Up .cursor/rules/

Create this folder structure in your project:

```
software-engineering/
└── .cursor/
    └── rules/
        ├── stack.mdc        ← tech stack & patterns
        ├── style.mdc        ← code style conventions
        └── visualizers.mdc  ← visualizer-specific rules
```

### `stack.mdc`
```markdown
---
description: Tech stack for the visualizers project
globs: ["**/*.js", "**/*.css", "**/*.html"]
---

## Stack
- Vanilla HTML, CSS, JavaScript (no frameworks, no build step)
- Google Fonts: Inter (sans) + JetBrains Mono (code)
- No npm, no bundler, no TypeScript

## Architecture
- Each visualizer is self-contained: index.html + index.js + index.css
- All JS is wrapped in an IIFE: ;(function() { 'use strict'; })()
- CSS uses custom properties defined in :root — never hardcode colors
- DOM manipulation only via vanilla JS — no jQuery, no frameworks

## Constraints
- Do NOT add TODO comments
- Do NOT use classes or OOP — prefer plain functions and objects
- Do NOT add external CDN dependencies without asking
- Always check if a CSS variable exists in :root before creating a new one
```

### `style.mdc`
```markdown
---
description: Code style conventions
globs: ["**/*.js"]
---

## JavaScript Style
- Use const for everything that doesn't reassign
- Arrow functions for callbacks, regular functions for named declarations
- Template literals for HTML strings in JS
- Guard clauses: if (!element) return; at the top of DOM-dependent functions
- Add section comments using the ── format for new sections

## CSS Style  
- All colors via CSS custom properties (var(--accent-orange) etc.)
- Use existing animation keyframes before creating new ones
- Class naming: BEM-like — .block__element.modifier
- Never use !important
```

### `visualizers.mdc`
```markdown
---
description: Rules specific to building visualizer sections
globs: ["**/visualizers/**"]
---

## Adding a New Section
1. Copy the section__header + section__number + section__desc structure
2. Add a TOC link in the <nav class="toc"> with matching data-section
3. Add .reveal class to trigger scroll animation
4. Use .viz-card for each interactive demo
5. Use .viz-controls for buttons/sliders, .viz-canvas for the demo area
6. Add .callout or .callout.teal for key insight boxes

## Interactive Demos
- Always guard DOM lookups: const el = document.getElementById('id'); if (!el) return;
- Animations: prefer CSS keyframes over JS-driven timers where possible
- Use setInterval/clearInterval pattern for timed demos (not recursive setTimeout)
- Always provide a "reset" mechanism for demos that modify state
```

---

## The Golden Prompting Framework

Every great prompt has 3 parts:

```
[CONTEXT] + [CONSTRAINT] + [GOAL]
```

### Template for features:
```
Goal: [one clear sentence]
Context: @file:... @file:...
Constraints:
  - Must NOT modify [X]
  - Must follow pattern in [Y]
  - Must not add new dependencies
Acceptance criteria: [how you'll know it's done]
```

### Template for debugging:
```
I get [ERROR] when [ACTION].
Relevant files: @file:...
Expected: [what should happen]
Actual: [what happens instead]
Explain the root cause and suggest a targeted fix.
Don't change anything else.
```

### Template for refactoring:
```
Refactor [X] to [Y].
Reference the pattern in @file:...
Do NOT change: business logic, function signatures, CSS class names
Do this one section at a time and explain each change.
```

---

## Real Exercises

These are real improvements your kafka-visualizer needs:

### 🟢 Easy (Ctrl+K)
- [ ] Add JSDoc to all exported/major functions in `index.js`
- [ ] Add `aria-label` attributes to all interactive buttons in `index.html`
- [ ] Add a `prefers-reduced-motion` media query to disable animations in `index.css`

### 🟡 Medium (Ctrl+L + Ctrl+K)
- [ ] The `renderPartitions()` uses `Math.random()` making it non-deterministic. 
      Chat → find the bug → Ctrl+K → fix it with a seed parameter.
- [ ] The TOC has nav items 09–28 but section numbers jump (no 08, 18).
      Chat → understand why → Ctrl+K → fix the TOC numbering.

### 🔴 Hard (Ctrl+I)
- [ ] Extract each major section's JS into its own file (cluster.js, producers.js, etc.)
- [ ] Add a "Search sections" input to the TOC that filters nav links in real time
- [ ] Add a floating "Progress" indicator showing how many sections you've scrolled through

---

## Common Mistakes to Avoid

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Accepting Composer changes without reading the diff | Review every file change before accepting |
| Using one long chat for many topics | `Ctrl+N` for each new topic |
| Vague prompts: "fix this" | Specific: "fix the off-by-one in the partition loop at line 119" |
| Trusting AI output blindly | Force it to write tests, then run them |
| Dumping the whole codebase into context | Use `@file:` for specific files only |
| Letting agent delete files without checking | Always read "deleted files" in diffs |
| Not using Plan Mode for big changes | Always ask for a plan before execution |

---

## Quick Reference Cheatsheet

```
SHORTCUTS
─────────────────────────────────────────
Ctrl+K          Inline edit (surgical)
Ctrl+L          AI Chat (questions)
Ctrl+I          Composer (multi-file)
Ctrl+Shift+I    Composer full-screen
Ctrl+N          New chat
Ctrl+E          Background agent
Tab             Accept autocomplete
Esc             Reject autocomplete
@               Open context picker

CONTEXT MENTIONS
─────────────────────────────────────────
@file:          Specific file
@folder:        Directory
@codebase       Semantic search
@web            Live web search
@git            Git history/diffs
@terminal       Last terminal output

DECISION TREE
─────────────────────────────────────────
Changing 1 function?              → Ctrl+K
Understanding / asking questions? → Ctrl+L
Touching multiple files?          → Ctrl+I (with plan first)
Long-running / background task?   → Ctrl+E

PROMPT QUALITY CHECK
─────────────────────────────────────────
✓ Did I give context (@file / @folder)?
✓ Did I state what NOT to change?
✓ Did I define the acceptance criteria?
✓ Did I ask for a plan before execution?
✓ Did I review the diff before accepting?
```

---

## Learning Path

```
Week 1: Ctrl+K — Do all Exercise 1A–1D on kafka-visualizer
Week 2: Ctrl+L — Do all Exercise 2A–2D, never Google first
Week 3: Ctrl+I — Do Exercise 3A (new section), review every diff
Week 4: Context + Rules — Set up .cursor/rules/, do Exercise 4A–4C

After 4 weeks:
- Add rules every time AI makes the same mistake twice
- Use Background Agents for doc generation / test writing
- Use @git for every PR description
```

---

*Tailored to: `samargupta096/software-engineering` — kafka-visualizer project*  
*Last updated: May 2026*

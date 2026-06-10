# 🧠 Prompt Engineering — A Complete Guide

> **Prompt engineering** is the art and science of crafting inputs (prompts) to get the best possible outputs from Large Language Models (LLMs) like GPT-4, Claude, Gemini, and others.

---

## Table of Contents

1. [Zero-Shot Prompting](#1-zero-shot-prompting)
2. [Few-Shot Prompting](#2-few-shot-prompting-with-examples)
3. [Role Prompting & Personas](#3-role-prompting-and-personas)
4. [Chain-of-Thought Prompting](#4-chain-of-thought-prompting)
5. [Self-Consistency Technique](#5-self-consistency-technique)
6. [ReAct Prompting](#6-react-prompting)
7. [Negative Prompting & Constraints](#7-negative-prompting-and-setting-constraints)
8. [Getting Reliable Structured Output (JSON)](#8-getting-reliable-structured-output-like-json)
9. [Prompt Chaining Across Multiple Calls](#9-prompt-chaining-across-multiple-calls)
10. [Common Prompt Mistakes & How to Fix Them](#10-common-prompt-mistakes-and-how-to-fix-them)

---

## 1. Zero-Shot Prompting

### What Is It?

Zero-shot prompting means giving the model a task **without any examples**. You rely entirely on the model's pre-trained knowledge and its ability to understand your instruction.

### When to Use

- The task is simple and well-understood (translation, summarization, classification).
- You want quick results without crafting examples.
- The model is powerful enough to understand the intent from instructions alone.

### Example

```
Prompt:
Classify the following sentence as positive, negative, or neutral:
"The movie was absolutely breathtaking and I loved every minute of it."
```

```
Output:
Positive
```

### Tips for Better Zero-Shot Prompts

| Tip | Example |
|-----|---------|
| Be specific about the task | "Summarize in 2 sentences" instead of "Summarize" |
| Define the output format | "Answer with only: Positive, Negative, or Neutral" |
| Provide context | "You are analyzing customer reviews for a restaurant..." |
| Use clear delimiters | Wrap input text in triple quotes or XML tags |

### Limitations

- May fail on nuanced, ambiguous, or domain-specific tasks.
- Output format can be unpredictable without explicit instructions.
- Complex reasoning tasks often need more guidance.

---

## 2. Few-Shot Prompting with Examples

### What Is It?

Few-shot prompting provides the model with **a small number of examples** (typically 2–6) demonstrating the desired input → output pattern before asking it to handle a new input.

### When to Use

- The task has a specific format the model might not guess on its own.
- You need consistent output structure.
- Zero-shot results are unreliable or inconsistent.

### Example

```
Prompt:
Classify the sentiment of each review:

Review: "The food was fantastic and the service was quick."
Sentiment: Positive

Review: "Terrible experience. The waiter was rude and the food was cold."
Sentiment: Negative

Review: "It was okay, nothing special but not bad either."
Sentiment: Neutral

Review: "I waited 45 minutes for a burnt pizza. Never going back."
Sentiment:
```

```
Output:
Negative
```

### Best Practices

1. **Diverse examples** — Cover edge cases and different categories.
2. **Consistent formatting** — Keep the structure identical across all examples.
3. **Order matters** — Place the most representative examples first.
4. **Balance classes** — Don't show 5 positive and 1 negative example.
5. **Use delimiters** — Clearly separate each example.

### Variants

| Variant | Description |
|---------|-------------|
| **One-shot** | Only 1 example provided |
| **Few-shot** | 2–6 examples provided |
| **Many-shot** | 10+ examples (useful for very complex patterns) |

### Limitations

- Uses up more tokens (context window).
- Poor examples can mislead the model ("garbage in, garbage out").
- Doesn't help much with tasks requiring complex reasoning — combine with Chain-of-Thought instead.

---

## 3. Role Prompting and Personas

### What Is It?

Role prompting assigns the model a **specific identity, expertise, or persona** to shape its behavior, tone, depth, and perspective.

### When to Use

- You need domain-specific expertise (legal, medical, technical).
- You want a specific communication style or tone.
- You're building a chatbot with a defined personality.

### Example — Expert Persona

```
Prompt:
You are a senior backend engineer with 15 years of experience in distributed
systems. A junior developer asks you:

"Why should I use message queues instead of direct API calls between microservices?"

Explain clearly with real-world analogies.
```

### Example — Creative Persona

```
Prompt:
You are a witty, sarcastic food critic who writes for a trendy magazine.
Review the following dish:

"Plain boiled chicken breast with unseasoned steamed broccoli, served on a
paper plate."
```

### Persona Design Framework

```
You are a [ROLE] with [EXPERIENCE/QUALIFICATIONS].
Your communication style is [TONE].
Your audience is [TARGET AUDIENCE].
You should [SPECIFIC BEHAVIORS].
You should NOT [ANTI-BEHAVIORS].
```

### Real-World Personas Table

| Persona | Use Case |
|---------|----------|
| Senior Code Reviewer | Get thorough, critical code reviews |
| ELI5 Teacher | Simplify complex topics |
| Technical Writer | Generate clear documentation |
| Devil's Advocate | Challenge ideas and find weaknesses |
| Product Manager | Prioritize features and write specs |
| Security Auditor | Find vulnerabilities in code |

### Tips

- **Stack roles**: "You are a Python expert AND a security specialist."
- **Add constraints**: "Never use jargon. Always give examples."
- **Set anti-behaviors**: "Do NOT give generic advice."
- Combine with **system prompts** in APIs for persistent persona behavior.

---

## 4. Chain-of-Thought (CoT) Prompting

### What Is It?

Chain-of-Thought prompting asks the model to **show its reasoning step by step** before arriving at a final answer. This dramatically improves performance on math, logic, and multi-step reasoning tasks.

### When to Use

- Math and arithmetic problems.
- Logic puzzles and word problems.
- Multi-step reasoning or decision-making.
- Any task where the model tends to "jump" to a wrong answer.

### Zero-Shot CoT (The Magic Phrase)

Simply add **"Let's think step by step"** at the end of your prompt:

```
Prompt:
A store has 25 apples. It sells 13 in the morning, receives a shipment of 20
more, then sells 9 in the afternoon. How many apples does the store have now?

Let's think step by step.
```

```
Output:
Step 1: Start with 25 apples.
Step 2: Sell 13 → 25 - 13 = 12 apples.
Step 3: Receive 20 → 12 + 20 = 32 apples.
Step 4: Sell 9 → 32 - 9 = 23 apples.

Answer: 23 apples.
```

### Few-Shot CoT

Provide examples that include the reasoning process:

```
Prompt:
Q: Roger has 5 tennis balls. He buys 2 cans of 3 tennis balls each.
   How many tennis balls does he have now?
A: Roger starts with 5. He buys 2 cans × 3 balls = 6 balls. 5 + 6 = 11.
   The answer is 11.

Q: The cafeteria had 23 apples. They used 20 for lunch and bought 6 more.
   How many do they have?
A:
```

### When CoT Helps vs. Doesn't Help

| ✅ Helps | ❌ Doesn't Help Much |
|----------|---------------------|
| Math word problems | Simple factual recall |
| Multi-step logic | Sentiment classification |
| Code debugging | Translation |
| Planning & strategy | Summarization |
| Causal reasoning | Creative writing |

### Advanced Variations

- **CoT + Few-Shot**: Provide examples with reasoning chains.
- **Zero-Shot CoT**: Just say "Let's think step by step."
- **Plan-and-Solve**: "First understand the problem, then devise a plan, then solve step by step."

---

## 5. Self-Consistency Technique

### What Is It?

Self-consistency generates **multiple reasoning paths** for the same problem, then selects the most common (majority-vote) answer. It's built on top of Chain-of-Thought prompting.

### How It Works

```
┌─────────────┐
│   Problem    │
└──────┬──────┘
       │
  ┌────┼────┐
  ▼    ▼    ▼
Path1 Path2 Path3   ← Multiple CoT reasoning paths
  │    │    │
  ▼    ▼    ▼
Ans:A Ans:A Ans:B   ← Different answers possible
  │    │    │
  └────┼────┘
       ▼
   Majority Vote → Answer: A ✅
```

### Step-by-Step Process

1. **Run the same prompt multiple times** (e.g., 5 times) with temperature > 0.
2. Each run generates a different reasoning chain.
3. Extract the final answer from each chain.
4. **Pick the answer that appears most often** (majority vote).

### Implementation Example (Pseudocode)

```python
import openai
from collections import Counter

def self_consistency(prompt, n=5, temperature=0.7):
    answers = []
    for _ in range(n):
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature
        )
        # Extract the final answer from the response
        answer = extract_final_answer(response)
        answers.append(answer)
    
    # Majority vote
    most_common = Counter(answers).most_common(1)[0][0]
    return most_common
```

### When to Use

- High-stakes reasoning tasks where accuracy is critical.
- Math and logic where a single chain might go wrong.
- When you have budget for multiple API calls.

### Trade-offs

| Pros | Cons |
|------|------|
| Higher accuracy on reasoning | Costs more (N × API calls) |
| Reduces random errors | Slower than single-pass |
| Simple to implement | Doesn't help if all paths are wrong |
| Works with any CoT method | Needs a way to extract and compare answers |

---

## 6. ReAct Prompting

### What Is It?

**ReAct (Reasoning + Acting)** combines the model's ability to **reason** (think out loud) with **actions** (use tools, search, compute). The model alternates between thinking, taking actions, and observing results.

### The Loop

```
Thought → Action → Observation → Thought → Action → Observation → ... → Final Answer
```

### Example

```
Question: What is the population of the capital of France?

Thought 1: I need to find the capital of France first.
Action 1: Search["Capital of France"]
Observation 1: The capital of France is Paris.

Thought 2: Now I need to find the population of Paris.
Action 2: Search["Population of Paris 2024"]
Observation 2: The population of Paris is approximately 2.1 million (city proper).

Thought 3: I now have enough information to answer.
Final Answer: The population of the capital of France (Paris) is approximately
2.1 million people.
```

### ReAct vs. Other Methods

| Method | Reasoning | Tool Use | Grounded |
|--------|-----------|----------|----------|
| Standard prompting | ❌ | ❌ | ❌ |
| Chain-of-Thought | ✅ | ❌ | ❌ |
| Act-only (tools) | ❌ | ✅ | ✅ |
| **ReAct** | **✅** | **✅** | **✅** |

### When to Use

- Tasks requiring **external information** (web search, databases, APIs).
- **Multi-step** tasks that need planning and execution.
- When you need **verifiable, grounded** answers.
- Building **AI agents** and **autonomous systems**.

### Real-World Applications

- **AI Agents**: LangChain agents, AutoGPT, and similar frameworks use ReAct.
- **Customer Support Bots**: Reason → look up order → check policies → respond.
- **Research Assistants**: Think → search papers → read abstracts → synthesize.
- **Code Assistants**: Understand task → read files → write code → run tests.

### Prompt Template

```
Answer the following question by reasoning step-by-step and using the
available tools when needed.

Available tools:
- Search[query]: Search the web for information.
- Calculator[expression]: Evaluate a math expression.
- Lookup[term]: Look up a term in a knowledge base.

Format your response as:
Thought: <your reasoning>
Action: <ToolName>[<input>]
Observation: <result from tool>
... (repeat as needed)
Final Answer: <your answer>

Question: {question}
```

---

## 7. Negative Prompting and Setting Constraints

### What Is It?

Negative prompting tells the model what **NOT** to do, what to **avoid**, and sets **boundaries** on its output. Constraints narrow the output space and prevent common failure modes.

### Why It Matters

Models are trained to be helpful and verbose. Without constraints they tend to:
- Over-explain or ramble.
- Use jargon you don't want.
- Include disclaimers and caveats.
- Hallucinate or speculate.

### Types of Constraints

#### 1. Content Constraints (What NOT to include)

```
Prompt:
Explain quantum computing to a 10-year-old.

Do NOT:
- Use technical jargon
- Mention math formulas
- Use analogies involving computers (they don't understand those yet)
- Exceed 100 words
```

#### 2. Format Constraints (How NOT to format)

```
Prompt:
List 5 benefits of exercise.

Constraints:
- Do NOT use bullet points or numbered lists
- Do NOT use bold or italic formatting
- Write it as a flowing paragraph
```

#### 3. Behavioral Constraints (How NOT to behave)

```
Prompt:
You are a coding assistant.

Rules:
- Do NOT apologize or say "I'm sorry"
- Do NOT use phrases like "As an AI language model..."
- Do NOT add unnecessary disclaimers
- Do NOT explain things the user didn't ask about
- If you don't know something, say "I don't know" — do NOT guess
```

#### 4. Scope Constraints (What NOT to go beyond)

```
Prompt:
Based ONLY on the following text, answer the question.
Do NOT use any outside knowledge.
If the answer is not in the text, say "Not found in the provided text."

Text: """..."""

Question: ...
```

### The Constraint Stack Pattern

```
[INSTRUCTION]
Your task is to...

[POSITIVE CONSTRAINTS — DO]
- Use simple language
- Provide 3 examples
- Keep it under 200 words

[NEGATIVE CONSTRAINTS — DON'T]
- Do NOT use passive voice
- Do NOT include code
- Do NOT mention competitor products

[OUTPUT FORMAT]
Return your answer as...
```

### Common Constraint Templates

| Purpose | Constraint |
|---------|-----------|
| Prevent hallucination | "Only use information from the provided context" |
| Control length | "Respond in exactly 3 sentences" |
| Control tone | "Do not use casual language or slang" |
| Prevent repetition | "Do not repeat any point already made" |
| Force specificity | "Do not give generic advice — be specific to this scenario" |
| Prevent hedging | "Do not say 'it depends' — commit to an answer" |

---

## 8. Getting Reliable Structured Output Like JSON

### The Problem

By default, LLMs output free-form text. Getting consistent, parseable JSON (or other structured formats) requires careful prompting.

### Strategy 1: Explicit JSON Schema in Prompt

```
Prompt:
Extract the following information from the text below and return it as JSON.

Schema:
{
  "name": "string",
  "age": "integer",
  "email": "string or null",
  "skills": ["string"]
}

Text: "John Doe is a 28-year-old developer skilled in Python, JavaScript, and
Rust. His email is john@example.com."

Return ONLY valid JSON. No explanations, no markdown, no code blocks.
```

```json
{
  "name": "John Doe",
  "age": 28,
  "email": "john@example.com",
  "skills": ["Python", "JavaScript", "Rust"]
}
```

### Strategy 2: Provide an Example (Few-Shot)

```
Prompt:
Convert each product description into JSON.

Example:
Input: "Red Nike sneakers, size 10, priced at $120"
Output: {"product": "sneakers", "brand": "Nike", "color": "red", "size": 10, "price": 120}

Input: "Blue Adidas hoodie, size M, priced at $65"
Output:
```

### Strategy 3: Use System Prompts + Response Format (API)

```python
# OpenAI example with response_format
response = openai.ChatCompletion.create(
    model="gpt-4-turbo",
    response_format={"type": "json_object"},
    messages=[
        {
            "role": "system",
            "content": "You are an API that returns JSON. Always respond with valid JSON only."
        },
        {
            "role": "user",
            "content": "Extract entities from: 'Apple Inc. was founded by Steve Jobs in Cupertino, California.'"
        }
    ]
)
```

### Strategy 4: XML Tags as Delimiters

```
Prompt:
Analyze the following code and return your analysis inside XML tags:

<analysis>
  <language>detected programming language</language>
  <bugs>list of bugs found</bugs>
  <suggestions>improvement suggestions</suggestions>
  <complexity>time complexity</complexity>
</analysis>
```

### Reliability Checklist

| Technique | Impact |
|-----------|--------|
| Show the exact JSON schema | 🟢 High |
| Say "Return ONLY valid JSON" | 🟢 High |
| Use `response_format: json_object` (API) | 🟢 Highest |
| Provide a complete example | 🟢 High |
| Say "No markdown code blocks" | 🟡 Medium |
| Validate and retry on parse failure | 🟢 High |
| Use a lower temperature (0–0.2) | 🟡 Medium |

### Handling Failures

```python
import json

def get_json_response(prompt, max_retries=3):
    for attempt in range(max_retries):
        response = call_llm(prompt)
        try:
            # Try to extract JSON from possible markdown code blocks
            text = response.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(text)
        except json.JSONDecodeError:
            if attempt < max_retries - 1:
                prompt += "\n\nYour previous response was not valid JSON. Please return ONLY valid JSON."
    raise ValueError("Failed to get valid JSON after retries")
```

---

## 9. Prompt Chaining Across Multiple Calls

### What Is It?

Prompt chaining breaks a **complex task into smaller, sequential steps**. The output of one prompt becomes the input for the next. Each link in the chain focuses on a single, well-defined sub-task.

### When to Use

- The task is too complex for a single prompt.
- You need to validate or transform intermediate results.
- Different steps need different expertise or configurations.
- You want more control and debuggability.

### Visual Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Prompt 1 │───▶│ Prompt 2 │───▶│ Prompt 3 │───▶│ Prompt 4 │
│ Research  │    │ Outline  │    │ Draft    │    │ Polish   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
    output1 ──▶ input2    output2 ──▶ input3    output3 ──▶ input4
```

### Example: Blog Post Generator

#### Step 1 — Research

```
Prompt 1:
List the 5 most important points about "the benefits of remote work" that
should be covered in a blog post. Return as a numbered list.
```

#### Step 2 — Outline

```
Prompt 2:
Based on these key points, create a detailed blog post outline with
introduction, sections for each point, and conclusion:

Key Points:
{output_from_step_1}
```

#### Step 3 — Draft

```
Prompt 3:
Write a 1000-word blog post following this outline. Use a conversational,
engaging tone. Include statistics where relevant.

Outline:
{output_from_step_2}
```

#### Step 4 — Polish

```
Prompt 4:
Review and improve the following blog post:
- Fix any grammatical errors
- Improve transitions between sections
- Add a compelling hook in the introduction
- Ensure the conclusion has a clear call to action

Blog Post:
{output_from_step_3}
```

### Chaining Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Sequential** | A → B → C → D | Research → Outline → Write → Edit |
| **Branching** | A → (B, C) → D | Generate 3 drafts → Pick best → Polish |
| **Conditional** | A → if X then B else C | Classify → Route to specialist prompt |
| **Loop** | A → B → Check → (repeat or continue) | Write → Review → Fix → Review again |
| **Map-Reduce** | Split → Process each → Combine | Split document → Summarize chapters → Merge |

### Implementation Example

```python
def blog_post_pipeline(topic):
    # Step 1: Research
    key_points = call_llm(
        f"List 5 key points about '{topic}'. Return as a numbered list."
    )
    
    # Step 2: Outline
    outline = call_llm(
        f"Create a blog post outline from these points:\n{key_points}"
    )
    
    # Step 3: Draft
    draft = call_llm(
        f"Write a 1000-word blog post from this outline:\n{outline}",
        temperature=0.7  # More creative
    )
    
    # Step 4: Polish (use a different model or lower temperature)
    final = call_llm(
        f"Edit and improve this blog post:\n{draft}",
        temperature=0.2  # More precise
    )
    
    return final
```

### Benefits Over Single Prompts

| Single Prompt | Chained Prompts |
|---------------|-----------------|
| One long, complex prompt | Small, focused prompts |
| Hard to debug | Easy to inspect each step |
| All-or-nothing | Can retry individual steps |
| One temperature/model | Different settings per step |
| Token limits restrict output | Each step gets full context window |

---

## 10. Common Prompt Mistakes and How to Fix Them

### ❌ Mistake 1: Being Too Vague

```
Bad:  "Tell me about Python."
Good: "Explain Python's GIL (Global Interpreter Lock) — what it is, why it
       exists, and how it affects multi-threaded programs. Target audience:
       intermediate developers. Keep it under 300 words."
```

**Fix**: Be specific about **topic**, **scope**, **audience**, and **length**.

---

### ❌ Mistake 2: Overloading a Single Prompt

```
Bad:  "Write a REST API in Python, add authentication, write tests, create
       documentation, set up Docker, and deploy it to AWS."

Good: Break it into a chain:
      1. "Design the API endpoints for a todo app."
      2. "Implement the endpoints using FastAPI."
      3. "Add JWT authentication to the API."
      4. "Write pytest tests for each endpoint."
      ... (etc.)
```

**Fix**: Use **prompt chaining** for complex, multi-step tasks.

---

### ❌ Mistake 3: Not Specifying Output Format

```
Bad:  "Extract the names and dates from this text."
Good: "Extract all person names and dates from the text below.
       Return as JSON: [{"name": "...", "date": "YYYY-MM-DD"}]
       Text: ..."
```

**Fix**: Always specify the **exact format** you expect.

---

### ❌ Mistake 4: Ignoring the Model's Tendency to Be Verbose

```
Bad:  "What is 2 + 2?"
      → "Great question! The sum of 2 and 2 is 4. This is a basic arithmetic..."

Good: "What is 2 + 2? Reply with only the number."
      → "4"
```

**Fix**: Add constraints like "Reply with only...", "Be concise", "No preamble".

---

### ❌ Mistake 5: Providing Conflicting Instructions

```
Bad:  "Be creative and original. Follow this exact template word for word."

Good: "Follow this template structure, but use creative and original language
       for the content within each section."
```

**Fix**: Review your prompt for **contradictions** before sending.

---

### ❌ Mistake 6: Not Using Delimiters for Input Data

```
Bad:  Summarize this: The meeting was productive and we discussed the
      summary format which should be brief.

Good: Summarize the following text:
      """
      The meeting was productive and we discussed the summary format
      which should be brief.
      """
```

**Fix**: Use `"""`, `---`, `<text>...</text>`, or XML tags to clearly **delimit input data** from instructions.

---

### ❌ Mistake 7: Asking "Do You Understand?"

```
Bad:  "Do you understand the task? If yes, proceed."
      → "Yes, I understand! [proceeds incorrectly]"

Good: "Before answering, restate the task in your own words, then proceed."
```

**Fix**: Ask the model to **restate** the task rather than confirm understanding.

---

### ❌ Mistake 8: Not Iterating on Prompts

Most people write one prompt and give up if it doesn't work.

**Fix**: Treat prompting as **iterative development**:

```
v1: Basic prompt → examine output
v2: Add format constraints → examine output
v3: Add examples → examine output
v4: Add negative constraints → examine output
v5: Final version ✅
```

---

### ❌ Mistake 9: Using the Wrong Temperature

| Temperature | Best For |
|-------------|----------|
| 0.0 – 0.2 | Factual answers, JSON, code, classification |
| 0.3 – 0.7 | Balanced creativity + accuracy |
| 0.8 – 1.0 | Creative writing, brainstorming, poetry |

**Fix**: Match temperature to your task type.

---

### ❌ Mistake 10: Forgetting Context Window Limits

```
Bad:  Pasting an entire 500-page book and asking for analysis.
Good: Split into chapters, summarize each, then synthesize summaries.
```

**Fix**: Use **map-reduce** or **chunking** strategies for large inputs.

---

## 🏁 Quick Reference Cheat Sheet

| Technique | When to Use | Key Phrase |
|-----------|-------------|------------|
| Zero-Shot | Simple, well-defined tasks | "Classify this as..." |
| Few-Shot | Need consistent formatting | "Here are 3 examples..." |
| Role Prompting | Need expertise or tone | "You are a senior..." |
| Chain-of-Thought | Reasoning & math | "Let's think step by step" |
| Self-Consistency | High-stakes accuracy | Run N times + majority vote |
| ReAct | Tool use + reasoning | "Thought → Action → Observation" |
| Negative Prompting | Preventing unwanted output | "Do NOT..." |
| Structured Output | Need parseable data | "Return as JSON: {schema}" |
| Prompt Chaining | Complex multi-step tasks | Output₁ → Input₂ → Output₂ |

---

## 📚 Further Reading

- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- [Google Gemini Prompting Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [Learn Prompting (Community)](https://learnprompting.org/)
- Original Papers:
  - [Chain-of-Thought Prompting (Wei et al., 2022)](https://arxiv.org/abs/2201.11903)
  - [Self-Consistency (Wang et al., 2022)](https://arxiv.org/abs/2203.11171)
  - [ReAct (Yao et al., 2022)](https://arxiv.org/abs/2210.03629)

---

> *"The prompt is the program."* — Andrej Karpathy

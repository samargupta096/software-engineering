# Chapter 5: Prompt Engineering

> *The art and science of communicating effectively with foundation models*

---

## 🎯 Core Concepts

### Why Prompt Engineering Matters

- Most accessible and lowest-barrier adaptation technique
- Can dramatically change model behavior without any training
- First line of defense before considering finetuning
- Iterative: small changes can yield large output differences

### Prompt Structure

```
┌─────────────────────────────────┐
│         SYSTEM PROMPT           │
│  Role, personality, rules,     │
│  output format requirements    │
├─────────────────────────────────┤
│       FEW-SHOT EXAMPLES        │
│  Input → Output pairs that     │
│  demonstrate desired behavior  │
├─────────────────────────────────┤
│        CONTEXT / DATA          │
│  Retrieved docs, user history, │
│  relevant information          │
├─────────────────────────────────┤
│        USER QUERY              │
│  The actual user request       │
└─────────────────────────────────┘
```

### Key Techniques

| Technique | Description | When to Use |
|-----------|------------|-------------|
| **Zero-shot** | Direct instruction, no examples | Simple tasks, strong models |
| **Few-shot** | Provide examples of desired I/O | Complex formatting, niche tasks |
| **Chain-of-Thought (CoT)** | "Let's think step by step" | Reasoning, math, logic |
| **Self-consistency** | Generate multiple CoT paths, vote | Critical reasoning tasks |
| **Role prompting** | "You are a {expert}" | Domain-specific tasks |
| **ReAct** | Reasoning + Acting interleaved | Agent tasks with tools |
| **Decomposition** | Break complex task into sub-tasks | Multi-step problems |

### Best Practices

- **Be specific and explicit** — vague prompts → vague outputs
- **Use delimiters** — clearly separate instructions from data (`"""`, `---`, XML tags)
- **Specify output format** — JSON, markdown, specific structure
- **Provide constraints** — word limits, tone, things to avoid
- **Iterate systematically** — change one thing at a time, evaluate rigorously
- **Test edge cases** — adversarial inputs, empty inputs, very long inputs

### Common Pitfalls

- ❌ Overly complex prompts that confuse the model
- ❌ Conflicting instructions
- ❌ Assuming the model "knows" your context
- ❌ Not testing across diverse inputs
- ❌ Prompt injection vulnerabilities

### Prompt Management

- Version control your prompts
- A/B test prompt variants
- Monitor performance over time (model updates can break prompts)
- Document what each prompt component does and why

---

## 📝 My Notes

<!-- Add your own notes, insights, and questions as you read -->



---

## ❓ Questions to Reflect On

1. When should you invest more in prompt engineering vs. moving to RAG or finetuning?
2. How do you systematically test and iterate on prompts?
3. What's your strategy for prompt versioning in production?
4. How do you defend against prompt injection attacks?

---

## 🔗 Key Takeaways

1. 
2. 
3. 

---

## 🛠️ Practice Ideas

- [ ] Take one task and write zero-shot, few-shot, and CoT prompts — compare results
- [ ] Build a prompt testing harness that evaluates a prompt across 50+ inputs
- [ ] Implement a prompt versioning system with evaluation tracking
- [ ] Try prompt injection attacks on your own system and add defenses


---

<div align="center">

[⬅️ Previous Chapter](./chapter-04-evaluating-ai-systems.md) | [🏠 Home](./README.md) | [Next Chapter ➡️](./chapter-06-rag-and-agents.md)

</div>

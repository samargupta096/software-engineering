# 📚 AI Engineering: Building Applications with Foundation Models

> **Author:** Chip Huyen | **Publisher:** O'Reilly (2025)
> **GitHub:** [chiphuyen/aie-book](https://github.com/chiphuyen/aie-book)

A structured study guide for learning AI Engineering — the discipline of building real-world applications on top of foundation models (LLMs & LMMs).

### 🚀 [Quick Reference Guide (Visuals & Diagrams)](./quick-reference.md) ⭐

---

## 🗺️ Book Overview

This book provides a **framework for adapting foundation models** to solve real-world problems. It focuses on **fundamentals** rather than specific tools/APIs, covering the end-to-end process from ideation to deployment and monitoring.

### Key Questions This Book Answers

1. Should I build this AI application?
2. How do I evaluate my application? Can I use AI to evaluate AI outputs?
3. What causes hallucinations? How do I detect and mitigate them?
4. What are the best practices for prompt engineering?
5. Why does RAG work? What strategies exist for RAG?
6. What's an agent? How do I build and evaluate one?
7. When to finetune? When NOT to finetune?
8. How much data do I need? How do I validate data quality?
9. How to make my model faster, cheaper, and secure?
10. How to create feedback loops for continual improvement?

---

## 📖 Chapter Guide

| # | Chapter | Notes File | Status |
|---|---------|------------|--------|
| 1 | Introduction to Building AI Applications | [Chapter 1](./chapter-01-introduction.md) | 📝 Not Started |
| 2 | Understanding Foundation Models | [Chapter 2](./chapter-02-foundation-models.md) | 📝 Not Started |
| 3 | Evaluation Methodology | [Chapter 3](./chapter-03-evaluation-methodology.md) | 📝 Not Started |
| 4 | Evaluating AI Systems | [Chapter 4](./chapter-04-evaluating-ai-systems.md) | 📝 Not Started |
| 5 | Prompt Engineering | [Chapter 5](./chapter-05-prompt-engineering.md) | 📝 Not Started |
| 6 | RAG and Agents | [Chapter 6](./chapter-06-rag-and-agents.md) | 📝 Not Started |
| 7 | Finetuning | [Chapter 7](./chapter-07-finetuning.md) | 📝 Not Started |
| 8 | Dataset Engineering | [Chapter 8](./chapter-08-dataset-engineering.md) | 📝 Not Started |
| 9 | Inference Optimization | [Chapter 9](./chapter-09-inference-optimization.md) | 📝 Not Started |
| 10 | AI Engineering Architecture & User Feedback | [Chapter 10](./chapter-10-architecture-feedback.md) | 📝 Not Started |

---

## 🎯 Study Plan

### Phase 1: Foundations (Chapters 1–2)
> *Understand the landscape and how foundation models work*

- [ ] Chapter 1 — AI Engineering vs ML Engineering, the AI stack, planning applications
- [ ] Chapter 2 — How models are trained, tokenization, capabilities & limitations

### Phase 2: Evaluation (Chapters 3–4)
> *Learn to measure before you build*

- [ ] Chapter 3 — Evaluation methodology, AI-as-a-judge, metrics
- [ ] Chapter 4 — Designing evaluation pipelines, evaluating all system components

### Phase 3: Building Techniques (Chapters 5–7)
> *Core adaptation techniques: prompting, RAG, agents, and finetuning*

- [ ] Chapter 5 — Prompt engineering techniques and best practices
- [ ] Chapter 6 — RAG architecture, agent design and evaluation
- [ ] Chapter 7 — When and how to finetune, parameter-efficient methods

### Phase 4: Data & Optimization (Chapters 8–9)
> *Data quality and serving efficiency*

- [ ] Chapter 8 — Dataset engineering, data quality, data quantity needs
- [ ] Chapter 9 — Latency/cost bottlenecks, inference optimization strategies

### Phase 5: Production (Chapter 10)
> *Architecture, security, observability, and feedback loops*

- [ ] Chapter 10 — Production architecture, guardrails, feedback loops, continuous improvement

---

## 🧠 AI Engineering Stack

```
┌─────────────────────────────────────────────┐
│          APPLICATION DEVELOPMENT            │
│  Prompt Engineering · RAG · Agents · Eval   │
├─────────────────────────────────────────────┤
│            MODEL DEVELOPMENT                │
│  Finetuning · Dataset Engineering · RLHF    │
├─────────────────────────────────────────────┤
│              INFRASTRUCTURE                 │
│  Inference · Serving · Monitoring · GPUs    │
└─────────────────────────────────────────────┘
```

---

## 📌 How to Use This Guide

1. **Read the chapter** from the book
2. **Fill in the corresponding chapter notes** file as you read
3. **Update the status** in the table above (📝 → 🔄 → ✅)
4. **Add your own insights**, questions, and connections in each file
5. **Build mini-projects** to reinforce concepts (see each chapter file for ideas)

> 💡 **Tip:** The book is modular — you can jump to any chapter that interests you. However, Chapters 1–2 provide essential context, and Chapters 3–4 (Evaluation) are recommended before diving into building techniques.

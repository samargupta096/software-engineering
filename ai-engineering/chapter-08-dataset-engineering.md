# Chapter 8: Dataset Engineering

> *Data is the most underappreciated yet impactful part of AI engineering*

---

## 🎯 Core Concepts

### Why Dataset Engineering Matters

- **"Garbage in, garbage out"** applies even more with foundation models
- Data quality directly impacts: finetuning results, RAG accuracy, evaluation reliability
- Often the highest-leverage improvement you can make
- An essential skill that is frequently underappreciated

### Data for Different Purposes

| Purpose | Data Type | Quality Needs |
|---------|-----------|---------------|
| **RAG Knowledge Base** | Documents, articles, FAQs | Accurate, up-to-date, deduplicated |
| **Finetuning** | Instruction-response pairs | High-quality, diverse, consistent |
| **Evaluation** | Test cases with expected outputs | Curated, edge-case coverage |
| **Pre-training** | Large text corpora | Broad but filtered for quality |

### Data Collection Strategies

- **Manual curation**: Highest quality, lowest scale
- **Crowdsourcing**: Moderate quality, scalable, needs quality controls
- **Synthetic data generation**: Use AI to generate training/eval data
- **Web scraping**: Large scale but noisy, needs heavy filtering
- **User data**: Real-world distribution but privacy/consent concerns

### Synthetic Data

- Using strong models to generate data for training weaker models
- **Distillation**: Teacher model generates training data for student model
- **Self-Instruct**: Model generates its own instruction-following data
- **Evol-Instruct**: Progressively evolve instructions to be more complex
- ⚠️ Risks: model collapse, echo chamber effects, license restrictions

### Data Quality Framework

```
┌─────────────────────────────────────┐
│          DATA QUALITY               │
├──────────────┬──────────────────────┤
│ Accuracy     │ Is the data correct? │
│ Completeness │ Is anything missing? │
│ Consistency  │ Are labels uniform?  │
│ Freshness    │ Is it up to date?    │
│ Relevance    │ Does it match the    │
│              │ target distribution? │
│ Diversity    │ Does it cover edge   │
│              │ cases?               │
│ Uniqueness   │ Are duplicates       │
│              │ removed?             │
└──────────────┴──────────────────────┘
```

### How Much Data Do You Need?

- It depends! (No universal answer)
- **Finetuning**: Often 500–10,000 high-quality examples for LoRA
- **RAG**: Depends on knowledge domain breadth
- **Power law**: Diminishing returns — measure the data scaling curve for your task
- **Quality matters more**: 1K high-quality > 100K low-quality

### Data Labeling & Annotation

- Clear annotation guidelines with examples
- Inter-annotator agreement metrics (Kappa, agreement %)
- Iterative refinement of guidelines based on disagreements
- Use AI-assisted labeling + human verification

---

## 📝 My Notes

<!-- Add your own notes, insights, and questions as you read -->



---

## ❓ Questions to Reflect On

1. What data do you have access to, and how would you assess its quality?
2. Is synthetic data appropriate for your use case? What are the risks?
3. How do you build a data flywheel — improving data from production usage?
4. How do you balance data quantity vs. quality given your constraints?

---

## 🔗 Key Takeaways

1. 
2. 
3. 

---

## 🛠️ Practice Ideas

- [ ] Audit a dataset: check for duplicates, quality, diversity, edge cases
- [ ] Generate synthetic data using a strong model, evaluate its quality
- [ ] Build annotation guidelines for a task and measure inter-annotator agreement
- [ ] Plot a data scaling curve: train with 100, 500, 1K, 5K examples and compare


---

<div align="center">

[⬅️ Previous Chapter](./chapter-07-finetuning.md) | [🏠 Home](./README.md) | [Next Chapter ➡️](./chapter-09-inference-optimization.md)

</div>

# Chapter 7: Finetuning

> *When prompting isn't enough — adapting models to your specific needs*

---

## 🎯 Core Concepts

### When to Finetune (and When NOT to)

| ✅ Finetune When | ❌ Don't Finetune When |
|-----------------|----------------------|
| Consistent style/format needed | Prompt engineering works well enough |
| Domain-specific language | Small dataset (< hundreds of examples) |
| Significant quality gap with prompting | Task changes frequently |
| Need to reduce prompt length/cost | Limited compute budget |
| Proprietary data can't be sent to APIs | You're just starting to explore |

### Types of Finetuning

#### Full Finetuning
- Update **all model parameters**
- Requires significant compute (multiple GPUs)
- Best quality but most expensive
- Risk of catastrophic forgetting

#### Parameter-Efficient Finetuning (PEFT)

| Method | Description | Parameters Updated |
|--------|------------|-------------------|
| **LoRA** | Low-Rank Adaptation — add small trainable matrices | ~0.1-1% of original |
| **QLoRA** | LoRA + quantized base model (4-bit) | Same as LoRA, less VRAM |
| **Prefix Tuning** | Learn virtual tokens prepended to input | Very few parameters |
| **Adapters** | Insert small trainable layers | ~1-5% of original |

#### LoRA Deep Dive

```
Original Weight Matrix W (frozen)
           │
    ┌──────▼──────┐
    │  W (d × d)  │   ← Frozen (not updated)
    └─────────────┘
           +
    ┌──────▼──────┐
    │  A (d × r)  │   ← Trainable (r << d)
    │      ×      │
    │  B (r × d)  │   ← Trainable
    └─────────────┘
    
    Output = W·x + A·B·x
    (rank r is typically 4, 8, 16, 32)
```

### Finetuning Pipeline

1. **Data preparation** — Format data for the task (instruction, input, output)
2. **Choose base model** — Open-source model appropriate for your task
3. **Set hyperparameters** — Learning rate, epochs, batch size, LoRA rank
4. **Train** — Monitor loss, avoid overfitting
5. **Evaluate** — Compare against baseline (prompting-only)
6. **Merge & deploy** — Merge LoRA weights or serve adapter alongside base

### Alignment Techniques

- **SFT (Supervised Fine-Tuning)**: Train on curated instruction-response pairs
- **RLHF (Reinforcement Learning from Human Feedback)**: Train a reward model, optimize with PPO
- **DPO (Direct Preference Optimization)**: Simpler alternative to RLHF, no reward model needed
- **Constitutional AI**: Self-improvement with AI feedback

### Data Quality for Finetuning

- Quality > quantity — 1,000 high-quality examples can outperform 100,000 noisy ones
- Diversity matters — cover the range of expected inputs
- Label consistency — ambiguous labels hurt more than small datasets
- Deduplication — remove near-duplicates

---

## 📝 My Notes

<!-- Add your own notes, insights, and questions as you read -->



---

## ❓ Questions to Reflect On

1. For your use case, would LoRA or full finetuning be more appropriate?
2. How much data would you need to finetune effectively?
3. How do you know if finetuning is working — what metrics do you track?
4. How do you handle model updates (new base model versions)?

---

## 🔗 Key Takeaways

1. 
2. 
3. 

---

## 🛠️ Practice Ideas

- [ ] Finetune a small model (e.g., Llama 3.2 1B) with LoRA on a custom dataset
- [ ] Compare finetuned model vs. few-shot prompting on the same eval set
- [ ] Experiment with different LoRA ranks (4, 8, 16, 32) and measure impact
- [ ] Try DPO alignment on a preference dataset


---

<div align="center">

[⬅️ Previous Chapter](./chapter-06-rag-and-agents.md) | [🏠 Home](./README.md) | [Next Chapter ➡️](./chapter-08-dataset-engineering.md)

</div>

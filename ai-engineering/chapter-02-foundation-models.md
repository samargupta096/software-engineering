# Chapter 2: Understanding Foundation Models

> *Demystifying the core components that define a model's capabilities and limitations*

---

## 🎯 Core Concepts

### How Language Models Work

- **Autoregressive Models**: Generate tokens one at a time, left-to-right (e.g., GPT)
- **Masked Language Models**: Predict masked tokens (e.g., BERT) — used more for embeddings
- **Sequence-to-Sequence**: Encoder-decoder architecture (e.g., T5)

### Tokenization

- Models don't see text — they see **tokens** (subword units)
- Different tokenizers produce different token counts for the same text
- **BPE (Byte-Pair Encoding)**: Most common tokenization approach
- Token limits affect **context window** size and costs
- Why tokenization matters: it impacts model performance on different languages and tasks

### Training Data

- Foundation models are trained on **massive corpora** (internet text, books, code)
- Data quality > quantity (even for pre-training)
- **Data contamination**: Benchmark data may leak into training sets
- Biases in training data → biases in model outputs

### Model Architecture

- **Transformer architecture** — the backbone of modern foundation models
  - Self-attention mechanism
  - Positional encoding
  - Feed-forward networks
- **Scaling laws**: Relationship between model size, data, compute, and performance
- **Emergent capabilities**: Abilities that appear at scale but aren't present in smaller models

### How Models Generate Responses

- **Next-token prediction**: The core mechanism
- **Temperature**: Controls randomness (0 = deterministic, higher = more creative)
- **Top-k / Top-p sampling**: Filter token candidates
- **Beam search vs. sampling**: Different generation strategies
- **Stop sequences**: When to stop generating

### Capabilities & Limitations

| Capability | Limitation |
|-----------|-----------|
| Language understanding | Hallucinations |
| Reasoning (with caveats) | Limited math/logic reliability |
| Code generation | No real-time information |
| Multilingual support | Uneven language quality |
| Following instructions | Sensitivity to prompt phrasing |

### Types of Models

- **Base models**: Pre-trained only, can complete text
- **Instruction-tuned**: Finetuned to follow instructions
- **Chat models**: Further tuned for conversational interaction
- **RLHF-aligned**: Trained with human preference feedback

---

## 📝 My Notes

<!-- Add your own notes, insights, and questions as you read -->



---

## ❓ Questions to Reflect On

1. How does tokenization affect multilingual applications?
2. What are the practical implications of context window sizes?
3. How do scaling laws inform the decision between small vs. large models?
4. What's the trade-off between using base models vs. instruction-tuned models?

---

## 🔗 Key Takeaways

1. 
2. 
3. 

---

## 🛠️ Practice Ideas

- [ ] Compare tokenization of the same sentence across different models
- [ ] Experiment with temperature and sampling parameters on the same prompt
- [ ] Try using a base model vs. an instruction-tuned model and compare outputs


---

<div align="center">

[⬅️ Previous Chapter](./chapter-01-introduction.md) | [🏠 Home](./README.md) | [Next Chapter ➡️](./chapter-03-evaluation-methodology.md)

</div>

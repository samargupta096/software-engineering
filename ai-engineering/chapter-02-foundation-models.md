# Chapter 2: Understanding Foundation Models

> *Demystifying the core components that define a model's capabilities and limitations*

---

## 🎯 Core Concepts

### How Language Models Work

```mermaid
flowchart LR
    subgraph AUTO["Autoregressive (GPT, Llama)"]
        direction LR
        A1["The"] --> A2["cat"] --> A3["sat"] --> A4["on"] --> A5["..."]
    end

    subgraph MASKED["Masked Language Model (BERT)"]
        direction LR
        B1["The"] --> B2["[MASK]"] --> B3["sat"] --> B4["on"]
    end

    subgraph SEQ2SEQ["Encoder-Decoder (T5)"]
        direction LR
        C1["Encode Input"] --> C2["Decode Output"]
    end

    style AUTO fill:#e3f2fd,stroke:#1976d2
    style MASKED fill:#fff3e0,stroke:#ff9800
    style SEQ2SEQ fill:#e8f5e9,stroke:#4caf50
```

| Architecture | How It Works | Examples | Best For |
| :--- | :--- | :--- | :--- |
| **Autoregressive** | Predict next token L→R | GPT-4, Llama, Claude | Text generation, chat |
| **Masked** | Predict masked tokens | BERT, RoBERTa | Embeddings, classification |
| **Seq2Seq** | Encoder → Decoder | T5, BART | Translation, summarization |

### Tokenization — How Models See Text

```mermaid
flowchart LR
    Text["'Hello world!'"] --> Tokenizer["BPE Tokenizer"]
    Tokenizer --> T1["'Hello'"]
    Tokenizer --> T2["' world'"]
    Tokenizer --> T3["'!'"]
    T1 --> ID1["Token ID: 9906"]
    T2 --> ID2["Token ID: 1917"]
    T3 --> ID3["Token ID: 0"]

    style Text fill:#fff3e0,stroke:#ff9800
    style Tokenizer fill:#e8eaf6,stroke:#3f51b5
```

- Models don't see text — they see **tokens** (subword units)
- **BPE (Byte-Pair Encoding)**: Most common tokenization approach
- Token limits affect **context window** size and costs
- Different languages have different token efficiency (English is cheaper per word than most)

### The Transformer Architecture

```mermaid
flowchart TB
    Input["Input Tokens"] --> PE["Positional Encoding"]
    PE --> SA["🔗 Self-Attention<br/>'Which tokens should<br/>attend to which?'"]
    SA --> FF["⚡ Feed-Forward Network<br/>'Process each position'"]
    FF --> LN["Layer Norm + Residual"]
    LN --> |"Repeat N layers"| SA2["🔗 Self-Attention"]
    SA2 --> FF2["⚡ Feed-Forward"]
    FF2 --> Output["Output Probabilities"]

    style SA fill:#e8eaf6,stroke:#3f51b5
    style FF fill:#e3f2fd,stroke:#2196f3
    style Output fill:#c8e6c9,stroke:#388e3c
```

**Self-Attention** is the key innovation — it lets each token "look at" every other token to understand context and relationships.

### How Models Generate Responses

```mermaid
flowchart TD
    Prompt["Input: 'The capital of France is'"] --> Model["Model computes<br/>probability distribution"]
    Model --> Candidates["Top candidates:<br/>Paris (0.85)<br/>Lyon (0.05)<br/>the (0.03)"]

    Candidates --> Temp{"Temperature?"}
    Temp -- "T=0 (deterministic)" --> Pick1["Always pick: Paris"]
    Temp -- "T=0.7 (balanced)" --> Pick2["Usually: Paris<br/>Sometimes: Lyon"]
    Temp -- "T=1.5 (creative)" --> Pick3["More diverse<br/>sampling"]

    style Prompt fill:#fff3e0,stroke:#ff9800
    style Pick1 fill:#c8e6c9,stroke:#388e3c
```

### Generation Parameters

| Parameter | What It Does | Low Value | High Value |
| :--- | :--- | :--- | :--- |
| **Temperature** | Controls randomness | Deterministic, focused | Creative, diverse |
| **Top-p** | Nucleus sampling cutoff | Conservative (0.1) | Broad (0.95) |
| **Top-k** | Limits candidate tokens | Focused (5) | Diverse (100) |
| **Max Tokens** | Output length limit | Short answers | Long-form generation |
| **Stop Sequences** | When to stop generating | — | `\n`, `###`, custom |

### Capabilities & Limitations

```mermaid
flowchart LR
    subgraph CAN["✅ Capabilities"]
        direction TB
        C1["Language understanding"]
        C2["Reasoning (with prompting)"]
        C3["Code generation"]
        C4["Multilingual support"]
        C5["Instruction following"]
    end

    subgraph CANT["❌ Limitations"]
        direction TB
        L1["Hallucinations"]
        L2["Unreliable math/logic"]
        L3["No real-time information"]
        L4["Uneven language quality"]
        L5["Prompt sensitivity"]
    end

    style CAN fill:#c8e6c9,stroke:#388e3c
    style CANT fill:#ffcdd2,stroke:#c62828
```

### Types of Models — Evolution Pipeline

```mermaid
flowchart LR
    Base["📦 Base Model<br/>(pre-trained)"] --> SFT["📋 Instruction-Tuned<br/>(SFT)"]
    SFT --> Chat["💬 Chat Model<br/>(multi-turn)"]
    Chat --> Aligned["🛡️ RLHF-Aligned<br/>(safe + helpful)"]

    Base -.-> |"Can complete text"| UseBase["Embeddings, completion"]
    SFT -.-> |"Follows instructions"| UseSFT["Single-turn tasks"]
    Chat -.-> |"Conversational"| UseChat["Chatbots, assistants"]
    Aligned -.-> |"Safe & helpful"| UseAligned["Production apps"]

    style Base fill:#e0e0e0,stroke:#757575
    style Aligned fill:#c8e6c9,stroke:#388e3c
```

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

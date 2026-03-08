# LLM Fine-Tuning Project

> Fine-tune Llama 3 with QLoRA on AWS SageMaker

## 🎯 Project Overview

A complete fine-tuning pipeline demonstrating:
- **QLoRA** for memory-efficient fine-tuning
- **AWS SageMaker** for managed training
- **MLflow** for experiment tracking
- **Hugging Face** Transformers & PEFT

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Dataset     │────▶│  SageMaker   │────▶│   Model      │
│  (S3)        │     │  Training    │     │   Registry   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   MLflow     │
                     │   Tracking   │
                     └──────────────┘
```

## 📁 Project Structure

```
llm-finetuning-project/
├── scripts/
│   ├── prepare_data.py      # Dataset preparation
│   ├── train_local.py       # Local training script
│   ├── train_sagemaker.py   # SageMaker launcher
│   └── evaluate.py          # Model evaluation
├── notebooks/
│   └── fine_tuning.ipynb    # Interactive notebook
├── data/
│   └── sample_dataset.json  # Sample training data
├── requirements.txt
└── README.md
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
cd projects/llm-finetuning-project

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Prepare Dataset

```bash
# Create instruction dataset
python scripts/prepare_data.py --output data/train.json
```

### 3. Local Training (for testing)

```bash
# Fine-tune locally with QLoRA
python scripts/train_local.py \
    --model_name "meta-llama/Llama-3.2-3B" \
    --dataset_path data/train.json \
    --output_dir ./output \
    --lora_r 16 \
    --epochs 3
```

### 4. SageMaker Training

```bash
# Launch training on SageMaker
python scripts/train_sagemaker.py \
    --model_name "meta-llama/Llama-3.2-3B" \
    --s3_data s3://your-bucket/train.json \
    --instance_type ml.g5.2xlarge
```

## 📊 Training Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `model_name` | Base model to fine-tune | `meta-llama/Llama-3.2-3B` |
| `lora_r` | LoRA rank | 16 |
| `lora_alpha` | LoRA scaling | 32 |
| `epochs` | Training epochs | 3 |
| `batch_size` | Per-device batch size | 4 |
| `learning_rate` | Learning rate | 2e-4 |
| `max_length` | Max sequence length | 512 |

## 🧪 Dataset Format

```json
[
    {
        "instruction": "Summarize the following text",
        "input": "The quick brown fox...",
        "output": "A fox jumped over a dog."
    },
    {
        "instruction": "Translate to French",
        "input": "Hello, how are you?",
        "output": "Bonjour, comment allez-vous?"
    }
]
```

## 💡 Key Learnings

1. **QLoRA**: 4-bit quantization + LoRA adapters
2. **Memory Efficiency**: Fine-tune 7B model on single GPU
3. **SageMaker Integration**: Managed training infrastructure
4. **MLflow**: Track experiments, compare runs

## 📚 Resources

- [Fine-Tuning Guide](../../genai/fine-tuning-guide.md)
- [AWS GenAI & MLOps Guide](../../genai/aws-genai-mlops.md)
- [LoRA Paper](https://arxiv.org/abs/2106.09685)
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)

---

*Part of the [GenAI Learning Curriculum](../../genai/RAG-FineTuning-LLM-Mastery.md)*

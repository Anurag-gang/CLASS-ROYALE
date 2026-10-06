# Class Royale AI ("CR") — Fine-Tuning & Model Training Pipeline

This document defines the architectural specification, dataset curation strategy, training recipe, and serving pipeline for training custom educational foundation models tailored for **Class Royale ("CR")**.

---

## 1. Architectural Strategy: Why & When to Fine-Tune

Currently, CR runs on top of high-capability frontier and mid-sized models accessed via **OpenRouter** (e.g. `anthropic/claude-3.5-haiku` and `google/gemini-2.5-flash`), with structured schema enforcement (Zod) and Course-Scoped RAG.

### Comparison Matrix

| Dimension | Prompt Injection / RAG (Current) | Fine-Tuned Model (CR-Foundation) |
| :--- | :--- | :--- |
| **Setup Cost** | Zero training, immediate deployment | Training compute (GPUs), dataset curation |
| **Pedagogical Instinct** | Constrained by system prompts | Intrinsic Socratic reflex without long prompts |
| **Output Consistency** | Dependent on prompt adherence | Deterministic adherence to JSON and 8-bit tone |
| **Inference Cost** | Standard provider API pricing | Significantly lower marginal token cost at scale |
| **Data Privacy** | Encrypted transit to provider | Can run completely on-premise / private cloud |

---

## 2. Telemetry Ingestion & Data Curation

### 2.1 Sources of Telemetry
Class Royale continuously records pedagogical interactions across:
1. `CRConversation` & `CRMessage`: Student inquiries and assistant responses.
2. `CRQuizQuestion` & `CRQuiz`: Generated questions, student attempts, and identified misconceptions.
3. `TopicMastery`: Student accuracy delta before vs. after CR tutoring sessions.

### 2.2 Anonymization & Sanitization Pipeline
Before adding any session to the training set:
- **PII Scrubbing**: Student names, emails, student IDs, and institution names are replaced with generalized synthetic handles (`Student`, `Challenger`).
- **Pedagogical Filtering**: Exclude conversations where the student's next quiz attempt on the same topic showed a score drop. Include sessions where post-tutoring accuracy increased by $\ge 15\%$.
- **Format Validation**: Ensure every conversation contains valid code blocks, verified solutions, and adheres to Socratic questioning.

---

## 3. Dataset Format & Schema

We adopt the standard **ShareGPT / OpenAI Chat JSONL format**:

```jsonl
{
  "messages": [
    {
      "role": "system",
      "content": "You are CR, the official educational AI companion for Class Royale. You teach using Socratic inquiry, analogies, and 8-bit arcade themes."
    },
    {
      "role": "user",
      "content": "Why is quicksort faster than mergesort in practice even though both have O(n log n) average time?"
    },
    {
      "role": "assistant",
      "content": "⚔️ **CR CONCEPT BREAKDOWN: QUICKSORT CACHE LOCALITY**\n\nWhile both partition the realm in O(n log n) time on average, Quicksort holds two critical tactical advantages:\n\n1. **In-Place Sorting (Auxiliary Space O(log n))**: Unlike standard Merge Sort which demands auxiliary memory O(n) for merging arrays, Quicksort swaps elements in-place.\n2. **Hardware Cache Locality**: Quicksort's partitioning scans sequential memory addresses, keeping CPU L1/L2 caches hot with minimal cache misses.\n\nQuick diagnostic question: What input arrangement causes naive Quicksort to collapse into O(n²) worst-case battle performance?"
    }
  ]
}
```

---

## 4. Supervised Fine-Tuning (SFT) Recipe

### 4.1 Base Model Recommendations
- **Primary**: `meta-llama/Llama-3.1-8B-Instruct`
- **Alternative / Ultra-Fast**: `Qwen/Qwen2.5-7B-Instruct`
- **Coding Focused**: `Qwen/Qwen2.5-Coder-7B-Instruct`

### 4.2 LoRA / QLoRA Hyperparameters
Using [Unsloth](https://github.com/unslothai/unsloth) or [Llama-Factory](https://github.com/hiyouga/LLaMA-Factory):

```python
# Training Configuration: CR-Llama-3.1-8B-Instruct-v1
training_args = {
    "per_device_train_batch_size": 4,
    "gradient_accumulation_steps": 4,
    "warmup_ratio": 0.05,
    "num_train_epochs": 3,
    "learning_rate": 2e-4,
    "fp16": False,
    "bf16": True,
    "logging_steps": 10,
    "optim": "adamw_8bit",
    "weight_decay": 0.01,
    "lr_scheduler_type": "cosine",
    "seed": 42,
}

lora_config = {
    "r": 16,
    "lora_alpha": 32,
    "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    "lora_dropout": 0.05,
    "bias": "none",
}
```

---

## 5. Direct Preference Optimization (DPO)

To refine CR's pedagogical persona and prevent spoon-feeding answers:

- **Chosen Response ($y_w$)**: Guides the student to the answer with hints and analogies, asks checking questions, formats equations cleanly.
- **Rejected Response ($y_l$)**: Dumps the direct homework answer immediately without explanation, displays dry robotic tone, or produces hallucinations.

$$\mathcal{L}_{\text{DPO}}(\theta; \pi_{\text{ref}}) = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma \left( \beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\text{ref}}(y_w \mid x)} - \beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\text{ref}}(y_l \mid x)} \right) \right]$$

---

## 6. Evaluation Benchmark & Rubric

Every trained checkpoint must pass automated and human evaluation before deployment:

| Metric | Target | Verification Method |
| :--- | :--- | :--- |
| **Socratic Adherence** | $\ge 92\%$ | Prompt-based LLM-as-judge scoring whether answer guides vs dumps |
| **CS Concept Accuracy** | $\ge 90\%$ | Benchmark against 500 validated university CS exams |
| **JSON Schema Compliance** | $100\%$ | Zod validation on 1,000 synthesized quiz generation calls |
| **8-Bit Arcade Tone** | $\ge 85\%$ | Terminology auditor (Quest, Battle, Mastery, Invariant) |

---

## 7. Model Serving & Integration

Once trained and exported to GGUF or AWQ format:

### Option A: OpenRouter Custom Endpoint
Upload weights to Hugging Face or RunPod, expose OpenAI-compatible endpoint, and configure in `.env.local`:
```bash
OPENROUTER_MODEL="classroyale/cr-pedagogy-8b:v1"
```

### Option B: Local vLLM Inference
Deploy using vLLM:
```bash
vllm serve classroyale/cr-pedagogy-8b --port 8000 --dtype bfloat16
```
And switch the provider in `src/lib/ai/provider.ts`:
```typescript
// .env.local
AI_PROVIDER="local"
LOCAL_AI_ENDPOINT="http://localhost:8000/v1"
```
Because Class Royale's AI architecture is strictly model-agnostic, changing the model requires **zero code rewrites**.

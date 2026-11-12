# Class Royale — Colibri Local Inference Setup & Operations Guide

## Overview

Colibri is an ultra-fast, dependency-free local inference runtime designed for MoE (Mixture of Experts) and dense LLMs with hardware-specific CUDA backends.

In Class Royale, Colibri hosts `qwen3-coder-30b` (19.4 GB int4-gs64) to power both **Socrates** and **CR Intelligence**.

---

## Hardware Requirements

- **Operating System**: Windows 11 x64 / Linux x86_64
- **GPU**: NVIDIA RTX 3050 Ti Laptop GPU (Compute 8.6) or higher, with at least 4 GB VRAM
- **System RAM**: 16 GB DDR4/DDR5 min (model dense layers map dynamically into system memory)
- **Disk Storage**: 30 GB free NVMe SSD storage

---

## Installation & Setup

1. **Verify Colibri Repository**:
   The engine code resides in the vendored `colibri/` directory:
   ```bash
   cd colibri
   ```

2. **One-Command Setup**:
   Download and prepare the prebuilt CUDA engine and model weights:
   ```bash
   python c/coli setup --yes --model qwen3-coder-30b --no-start
   ```
   - Model Path: `C:\Users\<user>\colibri-models\qwen3-coder-30b`
   - Engine Binary: `C:\Users\<user>\AppData\Local\colibri\runtime\colibri-v2.1.0\qwen36.exe`

3. **Start the Colibri OpenAI-Compatible Server**:
   Start Colibri on port `8080` (reserving port `8000` for the ML microservice):
   ```bash
   python c/coli start --port 8080 --no-browser --background
   ```

4. **Verify Liveness**:
   ```bash
   # Liveness check
   curl http://127.0.0.1:8080/health

   # Models list
   curl http://127.0.0.1:8080/v1/models
   ```

---

## Environment Configuration

Configure `.env` in the root of `fervent-kepler`:

```env
AI_PROVIDER="colibri"
COLIBRI_BASE_URL="http://127.0.0.1:8080/v1"
COLIBRI_MODEL="qwen3-coder-30b"
AI_REQUEST_TIMEOUT_MS="60000"
AI_MAX_RETRIES="2"
AI_ENABLE_STREAMING="true"
AI_CIRCUIT_BREAKER_FAILURES="3"
AI_CIRCUIT_BREAKER_RESET_MS="30000"

# Supervised ML Microservice (Runs independently on port 8000)
ML_SERVICE_URL="http://127.0.0.1:8000"
```

---

## Troubleshooting

### 1. Colibri Returns 503 ("engine_down" or "restarting")
- **Cause**: Engine process is still loading the 19.4 GB model weights into memory.
- **Resolution**: Next.js automatically engages `SocraticFallbackProvider`. Check engine status:
  ```bash
  python c/coli status
  ```

### 2. Port Collision with ML Microservice
- **Cause**: Both services attempted to bind `8000`.
- **Resolution**: Colibri is configured on `8080` in `.env` (`COLIBRI_BASE_URL="http://127.0.0.1:8080/v1"`). The ML Microservice runs on `8000`.

### 3. VRAM Constraint
- **Cause**: RTX 3050 Ti has 4.3 GB VRAM; large context windows may spill to system RAM.
- **Resolution**: Keep `AI_MAX_OUTPUT_TOKENS=2048` and `maxTokens: 1024` for quick interactive generation.

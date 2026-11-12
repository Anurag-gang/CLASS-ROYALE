# Class Royale — AI System Architecture

## Overview

Class Royale operates a multi-tiered, localized AI architecture designed for educational rigor, data privacy, and sub-second latency. The system unifies three autonomous components:

1. **Shared Local Inference Engine (Colibri)**: Local OpenAI-compatible LLM gateway running `qwen3-coder-30b` on hardware-accelerated CUDA backend (`http://127.0.0.1:8080/v1`).
2. **Two Independent AI Products**:
   - **Socrates**: Classical academic teacher and Socratic mentor providing dialectic inquiry grounded on the canonical question bank database.
   - **CR Intelligence**: Academic analyst and learning strategist providing mastery diagnostics, study scheduling, and exam preparation.
3. **Supervised ML Microservice**: Independent Bayesian Knowledge Tracing (BKT) and Deep Knowledge Tracing (DKT) numerical prediction microservice (`http://127.0.0.1:8000`).

---

## Architectural Topology

```
                  ┌─────────────────────────────────────────┐
                  │          Browser / Student UI           │
                  └──────┬───────────────────────────┬──────┘
                         │                           │
              (Socrates Chat / Quest)        (CR Intelligence Agent)
                         │                           │
                         ▼                           ▼
            ┌───────────────────────────┐ ┌───────────────────────────┐
            │   /api/ai-tutor/chat      │ │   /api/cr/chat & stream   │
            │   (Pedagogical Teacher)   │ │   (Academic Strategist)   │
            └────────────┬──────────────┘ └───────────┬───────────────┘
                         │                           │
                         ▼                           ▼
            ┌─────────────────────────────────────────────────────────┐
            │       Prisma SQLite Database (Canonical Grounding)       │
            │    BankQuestion, Subjects, User, TopicMastery, Quizzes   │
            └────────────────────────────┬────────────────────────────┘
                                         │
                                         ▼
            ┌─────────────────────────────────────────────────────────┐
            │         AIProviderFactory (Dynamic Resolution)          │
            └────────────┬───────────────────────────┬────────────────┘
                         │ (If Healthy)              │ (If Offline / Loading)
                         ▼                           ▼
          ┌────────────────────────────┐ ┌───────────────────────────┐
          │      ColibriProvider       │ │ SocraticFallbackProvider  │
          │ (http://127.0.0.1:8080/v1) │ │ (In-Process Pedagogy)     │
          │   Model: qwen3-coder-30b   │ │ 100% Offline Resilience   │
          └──────────────┬─────────────┘ └───────────────────────────┘
                         │
                         ▼
          ┌────────────────────────────┐
          │  Colibri Inference Daemon  │
          │  (qwen36.exe + CUDA MoE)   │
          └────────────────────────────┘

    [Strictly Independent Numerical Service]
    ┌─────────────────────────────────────────────────────────────────┐
    │  FastAPI ML Microservice (http://127.0.0.1:8000)                │
    │  - BKT (Bayesian Knowledge Tracing)                             │
    │  - Elo & Latent Skill Estimation                                │
    │  - Difficulty & Next Best Action Determination                  │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Strict Separation of Concerns

| Attribute | Socrates AI Tutor | CR Intelligence Agent | ML Microservice |
| :--- | :--- | :--- | :--- |
| **Role** | Academic Teacher / Dialectic Guide | Academic Analyst / Learning Strategist | Numerical Statistician |
| **Grounding** | Canonical `BankQuestion` & Misconceptions | Mastery Vectors & Curricula | Historical Quiz Attempts |
| **Output Style** | Probing questions, first principles, hints | Study schedules, flashcards, roadmaps | Floats, probabilities, actions |
| **Direct Answers** | Strictly avoided; guides student discovery | Synthesizes high-level summaries | N/A (numerical output) |
| **Inference Source**| Shared Colibri (`qwen3-coder-30b`) | Shared Colibri (`qwen3-coder-30b`) | Python Scikit-Learn / SciPy |
| **Endpoint** | `/api/ai-tutor/chat` | `/api/cr/chat` & `/stream` | `http://127.0.0.1:8000/predict` |

---

## Failover & Circuit Breaker Architecture

1. **Auto-Discovery**: `AIProviderFactory` verifies Colibri health via `/health` with a 4,000ms probe.
2. **Graceful Failover**: If Colibri is offline, restarting, or downloading model weights, requests automatically route to `SocraticFallbackProvider`.
3. **Circuit Breaker**: Tracks consecutive failures. If failures exceed threshold (`AI_CIRCUIT_BREAKER_FAILURES=3`), the circuit opens for 30s to prevent request stalls.
4. **Zero Browser Exposure**: The Colibri engine runs entirely on local loopback (`127.0.0.1`). The frontend communicates strictly via Next.js backend routes.

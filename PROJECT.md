# 👑 Class Royale (CR) — Master Architecture, ML Pipelines & Colibri Inference Specification

**Platform Code:** `FERVENT-KEPLER`  
**Platform Version:** `v2.2.0-PROD-CERTIFIED`  
**System Classification:** Full-Stack Gamified Academic Learning Platform, Dual-Core AI Architecture & Supervised ML Microservice  
**Primary Engine:** Next.js 16.3.4 (Turbopack, React 19) + Colibri Local Inference Daemon (`qwen3-coder-30b-a3b-colibri`) + FastAPI ML Microservice  
**Database Relational Core:** Prisma ORM / SQLite (`prisma/dev.db`) & Production-Ready PostgreSQL Schemas  

---

## 1. Executive Summary & Vision

**Class Royale** is an enterprise-grade, gamified computer science educational platform engineered for higher-education engineering students. Traditional technical learning tools suffer from two crippling paradigms:
1. **Passive memorization & answer dumping:** Conventional chatbots spoon-feed code snippets and multiple-choice answers, depriving students of dialectic inquiry and analytical reasoning.
2. **Disconnected gamification:** Flashcards and superficial badge mechanics are decoupled from true algorithmic competence and cognitive retention.

Class Royale bridges this gap by marrying retro-modern arcade game mechanics (experience points, clan battles, tier progression, level unlock trees) with an **asynchronous, dual-core artificial intelligence architecture**:
- **Socrates AI Workspace (`/socrates`):** A full-screen, blue-black glassmorphism workspace acting as an uncompromising academic mentor. It uses the classical Socratic method (*elenchus*) to guide students through first principles, mathematical proofs, runtime invariant analysis, and algorithmic deconstruction without spoon-feeding answers.
- **CR Intelligence (`/cr`):** An academic strategist and learning companion that tracks student retention curves, diagnoses weak topics, designs custom study blocks, and generates high-yield revision flashcards.
- **Supervised ML Microservice (`ml-service`):** A high-throughput Python engine executing Bayesian Knowledge Tracing (BKT), item difficulty calibration, weak-topic decay classification, and adaptive Zone of Proximal Development (ZPD) curriculum steering.
- **Colibri Local Inference Daemon:** A zero-dependency, local CUDA inference runtime hosting `qwen3-coder-30b`, eliminating cloud token costs, external latency, and student privacy leakage.

---

## 2. High-Level System Architecture & Topology

Class Royale enforces a strict separation of concerns between client interactive delivery, backend orchestration, relational persistence, local LLM inference, and statistical machine learning.

```
                              ┌────────────────────────────────────────────────────────┐
                              │            Client Layer (Next.js 16 / React 19)        │
                              │  - Full-Screen Socrates Workspace (/socrates)          │
                              │  - CR Intelligence Academic Strategist (/cr)           │
                              │  - Gamified Quiz Arena & Clan Dashboard (/arena)       │
                              │  - Streaming Markdown + KaTeX + Syntax Highlighting    │
                              │  - Floating Multiline Glass Composer & Abort Control   │
                              └───────────────────────────┬────────────────────────────┘
                                                          │ HTTPS / SSE Stream (req.signal)
                                                          ▼
                              ┌────────────────────────────────────────────────────────┐
                              │             Next.js 16 App Router (BFF Layer)          │
                              │  - /api/socrates/chat (Streaming SSE, Abort, Timeout)  │
                              │  - /api/socrates/conversations (CRUD Session Mgmt)     │
                              │  - /api/cr/chat & /api/cr/chat/stream (Strategist)     │
                              │  - /api/quizzes/submit (Scoring, Invariant Audit)      │
                              │  - Self-Healing Prisma Singleton (Stale Cache Buster)  │
                              └─────────────┬───────────────────────────┬──────────────┘
                                            │                           │
                   Prisma Client (dev.db)   │                           │ HTTP Fetch / SSE
                                            ▼                           ▼
                 ┌────────────────────────────────────┐   ┌────────────────────────────┐
                 │       SQLite Database (dev.db)     │   │ Colibri Local LLM Gateway  │
                 │ - User & Profile (19 Students)     │   │ (http://127.0.0.1:8080/v1) │
                 │ - QuizAttempt & TopicMastery       │   │ - Model: qwen3-coder-30b   │
                 │ - BankQuestion (215 Questions)     │   │ - CUDA Hardware Execution  │
                 │ - SocratesConversation & Messages  │   │ - Streaming SSE Tokenizer  │
                 │ - CRConversation & Messages        │   │ - Client Abort Termination │
                 │ - Clan, ClanMember, XPTransaction  │   │ - Transparent 503 Offline  │
                 └─────────────────┬──────────────────┘   └────────────────────────────┘
                                   │
                                   │ Async Telemetry POST
                                   ▼
                 ┌─────────────────────────────────────────────────────────────────┐
                 │        FastAPI Supervised ML Microservice (Port 8000)           │
                 │  - Bayesian Knowledge Tracing (BKT) Topic Mastery Estimation    │
                 │  - 2PL Item Response Theory (IRT) Question Difficulty Model     │
                 │  - Weak Topic Decay Classifier (STRONG / NORMAL / WEAK)         │
                 │  - Zone of Proximal Development (ZPD) Question Recommender      │
                 │  - Deterministic Pedagogical State Machine                      │
                 └─────────────────────────────────────────────────────────────────┘
```

---

## 3. Dual-AI Ecosystem: Socrates AI Workspace vs. CR Intelligence

Class Royale maintains two architecturally isolated AI products powered by the shared local Colibri inference gateway:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SHARED LOCAL INFERENCE                                 │
│                     Colibri Runtime Gateway (http://127.0.0.1:8080/v1)                 │
│                                Model: qwen3-coder-30b                                  │
└───────────────────────────┬────────────────────────────────┬───────────────────────────┘
                            │                                │
                            ▼                                ▼
┌───────────────────────────────────────┐        ┌───────────────────────────────────────┐
│          SOCRATES AI WORKSPACE        │        │             CR INTELLIGENCE           │
│                (/socrates)            │        │                  (/cr)                │
├───────────────────────────────────────┤        ├───────────────────────────────────────┤
│ • Role: Academic Mentor & Dialectic   │        │ • Role: Academic Learning Strategist  │
│   Teacher (Elenchus method).          │        │   & Performance Analyst.              │
│ • Focus: Single-concept deconstruction│        │ • Focus: Longitudinal mastery trends, │
│   runtime proofs, invariant checks.   │        │   revision schedules, flashcards.     │
│ • 4-Tier Adaptive Prompt Engine:      │        │ • Telemetry-Driven Modes:             │
│   - Type A: Direct Explanations       │        │   - PERFORMANCE (Mastery vectors)     │
│   - Type B: Conceptual Analogies      │        │   - EXAM_PREP (High-yield reviews)    │
│   - Type C: Implementation & Syntax   │        │   - STUDY_PLAN (Daily milestones)     │
│   - Type D: Root-Cause Debugging      │        │   - REVISION (Active recall decks)    │
│ • Grounding: Non-gating 215-question  │        │ • Grounding: Student mastery vectors, │
│   curriculum search (never blocks).   │        │   historical quiz stats, ML signals.  │
│ • DB Models: SocratesConversation,    │        │ • DB Models: CRConversation,         │
│   SocratesMessage.                    │        │   CRMessage.                          │
│ • Context Window: Bounded ~3,000      │        │ • Context Window: Rolling turns       │
│   tokens sliding window (10-12 turns).│        │   with integrated ML telemetry summaries.│
└───────────────────────────────────────┘        └───────────────────────────────────────┘
```

### Strict Isolation Invariants
1. **Zero State Bleed:** Conversations, prompts, and session tables are 100% segregated in Prisma (`SocratesConversation` vs `CRConversation`).
2. **Distinct API Endpoints:** Socrates routes operate under `/api/socrates/*`; CR Intelligence operates under `/api/cr/*`.
3. **Different System Prompts:** Socrates uses `SOCRATES_CORE_PROMPT` tailored for academic elenchus; CR Intelligence uses `CR_CORE_SYSTEM_PROMPT` tailored for strategic diagnostics.
4. **No Telemetry Coupling:** Socrates remains an unencumbered dialetic thinker; CR Intelligence receives numerical vectors from the ML microservice.

---

## 4. Colibri Local Inference Engine Integration

### 4.1. Motivation & Migration from Cloud APIs
Class Royale was migrated from Mistral cloud inference to local Colibri inference for four critical reasons:
- **Sub-Second First Token Latency:** Local loopback HTTP streaming eliminates 1.5s - 2.5s cloud roundtrips, delivering the first token in $< 50\text{ ms}$.
- **Zero Cloud Costs:** Academic platforms processing thousands of multi-turn student messages incur massive monthly token bills; Colibri operates on local hardware with zero marginal cost.
- **Complete Student Data Privacy:** Student queries, code submissions, and performance histories never leave the campus/host perimeter.
- **Offline Reliability:** Classrooms and labs can operate without active internet uplinks.

### 4.2. Engine Specifications & Hardware Tiering
- **Engine Binary:** Colibri v2.1.0 (`coli` runtime) with hardware-optimized CUDA execution backends (`qwen36.exe`).
- **Target Model:** `qwen3-coder-30b` (30-billion parameter code-specialized model quantized to int4-gs64, total disk footprint 19.4 GB).
- **GPU Architecture:** NVIDIA RTX 3050 Ti Laptop GPU (Compute 8.6, 4 GB VRAM) with automatic tiering (`--auto-tier` and `--gpu auto`). Dense model weights map dynamically across available VRAM and host DDR4/DDR5 system memory.
- **Gateway Endpoint:** `http://127.0.0.1:8080/v1` exposing standard OpenAI-compatible `/chat/completions`, `/models`, and `/health`.

### 4.3. Connection Lifecycle, Streaming & Abort Handling
```
Client (Browser)             Next.js 16 (/api/socrates/chat)              Colibri Daemon (:8080)
      │                                     │                                     │
      ├── POST /api/socrates/chat ─────────>│                                     │
      │   (stream: true, message: "...")    ├── Resolve active model (/health) ──>│
      │                                     │<── Model status (qwen3-coder-30b) ──┤
      │                                     │                                     │
      │                                     ├── POST /v1/chat/completions ───────>│
      │                                     │   (stream: true, messages: [...])   │
      │<── SSE: event: stage (grounding) ───┤                                     │
      │<── SSE: event: stage (inference) ───┤<── HTTP 200 Streaming Chunks ──────┤
      │<── SSE: event: token ("Binary") ────┤<── Chunk: "Binary" ─────────────────┤
      │<── SSE: event: token (" search...")─┤<── Chunk: " search..." ─────────────┤
      │                                     │                                     │
      │── User Clicks "Stop" (AbortSignal)─>│                                     │
      │                                     ├── Destroy upstream fetch socket ───>│ (Immediate teardown)
      │                                     ├── Commit partial tokens to DB       │
      │<── Connection Closed ───────────────┤                                     │
```

- **Client Abort Forwarding:** When a student cancels generation, the browser's `AbortController` triggers `req.signal.abort()`. Next.js aborts the upstream Colibri fetch request immediately, terminating GPU matrix multiplication and preserving host resources.
- **Transparent 503 Handling:** If the Colibri daemon is stopped or loading model weights, `/api/socrates/chat` returns a structured HTTP 503 `{ code: "COLIBRI_OFFLINE" }`, surfacing a clear retry button in the UI rather than falling back to low-quality mock heuristic bots.

---

## 5. Supervised & Predictive Machine Learning Microservice

The standalone FastAPI microservice (`ml-service` running on `http://127.0.0.1:8000`) provides numerical student modeling. It enforces strict **zero target leakage** and student-level `GroupShuffleSplit` validation.

### 5.1. Pipeline 1: Bayesian Knowledge Tracing (BKT) & Forgetting Dynamics
Bayesian Knowledge Tracing models student topic mastery as a Hidden Markov Model with binary latent states: $L_t \in \{0, 1\}$ (Unmastered, Mastered).

```
         ┌────────────────┐                       ┌────────────────┐
         │ Unmastered (0) ├────── Transition (T) ─>│  Mastered (1)  │
         └───────┬────────┘                       └───────┬────────┘
                 │                                        │
           Guess │ (G)                              Slip  │ (S)
                 ▼                                        ▼
         ┌────────────────┐                       ┌────────────────┐
         │ Correct Answer │                       │ Wrong Answer   │
         └────────────────┘                       └────────────────┘
```

#### Update Equations:
1. **Observation Update (Posterior Probability given observed outcome $O_t$):**
   $$\text{If } O_t = 1 \text{ (Correct): } \quad P(L_{t-1} \mid O_t=1) = \frac{P(L_{t-1}) \cdot (1 - S)}{P(L_{t-1}) \cdot (1 - S) + (1 - P(L_{t-1})) \cdot G}$$
   $$\text{If } O_t = 0 \text{ (Incorrect): } \quad P(L_{t-1} \mid O_t=0) = \frac{P(L_{t-1}) \cdot S}{P(L_{t-1}) \cdot S + (1 - P(L_{t-1})) \cdot (1 - G)}$$

2. **Transition Update (Accounting for learning during the trial):**
   $$P(L_t) = P(L_{t-1} \mid O_t) + (1 - P(L_{t-1} \mid O_t)) \cdot T$$

3. **Ebbinghaus Memory Decay (Between Study Sessions):**
   $$M(t) = P(L_t) \cdot e^{-\lambda \cdot \Delta t}$$
   Where $\lambda = \frac{\ln(2)}{t_{\text{half}}}$ represents the forgetting velocity, and $\Delta t$ is elapsed days since last practice.

### 5.2. Pipeline 2: Item Response Theory (IRT) & Difficulty Calibration
Question difficulty is calibrated using the **2-Parameter Logistic (2PL)** Item Response Model:

$$P(\text{correct} \mid \theta, a_i, b_i) = \frac{1}{1 + e^{-a_i (\theta - b_i)}}$$

- $\theta \in [-3.0, +3.0]$: Latent student ability.
- $b_i \in [-3.0, +3.0]$: Item difficulty threshold.
- $a_i \in [0.5, 2.5]$: Item discrimination parameter.

The ML service estimates empirical item difficulty from historical attempts:
$$b_i = \ln\left(\frac{1 - \bar{p}_i}{\bar{p}_i}\right)$$
Where $\bar{p}_i$ is the smoothed success rate across historical student attempts.

### 5.3. Pipeline 3: Weak Topic Classification & Decay Monitoring
The Weak Topic Classifier aggregates rolling interaction features over a sliding window of the last 10 attempts:
- $F_1$: Rolling accuracy ($\text{mean}(O_{t-9:t})$)
- $F_2$: Consecutive error streak
- $F_3$: Normalized time spent per question
- $F_4$: Days elapsed since topic review

Topics are classified into discrete pedagogical tiers:
- **STRONG ($M(t) \ge 0.75$):** Student possesses high confidence; eligible for challenge-tier boss questions.
- **NORMAL ($0.45 \le M(t) < 0.75$):** Steady progress; standard progression.
- **WEAK ($M(t) < 0.45$):** Cognitive breakdown detected; triggers targeted intervention.

### 5.4. Pipeline 4: Zone of Proximal Development (ZPD) Recommendation Engine
To keep students in optimal flow without causing anxiety or boredom, the recommendation engine targets questions whose predicted success probability falls within Vygotsky's Zone of Proximal Development:

$$\text{Target Probability Window: } P(\text{correct}) \in [0.60, 0.80]$$

#### Candidate Ranking Score:
$$\text{Score}(q) = 1.0 - \left| P(\text{correct} \mid \theta, q) - 0.70 \right| + \gamma \cdot \text{SpacedRepetitionBonus}(q)$$

### 5.5. Deterministic Pedagogical State Machine
```
                       ┌─────────────────────────┐
                       │ Student Submits Answer  │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │ Consecutive Errors >= 3? │
                       └──────┬───────────┬──────┘
                          Yes │           │ No
                              ▼           ▼
                   ┌─────────────────┐ ┌──────────────────────┐
                   │ LOWER_DIFFICULTY│ │ Topic Mastery < 0.45?│
                   └─────────────────┘ └──────┬────────┬──────┘
                                          Yes │        │ No
                                              ▼        ▼
                                      ┌─────────────┐ ┌──────────────────────────┐
                                      │REVISE_TOPIC │ │Consecutive Correct >= 4? │
                                      └─────────────┘ └───────┬──────────┬───────┘
                                                          Yes │          │ No
                                                              ▼          ▼
                                                   ┌─────────────────┐ ┌─────────────────────┐
                                                   │INCREASE_DIFFICULTY│ANSWER_NEXT_QUESTION │
                                                   └─────────────────┘ └─────────────────────┘
```

---

## 6. Database Architecture & 100% Student Data Preservation

Class Royale operates an SQLite relational schema (`prisma/dev.db`) managed via Prisma ORM, engineered for zero-loss drop-in compatibility with PostgreSQL and Supabase in production.

### 6.1. Entity Relationship Overview
The database comprises **10 core tables** with strictly enforced foreign key integrity:

```
┌──────────────┐         ┌───────────────┐
│     User     ├────────<│  QuizAttempt  │
│  (19 records)│         │  (27 records) │
└──────┬───────┘         └───────────────┘
       │
       ├────────<┌───────────────┐
       │         │ TopicMastery  │
       │         │  (76 records) │
       │         └───────────────┘
       │
       ├────────<┌───────────────────┐        ┌───────────────────┐
       │         │  CRConversation   ├───────<│     CRMessage     │
       │         │   (26 records)    │        │   (82 records)    │
       │         └───────────────────┘        └───────────────────┘
       │
       ├────────<┌───────────────────┐        ┌───────────────────┐
       │         │SocratesConversation├──────<│  SocratesMessage  │
       │         │   (Auto-managed)  │        │   (Auto-managed)  │
       │         └───────────────────┘        └───────────────────┘
       │
       ├────────<┌───────────────┐
       │         │ XPTransaction │
       │         │  (19 records) │
       │         └───────────────┘
       │
       └────────<┌───────────────┐        ┌───────────────┐
                 │  ClanMember   │>───────┤     Clan      │
                 │  (3 records)  │        │  (2 records)  │
                 └───────────────┘        └───────────────┘
```

### 6.2. 100% Student Data Preservation Guarantee
A dedicated verification engine (`scripts/verify_data_preservation.ts`) executes regression testing against `prisma/dev.db`:
- **19 Users** (1 Admin, 3 Faculty, 15 Students) preserved with intact hashed credentials and profiles.
- **27 Historical Quiz Attempts** preserved with an aggregate sum of 53 points, 96 questions answered, and 2,426 XP awarded.
- **76 Topic Mastery Vectors** across 6 core academic disciplines.
- **Zero Orphan Records:** All foreign keys strictly validate (`Profile -> User`, `Attempt -> User`, `Mastery -> User`, `Message -> Conversation`).

---

## 7. Frontend UI/UX Architecture & Design System

### 7.1. Aesthetic Philosophy: High-End Blue-Black Glassmorphism
The interface discards generic dashboard cards in favor of a cinematic, deep-space workstation:
- **Base Canvas:** Deep obsidian `#02040a` accented by radial midnight glows (`rgba(30, 58, 138, 0.15)`).
- **Glass Surfaces:** Translucent panels (`rgba(6, 11, 24, 0.75)`) layered over 16px backdrop-blur with 1px border highlights (`rgba(59, 130, 246, 0.15)`).
- **Electric Accents:** Cyberpunk cyan (`#00f0ff`), electric blue (`#3b82f6`), and emerald status indicators.

### 7.2. Typography System
- **Body & Subtexts:** `Inter` (sans-serif) for high legibility, clean geometry, and zero visual clutter.
- **Monospace & Code:** `JetBrains Mono` with full ligatures for algorithmic code blocks, assembly instructions, and complexity notation.

### 7.3. Streaming-Resilient Markdown & Math Parser
The custom markdown engine (`src/components/socrates/StreamingMarkdown.tsx`) is purpose-built for real-time LLM token streams:
- **Auto-Closing Code Fences:** Dynamically detects unbalanced triple-backtick fences in partial token streams and synthesizes closing tags, preventing layout collapse while streaming.
- **KaTeX / LaTeX Math Integration:** Renders inline math (`$O(n \log n)$`) and block display equations (`$$\sum_{i=1}^n i = \frac{n(n+1)}{2}$$`).
- **One-Click Code Copy:** Hover-activated copy button with copy feedback animation.
- **Table & AST Parsing:** Formats markdown tables, bullet hierarchies, and callout blocks without raw text flickering.

---

## 8. Verification, Benchmarking & Testing Matrix

The system undergoes rigorous automated verification across all layers:

| Layer | Test Target | Command | Verification Invariant | Status |
|---|---|---|---|---|
| **Socrates Suite** | 15 Core Scenarios | `npx tsx scripts/verify_socrates_suite.ts` | Complete coverage across DSA, OS, Networks, C++, Math, 503 error handling, stream abort, and multi-turn persistence | 🟢 **15/15 PASS (100%)** |
| **Data Preservation** | 10 Database Tables | `npm run test:preservation` | Exact record counts, aggregate sums, zero orphan foreign keys | 🟢 **100% PASS** |
| **ML Microservice** | Unit & Integration | `cd ml-service && pytest` | Leakage tests, BKT convergence, IRT calibration, API contracts | 🟢 **51/51 PASS (100%)** |
| **Next.js Type Check** | Full Frontend | `npx tsc --noEmit` | Strict TypeScript types, zero `any` regressions | 🟢 **0 Errors** |
| **Local Inference** | Colibri Health Probe | `GET http://127.0.0.1:8080/health` | Active model `qwen3-coder-30b-a3b-colibri`, HTTP 200 | 🟢 **ONLINE** |

---

## 9. Operations, Deployment & Runbook

### 9.1. Local Development Orchestration
Class Royale coordinates three concurrent local processes:

```powershell
# 1. Start the Colibri Inference Daemon (Port 8080)
C:\Python313\python.exe C:\Users\amita\AppData\Local\colibri\runtime\colibri-v2.1.0\coli web `
  --model C:\Users\amita\colibri-models\qwen3-coder-30b `
  --host 127.0.0.1 --port 8080 --gpu auto --auto-tier --no-browser

# 2. Start the FastAPI ML Microservice (Port 8000)
cd ml-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# 3. Start the Next.js Turbopack Dev Server (Port 3000)
npm run dev
```

### 9.2. Environment Configuration Reference (`.env.local`)
```env
# Relational Database
DATABASE_URL="file:./dev.db"

# Local Colibri LLM Inference Gateway
AI_PROVIDER="colibri"
COLIBRI_BASE_URL="http://127.0.0.1:8080/v1"
COLIBRI_MODEL="qwen3-coder-30b"
AI_REQUEST_TIMEOUT_MS="60000"
AI_MAX_RETRIES="2"
AI_ENABLE_STREAMING="true"
AI_CIRCUIT_BREAKER_FAILURES="3"
AI_CIRCUIT_BREAKER_RESET_MS="30000"

# Supervised ML Microservice
ML_SERVICE_URL="http://127.0.0.1:8000"

# Authentication & Rate Limits
JWT_SECRET="cr-dev-secret-key-32-chars-long"
AI_DAILY_REQUEST_LIMIT="100"
```

### 9.3. Production Containerization
- **Web BFF:** Dockerized Next.js standalone server with multi-stage Alpine build (`Dockerfile`).
- **ML Service:** Python 3.11 slim container exposing FastAPI through Uvicorn with Gunicorn process management (`docker-compose.ml.yml`).
- **Kubernetes:** Production deployment manifests under `k8s/` providing horizontal pod autoscaling and ingress controllers.

---

*Class Royale Engineering Team — Architecture Document Certified Ready for Production.*

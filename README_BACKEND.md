# Class Royale — Backend Architecture & API Documentation

> **Next.js App Router Backend, Socratic AI Engine, Prisma ORM, and ML Service Bridge**

---

## 1. Overview & Architecture

The Class Royale backend acts as the core orchestration layer connecting:
1. **The Web Client:** Serving authenticated user sessions, SSE streams, quiz states, and leaderboard rankings.
2. **The Database Layer:** Relational persistence powered by **Prisma ORM** and SQLite (`dev.db`).
3. **The AI Orchestration Engine (`CROrchestrator`):** Pedagogical intent detection, prompt enrichment, multi-turn history tracking, and automated suggestion synthesis.
4. **The Socratic Pedagogy Engine (`socratic-engine.ts`):** In-process domain knowledge engine delivering algorithmic invariant breakdowns and Socratic question checks.
5. **The Machine Learning Microservice:** Low-latency bridge (`MLServiceClient`) querying student mastery predictions and adaptive learning actions from Python FastAPI.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                          │
│          (/api/cr/chat/stream  or  /api/cr/chat)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    CR ORCHESTRATOR                          │
│  - Intent Detection (TUTOR / QUIZ / EXAM_PREP / REVISION)   │
│  - History extraction (recent 8-10 turns)                   │
│  - Academic Context Retrieval (Prisma: mastery & history)   │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                ▼                             ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│     ML SERVICE CLIENT       │ │      AI PROVIDER LAYER      │
│  POST /adaptive/next-action │ │  - Primary: OpenRouter LLM │
│  Returns:                   │ │    (4.5s timeout protect)   │
│  - Mastery % (e.g. 48%)     │ │  - Autonomous Fallback:     │
│  - Action (LOWER_DIFFICULTY)│ │    Socratic Pedagogy Engine │
│  - Feature Contributions    │ │    (First-principles & code)│
└───────────────┬─────────────┘ └─────────────┬───────────────┘
                │                             │
                └──────────────┬──────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PERSISTENCE & SSE                        │
│  - Database: Prisma CRMessage & CRConversation update       │
│  - Event Stream: tokens, ML telemetry, suggestions, done    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

- **Framework:** Next.js 16.3.4 (App Router Route Handlers `export async function POST / GET`)
- **Runtime:** Node.js v24 LTS
- **Database & ORM:** Prisma 6.4.1 with SQLite (`prisma/dev.db`)
- **Authentication:** JWT (`jsonwebtoken`) with `bcryptjs` password hashing and guest-student fallback
- **Data Validation:** Zod schema validation
- **HTTP Transport:** Server-Sent Events (SSE) for streaming and standard REST JSON

---

## 3. Database Schema Highlights (`prisma/schema.prisma`)

### Core Models
- `User`: Accounts with roles (`STUDENT`, `FACULTY`, `ADMIN`), credentials, and gamification links.
- `Profile`: Student academic info (program, semester, section) and 8-bit metrics (level, XP, rank, streak).
- `CRConversation`: Saved chat sessions between a student and the CR Tutor.
- `CRMessage`: Messages stored with sender (`user` or `cr`), raw text, message type, and JSON tool payloads.
- `CRQuiz`: Dynamically generated diagnostic quizzes with questions, options, correct answers, and XP rewards.
- `CRStudyPlan`: Multi-day study schedules generated from student mastery gaps.
- `CRRevisionPack`: Topic summaries and flashcards saved for active recall revision.
- `TopicMastery`: Subject-specific competency scores, historical accuracy, and error counts.
- `QuizAttempt`: Individual test submissions with per-question latency, score, and XP awarded.
- `Clan` & `ClanMember`: Social cohorts, clan XP, and group challenges.

---

## 4. AI & Orchestration Engine

### 4.1. `CROrchestrator` (`src/lib/ai/orchestrator.ts`)
The central coordinator for all educational dialogues:
- **`detectIntent(message, explicitMode)`:** Classifies student intent into one of 5 pedagogical modes:
  - `TUTOR`: Interactive explanation with loop invariants and Socratic check questions.
  - `QUIZ`: Active diagnostic trials with multiple-choice verification.
  - `EXAM_PREP`: High-yield exam traps, edge-case analysis, and complexity proofs.
  - `REVISION`: Flashcard summaries and memory mnemonics.
  - `STUDY_PLAN`: Phased calendar schedules targeting weak areas.
- **`buildEnrichedPrompt(userId, mode, userQuery)`:** Queries student history, determines current struggle factors, fetches live ML telemetry from `mlClient.getAdaptiveAction()`, and constructs a structured system prompt.
- **`generateAutomaticSuggestions(topic, userMessage, mode, mlTelemetry)`:** Generates 4 context-aware action chips based directly on the ML learning directive (`INCREASE_DIFFICULTY` suggests edge-case trials; `LOWER_DIFFICULTY` suggests fundamental walk-throughs).
- **`streamMessage()`:** SSE generator emitting `{ event: "telemetry" }`, `{ event: "token" }`, `{ event: "suggestions" }`, and `{ event: "done" }`.

### 4.2. Socratic Pedagogy Engine (`src/lib/ai/socratic-engine.ts`)
An in-process autonomous reasoning engine providing guaranteed, high-quality technical responses:
- **Domain Deconstructions:** Deep algorithmic breakdowns across:
  - Dijkstra, Bellman-Ford, BFS/DFS, A*
  - Dynamic Programming (Recurrence, Memoization, Tabulation, Knapsack)
  - Binary Search Trees & AVL Rotations (Balance factors, Left/Right rotations)
  - Process Synchronization (Semaphores, Mutex, Coffman Deadlock Conditions)
  - Database Indexing (B+ Trees, Clustering, WAL, ACID)
  - Computer Networking (TCP 3-way handshake, Flow & Congestion Control)
  - Sorting Algorithms (QuickSort Lomuto vs Hoare, Invariant bounds)
  - OOP & System Design (SOLID, CAP Theorem, Consistent Hashing)
- **Socratic Answer Grading:** Recognizes when a student is answering a previous question, checks correctness, awards XP, and asks deepening follow-up questions.
- **ML Directive Alignment:** Scaffolds fundamentals when ML says `LOWER_DIFFICULTY` or `REVISE_TOPIC`; challenges edge cases when ML says `INCREASE_DIFFICULTY`.

---

## 5. Machine Learning Bridge (`src/lib/ml/client.ts`)

Connects Next.js to the Python FastAPI microservice:
- **Liveness Checking:** `isHealthy()` checks `http://127.0.0.1:8000/health` with a 10-second cache.
- **Adaptive Action:** `getAdaptiveAction(req)` posts student interaction history and receives:
  - `action`: `ANSWER_NEXT_QUESTION`, `LOWER_DIFFICULTY`, `INCREASE_DIFFICULTY`, `REVISE_TOPIC`, `TAKE_BREAK`.
  - `mastery.score`: $0.0 \to 1.0$ logistic/gradient-boosted score.
  - `confidence`: Confidence interval estimate.
  - `contributing_factors`: Feature importances explaining why the decision was made.
- **Zero-Fail Failover:** If the Python microservice is offline, `computeLocalAdaptiveFallback()` mirrors the exact same decision tree deterministically.

---

## 6. REST API Reference

### CR Socratic Tutor Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/cr/chat/stream` | Server-Sent Events stream for real-time tokens, telemetry, and suggestions. Accepts `{ message, conversationId, mode, history }`. |
| `POST` | `/api/cr/chat` | Standard JSON endpoint returning full response, telemetry, thought steps, and suggestion pills. |

### Authentication Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Validates credentials and sets `cr_token` HTTP-only cookie. |
| `POST` | `/api/auth/register` | Creates student user and initializes level 1 8-bit profile. |
| `GET` | `/api/auth/me` | Returns active session user and profile stats. |
| `POST` | `/api/auth/logout` | Clears authentication session cookies. |

### Quizzes & Gamification Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/quiz/generate` | Generates a topic quiz with specified difficulty and question count. |
| `POST` | `/api/quiz/submit` | Submits answers, updates mastery scores, and credits XP. |
| `GET` | `/api/leaderboard` | Fetches global and weekly student rankings. |
| `GET` | `/api/dashboard/stats` | Fetches streak, level, XP history, and subject masteries. |

---

## 7. Environment Variables

Create `.env` (or `.env.local`) in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# Session Secret
JWT_SECRET="class-royale-secret-key-8bit-retro-game-session-2026"

# Next.js Environment
NODE_ENV="development"

# Class Royale Machine Learning Service
ML_SERVICE_URL="http://127.0.0.1:8000"

# Optional Cloud LLM Provider (OpenRouter)
OPENROUTER_API_KEY="your-api-key-here"
OPENROUTER_MODEL="openai/gpt-4o-mini"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
```

---

## 8. Database Setup & Migrations

```bash
# Push schema changes to SQLite database
npx prisma db push

# Generate updated Prisma Client types
npx prisma generate

# Inspect database in Prisma Studio
npx prisma studio
```

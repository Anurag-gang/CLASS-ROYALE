# 👑 Class Royale (CR)

> **Gamified 8-Bit Computer Science Education Platform with an Adaptive Machine Learning Engine & Socratic AI Tutor**

Class Royale is an interactive computer science learning ecosystem designed for university engineering students. It unites retro arcade gaming progression (XP, levels, clans, arenas) with a Socratic conversational AI companion and a Python-powered supervised Machine Learning adaptive engine.

---

## 📚 Specialized Architecture Documentation

This repository is split into three interconnected systems, each documented in its dedicated guide:

| Layer | Documentation | Core Technologies | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend** | [**`README_FRONTEND.md`**](./README_FRONTEND.md) | Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, Three.js / WebGL, Web Audio API | 8-bit retro gaming UI, Socratic terminal (`/cr`), interactive 3D hero canvasses, Combat Arena (`/arena`), dashboards, and audio FX. |
| **Backend** | [**`README_BACKEND.md`**](./README_BACKEND.md) | Next.js API Route Handlers, Node.js 24, Prisma ORM (SQLite), JWT, SSE Streaming | Session auth, database persistence, CROrchestrator state machine, in-process Socratic reasoning engine, and ML bridge. |
| **Machine Learning** | [**`README_ML.md`**](./README_ML.md) | Python 3.13, FastAPI, Scikit-Learn, Joblib, NumPy, Pandas | Supervised student mastery prediction ($0.0 \to 1.0$), item difficulty calibration, weak topic classification, and adaptive action directives. |

---

## ⚡ Quick Start: Running the Entire System

### 1. Prerequisites
- **Node.js:** `v20+` or `v24+`
- **Python:** `3.11+` or `3.13+`
- **npm:** `v10+`

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="file:./dev.db"

# Session Secret
JWT_SECRET="class-royale-secret-key-8bit-retro-game-session-2026"

# Next.js Environment
NODE_ENV="development"

# Python ML Microservice
ML_SERVICE_URL="http://127.0.0.1:8000"

# Optional Cloud LLM API Key (OpenRouter)
OPENROUTER_API_KEY=""
```

### 3. Launching the Services

Open two terminals:

#### Terminal 1: Machine Learning Microservice
```bash
npm run ml:start
```
*Runs FastAPI on `http://127.0.0.1:8000` (Health Check: `http://127.0.0.1:8000/health`).*

#### Terminal 2: Web Application & API
```bash
npm run dev
```
*Runs Next.js on `http://localhost:3000` (CR Socratic Tutor: `http://localhost:3000/cr`).*

---

## 🧪 Verification & Testing

- **Verify Frontend & Backend TypeScript:**
  ```bash
  npx tsc --noEmit
  ```
- **Verify ML Microservice Pytest Suite:**
  ```bash
  cd ml-service
  python -m pytest tests -v
  ```
  *(51 test suites covering data contracts, leakage guardrails, and decision trees)*

---

## 🛡️ License

Class Royale is distributed under the MIT License.

# Class Royale — Frontend Architecture & UI Documentation

> **Interactive 8-Bit Retro Gamified Computer Science Learning Platform**  
> Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Framer Motion**, and **Three.js / WebGL**.

---

## 1. Overview & Vision

Class Royale merges retro 8-bit arcade aesthetics with modern university-level computer science pedagogy. The frontend provides:
- **CR Socratic Tutor (`/cr`):** An AI-guided terminal companion that reasons through algorithms, presents loop invariants, grades student responses Socratically, and renders live Machine Learning mastery telemetry.
- **Combat Arena (`/arena`):** Time-pressured diagnostic quizzes and real-time knowledge trials.
- **Academic Dashboard (`/dashboard`):** Real-time XP meters, rank badges, streak counters, and multi-subject mastery radars.
- **Curriculum Questline (`/learn`, `/subjects`):** Visual interactive skill trees across Data Structures, Algorithms, OS, Networking, and Databases.
- **Clans & Leaderboards (`/clans`, `/leaderboard`):** Social cohort competitions and weekly academic leaderboards.

---

## 2. Tech Stack & Libraries

| Technology | Version / Spec | Primary Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.3.4` (App Router + Turbopack) | Fast Server/Client component rendering, nested layouts, and streaming routes. |
| **React** | `19.2.8` | Declarative UI state, suspense boundaries, transitions, and streaming hooks. |
| **Tailwind CSS** | `v4` (`@tailwindcss/postcss`) | Utility-first styling with custom retro palettes, glowing neon accents, and scanline borders. |
| **Framer Motion** | `14.0.0` | Fluid layout animations, tab glide transitions, and dialogue animations. |
| **Three.js / OGL** | `^0.185.1` / `^1.0.11` | 3D interactive hero backgrounds, retro particle effects, and spatial game elements. |
| **Lucide React** | `^1.41.0` | Crisp, scalable iconography across all interfaces. |
| **Web Audio API** | Native Browser Engine | Synthesized 8-bit retro sound effects (`retroSound`) with zero external asset latency. |

---

## 3. Directory Structure

```
src/
├── app/
│   ├── (auth)/                # Login & Registration authentication flows
│   ├── arena/                 # Diagnostic arena & timed quiz trials
│   ├── cr/                    # CR AI Socratic Companion Terminal
│   │   └── page.tsx           # Multi-turn streaming chat UI with ML badge
│   ├── dashboard/             # Student mastery, XP, streak, & rank stats
│   ├── faculty/               # Academic faculty diagnostics & student reports
│   ├── leaderboard/           # Global and clan rankings
│   ├── learn/                 # Interactive course syllabus & lessons
│   ├── profile/               # Student profile, avatars, and badges
│   ├── quests/                # Daily bounties and achievement rewards
│   ├── layout.tsx             # Root application shell & sound providers
│   └── page.tsx               # 3D Hero landing page
├── components/
│   ├── reactbits/             # High-polish micro-interaction primitives
│   │   ├── GlideSelect.tsx    # Smooth sliding animated mode/tab selector
│   │   ├── ThoughtLine.tsx    # Collapsible AI reasoning & diagnostic accordion
│   │   └── StatusMark.tsx     # Animated state indicator dots
│   ├── ui/                    # Reusable atomic UI components (Buttons, Dialogs, Cards)
│   └── three/                 # Three.js / WebGL background canvasses & shaders
└── lib/
    ├── sound.ts               # 8-bit Web Audio API synthesizer
    ├── auth.ts                # Client-side session and auth helpers
    └── utils.ts               # Classnames merge (`clsx` + `tailwind-merge`)
```

---

## 4. Key UI Features & Components

### 4.1. CR Socratic Terminal (`/cr`)
The flagship conversational interface for intelligent algorithmic learning:
- **GlideSelect Mode Switcher:** Instant animated mode switching between:
  - 🧠 `Socratic Tutor` (Deep reasoning, invariant proofs, scaffolding)
  - ⚔️ `Diagnostic Quiz` (Active recall trials with live grading)
  - 🛡️ `Exam Prep` (High-yield exam traps, edge-case analysis)
  - ⚡ `Revision Pack` (Rapid flashcards and mnemonic sheets)
- **ThoughtLine Accordion:** Displays real-time reasoning steps taken by the AI and ML models before rendering the final response.
- **ML Telemetry Badge:** Real-time badge that displays:
  - Student Topic Mastery % (e.g. `48%` or `82%`)
  - Prescribed Learning Action (`LOWER_DIFFICULTY`, `ANSWER_NEXT_QUESTION`, `INCREASE_DIFFICULTY`)
  - Active ML Endpoint (`http://127.0.0.1:8000/adaptive/next-action`)
  - Statistical confidence and contributing weights.
- **Automatic Next-Step Pills:** Contextual suggestion chips automatically synthesized from the topic and ML diagnostics (e.g. `⚔️ Challenge Quiz`, `⚡ Code Invariants Walkthrough`, `📜 7-Day Study Roadmap`).
- **Resilient Fallback Engine:** Client-side failover ensures that even during unexpected network interruptions, the terminal delivers structured first-principles breakdowns and Socratic question checks.

### 4.2. 8-Bit Web Audio System (`src/lib/sound.ts`)
Zero-latency procedural sound generation using the native browser Web Audio API:
- `retroSound.playClick()`: Crisp arcade button press.
- `retroSound.playSuccess()`: Ascending 8-bit arpeggio for XP gain and correct answers.
- `retroSound.playLevelUp()`: Multi-tone fanfaric flourish.
- `retroSound.playError()`: Low square-wave buzz for invalid operations.

---

## 5. Streaming Architecture (Server-Sent Events)

The chat terminal communicates with the backend via Server-Sent Events (SSE) over HTTP POST:

```
User Input
    │
    ▼
fetch('/api/cr/chat/stream')
    │
    ├──► event: telemetry    (Emitted first with ML mastery & decision weights)
    ├──► event: token        (Streamed incrementally for zero-latency reading)
    ├──► event: suggestions  (Emitted with contextual next-step action pills)
    └──► event: done         (Conversation ID & database persistence confirmation)
```

If streaming encounters an empty response, the client gracefully falls back to `/api/cr/chat` (standard JSON POST) and then to the local resilient knowledge synthesis engine.

---

## 6. Styling & Design Tokens

Tailwind CSS v4 configures an intentional retro-cyber arcade aesthetic:
- **Backgrounds:** Deep abyss (`#000000`, `#090b10`) with subtle grid patterns.
- **Accents:** Neon Cyan (`#06b6d4`), Retro Amber (`#f59e0b`), Emerald (`#10b981`), and Crimson (`#ef4444`).
- **Typography:** Monospaced headings (`font-mono`) paired with modern legible sans-serif for long technical explanations.
- **Borders:** Translucent hairline borders (`border-white/[0.06]`, `border-cyan-500/30`).

---

## 7. Running the Frontend Locally

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### Installation & Execution
```bash
# Install dependencies
npm install

# Start Next.js development server with Turbopack
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) or navigate directly to [http://localhost:3000/cr](http://localhost:3000/cr).

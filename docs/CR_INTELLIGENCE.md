# CR Intelligence — Academic Analyst & Learning Strategist

## Role & Distinct Identity

**CR Intelligence ("CR")** is Class Royale's learning strategist, academic performance analyst, and curriculum companion.

While **Socrates** teaches specific concepts in real time, **CR Intelligence** observes the student's longitudinal performance across subjects, models retention curves, and crafts strategic study roadmaps.

---

## Capabilities & Modes

1. **Mastery Diagnostics (`PERFORMANCE`)**:
   - Synthesizes student accuracy, streak stability, and latent topic skill vectors.
   - Diagnoses weak areas (e.g. Graph Traversal, AVL Tree Rotations) requiring active recall.
2. **High-Yield Exam Preparation (`EXAM_PREP`)**:
   - Compiles high-priority review topics based on impending deadlines and syllabus coverage.
   - Highlights tricky exam pitfalls and grading rubric expectations.
3. **Adaptive Study Planning (`STUDY_PLAN`)**:
   - Generates daily milestone-based study blocks balancing theory, coding practice, and battle trials.
4. **Revision Pack Generation (`REVISION`)**:
   - Produces active-recall flashcard pairs (Front / Back) and formula cheat-sheets.

---

## Integration with the Supervised ML Microservice

CR Intelligence does not estimate mastery numerically on its own. Numerical skill parameters are calculated by the dedicated FastAPI ML Microservice (`http://127.0.0.1:8000`):

- **Bayesian Knowledge Tracing (BKT)**: Calculates $P(L_t)$, the probability that the student has mastered topic $t$.
- **Deep Knowledge Tracing (DKT)**: Predicts correctness probability on the next question.
- **Prescribed Learning Action**:
  - `INCREASE_DIFFICULTY`
  - `LOWER_DIFFICULTY`
  - `REVISE_TOPIC`
  - `PRACTICE_ACTIVE_RECALL`

CR Intelligence injects this telemetry directly into its prompt to calibrate explanation depth and task recommendations:

```typescript
MACHINE LEARNING ADAPTIVE ENGINE DIAGNOSTIC:
- Estimated Topic Mastery: ${mlTelemetry.masteryPercent}%
- Prescribed Pedagogical Action: ${mlTelemetry.learningAction}
- Adaptive Rationale: "${mlTelemetry.actionRationale}"
```

---

## Inference Execution

- **Inference Engine**: Shared local Colibri engine (`http://127.0.0.1:8080/v1`).
- **Client Route**: `/api/cr/chat` (JSON) and `/api/cr/chat/stream` (SSE Token Streaming).
- **Separation Guarantee**: Uses independent system prompts (`CR_CORE_SYSTEM_PROMPT` in `src/lib/ai/prompts.ts`). Never mixes state or context with Socrates.

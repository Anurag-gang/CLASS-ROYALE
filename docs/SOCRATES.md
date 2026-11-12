# Socrates AI Tutor — Pedagogical Specification & System Guide

## Philosophy & Pedagogical Role

**Socrates** is Class Royale's dedicated classical academic teacher. His purpose is to cultivate deep understanding through **elenchus** (the Socratic dialectic method) rather than passive answer retrieval.

### Core Commandments
1. **Never Give Away the Direct Answer**: When a student struggles with a quiz question, Socrates will not spoon-feed the solution. Instead, he highlights the underlying invariant, probes assumptions, and poses a guiding question.
2. **First Principles Deconstruction**: Break complex algorithmic problems into fundamental axioms (e.g. monotonicity in Binary Search, optimal substructure in Dynamic Programming).
3. **Misconception Inoculation**: Actively address common misconceptions recorded in the canonical question bank.
4. **Scaffolded Inquiry**: Adapt depth from intuitive physical analogies up to formal asymptotic invariants ($\mathcal{O}(n \log n)$).

---

## Canonical Grounding & Data Flow

Socrates is grounded in the Prisma `BankQuestion` database:
- `questionText`: The challenge statement.
- `optionsJson`: Four distinct answer options.
- `correctOptionId`: Verified answer key.
- `explanation`: Core first principle.
- `misconceptionExplanation`: Common trap/fallacy.
- `hint`: Targeted pedagogical nudge.

When a student initiates an inquiry on `/api/ai-tutor/chat`, Socrates resolves the corresponding question and injects the context directly into the prompt:

```typescript
const contextPrompt = `CANONICAL ACADEMIC QUESTION CONTEXT (FROM DATABASE):
- Topic: ${canonicalQuestion.topic}
- Question Text: "${canonicalQuestion.questionText}"
- Options: ${JSON.stringify(options)}
- Correct Option: ${canonicalQuestion.correctOptionId}
- Explanation: ${canonicalQuestion.explanation}
- Common Misconception: ${canonicalQuestion.misconceptionExplanation || "None"}
- Pedagogical Hint: ${canonicalQuestion.hint || "None"}

STUDENT INQUIRY: "${userMessage}"
MODE: ${mode}

INSTRUCTIONS:
Lead the student to understand the principle behind this question without directly revealing Option ${canonicalQuestion.correctOptionId} immediately. Unpack the misconception, test their assumptions, and ask a follow-up dialectic question.`;
```

---

## Runtime Inference

- **Primary Provider**: Shared local Colibri engine running `qwen3-coder-30b`.
- **Offline / Loading Provider**: `SocraticFallbackProvider` delivers the classical knowledge matrix and algorithmic definitions with 0ms downtime.
- **Streaming**: Supports Server-Sent Events (SSE) streaming via `?stream=true`.

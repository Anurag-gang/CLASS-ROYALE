# E2E Test Infra: Socrates Full-Screen Glassmorphism AI Workspace

## Test Philosophy
- Requirement-driven, opaque-box testing covering the Next.js backend, Colibri Qwen integration, streaming SSE, client abort signals, error boundaries, and SQLite conversation persistence.
- Strict validation across all 15 evaluation scenarios defined in Part 12 and Acceptance Criteria.
- Zero tolerance for simulated or fake mock responses: tests verify genuine Colibri communication, truthful 503 offline notifications, uncorrupted Markdown parsing, and authentic SQLite persistence.

---

## 15 Evaluation Scenarios Test Suite Architecture

### Test Runner
- Script location: `scripts/verify_socrates_suite.ts`
- Command: `npx tsx scripts/verify_socrates_suite.ts`
- Pass/Fail semantics: All 15 scenarios must pass with exit code 0. Zero unhandled rejections, zero regression across student database preservation.

---

## 4-Tier Test Matrix

### Tier 1 — Core Model & Backend Integration (Scenarios 1, 12, 13)
- **T1.1: Health & Dynamic Model Resolution**: Queries `/api/socrates/health` and verifies dynamic resolution of `qwen3-coder-30b-a3b-colibri`.
- **T1.2: Colibri Unavailability Error Notice**: Tests offline behavior against port 8080. Verifies 503 status code with explicit user notice; asserts `SocraticFallbackProvider` mock engine is NOT invoked.
- **T1.3: Streaming & Client Cancellation**: Initiates streaming chat request, verifies token chunks arrive via SSE, issues `AbortController.abort()`, and asserts stream cleanly terminates within 100ms without backend hang.

### Tier 2 — Restriction Audit & General Query Capabilities (Scenarios 1, 5, 6, 15)
- **T2.1: General Knowledge Query**: Sends "Who was Alan Turing?" — verifies response is generated without topic allowlist rejections or academic-only routing errors.
- **T2.2: Python Programming**: Requests "Write a thread-safe LRU cache in Python" — verifies complete code response without multiple-choice quiz-proctoring traps.
- **T2.3: C++ Debugging**: Requests memory bug analysis — verifies root-cause explanation and fix snippet.
- **T2.4: General Query with 0 Retrieval Hits**: Queries general non-curriculum question — verifies zero errors and complete response.

### Tier 3 — Academic Knowledge Grounding & Pedagogical Tone (Scenarios 2, 3, 4, 7, 8, 9)
- **T3.1: Algorithmic Concept & Invariants (DSA)**: Requests QuickSelect vs QuickSort analysis — asserts mathematical asymptotic notation $\mathcal{O}(n)$.
- **T3.2: OS Concepts with Analogies**: Inquires on virtual memory paging — asserts intuitive analogy and step-by-step breakdown.
- **T3.3: Computer Networks Comparison**: Inquires on TCP BBR vs CUBIC — asserts structured Markdown table.
- **T3.4: Canonical Question Explanation**: Queries canonical question from `BankQuestion` — asserts ground-truth hints and misconception context enrich the explanation.
- **T3.5: Multi-Turn Follow-up Retention**: Inquires follow-up "explain that again with a simpler analogy" — asserts conversation history is retained and tone adapts.
- **T3.6: Pedagogical Simplification**: Inquires "explain it like I'm a beginner" — asserts non-condescending, accessible explanation.

### Tier 4 — UI Resiliency, Markdown Engine & Session Persistence (Scenarios 10, 11, 14)
- **T4.1: Long Markdown Response Parsing**: Exercises headings, lists, blockquotes, tables, and code fences — asserts zero raw unparsed formatting tokens.
- **T4.2: Code Block Streaming Resiliency**: Injects partial stream chunks with open code fences — asserts no layout breakage or unclosed tag crashes.
- **T4.3: SQLite Session CRUD & Student Isolation**:
  - Creates a conversation for Student A.
  - Adds user and assistant messages.
  - Verifies reload from SQLite `prisma/dev.db`.
  - Verifies Student B cannot access Student A's conversations (multi-tenant isolation).
  - Verifies rename, delete, and bulk clear endpoints.
- **T4.4: Student Data Preservation**: Executes `npm run test:preservation` (`scripts/verify_data_preservation.ts`) — asserts 100% preservation across 19 users, 27 quiz attempts, and 25 CR conversations.

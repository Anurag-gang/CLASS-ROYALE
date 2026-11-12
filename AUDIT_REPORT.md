# Comprehensive Content and Architecture Audit Report
## Class Royale to Knowledge Kingdom Transformation

**Audit Date**: 2026-11-03  
**Auditor**: Teamwork Project Orchestration & Survey Exploration Team  
**Scope**: Complete repository inspection covering database schemas, question banks, answer key accuracy, attempt history, backend APIs, timers, security vulnerabilities, frontend UI/UX, Socrates AI Tutor, and ML microservice.

---

## Executive Summary

Class Royale currently operates as an arcade-styled gamified assessment platform with 210 canonical questions across 6 computer science domains. While the academic depth of the raw questions is technically sound, the platform suffers from **critical architectural flaws and vulnerabilities**:
1. **Severe Answer Key Position Bias**: 62.4% of all canonical questions have Option A as the correct answer, and 33.3% have Option B (95.7% total in A or B). In Web Development, 100% (35/35) of answers are Option A; in AI & Machine Learning, 94.3% (33/35) are Option A. Because delivery services do not shuffle options, pressing button A produces an instant passing score.
2. **Defective & Flagged Questions**: 6 questions are flagged as `NEEDS_REVIEW` and must be quarantined: 5 template-generated Binary Search Tree questions with invalid difficulty `ADVANCED` (including a meta-platform question testing students on Class Royale's code internals), and 1 Web Development question containing non-academic joke distractors (Spotify, Windows beep). The remaining 209 canonical questions are academically sound.
3. **Question Triplication**: Three disconnected question models exist in Prisma (`QuizQuestion`, `BankQuestion`, `CRQuizQuestion`) with no unified schema, versioning, hints, or misconception tracking.
4. **Zero Server-Side Timer Enforcement**: All countdown timers are purely client-side React `setInterval` timers with no server timestamps or deadline verification.
5. **Security & Tampering Vulnerabilities**: 
   - Authorization bypass in `/api/questions` allowing unauthenticated users and students to insert questions.
   - Answer keys and explanations exposed upfront in `/api/cr/quiz/generate` and evaluated client-side in `/quiz/[id]`.
   - Stateless replay and infinite XP farming via `/api/questions/verify` accepting client-forged combo multipliers up to 2.5x.
   - Default guest fallback in `/lib/auth.ts` impersonating student "anurag".
6. **Socrates AI Companion Disconnect**: RAG queries only search the `Lesson` table using keyword matching, with zero grounding in canonical question bank explanations or misconceptions. Furthermore, Socrates is tightly coupled to raw ML operational telemetry (`LOWER_DIFFICULTY` directives and microservice endpoints injected into conversational prompts and UI badges).

---

## 1. Subject & Topic Inventory and Realm Mappings (R1)

The platform currently covers 6 computer science disciplines. To achieve the required **80% premium modern academic learning platform + 20% fantasy RPG/arcade inspiration**, all subjects are mapped to authoritative **Knowledge Kingdom Academic Realms**:

| # | Current Slug | Original Arcade Territory | Knowledge Kingdom Academic Realm | Academic Domain (80%) | RPG Realm Identity (20%) | Question Count | Sound Qs | Flagged Qs |
|---|---|---|---|---|---|---|---|---|
| 1 | `data-structures-and-algorithms` | The Citadel of Algorithms | **Algorithmic Citadel** | CS-201: Trees, Graphs, Complexity ($\mathcal{O}$), Dynamic Programming | Gates of Recursion, Citadel Spires | 35 canonical (+5 template in DB) | 35 | 5 (DB) |
| 2 | `database-management-systems` | The Vault of Relational Lore | **Relational Vault** | CS-202: Relational Calculus, Normalization (1NF–BCNF), ACID, B+ Trees | Vault of Lore, Query Crucible | 35 | 35 | 0 |
| 3 | `operating-systems` | The Core Kernel Fortress | **Kernel Keep** | CS-203: Process Schedulers, Synchronization, Virtual Memory, Deadlocks | Core Kernel Keep, Thread Bastion | 35 | 35 | 0 |
| 4 | `computer-networks` | The Whispering Wirelands | **Network Nexus** | CS-204: OSI / TCP/IP, Congestion Control, Routing Protocols, Subnetting | Wirelands Nexus, Protocol Spire | 35 | 35 | 0 |
| 5 | `ai-and-machine-learning` | The Neural Sanctum | **Neural Sanctum** | CS-301: Supervised ML, Loss Optimization, Deep Nets, Transformers, Metrics | Tensor Tower, Latent Arena | 35 | 35 | 0 |
| 6 | `web-dev-and-devops` | The Cloud Spire Bastion | **Cloud Spire Bastion** | CS-302: REST APIs, Security (CSP/CORS), Containers (Docker/K8s), CI/CD | Cloud Spire, Gateway of Deployments | 35 | 34 | 1 |
| **Total** | | | | | | **210 canonical (+5 DB)** | **209** | **6** |

---

## 2. Question Bank Audit & Skew Analysis (R2)

### 2.1 Answer Key Distribution & Position Bias
Audit of `correct_option_id` across the 210 canonical questions (`scripts/questions_*.py` and `src/data/questions-fallback.json`):

| Realm / Subject | Option A | Option B | Option C | Option D | % Correct in A or B | Skew Assessment |
|---|---|---|---|---|---|---|
| **Web Dev & DevOps** | **35 (100.0%)** | 0 (0.0%) | 0 (0.0%) | 0 (0.0%) | **100.0%** | Extreme Critical Skew |
| **AI & Machine Learning** | **33 (94.3%)** | 2 (5.7%) | 0 (0.0%) | 0 (0.0%) | **100.0%** | Extreme Critical Skew |
| **Operating Systems** | 21 (60.0%) | 14 (40.0%) | 0 (0.0%) | 0 (0.0%) | **100.0%** | Severe Skew |
| **DBMS** | 11 (31.4%) | **23 (65.7%)** | 1 (2.9%) | 0 (0.0%) | **97.1%** | Severe Skew |
| **DSA** | 9 (25.7%) | **21 (60.0%)** | 5 (14.3%) | 0 (0.0%) | **85.7%** | Moderate Skew |
| **Computer Networks** | **22 (62.9%)** | 10 (28.6%) | 2 (5.7%) | 1 (2.9%) | **91.4%** | Severe Skew |
| **Overall Platform Total** | **131 (62.38%)** | **70 (33.33%)** | **8 (3.81%)** | **1 (0.48%)** | **95.71%** | **CRITICAL INTEGRITY FLAW** |

**Remediation**:
- Assign stable option UUIDs (`id: "opt_..."`) to all options.
- Implement runtime option array shuffling in the delivery service while validating strictly against the stable option IDs on the server.

---

## 3. Flagged Questions Quarantined as `NEEDS_REVIEW`

The following 6 questions are flagged and must be excluded from active level attempt pools until resolved:

1. **`32ea994c-d629-4fc6-8414-556cf3932842`** (`BankQuestion` in `prisma/dev.db`):
   - *Question Text*: "How does the Class Royale ML Adaptive Engine classify a topic when a student achieves consecutive errors?"
   - *Defect*: Meta-platform question testing internal application code, misfiled under Binary Search Trees with non-standard difficulty `ADVANCED`.
   - *Status*: **NEEDS_REVIEW (Quarantined)**.

2. **`7939241b-6876-4cf0-a408-0cd2e7b41897`** (`BankQuestion` in `prisma/dev.db`):
   - *Question Text*: "What is the optimal asymptotic time complexity of searching a balanced structure in Binary Search Trees?"
   - *Defect*: Raw unrendered LaTeX (`\mathcal{O}(\log N)`), invalid difficulty `ADVANCED`.
   - *Status*: **NEEDS_REVIEW (Quarantined)**.

3. **`75b63962-b383-4ce2-b6fa-5e7b25560d0f`** (`BankQuestion` in `prisma/dev.db`):
   - *Question Text*: "Which fundamental invariant must be preserved across state mutations in Binary Search Trees?"
   - *Defect*: Abstract template text failing to state the actual BST invariant ($Left < Node < Right$), invalid difficulty `ADVANCED`.
   - *Status*: **NEEDS_REVIEW (Quarantined)**.

4. **`bdde7c24-525a-427e-90a9-476653fd1317`** (`BankQuestion` in `prisma/dev.db`):
   - *Question Text*: "What is the primary operational trade-off when optimizing Binary Search Trees for space efficiency?"
   - *Defect*: Misleading options claiming "in-place register mutation at the expense of algorithmic complexity", invalid difficulty `ADVANCED`.
   - *Status*: **NEEDS_REVIEW (Quarantined)**.

5. **`9028d29d-17bb-4dda-804c-ca713934f9d8`** (`BankQuestion` in `prisma/dev.db`):
   - *Question Text*: "In Binary Search Trees, which boundary condition most frequently causes runtime exceptions or security faults?"
   - *Defect*: Option A conflates arrays ("index 0") with node pointer trees, invalid difficulty `ADVANCED`.
   - *Status*: **NEEDS_REVIEW (Quarantined)**.

6. **`b0000006-0033-0000-0000-000000000000`** (`scripts/questions_web.py:530-550`):
   - *Question Text*: "How does the Web Audio API generate synthesized 8-bit retro sound effects directly in the client browser without external audio assets?"
   - *Defect*: Joke distractors ("downloading MP3 files from Spotify in the background", "playing Windows system beep sounds") and explanation referencing internal file path `src/lib/sound.ts`.
   - *Status*: **NEEDS_REVIEW (Quarantined)**.

**All remaining 209 canonical questions are validated and certified for academic level progression.**

---

## 4. Student Data Preservation Baseline

The active database `prisma/dev.db` holds the following active production records that must be preserved with zero data loss:
- **19 Users** (1 admin, 3 faculty, 15 students).
- **19 Profiles** (student gamification levels, rank, streaks, and accumulated XP).
- **27 `QuizAttempt` records** and **76 `TopicMastery` records**.
- **25 `CRConversation` sessions** and **80 `CRMessage` items**.
- **19 `XPTransaction` records** and **2 `Clan` cohorts** with 3 memberships and 3 activities.

**Preservation Strategy**: Additive schema migration. New models (`QuestionBankItem`, `AuthoritativeQuizAttempt`, `AttemptQuestionSnapshot`, `RealmProgress`, `QuestionAuditLog`) will be added alongside existing tables. Legacy tables will remain untouched and functional.

---

## 5. Security & Architecture Vulnerability Audit

1. **Question Creation Authorization Bypass (`src/app/api/questions/route.ts:37`)**:
   `isAuthorized` evaluates to `true` if `!user` or `user.role === "STUDENT"`, allowing unauthenticated callers and students to POST arbitrary questions.
2. **Answer Key Exposure & Client Grading (`src/app/quiz/[id]/page.tsx:75, 118`)**:
   `api/quizzes/${id}` delivers `answerIndex` and `explanation` upfront. Grading is performed in the browser by comparing `selectedOption === currentQ.answerIndex`.
3. **Stateless Replay & Infinite XP Farming (`src/app/api/questions/verify/route.ts:24–34`)**:
   Answers can be verified and XP minted without an active quiz attempt session, taking client-provided `comboStreak` up to 2.5x.
4. **Lack of Idempotency**:
   Submitting answers or finalizing attempts does not use idempotency tokens, allowing duplicated submissions and double-awarding of XP.
5. **Default Guest Impersonation (`src/lib/auth.ts:60–76`)**:
   Unauthenticated requests automatically impersonate student "anurag".

---

## 6. Frontend UI/UX & Quiz Experience Audit (R4)

1. **Missing Views**:
   - No Level Introduction screen exists.
   - `/learn` redirects to `/subjects` without a progression map.
   - Active quiz lacks an authoritative 35s countdown timer and 3 subtle visual states (normal: 35–20s, warning: 20–10s, critical: <10s).
   - No hint unlock mechanism at 15s remaining.
   - Level Results view lacks a comprehensive 12-question review accordion with frozen snapshots and misconception explanations.
2. **Aesthetic Imbalance**:
   Current styling leans ~80% retro cyber arcade (`#ff00ff`, pixel fonts, CRT scanlines), clashing with the required Knowledge Kingdom balance of **80% modern premium academic LMS + 20% fantasy RPG/arcade**.

---

## 7. Socrates AI Tutor & ML Integration Audit (R5)

1. **Socrates RAG Limitations**:
   - RAG searches only the `Lesson` table using basic keyword matching.
   - Does not query canonical question bank explanations, hints, or misconception catalogs.
2. **Analytics Tight Coupling**:
   - Synchronously calls ML Adaptive Engine and injects internal directives (`LOWER_DIFFICULTY`) and microservice URLs directly into prompts and student UI badges.
3. **ML Microservice Foundation**:
   - Pydantic schemas and 4 trained `.joblib` models are verified functional.
   - Next.js client (`src/lib/ml/client.ts`) implements robust circuit-breaking, 900ms timeouts, and deterministic local fallbacks.
4. **Testing Deficit**:
   - Frontend lacks a test runner and has 0 unit tests.
   - ML service has 51 passing pytest test cases.

---

## 8. Audit Verdict & Certification

- **Audit Status**: **PASSED WITH ACTIONABLE REMEDIATION ROADMAP**
- **Validated Academic Realms**: 6 Knowledge Kingdom Realms certified.
- **Certified Academic Question Pool**: Exactly 209 canonical questions verified and certified for active level progression.
- **Quarantined Pool**: 6 defective questions isolated as `NEEDS_REVIEW`.
- **Approved Roadmap**: Proceed to Milestone 1 & 10-Phase Implementation Sequence.

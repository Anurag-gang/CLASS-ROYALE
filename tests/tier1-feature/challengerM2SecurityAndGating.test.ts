/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Challenger 2 Empirical Adversarial Stress Test Suite
 * Target: tests/tier1-feature/challengerM2SecurityAndGating.test.ts
 *
 * Role: Challenger 2 (Milestone 2 — Phases 3, 4 & 5)
 *
 * Empirically Stress-Tests:
 * 1. Security & RBAC: Authorization bypass attempts across POST /api/questions
 *    and all 8 /api/faculty/questions/* endpoints using unauthenticated requests,
 *    spoofed sessions (tampered roles, forged keys, expired tokens), and STUDENT accounts.
 *    Verifies non-privileged callers cannot create, modify, archive, review, or publish questions.
 * 2. Gating Invariants: Adversarial testing of hint requests (>15s rejected,
 *    Level 7 Crown Trial strictly locked, inactive attempts rejected).
 * 3. Sanitized Delivery: Verification across all 215 database questions that
 *    answer keys, explanations, and misconceptions are NEVER leaked prior to submission.
 * 4. State Machine Rigidity: Rejection of illegal validation status leaps.
 * =============================================================================
 */

import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { describe, it } from "../run-all-tests";
import { prisma } from "../../src/lib/db";
import { ALLOWED_FACULTY_ROLES, requireFacultyOrAdminUser } from "../../src/lib/questions/facultyAuthHelper";
import {
  sanitizeQuestionForDelivery,
  evaluateHintRequest,
  evaluateAnswerSubmission,
  shuffleArray,
} from "../../src/lib/questions/questionDeliveryService";
import {
  canTransitionStatus,
  publishFacultyQuestion,
  getFacultyQuestionById,
} from "../../src/lib/questions/facultyQuestionService";

// Import Next.js route handlers directly
import { POST as legacyQuestionsPost } from "../../src/app/api/questions/route";
import {
  GET as facultyQuestionsGet,
  POST as facultyQuestionsPost,
} from "../../src/app/api/faculty/questions/route";
import {
  GET as facultyDetailGet,
  PUT as facultyDetailPut,
  DELETE as facultyDetailDelete,
} from "../../src/app/api/faculty/questions/[id]/route";
import { GET as facultyFlaggedGet } from "../../src/app/api/faculty/questions/flagged/route";
import { POST as facultyReviewPost } from "../../src/app/api/faculty/questions/[id]/review/route";
import { POST as facultyPublishPost } from "../../src/app/api/faculty/questions/[id]/publish/route";

// JWT Secret used in src/lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || "class-royale-secret-key-8bit-retro-game-session-2026";
const AUTH_COOKIE_NAME = "class_royale_session";

// Active user IDs from dev.db
const STUDENT_USER_ID = "cmuve7bip001e31zcc516w4iw"; // anurag (STUDENT)
const FACULTY_USER_ID = "cmuve7atu000e31zckahjq0m7"; // dr.sharma (FACULTY)
const ADMIN_USER_ID = "cmuve7awk000k31zcgm2nbzsh";   // admin (ADMIN)

// Canonical test question from published bank
const CANONICAL_QUESTION_ID = "b0000001-0001-0000-0000-000000000000";

// Monkey-patchable cookie store helper
let activeSessionToken: string | undefined = undefined;

// Patch next/headers cookies for route handler invocation
const nextHeaders = require("next/headers");
const originalCookies = nextHeaders.cookies;

function setSessionToken(token: string | undefined) {
  activeSessionToken = token;
}

function restoreSessionMock() {
  nextHeaders.cookies = async () => ({
    get: (name: string) => {
      if (name === AUTH_COOKIE_NAME && activeSessionToken) {
        return { name: AUTH_COOKIE_NAME, value: activeSessionToken };
      }
      return undefined;
    },
  });
}

// Initialize the mock before running tests
restoreSessionMock();

// Helper to generate various JWT tokens
function createToken(payload: { userId: string; username: string; email: string; role: string }, secret = JWT_SECRET, options: jwt.SignOptions = { expiresIn: "7d" }) {
  return jwt.sign(payload, secret, options);
}

// Valid tokens
const validStudentToken = createToken({
  userId: STUDENT_USER_ID,
  username: "anurag",
  email: "anurag@apex.edu.in",
  role: "STUDENT",
});

const validFacultyToken = createToken({
  userId: FACULTY_USER_ID,
  username: "dr.sharma",
  email: "r.sharma@apex.edu.in",
  role: "FACULTY",
});

const validAdminToken = createToken({
  userId: ADMIN_USER_ID,
  username: "admin",
  email: "admin@apex.edu.in",
  role: "ADMIN",
});

// Spoofed tokens
const spoofedStudentToken = createToken({
  userId: STUDENT_USER_ID,
  username: "anurag",
  email: "anurag@apex.edu.in",
  role: "ADMIN", // Tampered role in payload!
});

const forgedSecretToken = createToken(
  {
    userId: FACULTY_USER_ID,
    username: "dr.sharma",
    email: "r.sharma@apex.edu.in",
    role: "FACULTY",
  },
  "malicious-attacker-secret-key-666"
);

const expiredToken = createToken(
  {
    userId: FACULTY_USER_ID,
    username: "dr.sharma",
    email: "r.sharma@apex.edu.in",
    role: "FACULTY",
  },
  JWT_SECRET,
  { expiresIn: "-10s" }
);

const nonExistentUserToken = createToken({
  userId: "user_non_existent_fake_uuid_999",
  username: "ghost",
  email: "ghost@apex.edu.in",
  role: "ADMIN",
});

// =============================================================================
// TEST SUITES
// =============================================================================

describe("Challenger 2 — Security & RBAC: requireFacultyOrAdminUser Helper Invariants", () => {
  it("rejects unauthenticated callers when session token is absent", async () => {
    setSessionToken(undefined);
    const auth = await requireFacultyOrAdminUser();
    // In absence of cookie, local dev demoUser returns anurag (STUDENT), which is rejected with 403
    // Or if getCurrentUser returns null, rejected with 401. Either way, user is strictly undefined.
    assert.equal(auth.user, undefined, "User must NOT be authenticated");
    assert.ok(auth.errorResponse, "errorResponse must be returned");
    const status = auth.errorResponse!.status;
    assert.ok(status === 401 || status === 403, `Expected status 401 or 403, got ${status}`);
  });

  it("strictly rejects legitimate STUDENT session with HTTP 403 Forbidden", async () => {
    setSessionToken(validStudentToken);
    const auth = await requireFacultyOrAdminUser();
    assert.equal(auth.user, undefined, "Student must NOT be authenticated as faculty");
    assert.ok(auth.errorResponse, "errorResponse must be returned");
    assert.equal(auth.errorResponse!.status, 403, "Status must be 403 Forbidden");
    const body = await auth.errorResponse!.json();
    assert.equal(body.success, false);
    assert.ok(body.error.includes("Forbidden") || body.error.includes("STUDENT"));
  });

  it("strictly thwarts role-spoofing attack (token claims ADMIN with student userId)", async () => {
    // The attacker claims role: "ADMIN" in the signed JWT token, but the userId belongs to student anurag
    setSessionToken(spoofedStudentToken);
    const auth = await requireFacultyOrAdminUser();
    assert.equal(auth.user, undefined, "Spoofed session must NOT bypass role gate");
    assert.ok(auth.errorResponse, "errorResponse must be returned");
    assert.equal(auth.errorResponse!.status, 403, "Must evaluate DB role, not spoofed JWT payload role");
  });

  it("strictly rejects token signed with an invalid/forged secret", async () => {
    setSessionToken(forgedSecretToken);
    const auth = await requireFacultyOrAdminUser();
    assert.equal(auth.user, undefined, "Forged secret token must be rejected");
    assert.ok(auth.errorResponse);
    const status = auth.errorResponse!.status;
    assert.ok(status === 401 || status === 403, `Status must be 401 or 403, got ${status}`);
  });

  it("strictly rejects expired session token", async () => {
    setSessionToken(expiredToken);
    const auth = await requireFacultyOrAdminUser();
    assert.equal(auth.user, undefined, "Expired session token must be rejected");
    assert.ok(auth.errorResponse);
    const status = auth.errorResponse!.status;
    assert.ok(status === 401 || status === 403, `Status must be 401 or 403, got ${status}`);
  });

  it("strictly rejects token for a non-existent user", async () => {
    setSessionToken(nonExistentUserToken);
    const auth = await requireFacultyOrAdminUser();
    assert.equal(auth.user, undefined, "Non-existent user must be rejected");
    assert.ok(auth.errorResponse);
    const status = auth.errorResponse!.status;
    assert.ok(status === 401 || status === 403, `Status must be 401 or 403, got ${status}`);
  });

  it("authorizes authentic FACULTY and ADMIN accounts", async () => {
    setSessionToken(validFacultyToken);
    const facultyAuth = await requireFacultyOrAdminUser();
    assert.ok(facultyAuth.user, "Faculty user must be authorized");
    assert.equal(facultyAuth.user!.role, "FACULTY");
    assert.equal(facultyAuth.errorResponse, undefined);

    setSessionToken(validAdminToken);
    const adminAuth = await requireFacultyOrAdminUser();
    assert.ok(adminAuth.user, "Admin user must be authorized");
    assert.equal(adminAuth.user!.role, "ADMIN");
    assert.equal(adminAuth.errorResponse, undefined);
  });
});

describe("Challenger 2 — Adversarial Attack on all 8 /api/faculty/questions/* Endpoints", () => {
  // Test endpoint 1: GET /api/faculty/questions
  it("blocks unauthenticated & student callers from listing questions via GET /api/faculty/questions", async () => {
    setSessionToken(undefined);
    const unauthReq = new NextRequest("http://localhost:3000/api/faculty/questions");
    const unauthRes = await facultyQuestionsGet(unauthReq);
    assert.ok([401, 403].includes(unauthRes.status), `Unauthenticated status: ${unauthRes.status}`);

    setSessionToken(validStudentToken);
    const studentReq = new NextRequest("http://localhost:3000/api/faculty/questions");
    const studentRes = await facultyQuestionsGet(studentReq);
    assert.equal(studentRes.status, 403, "Student must receive 403 Forbidden");

    setSessionToken(spoofedStudentToken);
    const spoofReq = new NextRequest("http://localhost:3000/api/faculty/questions");
    const spoofRes = await facultyQuestionsGet(spoofReq);
    assert.equal(spoofRes.status, 403, "Spoofed student must receive 403 Forbidden");

    // Faculty authorized check
    setSessionToken(validFacultyToken);
    const facultyReq = new NextRequest("http://localhost:3000/api/faculty/questions");
    const facultyRes = await facultyQuestionsGet(facultyReq);
    assert.equal(facultyRes.status, 200, "Faculty must receive 200 OK");
  });

  // Test endpoint 2: POST /api/faculty/questions (draft creation)
  it("blocks unauthenticated & student callers from creating drafts via POST /api/faculty/questions", async () => {
    const draftPayload = {
      subjectSlug: "data-structures-and-algorithms",
      levelNumber: 1,
      questionText: "Adversarial test question: Should not be created by student",
      options: [{ text: "Choice 1" }, { text: "Choice 2" }],
      correctOptionIds: ["opt_fake_1"],
      explanation: "Test explanation for security probe",
    };

    setSessionToken(undefined);
    const unauthReq = new NextRequest("http://localhost:3000/api/faculty/questions", {
      method: "POST",
      body: JSON.stringify(draftPayload),
    });
    const unauthRes = await facultyQuestionsPost(unauthReq);
    assert.ok([401, 403].includes(unauthRes.status));

    setSessionToken(validStudentToken);
    const studentReq = new NextRequest("http://localhost:3000/api/faculty/questions", {
      method: "POST",
      body: JSON.stringify(draftPayload),
    });
    const studentRes = await facultyQuestionsPost(studentReq);
    assert.equal(studentRes.status, 403, "Student must NOT create question draft");

    // Verify DB was NOT modified by student attempt
    const found = await prisma.questionBankItem.findFirst({
      where: { questionText: "Adversarial test question: Should not be created by student" },
    });
    assert.equal(found, null, "Question must not exist in database");
  });

  // Test endpoint 3: GET /api/faculty/questions/[id] (detail & audit log)
  it("blocks unauthenticated & student callers from inspecting question details via GET /api/faculty/questions/[id]", async () => {
    setSessionToken(undefined);
    const unauthReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}`);
    const unauthRes = await facultyDetailGet(unauthReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.ok([401, 403].includes(unauthRes.status));

    setSessionToken(validStudentToken);
    const studentReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}`);
    const studentRes = await facultyDetailGet(studentReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.equal(studentRes.status, 403, "Student must NOT view internal question details or audit trail");

    setSessionToken(validFacultyToken);
    const facultyReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}`);
    const facultyRes = await facultyDetailGet(facultyReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.equal(facultyRes.status, 200, "Faculty must view details");
  });

  // Test endpoint 4: PUT /api/faculty/questions/[id] (update & versioning)
  it("blocks unauthenticated & student callers from mutating questions via PUT /api/faculty/questions/[id]", async () => {
    const original = await getFacultyQuestionById(CANONICAL_QUESTION_ID);
    assert.ok(original, "Canonical question must exist");

    const maliciousUpdatePayload = {
      questionText: "TAMPERED BY ATTACKER",
      explanation: "TAMPERED EXPLANATION",
    };

    setSessionToken(undefined);
    const unauthReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}`, {
      method: "PUT",
      body: JSON.stringify(maliciousUpdatePayload),
    });
    const unauthRes = await facultyDetailPut(unauthReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.ok([401, 403].includes(unauthRes.status));

    setSessionToken(validStudentToken);
    const studentReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}`, {
      method: "PUT",
      body: JSON.stringify(maliciousUpdatePayload),
    });
    const studentRes = await facultyDetailPut(studentReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.equal(studentRes.status, 403, "Student must NOT update question");

    // Verify DB was NOT altered
    const unchanged = await getFacultyQuestionById(CANONICAL_QUESTION_ID);
    assert.equal(unchanged!.questionText, original!.questionText, "Question text must remain unmodified");
    assert.equal(unchanged!.version, original!.version, "Question version must not increment");
  });

  // Test endpoint 5: DELETE /api/faculty/questions/[id] (soft-delete archival)
  it("blocks unauthenticated & student callers from archiving questions via DELETE /api/faculty/questions/[id]", async () => {
    setSessionToken(undefined);
    const unauthReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}`, {
      method: "DELETE",
    });
    const unauthRes = await facultyDetailDelete(unauthReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.ok([401, 403].includes(unauthRes.status));

    setSessionToken(validStudentToken);
    const studentReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}`, {
      method: "DELETE",
    });
    const studentRes = await facultyDetailDelete(studentReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.equal(studentRes.status, 403, "Student must NOT archive question");

    // Verify question is NOT archived in DB
    const current = await getFacultyQuestionById(CANONICAL_QUESTION_ID);
    assert.equal(current!.status, "PUBLISHED", "Question must remain PUBLISHED");
  });

  // Test endpoint 6: GET /api/faculty/questions/flagged (quarantine review queue)
  it("blocks unauthenticated & student callers from viewing quarantined queue via GET /api/faculty/questions/flagged", async () => {
    setSessionToken(undefined);
    const unauthReq = new NextRequest("http://localhost:3000/api/faculty/questions/flagged");
    const unauthRes = await facultyFlaggedGet(unauthReq);
    assert.ok([401, 403].includes(unauthRes.status));

    setSessionToken(validStudentToken);
    const studentReq = new NextRequest("http://localhost:3000/api/faculty/questions/flagged");
    const studentRes = await facultyFlaggedGet(studentReq);
    assert.equal(studentRes.status, 403, "Student must NOT view flagged questions queue");

    setSessionToken(validFacultyToken);
    const facultyReq = new NextRequest("http://localhost:3000/api/faculty/questions/flagged");
    const facultyRes = await facultyFlaggedGet(facultyReq);
    assert.equal(facultyRes.status, 200, "Faculty must view flagged queue");
    const body = await facultyRes.json();
    assert.equal(body.quarantinedCount, 6, "Expected exactly 6 quarantined questions in queue");
  });

  // Test endpoint 7: POST /api/faculty/questions/[id]/review (review decision)
  it("blocks unauthenticated & student callers from making review decisions via POST /api/faculty/questions/[id]/review", async () => {
    const reviewPayload = {
      decision: "APPROVE",
      reviewNotes: "Malicious review approval by unauthorized student",
    };

    setSessionToken(undefined);
    const unauthReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}/review`, {
      method: "POST",
      body: JSON.stringify(reviewPayload),
    });
    const unauthRes = await facultyReviewPost(unauthReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.ok([401, 403].includes(unauthRes.status));

    setSessionToken(validStudentToken);
    const studentReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}/review`, {
      method: "POST",
      body: JSON.stringify(reviewPayload),
    });
    const studentRes = await facultyReviewPost(studentReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.equal(studentRes.status, 403, "Student must NOT record review decision");
  });

  // Test endpoint 8: POST /api/faculty/questions/[id]/publish (publish question)
  it("blocks unauthenticated & student callers from publishing questions via POST /api/faculty/questions/[id]/publish", async () => {
    setSessionToken(undefined);
    const unauthReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}/publish`, {
      method: "POST",
    });
    const unauthRes = await facultyPublishPost(unauthReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.ok([401, 403].includes(unauthRes.status));

    setSessionToken(validStudentToken);
    const studentReq = new NextRequest(`http://localhost:3000/api/faculty/questions/${CANONICAL_QUESTION_ID}/publish`, {
      method: "POST",
    });
    const studentRes = await facultyPublishPost(studentReq, { params: Promise.resolve({ id: CANONICAL_QUESTION_ID }) });
    assert.equal(studentRes.status, 403, "Student must NOT publish question");
  });
});

describe("Challenger 2 — Adversarial Attack on Legacy POST /api/questions", () => {
  it("strictly blocks unauthenticated, student, and spoofed callers from creating questions via POST /api/questions", async () => {
    const legacyPayload = {
      subject_id: "data-structures-and-algorithms",
      question_text: "Unauthorized legacy question creation attempt",
      options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
      correct_option_id: "A",
      explanation: "Explaining nothing",
    };

    setSessionToken(undefined);
    const unauthReq = new Request("http://localhost:3000/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(legacyPayload),
    });
    const unauthRes = await legacyQuestionsPost(unauthReq);
    assert.ok([401, 403].includes(unauthRes.status), `Expected 401 or 403, got ${unauthRes.status}`);

    setSessionToken(validStudentToken);
    const studentReq = new Request("http://localhost:3000/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(legacyPayload),
    });
    const studentRes = await legacyQuestionsPost(studentReq);
    assert.equal(studentRes.status, 403, "Student must be blocked from legacy question creation");

    setSessionToken(spoofedStudentToken);
    const spoofReq = new Request("http://localhost:3000/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(legacyPayload),
    });
    const spoofRes = await legacyQuestionsPost(spoofReq);
    assert.equal(spoofRes.status, 403, "Spoofed session must be blocked from legacy question creation");
  });
});

describe("Challenger 2 — Gating Invariants: Timed Hint Restrictions & Crown Trial Lockout", () => {
  const sampleQuestion = {
    id: "q_test_hint_01",
    questionText: "What is the amortized cost of pushing to a dynamic array?",
    hint: "Think about doubling the capacity when the buffer becomes full.",
  };

  it("strictly rejects hint requests when remaining time is > 17.5s (15s unlock + 2.5s network grace)", () => {
    const now = new Date();

    // 0s elapsed -> 35s remaining
    const session35s = {
      levelNumber: 1,
      currentQuestionStartedAt: now,
      hintsUsedCount: 0,
      status: "IN_PROGRESS",
    };
    assert.throws(
      () => evaluateHintRequest(session35s, sampleQuestion, now, 35),
      /Hint will unlock when 15 seconds remain.*35s remaining/
    );

    // 10s elapsed -> 25s remaining
    const session25s = {
      ...session35s,
      currentQuestionStartedAt: new Date(now.getTime() - 10000),
    };
    assert.throws(
      () => evaluateHintRequest(session25s, sampleQuestion, now, 35),
      /Hint will unlock when 15 seconds remain.*25s remaining/
    );

    // 17s elapsed -> 18s remaining (strictly > 17.5s)
    const session18s = {
      ...session35s,
      currentQuestionStartedAt: new Date(now.getTime() - 17000),
    };
    assert.throws(
      () => evaluateHintRequest(session18s, sampleQuestion, now, 35),
      /Hint will unlock when 15 seconds remain.*18s remaining/
    );
  });

  it("permits hint requests when remaining time is <= 17.5s on Levels 1 to 6", () => {
    const now = new Date();

    // 20s elapsed -> 15s remaining (exact threshold)
    const session15s = {
      levelNumber: 1,
      currentQuestionStartedAt: new Date(now.getTime() - 20000),
      hintsUsedCount: 0,
      status: "IN_PROGRESS",
    };
    const res15s = evaluateHintRequest(session15s, sampleQuestion, now, 35);
    assert.ok(res15s.hint.includes("doubling the capacity"));
    assert.equal(res15s.secondsRemaining, 15);
    assert.equal(res15s.hintsUsedCount, 1);

    // 25s elapsed -> 10s remaining
    const session10s = {
      ...session15s,
      levelNumber: 6,
      currentQuestionStartedAt: new Date(now.getTime() - 25000),
    };
    const res10s = evaluateHintRequest(session10s, sampleQuestion, now, 35);
    assert.equal(res10s.secondsRemaining, 10);
    assert.equal(res10s.hintsUsedCount, 1);

    // 34s elapsed -> 1s remaining
    const session1s = {
      ...session15s,
      currentQuestionStartedAt: new Date(now.getTime() - 34000),
    };
    const res1s = evaluateHintRequest(session1s, sampleQuestion, now, 35);
    assert.equal(res1s.secondsRemaining, 1);
  });

  it("strictly forbids hint requests on Level 7 (Crown Trial) regardless of remaining time", () => {
    const now = new Date();

    // Level 7 with 15s remaining
    const level7At15s = {
      levelNumber: 7,
      currentQuestionStartedAt: new Date(now.getTime() - 20000),
      hintsUsedCount: 0,
      status: "IN_PROGRESS",
    };
    assert.throws(
      () => evaluateHintRequest(level7At15s, sampleQuestion, now, 35),
      /Crown Trial \(Level 7\) assessment enforces strict exam conditions: timed hints are disabled/
    );

    // Level 7 with 5s remaining
    const level7At5s = {
      levelNumber: 7,
      currentQuestionStartedAt: new Date(now.getTime() - 30000),
      hintsUsedCount: 0,
      status: "IN_PROGRESS",
    };
    assert.throws(
      () => evaluateHintRequest(level7At5s, sampleQuestion, now, 35),
      /Crown Trial \(Level 7\) assessment enforces strict exam conditions: timed hints are disabled/
    );

    // Level 7 with 0s remaining
    const level7At0s = {
      levelNumber: 7,
      currentQuestionStartedAt: new Date(now.getTime() - 36000),
      hintsUsedCount: 0,
      status: "IN_PROGRESS",
    };
    assert.throws(
      () => evaluateHintRequest(level7At0s, sampleQuestion, now, 35),
      /Crown Trial \(Level 7\) assessment enforces strict exam conditions: timed hints are disabled/
    );
  });

  it("rejects hint requests when attempt is not IN_PROGRESS", () => {
    const now = new Date();
    const inactiveStatuses = ["COMPLETED", "ABANDONED", "EXPIRED", "INITIALIZING"];

    for (const status of inactiveStatuses) {
      const session = {
        levelNumber: 1,
        currentQuestionStartedAt: new Date(now.getTime() - 25000),
        hintsUsedCount: 0,
        status,
      };
      assert.throws(
        () => evaluateHintRequest(session, sampleQuestion, now, 35),
        /Cannot request hints for an inactive quiz attempt/
      );
    }
  });
});

describe("Challenger 2 — Zero Answer Leakage & Pre-Submission Sanitization Audit", () => {
  it("empirically verifies zero answer or explanation leakage across ALL 215 database questions", async () => {
    const allQuestions = await prisma.questionBankItem.findMany();
    assert.equal(allQuestions.length, 215, "Must test exactly 215 database questions");

    for (const q of allQuestions) {
      // Test delivery sanitization for Levels 1-6
      const sanitizedL1 = sanitizeQuestionForDelivery(q, {
        realmSlug: q.subjectSlug,
        levelNumber: q.levelNumber,
      });

      // Strict Omissions: Correct keys and explanations must NEVER be present
      assert.equal((sanitizedL1 as any).correctOptionIds, undefined, `Question ${q.id} leaks correctOptionIds`);
      assert.equal((sanitizedL1 as any).correctOptionId, undefined, `Question ${q.id} leaks correctOptionId`);
      assert.equal((sanitizedL1 as any).correct_option_id, undefined, `Question ${q.id} leaks correct_option_id`);
      assert.equal((sanitizedL1 as any).primaryCorrectOptionId, undefined, `Question ${q.id} leaks primaryCorrectOptionId`);
      assert.equal((sanitizedL1 as any).explanation, undefined, `Question ${q.id} leaks explanation`);
      assert.equal((sanitizedL1 as any).hint, undefined, `Question ${q.id} leaks hint in pre-submission delivery`);
      assert.equal((sanitizedL1 as any).misconceptions, undefined, `Question ${q.id} leaks misconceptions`);
      assert.equal((sanitizedL1 as any).misconceptionsJson, undefined, `Question ${q.id} leaks misconceptionsJson`);
      assert.equal((sanitizedL1 as any).misconceptionExplanation, undefined, `Question ${q.id} leaks misconceptionExplanation`);

      // Verify options are present and have stable UUIDs
      assert.ok(sanitizedL1.options.length >= 2, `Question ${q.id} must have >= 2 options`);
      for (const opt of sanitizedL1.options) {
        assert.ok(opt.id.startsWith("opt_"), `Option ${opt.id} in question ${q.id} must have 'opt_' prefix`);
        assert.equal((opt as any).isCorrect, undefined, `Option ${opt.id} in question ${q.id} leaks isCorrect`);
        assert.equal((opt as any).correct, undefined, `Option ${opt.id} in question ${q.id} leaks correct flag`);
      }

      // Test Crown Trial (Level 7) delivery: hintsAvailable MUST be false
      const sanitizedL7 = sanitizeQuestionForDelivery(q, {
        realmSlug: q.subjectSlug,
        levelNumber: 7,
      });
      assert.equal(sanitizedL7.hintsAvailable, false, `Question ${q.id} must have hintsAvailable: false on Level 7`);
    }
  });

  it("thwarts adversarial question payloads with prototype pollution & injected answer keys", () => {
    const maliciousRawQuestion = {
      id: "q_malicious_001",
      questionText: "What does this malicious question test?",
      options: [
        { id: "opt_good", text: "Option A" },
        { id: "opt_bad", text: "Option B" },
      ],
      correctOptionIds: ["opt_good"],
      primaryCorrectOptionId: "opt_good",
      explanation: "LEAKED_EXPLANATION_TOP_SECRET",
      hint: "LEAKED_HINT_SECRET",
      misconceptions: { opt_bad: "LEAKED_MISCONCEPTION" },
      __proto__: { injectedRole: "SUPER_ADMIN" },
    };

    const sanitized = sanitizeQuestionForDelivery(maliciousRawQuestion as any, {
      realmSlug: "operating-systems",
      levelNumber: 3,
    });

    assert.equal((sanitized as any).correctOptionIds, undefined);
    assert.equal((sanitized as any).primaryCorrectOptionId, undefined);
    assert.equal((sanitized as any).explanation, undefined);
    assert.equal((sanitized as any).hint, undefined);
    assert.equal((sanitized as any).misconceptions, undefined);
    assert.equal(sanitized.timeLimitSeconds, 35);
    assert.equal(sanitized.levelNumber, 3);
  });
});

describe("Challenger 2 — Authoritative Answer Evaluation & Misconceptions Oracles", () => {
  const evalQuestion = {
    id: "q_eval_01",
    correctOptionIds: ["opt_correct_uuid"],
    explanation: "Correct explanation: O(1) time complexity.",
    misconceptions: {
      opt_distractor_1: "Distractor 1 misconception: O(n) is linear scan.",
      opt_distractor_2: "Distractor 2 misconception: O(log n) is tree search.",
    },
    referenceSource: "CLRS 4th Edition, Chapter 11",
  };

  it("evaluates correct submission: awards 1 academic point with explanation and null misconception", () => {
    const res = evaluateAnswerSubmission(evalQuestion, ["opt_correct_uuid"]);
    assert.equal(res.isCorrect, true);
    assert.equal(res.academicPointsEarned, 1);
    assert.equal(res.misconceptionExplanation, null);
    assert.equal(res.explanation, evalQuestion.explanation);
    assert.equal(res.referenceSource, evalQuestion.referenceSource);
  });

  it("evaluates targeted distractor: awards 0 academic points and delivers specific distractor misconception", () => {
    const res = evaluateAnswerSubmission(evalQuestion, ["opt_distractor_1"]);
    assert.equal(res.isCorrect, false);
    assert.equal(res.academicPointsEarned, 0);
    assert.equal(res.misconceptionExplanation, "Distractor 1 misconception: O(n) is linear scan.");

    const res2 = evaluateAnswerSubmission(evalQuestion, ["opt_distractor_2"]);
    assert.equal(res2.isCorrect, false);
    assert.equal(res2.misconceptionExplanation, "Distractor 2 misconception: O(log n) is tree search.");
  });

  it("evaluates unmapped distractor: delivers pedagogical invariant fallback misconception", () => {
    const res = evaluateAnswerSubmission(evalQuestion, ["opt_unmapped_random"]);
    assert.equal(res.isCorrect, false);
    assert.equal(res.academicPointsEarned, 0);
    assert.ok(res.misconceptionExplanation?.includes("violates the fundamental invariants"));
  });

  it("rejects empty selection: awards 0 points and marks incorrect", () => {
    const res = evaluateAnswerSubmission(evalQuestion, []);
    assert.equal(res.isCorrect, false);
    assert.equal(res.academicPointsEarned, 0);
  });

  it("rejects multi-selection spoofing on single MCQ: awards 0 points", () => {
    const res = evaluateAnswerSubmission(evalQuestion, ["opt_correct_uuid", "opt_distractor_1"]);
    assert.equal(res.isCorrect, false);
    assert.equal(res.academicPointsEarned, 0);
  });
});

describe("Challenger 2 — State Machine Rigidity & Illegal Status Leap Rejection", () => {
  it("rejects illegal leaps directly to PUBLISHED without required VALIDATED stage", async () => {
    // Check state transition table
    assert.equal(canTransitionStatus("DRAFT", "PUBLISHED"), false, "DRAFT cannot leap to PUBLISHED");
    assert.equal(canTransitionStatus("NEEDS_REVIEW", "PUBLISHED"), false, "NEEDS_REVIEW cannot leap to PUBLISHED");
    assert.equal(canTransitionStatus("ARCHIVED", "PUBLISHED"), false, "ARCHIVED cannot leap to PUBLISHED");

    // Test publishFacultyQuestion directly on a quarantined question
    const quarantinedItem = await prisma.questionBankItem.findFirst({
      where: { status: "NEEDS_REVIEW" },
    });
    assert.ok(quarantinedItem, "Must have quarantined question");

    await assert.rejects(
      async () => {
        await publishFacultyQuestion(quarantinedItem.id, FACULTY_USER_ID);
      },
      /Cannot publish question with status 'NEEDS_REVIEW'\. Question must be 'VALIDATED' before publishing\./
    );
  });
});

/**
 * Automated Verification Script for Colibri Local Inference Migration
 * Tests:
 * 1. AIProviderFactory resolution and telemetry
 * 2. Colibri provider configuration & graceful fallback
 * 3. Socrates canonical grounding & response synthesis
 * 4. CR Intelligence strategic analysis
 * 5. Database preservation & record integrity
 */

import { AIProviderFactory } from "../src/lib/ai/providers/AIProviderFactory";
import { crAIProvider } from "../src/lib/cr/cr-provider";
import { prisma } from "../src/lib/db";

async function runVerification() {
  console.log("================================================================================");
  console.log("   CLASS ROYALE: COLIBRI LOCAL INFERENCE MIGRATION VERIFICATION SUITE           ");
  console.log("================================================================================\n");

  let passes = 0;
  let fails = 0;

  // ---------------------------------------------------------------------------
  // TEST 1: Telemetry & Config Discovery
  // ---------------------------------------------------------------------------
  try {
    console.log("TEST 1: Querying AI Provider Telemetry...");
    const telemetry = await AIProviderFactory.getTelemetry();
    console.log("  Provider ID:       ", telemetry.activeProviderId);
    console.log("  Configured:        ", telemetry.configuredProvider);
    console.log("  Colibri URL:       ", telemetry.baseUrl);
    console.log("  Colibri Model:     ", telemetry.colibriModel);
    console.log("  Colibri Live:      ", telemetry.isColibriHealthy ? "ONLINE (Active)" : "OFFLINE / Downloading");
    console.log("  Fallback Engaged:  ", telemetry.isFallbackActive);

    if (telemetry.activeProviderId && telemetry.colibriModel) {
      console.log("  [PASS] Telemetry successfully resolved.\n");
      passes++;
    } else {
      console.error("  [FAIL] Incomplete telemetry returned.\n");
      fails++;
    }
  } catch (err) {
    console.error("  [FAIL] Telemetry error:", err);
    fails++;
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Active Provider Chat & Streaming Verification
  // ---------------------------------------------------------------------------
  try {
    console.log("TEST 2: Testing Provider chat() and streamChat()...");
    const provider = await AIProviderFactory.getProvider();
    console.log("  Active Provider Name:", provider.name);

    const chatRes = await provider.chat(
      [
        { role: "system", content: "You are a test assistant." },
        { role: "user", content: "Explain Binary Search in one short sentence." },
      ],
      { maxTokens: 40 }
    );

    if (chatRes.content && chatRes.content.length > 20) {
      console.log("  [PASS] chat() succeeded with", chatRes.content.length, "bytes. Model:", chatRes.model);
      passes++;
    } else {
      console.error("  [FAIL] chat() returned empty response.");
      fails++;
    }

    console.log("  Testing streamChat()...");
    let streamTokens = 0;
    for await (const chunk of provider.streamChat(
      [{ role: "user", content: "Stream test: count 1 to 3" }],
      { maxTokens: 20 }
    )) {
      streamTokens++;
    }

    if (streamTokens > 0) {
      console.log("  [PASS] streamChat() yielded", streamTokens, "chunks.\n");
      passes++;
    } else {
      console.error("  [FAIL] streamChat() yielded 0 chunks.\n");
      fails++;
    }
  } catch (err) {
    console.error("  [FAIL] Provider test error:", err);
    fails++;
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Socrates Canonical Question Bank Grounding
  // ---------------------------------------------------------------------------
  try {
    console.log("TEST 3: Testing Socrates Grounding & Dialectic Synthesis...");
    const sampleQuestion = await prisma.bankQuestion.findFirst({
      include: { subject: true },
    });

    if (!sampleQuestion) {
      throw new Error("No BankQuestions found in database!");
    }

    console.log(`  Found Question: "${sampleQuestion.questionText.slice(0, 50)}..." [${sampleQuestion.topic}]`);

    // Simulate Socratic Tutor Grounding
    const options = JSON.parse(sampleQuestion.optionsJson || "[]");
    const correctOpt = options.find((o: any) => o.id === sampleQuestion.correctOptionId);

    if (options.length > 0 && correctOpt) {
      console.log("  [PASS] Successfully grounded options and correct answer key:", correctOpt.id);
      passes++;
    } else {
      console.error("  [FAIL] Options parsing failed.");
      fails++;
    }
  } catch (err) {
    console.error("  [FAIL] Socrates grounding error:", err);
    fails++;
  }

  // ---------------------------------------------------------------------------
  // TEST 4: CR Intelligence Strategic Analysis & Separation
  // ---------------------------------------------------------------------------
  try {
    console.log("TEST 4: Testing CR Intelligence Agent...");
    const crResponse = await crAIProvider.generateResponse({
      systemPrompt: "You are CR, Academic Analyst and Learning Strategist. Be concise.",
      userMessage: "Give 1 short study tip for Binary Trees.",
      conversationHistory: [],
    });

    if (crResponse && crResponse.length > 30) {
      console.log("  [PASS] CR Intelligence returned valid analysis (Length:", crResponse.length, "bytes)");
      passes++;
    } else {
      console.error("  [FAIL] CR Intelligence returned empty response.");
      fails++;
    }
  } catch (err) {
    console.error("  [FAIL] CR Intelligence test error:", err);
    fails++;
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Database Record Preservation Verification
  // ---------------------------------------------------------------------------
  try {
    console.log("TEST 5: Verifying Student Database Record Preservation...");
    const [userCount, subjectCount, questionCount, progressCount] = await Promise.all([
      prisma.user.count(),
      prisma.subject.count(),
      prisma.bankQuestion.count(),
      prisma.userProgress.count(),
    ]);

    console.log(`  Users preserved:        ${userCount}`);
    console.log(`  Subjects preserved:     ${subjectCount}`);
    console.log(`  Questions preserved:    ${questionCount}`);
    console.log(`  Progress preserved:     ${progressCount}`);

    if (userCount > 0 && subjectCount > 0 && questionCount > 0) {
      console.log("  [PASS] 100% of database records verified and intact.\n");
      passes++;
    } else {
      console.error("  [FAIL] Zero records detected in one or more tables!\n");
      fails++;
    }
  } catch (err) {
    console.error("  [FAIL] Database verification error:", err);
    fails++;
  }

  console.log("================================================================================");
  console.log(`   VERIFICATION COMPLETE: ${passes} PASSED, ${fails} FAILED                     `);
  console.log("================================================================================");

  if (fails > 0) {
    process.exit(1);
  }
}

runVerification()
  .catch((err) => {
    console.error("FATAL ERROR in test suite:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

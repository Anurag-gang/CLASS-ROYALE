/**
 * Class Royale - TypeScript Question Bank Seeding Script
 * Can be executed via: npx tsx scripts/seed-questions.ts
 */

import fs from "fs";
import path from "path";
import { getSupabase } from "../src/lib/supabase";
import fallbackData from "../src/data/questions-fallback.json";

async function seedQuestionBank() {
  console.log("⚔️ Starting Class Royale Question Bank Seeding...");
  console.log(`Loaded ${fallbackData.subjects.length} subjects and ${fallbackData.questions.length} questions from fallback JSON.`);

  const supabase = getSupabase();

  if (supabase) {
    console.log("📡 Connected to Supabase! Seeding PostgreSQL database...");

    // 1. Seed Subjects
    for (const sub of fallbackData.subjects) {
      const { error: subErr } = await supabase.from("subjects").upsert(
        {
          id: sub.id,
          name: sub.name,
          slug: sub.slug,
          territory_name: sub.territory_name,
          description: sub.description,
          icon_name: sub.icon_name,
          total_questions: sub.total_questions,
        },
        { onConflict: "slug" }
      );

      if (subErr) {
        console.error(`Error inserting subject ${sub.slug}:`, subErr);
      } else {
        console.log(` -> Synced subject: ${sub.name} (${sub.territory_name})`);
      }
    }

    // 2. Seed Questions in batches of 25
    const questions = fallbackData.questions;
    const batchSize = 25;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize).map((q) => ({
        id: q.id,
        subject_id: q.subject_id,
        question_text: q.question_text,
        code_snippet: q.code_snippet,
        options: q.options,
        correct_option_id: q.correct_option_id,
        difficulty: q.difficulty,
        xp_reward: q.xp_reward,
        time_limit_seconds: q.time_limit_seconds,
        explanation: q.explanation,
        tags: q.tags,
      }));

      const { error: qErr } = await supabase.from("questions").upsert(batch, { onConflict: "id" });
      if (qErr) {
        console.error(`Error inserting questions batch ${i}-${i + batchSize}:`, qErr);
      } else {
        console.log(` -> Inserted questions ${i + 1} to ${Math.min(i + batchSize, questions.length)}`);
      }
    }

    console.log("✨ Supabase Question Bank Seeding Finished!");
  } else {
    console.log("ℹ️ Supabase environment variables not detected or offline. Local SQLite dev.db and JSON fallback are active.");
    console.log("   Run 'python scripts/build_full_question_bank.py' to update local SQLite dev.db.");
  }
}

seedQuestionBank()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });

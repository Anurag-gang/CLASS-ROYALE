#!/usr/bin/env python3
"""
Complete Question Bank Compiler & Database Seeder for Class Royale.
Generates:
1. src/data/questions-fallback.json
2. supabase/seed.sql
3. Direct SQLite database synchronization into dev.db
"""

import os
import json
import uuid
import sqlite3
import sys

# Ensure root and scripts dir are on python sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

try:
    from questions_dsa import DSA_QUESTIONS
    from questions_dbms import DBMS_QUESTIONS
    from questions_os import OS_QUESTIONS
    from questions_cn import CN_QUESTIONS
    from questions_ai import AI_QUESTIONS
    from questions_web import WEB_QUESTIONS
except ImportError:
    from scripts.questions_dsa import DSA_QUESTIONS
    from scripts.questions_dbms import DBMS_QUESTIONS
    from scripts.questions_os import OS_QUESTIONS
    from scripts.questions_cn import CN_QUESTIONS
    from scripts.questions_ai import AI_QUESTIONS
    from scripts.questions_web import WEB_QUESTIONS

SUBJECTS = [
    {
        "id": "a0000001-0000-0000-0000-000000000001",
        "name": "Data Structures & Algorithms",
        "slug": "data-structures-and-algorithms",
        "territory_name": "The Citadel of Algorithms",
        "description": "Master balance factors, dynamic programming state spaces, recursion trees, and asymptotic time bounds.",
        "icon_name": "BinaryTree",
        "raw_questions": DSA_QUESTIONS,
    },
    {
        "id": "a0000001-0000-0000-0000-000000000002",
        "name": "Database Management Systems",
        "slug": "database-management-systems",
        "territory_name": "The Vault of Relational Lore",
        "description": "Conquer relational algebra, ACID transaction guarantees, B-tree indexes, and BCNF normalization.",
        "icon_name": "Database",
        "raw_questions": DBMS_QUESTIONS,
    },
    {
        "id": "a0000001-0000-0000-0000-000000000003",
        "name": "Operating Systems",
        "slug": "operating-systems",
        "territory_name": "The Core Kernel Fortress",
        "description": "Survive virtual memory page tables, semaphore synchronization, race conditions, and deadlocks.",
        "icon_name": "Cpu",
        "raw_questions": OS_QUESTIONS,
    },
    {
        "id": "a0000001-0000-0000-0000-000000000004",
        "name": "Computer Networks",
        "slug": "computer-networks",
        "territory_name": "The Whispering Wirelands",
        "description": "Traverse the 7-layer OSI stacks, TCP congestion windows (BBR/Cubic), packet routing, and subnet topologies.",
        "icon_name": "Network",
        "raw_questions": CN_QUESTIONS,
    },
    {
        "id": "a0000001-0000-0000-0000-000000000005",
        "name": "Artificial Intelligence & Machine Learning",
        "slug": "ai-and-machine-learning",
        "territory_name": "The Neural Sanctum",
        "description": "Command neural weights, gradient descent loss surfaces, transformer attention heads, and Markov decision processes.",
        "icon_name": "Brain",
        "raw_questions": AI_QUESTIONS,
    },
    {
        "id": "a0000001-0000-0000-0000-000000000006",
        "name": "Web Development & DevOps",
        "slug": "web-dev-and-devops",
        "territory_name": "The Cloud Spire Bastion",
        "description": "Architect resilient microservices, Docker containers, Kubernetes ingress, CI/CD pipelines, and async event streams.",
        "icon_name": "Cloud",
        "raw_questions": WEB_QUESTIONS,
    },
]

print("Compiling Question Bank Dataset across 6 core subjects...")

compiled_subjects = []
all_compiled_questions = []

for sub_idx, sub in enumerate(SUBJECTS, start=1):
    sub_id = sub["id"]
    sub_questions = []
    
    easy_count = 0
    medium_count = 0
    hard_count = 0
    boss_count = 0
    total_xp = 0

    for q_idx, q in enumerate(sub["raw_questions"], start=1):
        q_uuid = f"b000000{sub_idx}-{q_idx:04d}-0000-0000-000000000000"
        
        diff = q["difficulty"]
        if diff == "Easy":
            easy_count += 1
        elif diff == "Medium":
            medium_count += 1
        elif diff == "Hard":
            hard_count += 1
        elif diff == "Boss":
            boss_count += 1
        
        xp = q["xp_reward"]
        total_xp += xp

        compiled_q = {
            "id": q_uuid,
            "subject_id": sub_id,
            "subject_slug": sub["slug"],
            "subject_name": sub["name"],
            "territory_name": sub["territory_name"],
            "question_text": q["question_text"],
            "code_snippet": q.get("code_snippet"),
            "options": q["options"],
            "correct_option_id": q["correct_option_id"],
            "difficulty": q["difficulty"],
            "xp_reward": q["xp_reward"],
            "time_limit_seconds": q["time_limit_seconds"],
            "explanation": q["explanation"],
            "tags": q["tags"],
        }
        sub_questions.append(compiled_q)
        all_compiled_questions.append(compiled_q)

    compiled_subject = {
        "id": sub_id,
        "name": sub["name"],
        "slug": sub["slug"],
        "territory_name": sub["territory_name"],
        "description": sub["description"],
        "icon_name": sub["icon_name"],
        "total_questions": len(sub_questions),
        "total_xp": total_xp,
        "difficulty_counts": {
            "Easy": easy_count,
            "Medium": medium_count,
            "Hard": hard_count,
            "Boss": boss_count,
        },
        "questions": sub_questions,
    }
    compiled_subjects.append(compiled_subject)
    print(f" -> [{sub['name']}] ({sub['territory_name']}): {len(sub_questions)} questions (Easy: {easy_count}, Med: {medium_count}, Hard: {hard_count}, Boss: {boss_count}) | Total XP: {total_xp}")

print(f"\nTotal Subjects: {len(compiled_subjects)}")
print(f"Total Questions: {len(all_compiled_questions)}")

# -----------------------------------------------------------------------------
# 1. WRITE src/data/questions-fallback.json
# -----------------------------------------------------------------------------
fallback_payload = {
    "version": "1.0.0",
    "updated_at": "2026-10-30T00:00:00Z",
    "subjects_count": len(compiled_subjects),
    "questions_count": len(all_compiled_questions),
    "subjects": [
        {
            "id": s["id"],
            "name": s["name"],
            "slug": s["slug"],
            "territory_name": s["territory_name"],
            "description": s["description"],
            "icon_name": s["icon_name"],
            "total_questions": s["total_questions"],
            "total_xp": s["total_xp"],
            "difficulty_counts": s["difficulty_counts"],
        }
        for s in compiled_subjects
    ],
    "questions": all_compiled_questions,
}

fallback_json_path = os.path.join(os.getcwd(), "src", "data", "questions-fallback.json")
os.makedirs(os.path.dirname(fallback_json_path), exist_ok=True)
with open(fallback_json_path, "w", encoding="utf-8") as f:
    json.dump(fallback_payload, f, indent=2)

print(f" Successfully exported fallback JSON: {fallback_json_path} ({os.path.getsize(fallback_json_path) / 1024:.2f} KB)")

# -----------------------------------------------------------------------------
# 2. WRITE supabase/seed.sql
# -----------------------------------------------------------------------------
def escape_sql_string(s: str) -> str:
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"

seed_sql_lines = [
    "-- =============================================================================",
    "-- CLASS ROYALE: Question Bank Production Seed Data",
    "-- Target: Supabase / PostgreSQL 14+",
    f"-- Total Subjects: {len(compiled_subjects)} | Total Questions: {len(all_compiled_questions)}",
    "-- =============================================================================\n",
    "-- 1. CLEAN EXISTING QUESTION BANK RECORDS",
    "TRUNCATE TABLE questions CASCADE;",
    "TRUNCATE TABLE subjects CASCADE;\n",
    "-- 2. SEED SUBJECTS",
]

for s in compiled_subjects:
    s_id = escape_sql_string(s["id"])
    s_name = escape_sql_string(s["name"])
    s_slug = escape_sql_string(s["slug"])
    s_terr = escape_sql_string(s["territory_name"])
    s_desc = escape_sql_string(s["description"])
    s_icon = escape_sql_string(s["icon_name"])
    s_total = s["total_questions"]
    seed_sql_lines.append(
        f"INSERT INTO subjects (id, name, slug, territory_name, description, icon_name, total_questions) "
        f"VALUES ({s_id}, {s_name}, {s_slug}, {s_terr}, {s_desc}, {s_icon}, {s_total}) "
        f"ON CONFLICT (slug) DO UPDATE SET "
        f"name = EXCLUDED.name, territory_name = EXCLUDED.territory_name, description = EXCLUDED.description, "
        f"icon_name = EXCLUDED.icon_name, total_questions = EXCLUDED.total_questions;"
    )

seed_sql_lines.append("\n-- 3. SEED QUESTIONS")

for q in all_compiled_questions:
    q_id = escape_sql_string(q["id"])
    q_sub = escape_sql_string(q["subject_id"])
    q_text = escape_sql_string(q["question_text"])
    q_code = escape_sql_string(q["code_snippet"]) if q["code_snippet"] else "NULL"
    q_opts = escape_sql_string(json.dumps(q["options"]))
    q_ans = escape_sql_string(q["correct_option_id"])
    q_diff = escape_sql_string(q["difficulty"])
    q_xp = q["xp_reward"]
    q_time = q["time_limit_seconds"]
    q_expl = escape_sql_string(q["explanation"])
    
    # Format tags for Postgres text[] literal e.g. ARRAY['Binary Search', 'Trees']
    tag_elements = ", ".join(escape_sql_string(t) for t in q["tags"])
    q_tags = f"ARRAY[{tag_elements}]::text[]"

    seed_sql_lines.append(
        f"INSERT INTO questions (id, subject_id, question_text, code_snippet, options, correct_option_id, difficulty, xp_reward, time_limit_seconds, explanation, tags) "
        f"VALUES ({q_id}, {q_sub}, {q_text}, {q_code}, {q_opts}::jsonb, {q_ans}, {q_diff}, {q_xp}, {q_time}, {q_expl}, {q_tags});"
    )

seed_sql_path = os.path.join(os.getcwd(), "supabase", "seed.sql")
os.makedirs(os.path.dirname(seed_sql_path), exist_ok=True)
with open(seed_sql_path, "w", encoding="utf-8") as f:
    f.write("\n".join(seed_sql_lines))

print(f" Successfully exported Supabase SQL seed: {seed_sql_path} ({os.path.getsize(seed_sql_path) / 1024:.2f} KB)")

# -----------------------------------------------------------------------------
# 3. DIRECT SEEDING INTO LOCAL dev.db (SQLite)
# -----------------------------------------------------------------------------
db_path = "dev.db"
if not os.path.exists(db_path):
    db_path = "prisma/dev.db"

if os.path.exists(db_path):
    print(f"Connecting to SQLite database: {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Ensure tables exist in SQLite
    cur.execute("""
    CREATE TABLE IF NOT EXISTS TerritorySubject (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        territoryName TEXT NOT NULL,
        description TEXT NOT NULL,
        iconName TEXT NOT NULL DEFAULT 'BookOpen',
        totalQuestions INTEGER NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS BankQuestion (
        id TEXT PRIMARY KEY,
        subjectId TEXT NOT NULL,
        questionText TEXT NOT NULL,
        codeSnippet TEXT,
        optionsJson TEXT NOT NULL,
        correctOptionId TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        xpReward INTEGER NOT NULL DEFAULT 50,
        timeLimitSeconds INTEGER NOT NULL DEFAULT 45,
        explanation TEXT NOT NULL,
        tagsJson TEXT NOT NULL DEFAULT '[]',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subjectId) REFERENCES TerritorySubject(id) ON DELETE CASCADE
    );
    """)

    # Clean old bank tables
    cur.execute("DELETE FROM BankQuestion;")
    cur.execute("DELETE FROM TerritorySubject;")

    # Insert Territory Subjects
    for s in compiled_subjects:
        cur.execute("""
        INSERT INTO TerritorySubject (id, name, slug, territoryName, description, iconName, totalQuestions, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));
        """, (s["id"], s["name"], s["slug"], s["territory_name"], s["description"], s["icon_name"], s["total_questions"]))

    # Insert Bank Questions
    for q in all_compiled_questions:
        cur.execute("""
        INSERT INTO BankQuestion (id, subjectId, questionText, codeSnippet, optionsJson, correctOptionId, difficulty, xpReward, timeLimitSeconds, explanation, tagsJson, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));
        """, (
            q["id"],
            q["subject_id"],
            q["question_text"],
            q["code_snippet"],
            json.dumps(q["options"]),
            q["correct_option_id"],
            q["difficulty"],
            q["xp_reward"],
            q["time_limit_seconds"],
            q["explanation"],
            json.dumps(q["tags"]),
        ))

    conn.commit()
    conn.close()
    print(f" Successfully seeded SQLite {db_path} with {len(compiled_subjects)} subjects and {len(all_compiled_questions)} questions!")
else:
    print(f" Warning: SQLite database {db_path} not found directly, fallback JSON will power local mode.")

print("\n Question Bank Generation & Seeding Complete!")

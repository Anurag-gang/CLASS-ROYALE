-- =============================================================================
-- CLASS ROYALE: Question Bank & Territory Knowledge Engine Schema Migration
-- Migration: 001_question_bank_schema.sql
-- Targets: Supabase / PostgreSQL 14+
-- =============================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. SUBJECTS (Territory Map & Knowledge Domains)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    territory_name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL DEFAULT 'BookOpen',
    total_questions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. QUESTIONS (Question Bank & Battle Arena Trials)
-- -----------------------------------------------------------------------------
-- Ensure difficulty enum or check constraint
DO $$ BEGIN
    CREATE TYPE question_difficulty_level AS ENUM ('Easy', 'Medium', 'Hard', 'Boss');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    code_snippet TEXT,
    options JSONB NOT NULL,
    correct_option_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard', 'Boss')),
    xp_reward INTEGER NOT NULL DEFAULT 50,
    time_limit_seconds INTEGER NOT NULL DEFAULT 45,
    explanation TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Invariant: correct_option_id must match one of A, B, C, D
    CONSTRAINT valid_option_id CHECK (correct_option_id IN ('A', 'B', 'C', 'D'))
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES FOR SUB-MILLISECOND QUERY PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions (subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty ON questions (subject_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_subjects_slug ON subjects (slug);

-- -----------------------------------------------------------------------------
-- 4. AUTOMATIC QUESTION COUNT SYNCHRONIZATION TRIGGER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_subject_total_questions()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE subjects
        SET total_questions = total_questions + 1,
            updated_at = now()
        WHERE id = NEW.subject_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE subjects
        SET total_questions = GREATEST(0, total_questions - 1),
            updated_at = now()
        WHERE id = OLD.subject_id;
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (NEW.subject_id <> OLD.subject_id) THEN
            UPDATE subjects SET total_questions = GREATEST(0, total_questions - 1), updated_at = now() WHERE id = OLD.subject_id;
            UPDATE subjects SET total_questions = total_questions + 1, updated_at = now() WHERE id = NEW.subject_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_subject_questions ON questions;
CREATE TRIGGER trigger_sync_subject_questions
AFTER INSERT OR UPDATE OR DELETE ON questions
FOR EACH ROW EXECUTE FUNCTION sync_subject_total_questions();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to subjects for all authenticated & anonymous users
CREATE POLICY "Allow public read on subjects"
ON subjects FOR SELECT
USING (true);

-- Allow public read access to questions for battle arena and practice sessions
CREATE POLICY "Allow public read on questions"
ON questions FOR SELECT
USING (true);

-- Allow faculty & admin roles to insert, update, delete subjects
CREATE POLICY "Allow faculty/admin modification on subjects"
ON subjects FOR ALL
TO authenticated
USING (
    COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('faculty', 'FACULTY', 'admin', 'ADMIN', 'SUPER_ADMIN')
)
WITH CHECK (
    COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('faculty', 'FACULTY', 'admin', 'ADMIN', 'SUPER_ADMIN')
);

-- Allow faculty & admin roles to insert, update, delete questions
CREATE POLICY "Allow faculty/admin modification on questions"
ON questions FOR ALL
TO authenticated
USING (
    COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('faculty', 'FACULTY', 'admin', 'ADMIN', 'SUPER_ADMIN')
)
WITH CHECK (
    COALESCE(auth.jwt() ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role') IN ('faculty', 'FACULTY', 'admin', 'ADMIN', 'SUPER_ADMIN')
);

-- Add instructor read policies so instructors can view all student data
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Helper function to check instructor role (SECURITY DEFINER bypasses RLS
-- to avoid recursive self-reference on the profiles table)
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'instructor'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Instructors can read all profiles
DROP POLICY IF EXISTS "Instructors can read all profiles" ON profiles;
CREATE POLICY "Instructors can read all profiles"
  ON profiles FOR SELECT
  USING (is_instructor());

-- Instructors can read all section progress
DROP POLICY IF EXISTS "Instructors can read all progress" ON section_progress;
CREATE POLICY "Instructors can read all progress"
  ON section_progress FOR SELECT
  USING (is_instructor());

-- Instructors can read all quiz attempts
DROP POLICY IF EXISTS "Instructors can read all quiz attempts" ON quiz_attempts;
CREATE POLICY "Instructors can read all quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (is_instructor());

-- Instructors can read all free text responses
DROP POLICY IF EXISTS "Instructors can read all free text responses" ON free_text_responses;
CREATE POLICY "Instructors can read all free text responses"
  ON free_text_responses FOR SELECT
  USING (is_instructor());

-- Instructors can read all assignment drafts
DROP POLICY IF EXISTS "Instructors can read all assignment drafts" ON assignment_drafts;
CREATE POLICY "Instructors can read all assignment drafts"
  ON assignment_drafts FOR SELECT
  USING (is_instructor());

-- Instructors can read all AI interactions
DROP POLICY IF EXISTS "Instructors can read all ai interactions" ON ai_interactions;
CREATE POLICY "Instructors can read all ai interactions"
  ON ai_interactions FOR SELECT
  USING (is_instructor());

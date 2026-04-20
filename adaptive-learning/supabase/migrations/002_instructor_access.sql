-- Instructor Access Policies
-- Run this in the Supabase SQL Editor to allow instructors to view all student data

-- Instructors can read all profiles
CREATE POLICY "Instructors can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'
    )
  );

-- Instructors can read all section progress
CREATE POLICY "Instructors can read all progress"
  ON section_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'
    )
  );

-- Instructors can read all quiz attempts
CREATE POLICY "Instructors can read all quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'
    )
  );

-- Instructors can read all free text responses
CREATE POLICY "Instructors can read all free text"
  ON free_text_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'
    )
  );

-- Instructors can read all assignment drafts
CREATE POLICY "Instructors can read all drafts"
  ON assignment_drafts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'
    )
  );

-- Instructors can read all AI interactions
CREATE POLICY "Instructors can read all ai interactions"
  ON ai_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'
    )
  );

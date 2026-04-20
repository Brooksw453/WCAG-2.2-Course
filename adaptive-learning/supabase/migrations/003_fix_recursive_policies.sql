-- Fix: Infinite recursion in instructor RLS policies
-- The old policies checked profiles table from within profiles policies, causing recursion.
-- Solution: Use a SECURITY DEFINER function that bypasses RLS to check instructor role.

-- Step 1: Create a helper function that bypasses RLS to check if the current user is an instructor
CREATE OR REPLACE FUNCTION is_instructor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop the old recursive policies
DROP POLICY IF EXISTS "Instructors can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Instructors can read all progress" ON section_progress;
DROP POLICY IF EXISTS "Instructors can read all quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Instructors can read all free text" ON free_text_responses;
DROP POLICY IF EXISTS "Instructors can read all drafts" ON assignment_drafts;
DROP POLICY IF EXISTS "Instructors can read all ai interactions" ON ai_interactions;

-- Step 3: Recreate policies using the helper function (no recursion)
CREATE POLICY "Instructors can read all profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_instructor());

CREATE POLICY "Instructors can read all progress"
  ON section_progress FOR SELECT
  USING (auth.uid() = user_id OR is_instructor());

CREATE POLICY "Instructors can read all quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id OR is_instructor());

CREATE POLICY "Instructors can read all free text"
  ON free_text_responses FOR SELECT
  USING (auth.uid() = user_id OR is_instructor());

CREATE POLICY "Instructors can read all drafts"
  ON assignment_drafts FOR SELECT
  USING (auth.uid() = user_id OR is_instructor());

CREATE POLICY "Instructors can read all ai interactions"
  ON ai_interactions FOR SELECT
  USING (auth.uid() = user_id OR is_instructor());

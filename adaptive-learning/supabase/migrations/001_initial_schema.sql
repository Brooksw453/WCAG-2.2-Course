-- Adaptive Learning Platform - Initial Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ============================================================
-- 1. Profiles (extends Supabase Auth users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. Section Progress (tracks student mastery per section)
-- ============================================================
CREATE TABLE section_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id INTEGER NOT NULL,
  section_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'needs_remediation', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  mastery_score NUMERIC(5,2),
  remediation_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, chapter_id, section_id)
);

-- ============================================================
-- 3. Quiz Attempts (gate check results)
-- ============================================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id INTEGER NOT NULL,
  section_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL,
  answers JSONB NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quiz_attempts_user_section
  ON quiz_attempts(user_id, chapter_id, section_id);

-- ============================================================
-- 4. Free-Text Responses (evaluated by Claude)
-- ============================================================
CREATE TABLE free_text_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id INTEGER NOT NULL,
  section_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  response_text TEXT NOT NULL,
  ai_evaluation JSONB,
  ai_model TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_free_text_user_section
  ON free_text_responses(user_id, chapter_id, section_id);

-- ============================================================
-- 5. Assignment Drafts (AI coaching history)
-- ============================================================
CREATE TABLE assignment_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assignment_id INTEGER NOT NULL,
  section_key TEXT NOT NULL,
  draft_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  ai_feedback JSONB,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_assignment_drafts_user
  ON assignment_drafts(user_id, assignment_id);

-- ============================================================
-- 6. AI Interactions Log (for auditing and cost tracking)
-- ============================================================
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL
    CHECK (interaction_type IN ('quiz_remediation', 'free_text_eval', 'assignment_coaching', 'content_generation')),
  context JSONB NOT NULL,
  prompt_sent TEXT NOT NULL,
  response_received TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. Discussion Posts
-- ============================================================
CREATE TABLE discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id INTEGER NOT NULL,
  parent_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_quality_score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_discussion_posts_chapter
  ON discussion_posts(chapter_id, created_at);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_text_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile, instructors can read all
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Section Progress: students see own, instructors see all
CREATE POLICY "Users can read own progress"
  ON section_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON section_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON section_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Quiz Attempts: students see own
CREATE POLICY "Users can read own quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Free-Text Responses: students see own
CREATE POLICY "Users can read own free text"
  ON free_text_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own free text"
  ON free_text_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Assignment Drafts: students see own
CREATE POLICY "Users can read own drafts"
  ON assignment_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts"
  ON assignment_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Interactions: students see own
CREATE POLICY "Users can read own ai interactions"
  ON ai_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai interactions"
  ON ai_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Discussion Posts: everyone can read, users can insert/update own
CREATE POLICY "Anyone can read discussion posts"
  ON discussion_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON discussion_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON discussion_posts FOR UPDATE
  USING (auth.uid() = user_id);

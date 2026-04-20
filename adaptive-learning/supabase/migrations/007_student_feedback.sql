CREATE TABLE IF NOT EXISTS student_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  trigger_point text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own feedback" ON student_feedback
  FOR ALL USING (user_id = auth.uid());

-- Instructors can view all feedback (uses is_instructor() from migration 003)
CREATE POLICY "Instructors can view all feedback" ON student_feedback
  FOR SELECT USING (is_instructor());

-- Read receipts for announcements
CREATE TABLE IF NOT EXISTS announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES announcements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  read_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Users can manage their own read receipts
CREATE POLICY "Users can manage own read receipts" ON announcement_reads
  FOR ALL USING (user_id = auth.uid());

-- Instructors can view read receipts for own announcements
CREATE OR REPLACE FUNCTION check_instructor_for_announcement(ann_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM announcements a
    JOIN profiles p ON p.id = auth.uid()
    WHERE a.id = ann_id AND a.instructor_id = auth.uid() AND p.role = 'instructor'
  );
$$;

CREATE POLICY "Instructors can view read receipts for own announcements" ON announcement_reads
  FOR SELECT USING (check_instructor_for_announcement(announcement_id));

-- Student activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  activity_type text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own activity" ON activity_log
  FOR ALL USING (user_id = auth.uid());

-- Use is_instructor() SECURITY DEFINER function from migration 003
CREATE POLICY "Instructors can view all activity" ON activity_log
  FOR SELECT USING (is_instructor());

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_announcement ON announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user ON announcement_reads(user_id);

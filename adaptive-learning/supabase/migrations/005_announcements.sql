-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES profiles(id) NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  body text NOT NULL,
  announcement_type text NOT NULL DEFAULT 'class',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Instructors can manage their own announcements
CREATE POLICY "Instructors can manage own announcements" ON announcements
  FOR ALL USING (instructor_id = auth.uid());

-- Use SECURITY DEFINER to avoid recursion with class_enrollments
CREATE OR REPLACE FUNCTION check_announcement_access(ann_class_id uuid, ann_recipient_id uuid, ann_type text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN ann_type = 'individual' AND ann_recipient_id = auth.uid() THEN true
    WHEN ann_type = 'class' AND EXISTS (
      SELECT 1 FROM class_enrollments WHERE class_id = ann_class_id AND student_id = auth.uid()
    ) THEN true
    ELSE false
  END;
$$;

CREATE POLICY "Students can see their announcements" ON announcements
  FOR SELECT USING (check_announcement_access(class_id, recipient_id, announcement_type));

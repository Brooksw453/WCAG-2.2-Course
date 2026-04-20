-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid REFERENCES profiles(id) NOT NULL,
  name text NOT NULL,
  join_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES profiles(id) NOT NULL,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- Classes policies
CREATE POLICY "Instructors can manage own classes" ON classes
  FOR ALL USING (instructor_id = auth.uid());
CREATE POLICY "Students can view classes they're enrolled in" ON classes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM class_enrollments WHERE class_id = id AND student_id = auth.uid())
  );

-- Enrollments policies
CREATE POLICY "Instructors can view enrollments for own classes" ON class_enrollments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND instructor_id = auth.uid())
  );
CREATE POLICY "Students can view own enrollments" ON class_enrollments
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can enroll themselves" ON class_enrollments
  FOR INSERT WITH CHECK (student_id = auth.uid());

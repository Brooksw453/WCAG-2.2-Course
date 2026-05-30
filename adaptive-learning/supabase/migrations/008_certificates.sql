-- Persisted, verifiable course completion certificates.
-- A record is snapshotted at issuance (student_name, grade) so the public
-- verification page is stable and never depends on a live grade recompute.
-- The row id (uuid) is the public, unguessable certificate identifier.

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  course_id text NOT NULL,
  student_name text NOT NULL,
  final_grade numeric,
  letter_grade text,
  issued_at timestamptz DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Students may read and issue their own certificate.
CREATE POLICY "Users can read own certificate" ON certificates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can issue own certificate" ON certificates
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Instructors can view all certificates (uses is_instructor() from migration 003).
CREATE POLICY "Instructors can view all certificates" ON certificates
  FOR SELECT USING (is_instructor());

-- NOTE: public verification reads go through the service-role client
-- (createAdminClient), which bypasses RLS. There is intentionally no public
-- SELECT policy — the table stays closed and is never enumerable by anon.

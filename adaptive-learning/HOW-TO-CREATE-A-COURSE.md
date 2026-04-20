# How to Create a New Course

## Prerequisites (one-time setup)

- Claude Code installed
- An Anthropic API key
- A Vercel account
- Access to the shared Supabase project credentials (same database used by all courses and the Course Dashboard)
- The `DASHBOARD_SSO_SECRET` shared secret
- Python 3 with PyMuPDF installed (`python3 -m pip install PyMuPDF`) — needed for textbook image extraction

## Step 1: Create the Course Folder

Create a new folder anywhere on your computer:

```
C:\Users\brook\Documents\GitHub\Introduction to Psychology\
```

## Step 2: Drop in the Textbook

Place the course textbook PDF (and any syllabus, assignment docs, or quiz files) into that folder.

## Step 3: Open Claude Code in That Folder

Point Claude Code at the new folder as the working directory.

## Step 4: Give Claude Code These Instructions

```
Fork the repo from https://github.com/Brooksw453/Workplace-Software-and-Skills into
an adaptive-learning subfolder in this directory, using only the course-template directory
as the source (not the adaptive-learning directory — that contains the Workplace Software
course content). Then read the CLAUDE.md file inside it — it contains the complete course
creation template.

Use that template to build a new course from the textbook PDF in this folder. Follow all
12 steps in CLAUDE.md:

1. Copy the template and install dependencies
2. Analyze the textbook (extract text with PyMuPDF if the PDF is too large to read directly)
3. Update course.config.ts with the new course identity
4. Delete existing content placeholders
5. Generate all chapter content (sections, quizzes, discussions)
5b. Extract and embed textbook images (extract-images.py → curate-images.py → update-captions.py)
6. Generate assignments (use minWords: 75 for written sections)
7. Validate content (0 errors required)
8. Build and test locally
9. Set up environment variables (shared Supabase — no new project needed)
10. Deploy to Vercel
11. Register the course on the Course Dashboard (courses table, tenant_courses table, course_outline)
12. Final verification
```

## Step 5: Configure Environment Variables

No new Supabase project needed. All courses share a single Supabase database for everything — auth, student progress, quiz attempts, assignment drafts, all of it. Migrations will mostly error because the tables already exist — this is expected.

Claude Code will create `.env.local`. Give it the same shared Supabase credentials used by your other courses and the Course Dashboard:

- `NEXT_PUBLIC_SUPABASE_URL` — shared Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — shared anon key
- `SUPABASE_SERVICE_ROLE_KEY` — shared service role key
- `ANTHROPIC_API_KEY` — your Claude API key
- `DASHBOARD_SSO_SECRET` — shared SSO secret (same as dashboard)
- `DASHBOARD_URL` — e.g. `https://courses.esdesigns.org`
- `COURSE_SLUG` — this course's slug (e.g. `introduction-to-psychology`)

## Step 6: Deploy

Claude Code will handle:

- Setting up `.env.local` with your keys
- Running `npm run build` to verify
- Creating a GitHub repo and pushing with `gh repo create`
- You connect Vercel to the GitHub repo (select root directory when prompted)
- You add a custom domain in Vercel if desired

Set the same environment variables in the Vercel dashboard.

## Step 7: Register on the Course Dashboard

In the **Course Dashboard's Supabase** (not the course app's), run:

```sql
-- 1. Insert the course
INSERT INTO courses (
  slug, title, subtitle, description, short_description,
  module_count, estimated_hours, price_cents, app_url,
  is_published, course_type, tags
) VALUES (
  'your-course-slug',
  'Course Title',
  'Adaptive Learning Platform',
  'Full description of the course.',
  'One-line description.',
  15,       -- number of chapters
  45.0,     -- estimated hours
  0,        -- price in cents (0 = free)
  'https://your-course.vercel.app',
  true,
  'course',
  ARRAY['tag1', 'tag2']
);

-- 2. Link to your tenant
INSERT INTO tenant_courses (tenant_id, course_id, is_visible, sort_order)
VALUES (
  (SELECT id FROM tenants LIMIT 1),
  (SELECT id FROM courses WHERE slug = 'your-course-slug'),
  true, 0
);

-- 3. Add the course outline (so it shows on the course detail page)
UPDATE courses SET course_outline = '[
  {"title": "Chapter 1: Title", "items": ["1.1 Section", "1.2 Section"]},
  {"title": "Chapter 2: Title", "items": ["2.1 Section", "2.2 Section"]}
]'::jsonb
WHERE slug = 'your-course-slug';
```

Claude Code can generate the exact SQL for steps 1-3 after the content is built — just ask it to write the dashboard registration SQL.

Instructor accounts are managed through the dashboard — admin/super_admin users are automatically mapped to instructor in course apps via SSO. There is no local signup/login. All auth flows through the Course Dashboard via SSO.

## What's Included in the Template

| Feature | Details |
|---------|---------|
| **Adaptive learning flow** | Gate quiz → remediation → free-text → AI evaluation per section |
| **AI tutoring** | Deep-dive explanations, assignment coaching, draft generation |
| **Textbook image extraction** | PyMuPDF pipeline: extract → curate → embed → caption |
| **Image content blocks** | `<figure>` rendering with lazy loading and captions |
| **Assignments** | 75-word minimum, AI coaching with 0-100 scoring |
| **Capstone portfolio** | Executive summary, introduction, preview/print, submit |
| **Instructor dashboard** | Student roster, class management, announcements, gradebook, CSV export |
| **SSO authentication** | Course Dashboard → JWT → magic link → session (with profile role upsert) |
| **Shared Supabase** | All courses share one database — no per-course setup |
| **Dark mode** | Full dark/light theme support |
| **Content validation** | `validate-content.ts` checks all JSON structure before deployment |

## Template Source

`https://github.com/Brooksw453/Workplace-Software-and-Skills` → `course-template/` directory

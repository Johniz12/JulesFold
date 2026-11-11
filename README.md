# LearnHub — Learning Management & Examination Platform

LearnHub is a full-stack, responsive, and secure Learning Management and Examination System built with **React**, **Vite**, standard **CSS** (no Tailwind/utility bloat), and **Supabase** (PostgreSQL, Row Level Security, and Authentication).

The architecture is designed to decouple presentation from business logic and data access, enabling future packaging as an Electron desktop application without rewriting application modules.

---

## Features

### 1. Dual User Role System
- **Administrator**:
  - Full statistical overview dashboard (total students, courses, published lessons, total examinations, recent exam submissions, and student registration log).
  - Course curriculum management (create, edit, delete, publish/unpublish, custom cover image URLs, categories).
  - Lesson syllabus authoring with Markdown support (headings, bullet/numbered lists, inline code, and code blocks) plus drag-and-drop sequence ordering.
  - Examination creator supporting **Multiple Choice** and **True/False** questions with custom point values, explanations, timer durations, passing score thresholds, maximum attempt limits, randomized questions, randomized options, and review toggles.
  - Student directory and complete examination grading ledger.
- **Student**:
  - Email/password self-registration (public signup is strictly locked to student role).
  - Learning progress overview with completion percentages and exam pass rates.
  - Course library catalog with live text search and category filtering.
  - Interactive lesson viewer with syllabus table-of-contents drawer, "Mark as Completed" tracking, and Previous/Next lesson navigation.
  - Single-question examination engine with question tracker, interactive answer selection, live countdown timer with auto-submit on expiration, and duplicate submission locks.
  - Instant examination results breakdown with score percentage, pass/fail status, and optional question-by-question review with explanations.

---

## Security Architecture

1. **Row Level Security (RLS)**:
   - Configured across all tables (`profiles`, `courses`, `lessons`, `exams`, `questions`, `enrollments`, `lesson_progress`, `exam_attempts`, `exam_answers`).
   - Students cannot read draft courses/lessons or another student's attempts.
2. **Confidential Answer Key Protection**:
   - Students cannot query the `questions` table directly.
   - Questions for students are served through the secure PostgreSQL RPC function `get_exam_questions_for_student()` which strips `correct_answer` and `explanation`.
3. **Server-Side Grading**:
   - Examination scores are **never** calculated or trusted from client-side browser submissions.
   - Submitted answers are evaluated against secret answer keys via the secure PostgreSQL RPC function `submit_and_grade_exam()` or Supabase Edge Function (`supabase/functions/grade-exam/index.ts`).
4. **Role Escalation Defense**:
   - The trigger `handle_new_user()` on `auth.users` always sets `role = 'student'`. Public users cannot grant themselves administrator privileges.

---

## Step-by-Step Supabase Setup Guide

Follow these steps to connect LearnHub to a live Supabase project:

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://app.supabase.com) and click **"New Project"**.
2. Note your **Project URL** and **anon public API Key** from **Project Settings -> API**.

### Step 2: Execute SQL Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Open `supabase/schema.sql` from this repository.
3. Paste the entire content into the SQL Editor and click **Run**.
   - This sets up all 9 tables, indexes, RLS policies, trigger-based profile creation, sanitized question retrieval RPC, and the `submit_and_grade_exam` server-side grading function.

### Step 3: Assign Initial Administrator Account
1. Register your administrator user through the LearnHub web UI (`/register`) or create the user in the Supabase **Authentication -> Users** tab.
2. In the Supabase SQL Editor, execute the script in `supabase/admin_setup.sql`:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin-email@example.com';
   ```
3. Verify the role change:
   ```sql
   SELECT id, email, full_name, role FROM public.profiles WHERE role = 'admin';
   ```

### Step 4: Configure Frontend Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Insert your actual Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
3. Restart the Vite development server:
   ```bash
   npm run dev
   ```

*Note: If no Supabase environment variables are provided, LearnHub automatically runs in Standalone Demo Mode with local persistence, pre-seeded sample courses, lessons, questions, and 1-click test role switches.*

---

## Local Development & Testing

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Automated Unit Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```
Production assets are generated in `dist/`.

---

## Netlify Deployment Configuration

LearnHub is pre-configured for static deployment on Netlify using `netlify.toml`:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

To deploy:
1. Connect your Git repository to Netlify.
2. In the Netlify site settings under **Environment variables**, set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Trigger a deploy. Single Page Application (SPA) routing is handled automatically.

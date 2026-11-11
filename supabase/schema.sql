-- ==============================================================================
-- LearnHub Database Schema & Security Policies
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Extends auth.users to store display name and application role ('student' | 'admin').
-- Default role is ALWAYS 'student'. Public registration NEVER grants 'admin'.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies:
-- Users can read their own profile; admins can read all profiles
CREATE POLICY "Profiles viewable by self or admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Users can only update their own non-role fields
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent escalating role from client side
    (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  );

-- Admin can manage all profiles
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Automatic profile creation on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student' -- ALWAYS student!
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  cover_image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (is_published = true OR public.is_admin());

CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. LESSONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  sequence INT NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_seq ON public.lessons (course_id, sequence);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published lessons of published courses"
  ON public.lessons FOR SELECT
  USING (
    public.is_admin() OR (
      is_published = true AND
      EXISTS (SELECT 1 FROM public.courses WHERE id = lessons.course_id AND is_published = true)
    )
  );

CREATE POLICY "Admins can manage lessons"
  ON public.lessons FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. EXAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 30, -- 0 for unlimited
  passing_percentage INT NOT NULL DEFAULT 70 CHECK (passing_percentage BETWEEN 0 AND 100),
  max_attempts INT NOT NULL DEFAULT 3, -- 0 for unlimited
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  review_answers_enabled BOOLEAN NOT NULL DEFAULT true,
  randomize_questions BOOLEAN NOT NULL DEFAULT false,
  randomize_options BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view enabled exams"
  ON public.exams FOR SELECT
  USING (is_enabled = true OR public.is_admin());

CREATE POLICY "Admins can manage exams"
  ON public.exams FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. QUESTIONS TABLE
-- CRITICAL SECURITY: Questions contain 'correct_answer' and 'explanation'.
-- Students must NEVER see correct_answer or explanation directly from table queries!
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')),
  choices JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings e.g. ["A", "B", "C", "D"]
  correct_answer TEXT NOT NULL,               -- e.g. "A" or "true"
  explanation TEXT,
  points INT NOT NULL DEFAULT 1 CHECK (points > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_questions_exam ON public.questions (exam_id);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Admins can query questions directly with answers
CREATE POLICY "Admins have full access to questions"
  ON public.questions FOR ALL
  USING (public.is_admin());

-- Students cannot read from questions table directly to prevent answer scraping!
-- Instead, students access questions sanitized via get_exam_questions() RPC below.

-- ------------------------------------------------------------------------------
-- 6. ENROLLMENTS & LESSON PROGRESS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view and enroll themselves"
  ON public.enrollments FOR ALL
  USING (student_id = auth.uid() OR public.is_admin())
  WITH CHECK (student_id = auth.uid() OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own progress"
  ON public.lesson_progress FOR ALL
  USING (student_id = auth.uid() OR public.is_admin())
  WITH CHECK (student_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. EXAM ATTEMPTS & ANSWERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1,
  score_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  points_earned INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON public.exam_attempts (student_id, exam_id);
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

-- Students can read their own attempts; Admins can read all attempts
CREATE POLICY "Students view own attempts"
  ON public.exam_attempts FOR SELECT
  USING (student_id = auth.uid() OR public.is_admin());

-- Students cannot update attempts directly - only the grading RPC does that!
CREATE POLICY "Admins can manage exam attempts"
  ON public.exam_attempts FOR ALL
  USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  student_answer TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_awarded INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view answers for their own attempts"
  ON public.exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts a
      WHERE a.id = exam_answers.attempt_id
      AND (a.student_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins manage exam answers"
  ON public.exam_answers FOR ALL
  USING (public.is_admin());

-- ==============================================================================
-- 8. SECURE RPC FUNCTIONS
-- ==============================================================================

-- A. Sanitized question fetcher for students (STRIPS correct_answer and explanation)
CREATE OR REPLACE FUNCTION public.get_exam_questions_for_student(p_exam_id UUID)
RETURNS TABLE (
  id UUID,
  exam_id UUID,
  question_text TEXT,
  question_type TEXT,
  choices JSONB,
  points INT
) AS $$
DECLARE
  v_randomize_questions BOOLEAN;
  v_randomize_options BOOLEAN;
BEGIN
  SELECT randomize_questions, randomize_options
  INTO v_randomize_questions, v_randomize_options
  FROM public.exams WHERE id = p_exam_id;

  RETURN QUERY
  SELECT
    q.id,
    q.exam_id,
    q.question_text,
    q.question_type,
    q.choices,
    q.points
  FROM public.questions q
  WHERE q.exam_id = p_exam_id
  ORDER BY
    CASE WHEN v_randomize_questions THEN random() ELSE NULL END,
    q.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Secure Server-Side Examination Grading RPC
-- Validates max attempts, compares answers against secret keys in questions,
-- computes points and percentages, persists attempt and answers, returns result.
CREATE OR REPLACE FUNCTION public.submit_and_grade_exam(
  p_exam_id UUID,
  p_answers JSONB -- Array of objects: [{"question_id": "...", "student_answer": "..."}]
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_exam RECORD;
  v_attempt_count INT;
  v_attempt_id UUID;
  v_total_points INT := 0;
  v_points_earned INT := 0;
  v_score_percentage NUMERIC(5, 2) := 0.00;
  v_passed BOOLEAN := false;
  v_correct_count INT := 0;
  v_incorrect_count INT := 0;
  v_total_questions INT := 0;
  v_elem JSONB;
  v_question RECORD;
  v_student_ans TEXT;
  v_is_correct BOOLEAN;
  v_awarded INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- Load examination rules
  SELECT * INTO v_exam FROM public.exams WHERE id = p_exam_id AND is_enabled = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam not found or is currently disabled.';
  END IF;

  -- Verify maximum attempts
  SELECT COUNT(*) INTO v_attempt_count
  FROM public.exam_attempts
  WHERE exam_id = p_exam_id AND student_id = v_user_id AND submitted_at IS NOT NULL;

  IF v_exam.max_attempts > 0 AND v_attempt_count >= v_exam.max_attempts THEN
    RAISE EXCEPTION 'Maximum attempts limit reached for this examination (% max).', v_exam.max_attempts;
  END IF;

  -- Create attempt record
  INSERT INTO public.exam_attempts (
    exam_id,
    student_id,
    attempt_number,
    started_at,
    submitted_at
  ) VALUES (
    p_exam_id,
    v_user_id,
    v_attempt_count + 1,
    now(),
    now()
  ) RETURNING id INTO v_attempt_id;

  -- Calculate total points possible for exam
  SELECT COALESCE(SUM(points), 0), COUNT(*)
  INTO v_total_points, v_total_questions
  FROM public.questions
  WHERE exam_id = p_exam_id;

  -- Grade each submitted answer
  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    SELECT * INTO v_question
    FROM public.questions
    WHERE id = (v_elem->>'question_id')::UUID AND exam_id = p_exam_id;

    IF FOUND THEN
      v_student_ans := TRIM(v_elem->>'student_answer');
      v_is_correct := (LOWER(v_student_ans) = LOWER(TRIM(v_question.correct_answer)));

      IF v_is_correct THEN
        v_awarded := v_question.points;
        v_points_earned := v_points_earned + v_awarded;
        v_correct_count := v_correct_count + 1;
      ELSE
        v_awarded := 0;
        v_incorrect_count := v_incorrect_count + 1;
      END IF;

      INSERT INTO public.exam_answers (
        attempt_id,
        question_id,
        student_answer,
        is_correct,
        points_awarded
      ) VALUES (
        v_attempt_id,
        v_question.id,
        v_student_ans,
        v_is_correct,
        v_awarded
      );
    END IF;
  END LOOP;

  -- Compute final score & pass/fail
  IF v_total_points > 0 THEN
    v_score_percentage := ROUND((v_points_earned::NUMERIC / v_total_points::NUMERIC) * 100, 2);
  ELSE
    v_score_percentage := 0.00;
  END IF;

  v_passed := (v_score_percentage >= v_exam.passing_percentage);

  -- Update attempt record
  UPDATE public.exam_attempts
  SET
    score_percentage = v_score_percentage,
    points_earned = v_points_earned,
    total_points = v_total_points,
    passed = v_passed
  WHERE id = v_attempt_id;

  -- Return comprehensive grading summary
  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'exam_id', p_exam_id,
    'score_percentage', v_score_percentage,
    'points_earned', v_points_earned,
    'total_points', v_total_points,
    'passed', v_passed,
    'passing_percentage', v_exam.passing_percentage,
    'total_questions', v_total_questions,
    'correct_count', v_correct_count,
    'incorrect_count', v_incorrect_count,
    'review_answers_enabled', v_exam.review_answers_enabled
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Answer review fetcher: ONLY returns answers/explanations if review is enabled and attempt belongs to student
CREATE OR REPLACE FUNCTION public.get_exam_attempt_review(p_attempt_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_attempt RECORD;
  v_exam RECORD;
  v_review JSONB;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_attempt FROM public.exam_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found.';
  END IF;

  IF v_attempt.student_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized to view this attempt.';
  END IF;

  SELECT * INTO v_exam FROM public.exams WHERE id = v_attempt.exam_id;

  IF NOT v_exam.review_answers_enabled AND NOT public.is_admin() THEN
    RETURN jsonb_build_object(
      'attempt', to_jsonb(v_attempt),
      'review_allowed', false,
      'questions', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'question_id', q.id,
      'question_text', q.question_text,
      'question_type', q.question_type,
      'choices', q.choices,
      'correct_answer', q.correct_answer,
      'explanation', q.explanation,
      'points', q.points,
      'student_answer', ea.student_answer,
      'is_correct', ea.is_correct,
      'points_awarded', ea.points_awarded
    )
  ) INTO v_review
  FROM public.exam_answers ea
  JOIN public.questions q ON q.id = ea.question_id
  WHERE ea.attempt_id = p_attempt_id;

  RETURN jsonb_build_object(
    'attempt', to_jsonb(v_attempt),
    'review_allowed', true,
    'questions', COALESCE(v_review, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

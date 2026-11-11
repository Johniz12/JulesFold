-- ==============================================================================
-- LearnHub: Initial Administrator Account Setup Instructions
-- ==============================================================================

-- STEP 1: Register an account through the LearnHub registration UI or Supabase Auth.
-- By design, public registration creates accounts with role = 'student'.

-- STEP 2: In your Supabase Dashboard SQL Editor, run the following SQL command
-- substituting the user's email address with your administrator's email:

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@learnhub.internal';

-- STEP 3: Verify the role update:
SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE email = 'admin@learnhub.internal';

-- The administrator now has full privileges to manage courses, lessons,
-- questions, examinations, view student lists, and inspect all exam results.

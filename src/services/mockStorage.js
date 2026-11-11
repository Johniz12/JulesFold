// Local mock storage for standalone demonstration/testing when Supabase credentials are not present
const STORAGE_KEYS = {
  USERS: 'learnhub_mock_users',
  CURRENT_USER: 'learnhub_mock_current_user',
  COURSES: 'learnhub_mock_courses',
  LESSONS: 'learnhub_mock_lessons',
  EXAMS: 'learnhub_mock_exams',
  QUESTIONS: 'learnhub_mock_questions',
  ENROLLMENTS: 'learnhub_mock_enrollments',
  PROGRESS: 'learnhub_mock_progress',
  ATTEMPTS: 'learnhub_mock_attempts',
  ANSWERS: 'learnhub_mock_answers',
};

const getStored = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage save error:', err);
  }
};

// Seed initial default courses, lessons, and exams if empty
export const seedInitialData = () => {
  const users = getStored(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    const defaultUsers = [
      {
        id: 'mock-admin-01',
        email: 'admin@learnhub.internal',
        password: 'password123',
        full_name: 'Dr. Jane Smith (Administrator)',
        role: 'admin',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'mock-student-01',
        email: 'student@learnhub.internal',
        password: 'password123',
        full_name: 'Alex Johnson (Student)',
        role: 'student',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.USERS, defaultUsers);
  }

  const courses = getStored(STORAGE_KEYS.COURSES, []);
  if (courses.length === 0) {
    const course1Id = 'course-react-101';
    const course2Id = 'course-sql-201';

    const defaultCourses = [
      {
        id: course1Id,
        title: 'Modern React Architecture & Engineering',
        description: 'Master component composition, custom hooks, centralized CSS architecture, and scalable frontend state management.',
        category: 'Web Development',
        cover_image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
        is_published: true,
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: course2Id,
        title: 'PostgreSQL Relational Design & Security',
        description: 'Deep dive into database schema design, Row Level Security (RLS) policies, triggers, and secure server-side RPC functions.',
        category: 'Database Architecture',
        cover_image_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
        is_published: true,
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.COURSES, defaultCourses);

    const defaultLessons = [
      {
        id: 'lesson-react-1',
        course_id: course1Id,
        title: '1. Separation of Concerns in UI Engineering',
        description: 'Understand why business logic and presentation must be decoupled.',
        content: `### Separation of Concerns in Modern Frontend Engineering

Frontend applications grow complex very rapidly when UI markup, database calls, and business logic are mixed together into monolithic components.

#### Core Architectural Directives
1. **Service Modules**: Direct database or API requests (like Supabase or REST endpoints) belong strictly in domain service modules, never directly in UI components.
2. **Centralized CSS Design System**: Rather than sprinkling ad-hoc utility classes or inline styling, manage colors, spacing, and typography using CSS Custom Properties.
3. **Decoupled Business Logic**: Custom hooks and pure state engines make code portable to desktop wrappers like Electron or Native platforms.

\`\`\`javascript
// Example: Service abstraction pattern
export async function fetchPublishedCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true);
  if (error) throw error;
  return data;
}
\`\`\`

When this architectural discipline is maintained, codebases remain readable, maintainable, and verifiable over years of evolution.`,
        sequence: 1,
        is_published: true,
        created_at: new Date(Date.now() - 19 * 86400000).toISOString(),
      },
      {
        id: 'lesson-react-2',
        course_id: course1Id,
        title: '2. Design Systems Without Utility Bloat',
        description: 'Building sustainable, clean user interfaces with vanilla CSS variables.',
        content: `### Clean Styling with Standard CSS Variables

Utility-first frameworks can lead to cluttered JSX and steep cognitive overhead. A well-crafted standard CSS stylesheet with CSS variables provides elegance and simplicity:

- Global design tokens in \`variables.css\`
- Reusable component classes in \`global.css\`
- Semantic headings and typography in \`typography.css\`

\`\`\`css
:root {
  --color-primary: #4f46e5;
  --color-surface: #ffffff;
  --radius-card: 12px;
}

.card {
  background: var(--color-surface);
  border-radius: var(--radius-card);
}
\`\`\`

This standard structure makes manual edits effortless in VS Code or any text editor.`,
        sequence: 2,
        is_published: true,
        created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
      },
      {
        id: 'lesson-sql-1',
        course_id: course2Id,
        title: '1. Row Level Security & Defending Data Isolation',
        description: 'Why frontend-only checks fail and how RLS enforces bulletproof tenancy.',
        content: `### Row Level Security (RLS) Foundations

Never trust the client browser. An attacker with DevTools can alter client JavaScript variables, bypass UI route guards, and invoke API endpoints directly.

#### Golden Rules of PostgreSQL Security
- **Enable RLS on every table**: \`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;\`
- **Isolate Student Data**: Ensure students can only read or modify rows where \`student_id = auth.uid()\`.
- **Protect Secret Answers**: Never allow clients to query correct examination answers from questions tables before grading!`,
        sequence: 1,
        is_published: true,
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.LESSONS, defaultLessons);

    const exam1Id = 'exam-react-cert';
    const defaultExams = [
      {
        id: exam1Id,
        course_id: course1Id,
        title: 'React Architecture & Quality Certification',
        description: 'Test your understanding of component separation, CSS design systems, and frontend clean code architecture.',
        duration_minutes: 15,
        passing_percentage: 75,
        max_attempts: 3,
        is_enabled: true,
        review_answers_enabled: true,
        randomize_questions: false,
        randomize_options: false,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.EXAMS, defaultExams);

    const defaultQuestions = [
      {
        id: 'q-react-1',
        exam_id: exam1Id,
        question_text: 'Where should direct Supabase/database queries be placed in a clean React architecture?',
        question_type: 'multiple_choice',
        choices: [
          'Directly inside JSX component event handlers',
          'Inside dedicated service modules (e.g., courseService.js)',
          'Embedded within inline style objects',
          'Only inside Vite configuration files'
        ],
        correct_answer: 'Inside dedicated service modules (e.g., courseService.js)',
        explanation: 'Placing database queries in dedicated service modules decouples business logic from presentation, making components testable and reusable.',
        points: 10,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'q-react-2',
        exam_id: exam1Id,
        question_text: 'True or False: Relying solely on client-side route guards (e.g., React Router) is sufficient to protect confidential database data.',
        question_type: 'true_false',
        choices: ['True', 'False'],
        correct_answer: 'False',
        explanation: 'Frontend route guards only protect the user interface flow. Row Level Security (RLS) in the database is essential to secure data at the protocol level.',
        points: 10,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'q-react-3',
        exam_id: exam1Id,
        question_text: 'Why should examination grading calculations be performed on the server rather than in the student browser?',
        question_type: 'multiple_choice',
        choices: [
          'Browsers cannot perform percentage arithmetic',
          'To prevent students from inspecting correct answers or manipulating submitted scores',
          'CSS variables cannot be evaluated during an exam',
          'React does not support form submissions'
        ],
        correct_answer: 'To prevent students from inspecting correct answers or manipulating submitted scores',
        explanation: 'Server-side grading ensures that secret answer keys are never sent to the client browser and prevents tampering with score records.',
        points: 10,
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.QUESTIONS, defaultQuestions);
  }
};

seedInitialData();

export { STORAGE_KEYS, getStored, setStored };

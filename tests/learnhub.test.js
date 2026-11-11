import test from 'node:test';
import assert from 'node:assert/strict';

// Grading arithmetic unit test simulating the PostgreSQL server-side RPC logic
function gradeExam(examConfig, questions, submittedAnswers) {
  let totalPoints = 0;
  let earnedPoints = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  questions.forEach((q) => {
    totalPoints += q.points;
  });

  const evaluated = submittedAnswers.map((sub) => {
    const q = questions.find((item) => item.id === sub.question_id);
    if (!q) return null;
    const isCorrect = (sub.student_answer || '').trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
    const pts = isCorrect ? q.points : 0;
    if (isCorrect) {
      earnedPoints += pts;
      correctCount++;
    } else {
      incorrectCount++;
    }
    return { question_id: q.id, is_correct: isCorrect, points_awarded: pts };
  }).filter(Boolean);

  const scorePercentage = totalPoints > 0 ? Number(((earnedPoints / totalPoints) * 100).toFixed(2)) : 0;
  const passed = scorePercentage >= examConfig.passing_percentage;

  return {
    scorePercentage,
    earnedPoints,
    totalPoints,
    passed,
    correctCount,
    incorrectCount,
    evaluated,
  };
}

test('Grading logic calculates exact score percentage and passing status', () => {
  const exam = { passing_percentage: 70 };
  const questions = [
    { id: 'q1', correct_answer: 'B', points: 10 },
    { id: 'q2', correct_answer: 'True', points: 10 },
    { id: 'q3', correct_answer: 'Paris', points: 20 },
  ];

  // 10 + 10 + 20 = 40 total points
  // Student answers q1 (correct) and q2 (correct), but q3 (incorrect) => 20 / 40 = 50% => Fail
  const submission1 = [
    { question_id: 'q1', student_answer: 'B' },
    { question_id: 'q2', student_answer: 'True' },
    { question_id: 'q3', student_answer: 'London' },
  ];

  const result1 = gradeExam(exam, questions, submission1);
  assert.equal(result1.totalPoints, 40);
  assert.equal(result1.earnedPoints, 20);
  assert.equal(result1.scorePercentage, 50.0);
  assert.equal(result1.passed, false);
  assert.equal(result1.correctCount, 2);
  assert.equal(result1.incorrectCount, 1);

  // Student answers all 3 correctly => 40 / 40 = 100% => Passed
  const submission2 = [
    { question_id: 'q1', student_answer: ' b ' }, // Case & whitespace insensitive
    { question_id: 'q2', student_answer: 'true' },
    { question_id: 'q3', student_answer: 'paris' },
  ];

  const result2 = gradeExam(exam, questions, submission2);
  assert.equal(result2.totalPoints, 40);
  assert.equal(result2.earnedPoints, 40);
  assert.equal(result2.scorePercentage, 100.0);
  assert.equal(result2.passed, true);
});

test('Student sanitized question view strips correct answers and explanations', () => {
  const secretQuestions = [
    {
      id: 'q1',
      exam_id: 'ex1',
      question_text: 'What is RLS?',
      question_type: 'multiple_choice',
      choices: ['Row Level Security', 'Real Life Storage'],
      correct_answer: 'Row Level Security',
      explanation: 'RLS restricts table row access based on PostgreSQL roles.',
      points: 5,
    },
  ];

  // Sanitizer simulating get_exam_questions_for_student RPC
  const sanitized = secretQuestions.map((q) => ({
    id: q.id,
    exam_id: q.exam_id,
    question_text: q.question_text,
    question_type: q.question_type,
    choices: q.choices,
    points: q.points,
  }));

  assert.equal(sanitized[0].correct_answer, undefined);
  assert.equal(sanitized[0].explanation, undefined);
  assert.equal(sanitized[0].question_text, 'What is RLS?');
});

test('Role-based route guard isolates student access from admin surfaces', () => {
  function checkAccess(userRole, requiredRole) {
    if (!userRole) return false;
    if (requiredRole === 'admin') return userRole === 'admin';
    return true; // students can access student surfaces
  }

  assert.equal(checkAccess('student', 'admin'), false);
  assert.equal(checkAccess('admin', 'admin'), true);
  assert.equal(checkAccess('student', 'student'), true);
  assert.equal(checkAccess(null, 'student'), false);
});

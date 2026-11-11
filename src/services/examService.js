import { supabase, isSupabaseConfigured } from './supabase.js';
import { STORAGE_KEYS, getStored, setStored } from './mockStorage.js';

export const examService = {
  /**
   * Fetch all exams (for admin)
   */
  async getAllExams() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('exams')
        .select('*, courses(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const courses = getStored(STORAGE_KEYS.COURSES, []);
    return exams.map((e) => ({
      ...e,
      courses: courses.find((c) => c.id === e.course_id) || null,
    }));
  },

  /**
   * Fetch enabled exams (for students)
   */
  async getAvailableExams() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('exams')
        .select('*, courses(title)')
        .eq('is_enabled', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const courses = getStored(STORAGE_KEYS.COURSES, []);
    return exams
      .filter((e) => e.is_enabled)
      .map((e) => ({
        ...e,
        courses: courses.find((c) => c.id === e.course_id) || null,
      }));
  },

  /**
   * Fetch single exam by ID
   */
  async getExamById(id) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('exams')
        .select('*, courses(title)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }

    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const courses = getStored(STORAGE_KEYS.COURSES, []);
    const exam = exams.find((e) => e.id === id);
    if (!exam) return null;
    return {
      ...exam,
      courses: courses.find((c) => c.id === exam.course_id) || null,
    };
  },

  /**
   * Create new exam
   */
  async createExam(examData) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('exams')
        .insert([examData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const newExam = {
      ...examData,
      id: `exam-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    exams.unshift(newExam);
    setStored(STORAGE_KEYS.EXAMS, exams);
    return newExam;
  },

  /**
   * Update exam
   */
  async updateExam(id, updates) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('exams')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const index = exams.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Exam not found');

    const updated = {
      ...exams[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    exams[index] = updated;
    setStored(STORAGE_KEYS.EXAMS, exams);
    return updated;
  },

  /**
   * Delete exam
   */
  async deleteExam(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    let exams = getStored(STORAGE_KEYS.EXAMS, []);
    exams = exams.filter((e) => e.id !== id);
    setStored(STORAGE_KEYS.EXAMS, exams);

    let questions = getStored(STORAGE_KEYS.QUESTIONS, []);
    questions = questions.filter((q) => q.exam_id !== id);
    setStored(STORAGE_KEYS.QUESTIONS, questions);
    return true;
  },

  // -------------------------------------------------------------
  // QUESTION MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Fetch questions for Admin (includes correct answers & explanations)
   */
  async getQuestionsForAdmin(examId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    }

    const questions = getStored(STORAGE_KEYS.QUESTIONS, []);
    return questions.filter((q) => q.exam_id === examId);
  },

  /**
   * Fetch questions for Student
   * CRITICAL SECURITY: Does NOT expose correct answers or explanations before submission!
   */
  async getQuestionsForStudent(examId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('get_exam_questions_for_student', {
        p_exam_id: examId,
      });

      if (error) throw error;
      return data || [];
    }

    // Mock Mode: Strip correct_answer and explanation securely
    const questions = getStored(STORAGE_KEYS.QUESTIONS, []);
    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const exam = exams.find((e) => e.id === examId);

    let examQuestions = questions
      .filter((q) => q.exam_id === examId)
      .map((q) => {
        let choices = [...(q.choices || [])];
        if (exam?.randomize_options) {
          choices = choices.sort(() => Math.random() - 0.5);
        }
        return {
          id: q.id,
          exam_id: q.exam_id,
          question_text: q.question_text,
          question_type: q.question_type,
          choices,
          points: q.points,
          // Notice: correct_answer and explanation are deliberately omitted!
        };
      });

    if (exam?.randomize_questions) {
      examQuestions = examQuestions.sort(() => Math.random() - 0.5);
    }

    return examQuestions;
  },

  /**
   * Create question (Admin only)
   */
  async createQuestion(questionData) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('questions')
        .insert([questionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const questions = getStored(STORAGE_KEYS.QUESTIONS, []);
    const newQuestion = {
      ...questionData,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    questions.push(newQuestion);
    setStored(STORAGE_KEYS.QUESTIONS, questions);
    return newQuestion;
  },

  /**
   * Update question (Admin only)
   */
  async updateQuestion(id, updates) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const questions = getStored(STORAGE_KEYS.QUESTIONS, []);
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) throw new Error('Question not found');

    const updated = { ...questions[index], ...updates };
    questions[index] = updated;
    setStored(STORAGE_KEYS.QUESTIONS, questions);
    return updated;
  },

  /**
   * Delete question (Admin only)
   */
  async deleteQuestion(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    let questions = getStored(STORAGE_KEYS.QUESTIONS, []);
    questions = questions.filter((q) => q.id !== id);
    setStored(STORAGE_KEYS.QUESTIONS, questions);
    return true;
  },

  // -------------------------------------------------------------
  // EXAMINATION SUBMISSION & SERVER-SIDE GRADING
  // -------------------------------------------------------------

  /**
   * Submit examination answers and receive secure server-side grade.
   * Client-side answers format: [{ question_id: '...', student_answer: '...' }]
   */
  async submitAndGradeExam(examId, answers, studentId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('submit_and_grade_exam', {
        p_exam_id: examId,
        p_answers: answers,
      });

      if (error) throw error;
      return data;
    }

    // Mock Mode Server-Side Grading Simulator
    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const exam = exams.find((e) => e.id === examId);
    if (!exam || !exam.is_enabled) {
      throw new Error('Exam not found or is currently disabled.');
    }

    const attempts = getStored(STORAGE_KEYS.ATTEMPTS, []);
    const userAttempts = attempts.filter((a) => a.exam_id === examId && a.student_id === studentId);
    if (exam.max_attempts > 0 && userAttempts.length >= exam.max_attempts) {
      throw new Error(`Maximum attempts limit reached (${exam.max_attempts} max).`);
    }

    const questions = getStored(STORAGE_KEYS.QUESTIONS, []).filter((q) => q.exam_id === examId);
    let totalPoints = 0;
    let pointsEarned = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach((q) => {
      totalPoints += q.points;
    });

    const attemptId = `att-${Date.now()}`;
    const storedAnswers = getStored(STORAGE_KEYS.ANSWERS, []);

    answers.forEach((ans) => {
      const q = questions.find((item) => item.id === ans.question_id);
      if (q) {
        const isCorrect = (ans.student_answer || '').trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase();
        const pts = isCorrect ? q.points : 0;
        if (isCorrect) {
          pointsEarned += pts;
          correctCount++;
        } else {
          incorrectCount++;
        }

        storedAnswers.push({
          id: `ans-${Date.now()}-${Math.random()}`,
          attempt_id: attemptId,
          question_id: q.id,
          student_answer: ans.student_answer,
          is_correct: isCorrect,
          points_awarded: pts,
        });
      }
    });

    const scorePercentage = totalPoints > 0 ? Number(((pointsEarned / totalPoints) * 100).toFixed(2)) : 0;
    const passed = scorePercentage >= exam.passing_percentage;

    const newAttempt = {
      id: attemptId,
      exam_id: examId,
      student_id: studentId,
      attempt_number: userAttempts.length + 1,
      score_percentage: scorePercentage,
      points_earned: pointsEarned,
      total_points: totalPoints,
      passed,
      started_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    attempts.push(newAttempt);
    setStored(STORAGE_KEYS.ATTEMPTS, attempts);
    setStored(STORAGE_KEYS.ANSWERS, storedAnswers);

    return {
      attempt_id: attemptId,
      exam_id: examId,
      score_percentage: scorePercentage,
      points_earned: pointsEarned,
      total_points: totalPoints,
      passed,
      passing_percentage: exam.passing_percentage,
      total_questions: questions.length,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      review_answers_enabled: exam.review_answers_enabled,
    };
  },

  /**
   * Fetch attempt review with questions & correct answers (when enabled)
   */
  async getExamAttemptReview(attemptId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('get_exam_attempt_review', {
        p_attempt_id: attemptId,
      });

      if (error) throw error;
      return data;
    }

    // Mock Mode Attempt Review
    const attempts = getStored(STORAGE_KEYS.ATTEMPTS, []);
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt record not found');

    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const exam = exams.find((e) => e.id === attempt.exam_id);
    const answers = getStored(STORAGE_KEYS.ANSWERS, []).filter((ans) => ans.attempt_id === attemptId);
    const allQuestions = getStored(STORAGE_KEYS.QUESTIONS, []);

    const questionsReview = answers.map((ans) => {
      const q = allQuestions.find((item) => item.id === ans.question_id);
      return {
        question_id: q?.id,
        question_text: q?.question_text,
        question_type: q?.question_type,
        choices: q?.choices || [],
        correct_answer: exam?.review_answers_enabled ? q?.correct_answer : null,
        explanation: exam?.review_answers_enabled ? q?.explanation : null,
        points: q?.points,
        student_answer: ans.student_answer,
        is_correct: ans.is_correct,
        points_awarded: ans.points_awarded,
      };
    });

    return {
      attempt,
      review_allowed: Boolean(exam?.review_answers_enabled),
      questions: questionsReview,
    };
  },

  /**
   * Fetch user's prior attempts for an exam
   */
  async getStudentAttempts(examId, studentId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .order('attempt_number', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    const attempts = getStored(STORAGE_KEYS.ATTEMPTS, []);
    return attempts
      .filter((a) => a.exam_id === examId && a.student_id === studentId)
      .sort((a, b) => b.attempt_number - a.attempt_number);
  },

  /**
   * Fetch all student attempts across all exams (for Admin)
   */
  async getAllAttempts() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, exams(title), profiles(full_name, email)')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    const attempts = getStored(STORAGE_KEYS.ATTEMPTS, []);
    const exams = getStored(STORAGE_KEYS.EXAMS, []);
    const users = getStored(STORAGE_KEYS.USERS, []);

    return attempts.map((a) => ({
      ...a,
      exams: exams.find((e) => e.id === a.exam_id) || null,
      profiles: users.find((u) => u.id === a.student_id) || null,
    }));
  },
};

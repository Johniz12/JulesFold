import { supabase, isSupabaseConfigured } from './supabase';
import { STORAGE_KEYS, getStored, setStored } from './mockStorage';

export const progressService = {
  /**
   * Check if a student is enrolled in a course
   */
  async isEnrolled(studentId, courseId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    }

    const enrollments = getStored(STORAGE_KEYS.ENROLLMENTS, []);
    return enrollments.some((e) => e.student_id === studentId && e.course_id === courseId);
  },

  /**
   * Enroll a student in a course
   */
  async enroll(studentId, courseId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('enrollments')
        .upsert([{ student_id: studentId, course_id: courseId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const enrollments = getStored(STORAGE_KEYS.ENROLLMENTS, []);
    if (!enrollments.some((e) => e.student_id === studentId && e.course_id === courseId)) {
      const newEnrollment = {
        id: `enr-${Date.now()}`,
        student_id: studentId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
      };
      enrollments.push(newEnrollment);
      setStored(STORAGE_KEYS.ENROLLMENTS, enrollments);
      return newEnrollment;
    }
    return enrollments.find((e) => e.student_id === studentId && e.course_id === courseId);
  },

  /**
   * Get all courses enrolled by student
   */
  async getStudentEnrollments(studentId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', studentId);

      if (error) throw error;
      return data?.map((e) => e.courses).filter(Boolean) || [];
    }

    const enrollments = getStored(STORAGE_KEYS.ENROLLMENTS, []);
    const courses = getStored(STORAGE_KEYS.COURSES, []);
    const userEnrollments = enrollments.filter((e) => e.student_id === studentId);
    return userEnrollments
      .map((e) => courses.find((c) => c.id === e.course_id))
      .filter(Boolean);
  },

  /**
   * Mark lesson as completed
   */
  async completeLesson(studentId, lessonId, courseId) {
    // Automatically ensure enrollment when interacting with a course
    await this.enroll(studentId, courseId);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert([
          {
            student_id: studentId,
            lesson_id: lessonId,
            course_id: courseId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const progress = getStored(STORAGE_KEYS.PROGRESS, []);
    const existingIndex = progress.findIndex(
      (p) => p.student_id === studentId && p.lesson_id === lessonId
    );

    if (existingIndex >= 0) {
      progress[existingIndex].is_completed = true;
      progress[existingIndex].completed_at = new Date().toISOString();
    } else {
      progress.push({
        id: `prog-${Date.now()}`,
        student_id: studentId,
        lesson_id: lessonId,
        course_id: courseId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    setStored(STORAGE_KEYS.PROGRESS, progress);
    return true;
  },

  /**
   * Get completed lesson IDs for a student in a course
   */
  async getCompletedLessonIds(studentId, courseId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('is_completed', true);

      if (error) throw error;
      return data?.map((p) => p.lesson_id) || [];
    }

    const progress = getStored(STORAGE_KEYS.PROGRESS, []);
    return progress
      .filter((p) => p.student_id === studentId && p.course_id === courseId && p.is_completed)
      .map((p) => p.lesson_id);
  },

  /**
   * Get all completed lessons across all courses for student
   */
  async getAllStudentCompletedLessons(studentId) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('is_completed', true);

      if (error) throw error;
      return data || [];
    }

    const progress = getStored(STORAGE_KEYS.PROGRESS, []);
    return progress.filter((p) => p.student_id === studentId && p.is_completed);
  },

  /**
   * Aggregate student learning overview metrics
   */
  async getStudentOverview(studentId) {
    const enrollments = await this.getStudentEnrollments(studentId);
    const completedLessons = await this.getAllStudentCompletedLessons(studentId);

    let attempts = [];
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });
      attempts = data || [];
    } else {
      const allAttempts = getStored(STORAGE_KEYS.ATTEMPTS, []);
      attempts = allAttempts
        .filter((a) => a.student_id === studentId)
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    }

    const passedAttempts = attempts.filter((a) => a.passed);

    return {
      enrolledCoursesCount: enrollments.length,
      completedLessonsCount: completedLessons.length,
      examAttemptsCount: attempts.length,
      examsPassedCount: passedAttempts.length,
      recentAttempts: attempts.slice(0, 5),
    };
  },
};

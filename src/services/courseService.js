import { supabase, isSupabaseConfigured } from './supabase';
import { STORAGE_KEYS, getStored, setStored } from './mockStorage';

export const courseService = {
  /**
   * Fetch published courses for students
   */
  async getPublishedCourses() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    const courses = getStored(STORAGE_KEYS.COURSES, []);
    return courses.filter((c) => c.is_published);
  },

  /**
   * Fetch all courses (for administrators)
   */
  async getAllCourses() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    return getStored(STORAGE_KEYS.COURSES, []);
  },

  /**
   * Get single course by ID
   */
  async getCourseById(id) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }

    const courses = getStored(STORAGE_KEYS.COURSES, []);
    return courses.find((c) => c.id === id) || null;
  },

  /**
   * Create a new course
   */
  async createCourse(courseData) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const courses = getStored(STORAGE_KEYS.COURSES, []);
    const newCourse = {
      ...courseData,
      id: `course-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    courses.unshift(newCourse);
    setStored(STORAGE_KEYS.COURSES, courses);
    return newCourse;
  },

  /**
   * Update an existing course
   */
  async updateCourse(id, updates) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const courses = getStored(STORAGE_KEYS.COURSES, []);
    const index = courses.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Course not found');

    const updated = {
      ...courses[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    courses[index] = updated;
    setStored(STORAGE_KEYS.COURSES, courses);
    return updated;
  },

  /**
   * Delete a course
   */
  async deleteCourse(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    let courses = getStored(STORAGE_KEYS.COURSES, []);
    courses = courses.filter((c) => c.id !== id);
    setStored(STORAGE_KEYS.COURSES, courses);

    // Also cascade remove associated lessons and exams
    let lessons = getStored(STORAGE_KEYS.LESSONS, []);
    lessons = lessons.filter((l) => l.course_id !== id);
    setStored(STORAGE_KEYS.LESSONS, lessons);

    return true;
  },
};

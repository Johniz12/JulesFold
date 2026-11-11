import { supabase, isSupabaseConfigured } from './supabase.js';
import { STORAGE_KEYS, getStored, setStored } from './mockStorage.js';

export const lessonService = {
  /**
   * Fetch lessons for a specific course
   */
  async getLessonsByCourse(courseId, isAdmin = false) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('sequence', { ascending: true });

      if (!isAdmin) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    const lessons = getStored(STORAGE_KEYS.LESSONS, []);
    return lessons
      .filter((l) => l.course_id === courseId && (isAdmin || l.is_published))
      .sort((a, b) => a.sequence - b.sequence);
  },

  /**
   * Fetch single lesson by ID
   */
  async getLessonById(id) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }

    const lessons = getStored(STORAGE_KEYS.LESSONS, []);
    return lessons.find((l) => l.id === id) || null;
  },

  /**
   * Create a new lesson
   */
  async createLesson(lessonData) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lessons')
        .insert([lessonData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const lessons = getStored(STORAGE_KEYS.LESSONS, []);
    const newLesson = {
      ...lessonData,
      id: `lesson-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    lessons.push(newLesson);
    setStored(STORAGE_KEYS.LESSONS, lessons);
    return newLesson;
  },

  /**
   * Update a lesson
   */
  async updateLesson(id, updates) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lessons')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const lessons = getStored(STORAGE_KEYS.LESSONS, []);
    const index = lessons.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Lesson not found');

    const updated = {
      ...lessons[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    lessons[index] = updated;
    setStored(STORAGE_KEYS.LESSONS, lessons);
    return updated;
  },

  /**
   * Delete a lesson
   */
  async deleteLesson(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    }

    let lessons = getStored(STORAGE_KEYS.LESSONS, []);
    lessons = lessons.filter((l) => l.id !== id);
    setStored(STORAGE_KEYS.LESSONS, lessons);
    return true;
  },
};

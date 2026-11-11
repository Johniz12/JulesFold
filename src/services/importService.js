import { courseService } from './courseService.js';
import { lessonService } from './lessonService.js';
import { examService } from './examService.js';

export const importService = {
  /**
   * Validate a lesson series payload
   */
  validateLessonSeries(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid JSON payload: expected an object.'] };
    }

    if (data.format !== 'learnhub-content') {
      errors.push(`Invalid format identifier: expected 'learnhub-content', got '${data.format}'.`);
    }

    if (data.version !== 1) {
      errors.push(`Unsupported format version: expected 1, got '${data.version}'.`);
    }

    if (data.type !== 'lesson_series') {
      errors.push(`Expected type 'lesson_series', got '${data.type}'.`);
    }

    if (!data.course || typeof data.course !== 'object') {
      errors.push("Missing 'course' definition object.");
    } else {
      if (!data.course.title || !data.course.title.trim()) {
        errors.push("Course 'title' is required.");
      }
    }

    if (!Array.isArray(data.lessons) || data.lessons.length === 0) {
      errors.push("Lesson series must contain at least one lesson in the 'lessons' array.");
    } else {
      const orders = new Set();
      data.lessons.forEach((l, index) => {
        const itemNumber = index + 1;
        if (!l.title || !l.title.trim()) {
          errors.push(`Lesson #${itemNumber}: 'title' is required.`);
        }
        if (!l.content || !l.content.trim()) {
          errors.push(`Lesson #${itemNumber} ("${l.title || 'Untitled'}"): 'content' is required.`);
        }
        const orderNum = l.order !== undefined ? l.order : (l.sequence !== undefined ? l.sequence : itemNumber);
        if (orders.has(orderNum)) {
          errors.push(`Lesson #${itemNumber}: duplicate sequence/order number '${orderNum}'.`);
        }
        orders.add(orderNum);
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate an examination payload
   */
  validateExam(data) {
    const errors = [];
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid JSON payload: expected an object.'] };
    }

    if (data.format !== 'learnhub-content') {
      errors.push(`Invalid format identifier: expected 'learnhub-content', got '${data.format}'.`);
    }

    if (data.version !== 1) {
      errors.push(`Unsupported format version: expected 1, got '${data.version}'.`);
    }

    if (data.type !== 'exam') {
      errors.push(`Expected type 'exam', got '${data.type}'.`);
    }

    const exam = data.exam;
    if (!exam || typeof exam !== 'object') {
      errors.push("Missing 'exam' definition object.");
      return { valid: false, errors };
    }

    if (!exam.title || !exam.title.trim()) {
      errors.push("Exam 'title' is required.");
    }

    if (exam.passing_percentage !== undefined) {
      const p = Number(exam.passing_percentage);
      if (isNaN(p) || p < 1 || p > 100) {
        errors.push(`Invalid passing_percentage '${exam.passing_percentage}': must be between 1 and 100.`);
      }
    }

    if (exam.duration_minutes !== undefined) {
      const d = Number(exam.duration_minutes);
      if (isNaN(d) || d < 0) {
        errors.push(`Invalid duration_minutes '${exam.duration_minutes}': must be a non-negative number.`);
      }
    }

    if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
      errors.push("Examination must contain at least one question in 'questions' array.");
    } else {
      const validTypes = ['multiple_choice', 'true_false', 'picture_identification'];

      exam.questions.forEach((q, index) => {
        const qNum = index + 1;
        if (!q.question && !q.question_text) {
          errors.push(`Question #${qNum}: prompt text ('question' or 'question_text') is required.`);
        }

        const type = q.type || q.question_type || 'multiple_choice';
        if (!validTypes.includes(type)) {
          errors.push(`Question #${qNum}: invalid type '${type}'. Allowed: ${validTypes.join(', ')}.`);
        }

        if (q.points !== undefined && (isNaN(Number(q.points)) || Number(q.points) <= 0)) {
          errors.push(`Question #${qNum}: 'points' must be a positive integer.`);
        }

        // Validate Options / Choices
        const rawOptions = q.options || q.choices;
        if (type === 'multiple_choice' || type === 'picture_identification') {
          if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
            errors.push(`Question #${qNum}: must contain at least 2 options/choices.`);
          } else {
            // Check correct answer reference
            const correctAnswer = (q.correct_answer || '').toString().trim().toLowerCase();
            if (!correctAnswer) {
              errors.push(`Question #${qNum}: 'correct_answer' is missing.`);
            } else {
              const matched = rawOptions.some((opt) => {
                if (typeof opt === 'string') {
                  return opt.trim().toLowerCase() === correctAnswer;
                }
                const optId = (opt.id || '').toString().trim().toLowerCase();
                const optText = (opt.text || '').toString().trim().toLowerCase();
                return optId === correctAnswer || optText === correctAnswer;
              });
              if (!matched) {
                errors.push(`Question #${qNum}: correct_answer '${q.correct_answer}' does not match any choice ID or text.`);
              }
            }
          }
        } else if (type === 'true_false') {
          const ans = (q.correct_answer || '').toString().trim().toLowerCase();
          if (ans !== 'true' && ans !== 'false') {
            errors.push(`Question #${qNum}: True/False question correct_answer must be 'True' or 'False'.`);
          }
        }

        // Validate image URLs if specified
        if (q.image && q.image.url) {
          if (!q.image.url.startsWith('http://') && !q.image.url.startsWith('https://') && !q.image.url.startsWith('data:')) {
            errors.push(`Question #${qNum}: question image URL is not a valid web URL.`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Parse CSV Question Bank format:
   * question,type,choices,correct_answer,explanation,points,image_url
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error('CSV file is empty or missing headers.');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const qIdx = headers.indexOf('question');
    const tIdx = headers.indexOf('type');
    const cIdx = headers.indexOf('choices');
    const aIdx = headers.indexOf('correct_answer');
    const eIdx = headers.indexOf('explanation');
    const pIdx = headers.indexOf('points');
    const iIdx = headers.indexOf('image_url');

    if (qIdx === -1 || aIdx === -1) {
      throw new Error("CSV must include at least 'question' and 'correct_answer' columns.");
    }

    const questions = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV quoting
      const cols = [];
      let inQuotes = false;
      let curr = '';
      for (let ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cols.push(curr.trim());
          curr = '';
        } else {
          curr += ch;
        }
      }
      cols.push(curr.trim());

      const questionText = cols[qIdx] || '';
      const type = (cols[tIdx] || 'multiple_choice').toLowerCase();
      const rawChoices = cols[cIdx] || '';
      const choices = rawChoices.includes('|')
        ? rawChoices.split('|').map((s) => s.trim())
        : rawChoices.split(';').map((s) => s.trim());
      const correctAnswer = cols[aIdx] || '';
      const explanation = eIdx >= 0 ? cols[eIdx] : '';
      const points = pIdx >= 0 ? parseInt(cols[pIdx], 10) || 1 : 1;
      const imageUrl = iIdx >= 0 ? cols[iIdx] : '';

      questions.push({
        type: type === 'true_false' ? 'true_false' : 'multiple_choice',
        question: questionText,
        options: choices.map((c, idx) => ({ id: String.fromCharCode(65 + idx), text: c })),
        correct_answer: correctAnswer,
        explanation,
        points,
        image: imageUrl ? { url: imageUrl, alt: questionText } : null,
      });
    }

    return {
      format: 'learnhub-content',
      version: 1,
      type: 'exam',
      exam: {
        title: 'Imported Question Bank',
        description: `Imported ${questions.length} questions from CSV.`,
        duration_minutes: 30,
        passing_percentage: 70,
        max_attempts: 3,
        questions,
      },
    };
  },

  /**
   * Commit Lesson Series to Database
   */
  async commitLessonSeries(data, targetCourseId = null) {
    let courseId = targetCourseId;

    if (!courseId) {
      const newCourse = await courseService.createCourse({
        title: data.course.title,
        description: data.course.description || '',
        category: data.course.category || 'General',
        cover_image_url: data.course.cover_image_url || '',
        is_published: true,
      });
      courseId = newCourse.id;
    }

    const createdLessons = [];
    for (let i = 0; i < data.lessons.length; i++) {
      const l = data.lessons[i];
      const seq = l.order !== undefined ? l.order : (l.sequence !== undefined ? l.sequence : i + 1);
      const created = await lessonService.createLesson({
        course_id: courseId,
        title: l.title,
        description: l.description || '',
        content: l.content,
        sequence: seq,
        is_published: true,
      });
      createdLessons.push(created);
    }

    return {
      courseId,
      lessonsCount: createdLessons.length,
      lessons: createdLessons,
    };
  },

  /**
   * Commit Examination to Database
   */
  async commitExam(data, targetCourseId = null) {
    const examData = data.exam;

    const newExam = await examService.createExam({
      course_id: targetCourseId || null,
      title: examData.title,
      description: examData.description || '',
      duration_minutes: examData.duration_minutes !== undefined ? examData.duration_minutes : 30,
      passing_percentage: examData.passing_percentage !== undefined ? examData.passing_percentage : 70,
      max_attempts: examData.max_attempts !== undefined ? examData.max_attempts : 3,
      is_enabled: true,
      review_answers_enabled: examData.review_answers_enabled !== undefined ? examData.review_answers_enabled : true,
      randomize_questions: examData.randomize_questions || false,
      randomize_options: examData.randomize_options || false,
    });

    const createdQuestions = [];
    for (const q of examData.questions) {
      // Normalize choices array
      const rawOpts = q.options || q.choices || [];
      const choices = rawOpts.map((opt, idx) => {
        if (typeof opt === 'string') {
          return { id: String.fromCharCode(65 + idx), text: opt };
        }
        return {
          id: opt.id || String.fromCharCode(65 + idx),
          text: opt.text || '',
          image: opt.image || null,
        };
      });

      // Find normalized correct answer text
      let normalizedCorrect = q.correct_answer;
      const matchedChoice = choices.find(
        (c) => c.id.toLowerCase() === (q.correct_answer || '').toString().toLowerCase()
      );
      if (matchedChoice) {
        normalizedCorrect = matchedChoice.text;
      }

      const created = await examService.createQuestion({
        exam_id: newExam.id,
        question_text: q.question || q.question_text,
        question_type: q.type || q.question_type || 'multiple_choice',
        choices,
        correct_answer: normalizedCorrect,
        explanation: q.explanation || '',
        points: q.points !== undefined ? q.points : 1,
        image: q.image || null,
      });
      createdQuestions.push(created);
    }

    return {
      examId: newExam.id,
      examTitle: newExam.title,
      questionsCount: createdQuestions.length,
      questions: createdQuestions,
    };
  },
};

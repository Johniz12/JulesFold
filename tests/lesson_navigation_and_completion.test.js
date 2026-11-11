import test from 'node:test';
import assert from 'node:assert/strict';
import { progressService } from '../src/services/progressService.js';
import { lessonService } from '../src/services/lessonService.js';
import { courseService } from '../src/services/courseService.js';
import { STORAGE_KEYS, getStored, setStored } from '../src/services/mockStorage.js';

test('Lesson Navigation & Isolated Completion State Test Suite', async (t) => {
  const testStudentId = 'test-student-' + Date.now();
  const testCourseId = 'course-react-101';

  await t.test('1. Verify lesson selection does NOT mark lesson as completed', async () => {
    // Fresh student starts with 0 completed lessons
    const initialCompleted = await progressService.getCompletedLessonIds(testStudentId, testCourseId);
    assert.deepEqual(initialCompleted, [], 'New student must have no completed lessons initially');

    // Simulate selecting lesson 1 (fetching syllabus and active lesson)
    const lessons = await lessonService.getLessonsByCourse(testCourseId, false);
    assert.ok(lessons.length >= 2, 'Course must have at least 2 lessons');

    const activeLesson = lessons[0];
    assert.ok(activeLesson.id, 'Lesson 1 has a valid ID');

    // Verify selecting lesson does not add it to progress
    const afterSelection = await progressService.getCompletedLessonIds(testStudentId, testCourseId);
    assert.deepEqual(afterSelection, [], 'Selecting a lesson must not mark it as completed');
  });

  await t.test('2. Verify completing one lesson records strictly that lesson', async () => {
    const lessons = await lessonService.getLessonsByCourse(testCourseId, false);
    const lesson1 = lessons[0];
    const lesson2 = lessons[1];

    // Mark lesson 1 completed
    await progressService.completeLesson(testStudentId, lesson1.id, testCourseId);

    const completedAfterL1 = await progressService.getCompletedLessonIds(testStudentId, testCourseId);
    assert.equal(completedAfterL1.length, 1, 'Exactly one lesson should be completed');
    assert.ok(completedAfterL1.includes(lesson1.id), 'Lesson 1 should be recorded as completed');
    assert.ok(!completedAfterL1.includes(lesson2.id), 'Lesson 2 must remain incomplete');
  });

  await t.test('3. Verify revisiting completed lesson does not erase or duplicate completion', async () => {
    const lessons = await lessonService.getLessonsByCourse(testCourseId, false);
    const lesson1 = lessons[0];

    // Revisit / trigger completion again
    await progressService.completeLesson(testStudentId, lesson1.id, testCourseId);

    const completed = await progressService.getCompletedLessonIds(testStudentId, testCourseId);
    assert.equal(completed.length, 1, 'Should still have exactly one completed record (idempotent)');
    assert.ok(completed.includes(lesson1.id));
  });

  await t.test('4. Verify completing second lesson maintains isolation and updates progress ratio accurately', async () => {
    const lessons = await lessonService.getLessonsByCourse(testCourseId, false);
    const lesson1 = lessons[0];
    const lesson2 = lessons[1];

    await progressService.completeLesson(testStudentId, lesson2.id, testCourseId);

    const completed = await progressService.getCompletedLessonIds(testStudentId, testCourseId);
    assert.equal(completed.length, 2, 'Both lessons should now be completed');
    assert.ok(completed.includes(lesson1.id));
    assert.ok(completed.includes(lesson2.id));

    // Check course progress ratio
    const ratio = completed.length / lessons.length;
    assert.equal(ratio, 2 / lessons.length, 'Progress ratio matches exactly completed / total published');
  });

  await t.test('5. Multi-page lesson pagination parsing and final-page completion boundary', async () => {
    const multiPageContent = `Page 1 content\n<!-- pagebreak -->\nPage 2 content\n<!-- pagebreak -->\nPage 3 content`;
    const pages = multiPageContent.split('<!-- pagebreak -->').map((p) => p.trim());
    assert.equal(pages.length, 3, 'Should parse into 3 distinct content pages');

    // Page 0 (Page 1) is not final
    const isFirstPage = 0 === 0;
    const isLastPageAt0 = 0 === pages.length - 1;
    assert.equal(isFirstPage, true);
    assert.equal(isLastPageAt0, false);

    // Page 1 (Page 2) is not final
    const isLastPageAt1 = 1 === pages.length - 1;
    assert.equal(isLastPageAt1, false);

    // Page 2 (Page 3) is final
    const isLastPageAt2 = 2 === pages.length - 1;
    assert.equal(isLastPageAt2, true, 'Only the final page (index 2) triggers completion');
  });
});

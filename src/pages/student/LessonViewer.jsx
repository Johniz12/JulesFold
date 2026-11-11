import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BookOpen,
  List,
  Menu,
  Check,
  Award,
  HelpCircle,
  LayoutDashboard,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { lessonService } from '../../services/lessonService';
import { progressService } from '../../services/progressService';
import { examService } from '../../services/examService';
import './LessonViewer.css';

export const LessonViewer = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [completionError, setCompletionError] = useState(null);
  const [courseAssessments, setCourseAssessments] = useState([]);
  const [reviewMode, setReviewMode] = useState(false);

  // Keep track of completion calls in progress to guarantee idempotency
  const completingRef = useRef(false);

  useEffect(() => {
    const loadLessonData = async () => {
      try {
        setLoading(true);
        setCompletionError(null);
        setReviewMode(false);
        const [c, lList, allExams] = await Promise.all([
          courseService.getCourseById(courseId),
          lessonService.getLessonsByCourse(courseId, false),
          examService.getAvailableExams(),
        ]);
        setCourse(c);
        setLessons(lList);
        setCourseAssessments(allExams.filter((e) => e.course_id === courseId));

        const active = lList.find((l) => l.id === lessonId) || lList[0];
        setCurrentLesson(active);
        setCurrentPageIndex(0); // Reset page on lesson switch

        if (user) {
          const completed = await progressService.getCompletedLessonIds(user.id, courseId);
          setCompletedLessonIds(completed);
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLessonData();
  }, [courseId, lessonId, user]);

  const currentIndex = lessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const isCompleted = currentLesson ? completedLessonIds.includes(currentLesson.id) : false;

  // Split lesson content into pages if delimited by <!-- pagebreak -->
  const rawContent = currentLesson?.content || '';
  const pages = rawContent.includes('<!-- pagebreak -->')
    ? rawContent.split('<!-- pagebreak -->').map((p) => p.trim()).filter(Boolean)
    : [rawContent];

  const totalPages = Math.max(pages.length, 1);
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;

  // Automatic completion effect: Triggered when reaching the final page
  useEffect(() => {
    if (!user || !currentLesson || !isLastPage || loading) return;

    // If already marked completed in local state, no need to re-record
    if (completedLessonIds.includes(currentLesson.id)) {
      return;
    }

    if (completingRef.current) return;

    const recordAutomaticCompletion = async () => {
      try {
        completingRef.current = true;
        setSavingCompletion(true);
        setCompletionError(null);
        await progressService.completeLesson(user.id, currentLesson.id, courseId);
        setCompletedLessonIds((prev) => {
          if (prev.includes(currentLesson.id)) return prev;
          return [...prev, currentLesson.id];
        });
      } catch (err) {
        console.error('Failed to automatically record lesson completion:', err);
        setCompletionError('Failed to record lesson completion. Please check your connection.');
      } finally {
        setSavingCompletion(false);
        completingRef.current = false;
      }
    };

    recordAutomaticCompletion();
  }, [isLastPage, user, currentLesson, courseId, completedLessonIds, loading]);

  const handleNextPage = () => {
    if (!isLastPage) {
      setCurrentPageIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex((prev) => prev - 1);
      setReviewMode(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Identify quizzes vs comprehensive exams associated with this course
  // Quizzes: titled with 'quiz', duration <= 15m, or description mentions quiz
  const quizzes = courseAssessments.filter((a) => {
    const titleLower = (a.title || '').toLowerCase();
    const descLower = (a.description || '').toLowerCase();
    return titleLower.includes('quiz') || descLower.includes('quiz') || (a.duration_minutes && a.duration_minutes <= 15);
  });

  // Exams: comprehensive exams not counted as short quizzes, or all available course exams
  const exams = courseAssessments.filter((a) => !quizzes.includes(a));
  const primaryQuiz = quizzes.length > 0 ? quizzes[0] : null;
  const primaryExam = exams.length > 0 ? exams[0] : (courseAssessments.length > 0 && !primaryQuiz ? courseAssessments[0] : null);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner-lg"></div>
        <p>Loading lesson content...</p>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">Lesson not found.</div>
        <Link to={`/courses/${courseId}`} className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Course
        </Link>
      </div>
    );
  }

  // Markdown parser supporting Headings, Paragraphs, Lists, Code, and Visual Images with Captions
  const renderFormattedContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeBuffer = [];

    // Image regex: ![alt](url "caption") or ![alt](url)
    const imageRegex = /^!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)$/;

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`}>
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      const trimmed = line.trim();
      if (!trimmed) return;

      const imgMatch = trimmed.match(imageRegex);
      if (imgMatch) {
        const alt = imgMatch[1];
        const url = imgMatch[2];
        const caption = imgMatch[3] || alt;

        elements.push(
          <figure key={`img-${index}`} className="lesson-image-wrapper">
            <img
              src={url}
              alt={alt}
              className="lesson-image"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {caption && <figcaption className="lesson-image-caption">{caption}</figcaption>}
          </figure>
        );
        return;
      }

      if (trimmed.startsWith('#### ')) {
        elements.push(<h4 key={index}>{trimmed.replace('#### ', '')}</h4>);
      } else if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={index}>{trimmed.replace('### ', '')}</h3>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h2 key={index}>{trimmed.replace('## ', '')}</h2>);
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h1 key={index}>{trimmed.replace('# ', '')}</h1>);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={index} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem' }}>
            {trimmed.substring(2)}
          </li>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li key={index} style={{ marginLeft: '1.5rem', marginBottom: '0.25rem' }}>
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        );
      } else {
        elements.push(<p key={index}>{trimmed}</p>);
      }
    });

    if (inCodeBlock && codeBuffer.length > 0) {
      elements.push(
        <pre key="code-final">
          <code>{codeBuffer.join('\n')}</code>
        </pre>
      );
    }

    return elements;
  };

  const activePageContent = pages[currentPageIndex] || '';

  // Show completion screen if on final page, completion saved (or already completed), and not explicitly reviewing content
  const shouldShowCompletionScreen = isLastPage && (isCompleted || !savingCompletion) && !completionError && !reviewMode;

  return (
    <div className="lesson-viewer-layout">
      {/* Mobile drawer toggle */}
      <div className="lesson-mobile-bar">
        <button className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <List size={16} /> Syllabus Outline ({lessons.length})
        </button>
        <span className="text-xs text-muted">
          Lesson {currentIndex + 1} of {lessons.length} {totalPages > 1 && `(Page ${currentPageIndex + 1}/${totalPages})`}
        </span>
      </div>

      {/* Sidebar Table of Contents */}
      <aside className={`lesson-toc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="lesson-toc-header">
          <Link to={`/courses/${courseId}`} className="text-sm font-semibold text-muted" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={14} /> {course?.title || 'Course'}
          </Link>
          <h4 style={{ margin: 'var(--spacing-2) 0 0', fontSize: '1.1rem' }}>Course Syllabus</h4>
        </div>

        <nav className="lesson-toc-list">
          {lessons.map((lesson) => {
            const isActive = lesson.id === currentLesson.id;
            const completed = completedLessonIds.includes(lesson.id);

            return (
              <button
                key={lesson.id}
                type="button"
                className={`lesson-toc-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSidebarOpen(false);
                  navigate(`/courses/${courseId}/lessons/${lesson.id}`);
                }}
              >
                <div className={`lesson-toc-indicator ${completed ? 'completed' : ''}`}>
                  {completed ? <Check size={12} /> : lesson.sequence}
                </div>
                <span className="lesson-toc-item-title">{lesson.title}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && <div className="lesson-toc-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Main Lesson Content Area */}
      <div className="lesson-article-container">
        {completionError && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-4)' }}>
            <div>{completionError}</div>
          </div>
        )}

        {savingCompletion && (
          <div className="alert alert-info" style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
            <div className="spinner" style={{ width: 16, height: 16 }}></div>
            <div>Recording lesson completion...</div>
          </div>
        )}

        {shouldShowCompletionScreen ? (
          /* Post-Lesson Completion Screen */
          <div className="card lesson-completion-screen">
            <div className="completion-badge-icon">
              <CheckCircle size={48} />
            </div>

            <h1 className="completion-title">Lesson Completed!</h1>
            <p className="completion-subtitle">
              Congratulations! You have successfully finished <strong>{currentLesson.title}</strong>.
            </p>

            <div className="completion-actions-container">
              {/* Option A: Take the Short Quiz (if available) */}
              {primaryQuiz && (
                <div className="completion-action-card">
                  <div className="action-card-header">
                    <div className="action-icon quiz-icon">
                      <HelpCircle size={22} />
                    </div>
                    <div>
                      <h3 className="action-card-title">{primaryQuiz.title}</h3>
                      <p className="action-card-desc">
                        {primaryQuiz.description || 'Test your understanding of the topics covered in this lesson.'}
                      </p>
                    </div>
                  </div>
                  <Link to={`/exams/${primaryQuiz.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                    Take the Short Quiz
                  </Link>
                </div>
              )}

              {/* Option B: Take the Exam (if available and distinct from quiz) */}
              {primaryExam && (
                <div className="completion-action-card">
                  <div className="action-card-header">
                    <div className="action-icon exam-icon">
                      <Award size={22} />
                    </div>
                    <div>
                      <h3 className="action-card-title">{primaryExam.title}</h3>
                      <p className="action-card-desc">
                        {primaryExam.description || 'Take the comprehensive examination for this course.'}
                      </p>
                    </div>
                  </div>
                  <Link to={`/exams/${primaryExam.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                    Take the Exam
                  </Link>
                </div>
              )}

              {/* Option: Next Lesson if syllabus continues */}
              {nextLesson && (
                <div className="completion-action-card">
                  <div className="action-card-header">
                    <div className="action-icon next-icon">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <h3 className="action-card-title">Next Lesson: {nextLesson.title}</h3>
                      <p className="action-card-desc">
                        Continue to lesson {nextLesson.sequence} of the course syllabus.
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                  >
                    Continue to Next Lesson <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* Option C: Return to Dashboard & Course Navigation */}
              <div className="completion-nav-links">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReviewMode(true)}
                  title="Review lesson text and pages"
                >
                  <RotateCcw size={16} /> Review Lesson Content
                </button>

                <Link to={`/courses/${courseId}`} className="btn btn-secondary">
                  <BookOpen size={16} /> Course Syllabus
                </Link>

                <Link to="/dashboard" className="btn btn-secondary">
                  <LayoutDashboard size={16} /> Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Lesson Content View */
          <div className="card lesson-card">
            <div className="lesson-article-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                <span className="badge badge-primary">
                  Lesson {currentLesson.sequence}
                </span>
                {totalPages > 1 && (
                  <span className="badge badge-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    Page {currentPageIndex + 1} of {totalPages}
                  </span>
                )}
              </div>
              <h1 className="lesson-main-title">{currentLesson.title}</h1>
              {currentLesson.description && (
                <p className="lesson-lead-summary">{currentLesson.description}</p>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-6) 0' }} />

            {/* Formatted body with responsive visual elements */}
            <div className="lesson-body-content">
              {renderFormattedContent(activePageContent)}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-8) 0 var(--spacing-6)' }} />

            {/* Complete & Navigation Controls */}
            <div className="lesson-navigation-footer">
              <div>
                {/* If multi-page and not on first page, show Previous Page; otherwise Previous Lesson if available */}
                {!isFirstPage ? (
                  <button className="btn btn-secondary" onClick={handlePrevPage}>
                    <ChevronLeft size={16} /> Previous Page
                  </button>
                ) : prevLesson ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/courses/${courseId}/lessons/${prevLesson.id}`)}
                  >
                    <ChevronLeft size={16} /> Previous Lesson
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                {/* If on non-last page of a multi-page lesson, show Next Page button */}
                {!isLastPage ? (
                  <button className="btn btn-primary" onClick={handleNextPage}>
                    Next Page ({currentPageIndex + 2}/{totalPages}) <ChevronRight size={16} />
                  </button>
                ) : isCompleted ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setReviewMode(false)}
                  >
                    View Completion Summary <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

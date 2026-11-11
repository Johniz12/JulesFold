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
  CheckCircle2,
  Circle
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

  // Ref to track if user actively navigated to final page within the current lesson session
  // Initial lesson selection should NEVER auto-complete the lesson!
  const hasUserNavigatedToFinalPageRef = useRef(false);
  const activeLessonIdRef = useRef(null);
  const completingRef = useRef(false);

  // 1. Initial Course & Lesson List Loading
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setCompletionError(null);

        const [c, lList, allExams] = await Promise.all([
          courseService.getCourseById(courseId),
          lessonService.getLessonsByCourse(courseId, false),
          examService.getAvailableExams(),
        ]);

        if (!isMounted) return;

        setCourse(c);
        setLessons(lList);
        setCourseAssessments(allExams.filter((e) => e.course_id === courseId));

        const targetLesson = lList.find((l) => l.id === lessonId) || lList[0];
        setCurrentLesson(targetLesson);
        setCurrentPageIndex(0);
        hasUserNavigatedToFinalPageRef.current = false;
        activeLessonIdRef.current = targetLesson?.id || null;

        if (user) {
          const completed = await progressService.getCompletedLessonIds(user.id, courseId);
          if (isMounted) {
            setCompletedLessonIds(completed);
          }
        }
      } catch (err) {
        console.error('Failed to load lesson syllabus:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [courseId, user]);

  // 2. Switching Lessons via URL change (Sidebar click or URL navigation)
  useEffect(() => {
    if (!lessons.length) return;

    const targetLesson = lessons.find((l) => l.id === lessonId);
    if (targetLesson && targetLesson.id !== activeLessonIdRef.current) {
      activeLessonIdRef.current = targetLesson.id;
      setCurrentLesson(targetLesson);
      setCurrentPageIndex(0);
      hasUserNavigatedToFinalPageRef.current = false;
      setCompletionError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [lessonId, lessons]);

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

  // 3. Independent Completion Handler
  const triggerLessonCompletion = async (lessonToComplete) => {
    if (!user || !lessonToComplete) return;

    // Check if already recorded in completedLessonIds
    if (completedLessonIds.includes(lessonToComplete.id)) return;
    if (completingRef.current) return;

    try {
      completingRef.current = true;
      setSavingCompletion(true);
      setCompletionError(null);

      await progressService.completeLesson(user.id, lessonToComplete.id, courseId);

      setCompletedLessonIds((prev) => {
        if (prev.includes(lessonToComplete.id)) return prev;
        return [...prev, lessonToComplete.id];
      });
    } catch (err) {
      console.error('Failed to record lesson completion:', err);
      setCompletionError('Failed to record lesson completion. Please check your network connection.');
    } finally {
      setSavingCompletion(false);
      completingRef.current = false;
    }
  };

  // 4. Navigation Handlers
  const handleNextPage = () => {
    if (!isLastPage) {
      const nextIdx = currentPageIndex + 1;
      setCurrentPageIndex(nextIdx);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // If this navigation lands on the final page of a multi-page lesson, mark as completed
      if (nextIdx === totalPages - 1) {
        hasUserNavigatedToFinalPageRef.current = true;
        triggerLessonCompletion(currentLesson);
      }
    }
  };

  const handlePrevPage = () => {
    if (!isFirstPage) {
      setCurrentPageIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Ref for end-of-lesson sentinel element (for single-page lessons)
  const endOfLessonSentinelRef = useRef(null);

  // Auto-complete single-page lessons when the student reaches/scrolls to the end of the lesson
  useEffect(() => {
    if (!currentLesson || totalPages > 1) return;
    if (completedLessonIds.includes(currentLesson.id)) return;

    const sentinel = endOfLessonSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          triggerLessonCompletion(currentLesson);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [currentLesson?.id, totalPages, completedLessonIds]);

  // Identify quizzes vs comprehensive exams associated with this course
  const quizzes = courseAssessments.filter((a) => {
    const titleLower = (a.title || '').toLowerCase();
    const descLower = (a.description || '').toLowerCase();
    return titleLower.includes('quiz') || descLower.includes('quiz') || (a.duration_minutes && a.duration_minutes <= 15);
  });

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

  return (
    <div className="lesson-viewer-layout">
      {/* Mobile syllabus bar */}
      <div className="lesson-mobile-bar">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Syllabus Outline"
        >
          <List size={16} /> Syllabus Outline ({lessons.length})
        </button>
        <span className="text-sm font-semibold text-muted">
          Lesson {currentIndex + 1} of {lessons.length} {totalPages > 1 && `(Page ${currentPageIndex + 1}/${totalPages})`}
        </span>
      </div>

      {/* Sidebar Table of Contents */}
      <aside className={`lesson-toc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="lesson-toc-header">
          <Link
            to={`/courses/${courseId}`}
            className="text-sm font-semibold text-muted lesson-back-link"
          >
            <ArrowLeft size={16} /> {course?.title || 'Back to Course'}
          </Link>
          <div className="lesson-toc-title-row">
            <h3 className="lesson-toc-heading">Course Syllabus</h3>
            <span className="badge badge-secondary">{completedLessonIds.length}/{lessons.length} Done</span>
          </div>
        </div>

        <nav className="lesson-toc-list" aria-label="Lessons List">
          {lessons.map((lesson) => {
            const isActive = lesson.id === currentLesson.id;
            const isLessonDone = completedLessonIds.includes(lesson.id);

            return (
              <button
                key={lesson.id}
                type="button"
                className={`lesson-toc-item ${isActive ? 'active' : ''} ${isLessonDone ? 'completed-item' : ''}`}
                onClick={() => {
                  setSidebarOpen(false);
                  navigate(`/courses/${courseId}/lessons/${lesson.id}`);
                }}
              >
                <div className={`lesson-toc-indicator ${isLessonDone ? 'completed' : isActive ? 'active-indicator' : 'not-started'}`}>
                  {isLessonDone ? <Check size={14} strokeWidth={3} /> : lesson.sequence}
                </div>

                <div className="lesson-toc-info">
                  <span className="lesson-toc-item-title">{lesson.title}</span>
                  <div className="lesson-toc-item-meta">
                    {isLessonDone ? (
                      <span className="text-success text-xs font-semibold">Completed</span>
                    ) : isActive ? (
                      <span className="text-primary text-xs font-semibold">Currently Reading</span>
                    ) : (
                      <span className="text-muted text-xs">Lesson {lesson.sequence}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && <div className="lesson-toc-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Main Lesson Content Area */}
      <main className="lesson-article-container">
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

        {/* Lesson Reading Card */}
        <article className="card lesson-card">
          <header className="lesson-article-header">
            <div className="lesson-meta-bar">
              <span className="badge badge-primary">
                Lesson {currentLesson.sequence}
              </span>

              {totalPages > 1 && (
                <span className="badge badge-secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  Page {currentPageIndex + 1} of {totalPages}
                </span>
              )}

              {isCompleted && (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> Completed
                </span>
              )}
            </div>

            <h1 className="lesson-main-title">{currentLesson.title}</h1>
            {currentLesson.description && (
              <p className="lesson-lead-summary">{currentLesson.description}</p>
            )}
          </header>

          <hr className="lesson-divider" />

          {/* Formatted Content */}
          <div className="lesson-body-content">
            {renderFormattedContent(activePageContent)}
          </div>

          <hr className="lesson-divider-footer" />

          {/* Navigation Controls */}
          <footer className="lesson-navigation-footer">
            <div className="footer-nav-left">
              {!isFirstPage ? (
                <button className="btn btn-secondary" onClick={handlePrevPage}>
                  <ChevronLeft size={18} /> Previous Page
                </button>
              ) : prevLesson ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/courses/${courseId}/lessons/${prevLesson.id}`)}
                >
                  <ChevronLeft size={18} /> Previous Lesson
                </button>
              ) : (
                <div />
              )}
            </div>

            <div className="footer-nav-right">
              {/* Multi-page lesson: Next Page button */}
              {!isLastPage && (
                <button className="btn btn-primary" onClick={handleNextPage}>
                  Next Page ({currentPageIndex + 2}/{totalPages}) <ChevronRight size={18} />
                </button>
              )}

              {/* Sentinel for single-page automatic completion when viewed to the end */}
              {totalPages === 1 && !isCompleted && (
                <div ref={endOfLessonSentinelRef} style={{ width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
              )}

              {/* Next Lesson navigation when on last page */}
              {isLastPage && nextLesson && (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                >
                  Next Lesson: {nextLesson.title} <ChevronRight size={18} />
                </button>
              )}
            </div>
          </footer>
        </article>

        {/* Post-Lesson Completion Section (Displayed on final page once completed) */}
        {isLastPage && isCompleted && (
          <section className="card lesson-completion-screen" style={{ marginTop: 'var(--spacing-8)' }}>
            <div className="completion-badge-icon">
              <CheckCircle size={48} />
            </div>

            <h2 className="completion-title">Lesson Completed!</h2>
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

              {/* Course Navigation Links */}
              <div className="completion-nav-links">
                <Link to={`/courses/${courseId}`} className="btn btn-secondary">
                  <BookOpen size={16} /> Course Syllabus
                </Link>

                <Link to="/dashboard" className="btn btn-secondary">
                  <LayoutDashboard size={16} /> Return to Dashboard
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

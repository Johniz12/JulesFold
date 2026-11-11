import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BookOpen,
  List,
  Menu,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { lessonService } from '../../services/lessonService';
import { progressService } from '../../services/progressService';
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
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const loadLessonData = async () => {
      try {
        setLoading(true);
        const [c, lList] = await Promise.all([
          courseService.getCourseById(courseId),
          lessonService.getLessonsByCourse(courseId, false),
        ]);
        setCourse(c);
        setLessons(lList);

        const active = lList.find((l) => l.id === lessonId) || lList[0];
        setCurrentLesson(active);

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

  const handleMarkCompleted = async () => {
    if (!user || !currentLesson || isCompleted) return;
    try {
      setMarking(true);
      await progressService.completeLesson(user.id, currentLesson.id, courseId);
      setCompletedLessonIds((prev) => [...prev, currentLesson.id]);
    } catch (err) {
      alert('Failed to update progress: ' + err.message);
    } finally {
      setMarking(false);
    }
  };

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

  return (
    <div className="lesson-viewer-layout">
      {/* Mobile drawer toggle */}
      <div className="lesson-mobile-bar">
        <button className="btn btn-secondary btn-sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <List size={16} /> Syllabus Outline ({lessons.length})
        </button>
        <span className="text-xs text-muted">
          Lesson {currentIndex + 1} of {lessons.length}
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
        <div className="lesson-card">
          <div className="lesson-article-header">
            <span className="badge badge-primary" style={{ alignSelf: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
              Lesson {currentLesson.sequence}
            </span>
            <h1 className="lesson-main-title">{currentLesson.title}</h1>
            {currentLesson.description && (
              <p className="lesson-lead-summary">{currentLesson.description}</p>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-6) 0' }} />

          {/* Formatted body with responsive visual elements */}
          <div className="lesson-body-content">
            {renderFormattedContent(currentLesson.content)}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-8) 0 var(--spacing-6)' }} />

          {/* Complete & Navigation Controls */}
          <div className="lesson-navigation-footer">
            <div>
              {prevLesson ? (
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
              <button
                className={`btn ${isCompleted ? 'btn-success' : 'btn-primary'}`}
                onClick={handleMarkCompleted}
                disabled={isCompleted || marking}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle size={16} /> Completed
                  </>
                ) : (
                  <>
                    {marking ? 'Saving...' : 'Mark as Completed'}
                  </>
                )}
              </button>

              {nextLesson && (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                >
                  Next Lesson <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

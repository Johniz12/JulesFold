import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  Clock,
  BookOpen,
  Award,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { lessonService } from '../../services/lessonService';
import { progressService } from '../../services/progressService';
import { examService } from '../../services/examService';

export const CourseDetail = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [courseExams, setCourseExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      try {
        setLoading(true);
        const [c, l, allExams] = await Promise.all([
          courseService.getCourseById(courseId),
          lessonService.getLessonsByCourse(courseId, false),
          examService.getAvailableExams(),
        ]);
        setCourse(c);
        setLessons(l);
        setCourseExams(allExams.filter((e) => e.course_id === courseId));

        if (user) {
          const completed = await progressService.getCompletedLessonIds(user.id, courseId);
          setCompletedLessonIds(completed);
        }
      } catch (err) {
        console.error('Failed to load course details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [courseId, user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p>Loading course syllabus...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">Course not found or is currently private.</div>
        <Link to="/courses" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Catalog
        </Link>
      </div>
    );
  }

  const completionPercentage = lessons.length > 0
    ? Math.round((completedLessonIds.length / lessons.length) * 100)
    : 0;

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <Link to="/courses" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>

      {/* Header Info */}
      <div className="card" style={{ marginBottom: 'var(--spacing-8)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-6)', flexWrap: 'wrap' }}>
          {course.cover_image_url && (
            <img
              src={course.cover_image_url}
              alt={course.title}
              style={{
                width: 240,
                height: 160,
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#e2e8f0'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          <div style={{ flex: 1, minWidth: 260 }}>
            <span className="badge badge-secondary" style={{ marginBottom: 'var(--spacing-2)' }}>
              {course.category}
            </span>
            <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--spacing-3)' }}>{course.title}</h1>
            <p className="text-muted" style={{ lineHeight: 1.6, marginBottom: 'var(--spacing-4)' }}>
              {course.description}
            </p>

            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                <span className="font-semibold text-muted">Course Completion</span>
                <span className="font-bold text-primary">{completionPercentage}% ({completedLessonIds.length}/{lessons.length} lessons)</span>
              </div>
              <div style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  width: `${completionPercentage}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-primary)',
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
        {/* Lesson Syllabus */}
        <div>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Course Syllabus & Lessons</h3>
          {lessons.length === 0 ? (
            <div className="card empty-state">
              <p className="text-muted text-sm">No published lessons yet for this course.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              {lessons.map((lesson) => {
                const isCompleted = completedLessonIds.includes(lesson.id);
                return (
                  <Link
                    key={lesson.id}
                    to={`/courses/${courseId}/lessons/${lesson.id}`}
                    className="card card-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textDecoration: 'none',
                      color: 'inherit',
                      padding: 'var(--spacing-4) var(--spacing-6)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', minWidth: 0 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isCompleted ? 'var(--color-success-bg)' : 'var(--color-primary-light)',
                        color: isCompleted ? 'var(--color-success)' : 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        flexShrink: 0
                      }}>
                        {isCompleted ? <CheckCircle size={18} /> : lesson.sequence}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lesson.title}
                        </h4>
                        <p className="text-muted text-xs" style={{ margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lesson.description || 'Interactive Lesson'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexShrink: 0 }}>
                      {isCompleted ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge badge-secondary">Start</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Exams associated with course */}
        <div>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Course Examination</h3>
          {courseExams.length === 0 ? (
            <div className="card" style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
              <Award size={32} style={{ color: 'var(--color-text-subtle)', marginBottom: 8 }} />
              <p className="text-muted text-sm" style={{ margin: 0 }}>No final examination required for this course.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
              {courseExams.map((ex) => (
                <div key={ex.id} className="card">
                  <span className="badge badge-primary" style={{ marginBottom: 'var(--spacing-2)' }}>Final Assessment</span>
                  <h4 style={{ margin: '0 0 var(--spacing-2)' }}>{ex.title}</h4>
                  <p className="text-muted text-xs" style={{ marginBottom: 'var(--spacing-3)' }}>
                    {ex.description || 'Test your proficiency upon completing the syllabus.'}
                  </p>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>
                    ⏱ Duration: {ex.duration_minutes ? `${ex.duration_minutes}m` : 'Untimed'} | Passing: {ex.passing_percentage}%
                  </div>
                  <Link to={`/exams/${ex.id}`} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                    Take Examination
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

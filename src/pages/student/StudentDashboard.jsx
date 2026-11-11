import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle,
  Award,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  PlayCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { progressService } from '../../services/progressService';
import { examService } from '../../services/examService';

export const StudentDashboard = () => {
  const { user, profile } = useAuth();
  const [overview, setOverview] = useState({
    enrolledCoursesCount: 0,
    completedLessonsCount: 0,
    examAttemptsCount: 0,
    examsPassedCount: 0,
    recentAttempts: [],
  });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [stats, courses, exams] = await Promise.all([
          progressService.getStudentOverview(user.id),
          progressService.getStudentEnrollments(user.id),
          examService.getAvailableExams(),
        ]);
        setOverview(stats);
        setEnrolledCourses(courses);
        setAvailableExams(exams.slice(0, 3));
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p>Loading your learning space...</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Learner';

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
        color: 'white',
        marginBottom: 'var(--spacing-8)',
        padding: 'var(--spacing-8)',
      }}>
        <div style={{ maxWidth: 640 }}>
          <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: 'var(--spacing-2)' }}>
            Welcome back, {firstName}! 👋
          </h1>
          <p style={{ color: '#c7d2fe', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
            Continue expanding your skills. Complete your syllabus lessons, test your comprehension with examinations, and receive immediate verified certifications.
          </p>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-8)',
      }}>
        <div className="card">
          <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Courses Enrolled</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4 }}>{overview.enrolledCoursesCount}</div>
        </div>

        <div className="card">
          <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Lessons Completed</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--color-primary)' }}>
            {overview.completedLessonsCount}
          </div>
        </div>

        <div className="card">
          <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Exams Taken</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4 }}>{overview.examAttemptsCount}</div>
        </div>

        <div className="card">
          <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Exams Passed</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 4, color: 'var(--color-success)' }}>
            {overview.examsPassedCount}
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-6)' }}>
        {/* Left: Enrolled Courses */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <h3 style={{ margin: 0 }}>Enrolled Courses</h3>
            <Link to="/courses" className="text-sm font-semibold text-primary" style={{ textDecoration: 'none' }}>
              Browse Catalog <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="card empty-state" style={{ padding: 'var(--spacing-8)' }}>
              <div className="empty-state-icon">
                <BookOpen size={32} />
              </div>
              <h4>No enrolled courses yet</h4>
              <p className="text-muted text-sm" style={{ marginBottom: 'var(--spacing-4)' }}>
                You have not started any courses yet. Browse our library to begin learning.
              </p>
              <Link to="/courses" className="btn btn-primary btn-sm">
                <Compass size={16} /> Explore Courses
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {enrolledCourses.map((course) => (
                <div key={course.id} className="card card-hover" style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'center' }}>
                  {course.cover_image_url && (
                    <img
                      src={course.cover_image_url}
                      alt={course.title}
                      style={{ width: 100, height: 80, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="badge badge-secondary" style={{ marginBottom: 4 }}>{course.category}</span>
                    <h4 style={{ margin: 0, fontSize: '1.125rem' }}>{course.title}</h4>
                    <p className="text-muted text-xs" style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: '4px 0 0'
                    }}>
                      {course.description}
                    </p>
                  </div>
                  <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                    <PlayCircle size={16} /> Study
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Available Exams & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Pending / Available Exams */}
          <div className="card">
            <h4 style={{ marginBottom: 'var(--spacing-3)' }}>Available Examinations</h4>
            {availableExams.length === 0 ? (
              <p className="text-muted text-sm">No examinations currently scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {availableExams.map((ex) => (
                  <div key={ex.id} style={{
                    padding: 'var(--spacing-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div className="font-semibold text-sm">{ex.title}</div>
                    <div className="text-muted text-xs" style={{ margin: '2px 0 8px' }}>
                      {ex.duration_minutes ? `${ex.duration_minutes} mins` : 'Untimed'} • Pass: {ex.passing_percentage}%
                    </div>
                    <Link to={`/exams/${ex.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      <Award size={14} /> Start Exam
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Exam Submissions */}
          <div className="card">
            <h4 style={{ marginBottom: 'var(--spacing-3)' }}>Recent Exam Results</h4>
            {overview.recentAttempts.length === 0 ? (
              <p className="text-muted text-sm">No test attempts submitted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                {overview.recentAttempts.map((att) => (
                  <div key={att.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-2) 0',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '0.8125rem'
                  }}>
                    <div>
                      <div className="font-semibold">{att.score_percentage}% Score</div>
                      <span className="text-muted text-xs">
                        {new Date(att.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`badge ${att.passed ? 'badge-success' : 'badge-danger'}`}>
                      {att.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

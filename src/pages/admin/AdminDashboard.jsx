import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileText,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  Plus
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import { lessonService } from '../../services/lessonService';
import { examService } from '../../services/examService';
import { authService } from '../../services/authService';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    studentsCount: 0,
    coursesCount: 0,
    lessonsCount: 0,
    examsCount: 0,
  });
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [courses, exams, students, attempts] = await Promise.all([
          courseService.getAllCourses(),
          examService.getAllExams(),
          authService.getStudents(),
          examService.getAllAttempts(),
        ]);

        // Aggregate lesson count across all courses
        let totalLessons = 0;
        for (const course of courses) {
          const lessons = await lessonService.getLessonsByCourse(course.id, true);
          totalLessons += lessons.length;
        }

        setStats({
          coursesCount: courses.length,
          examsCount: exams.length,
          studentsCount: students.length,
          lessonsCount: totalLessons,
        });

        setRecentAttempts(attempts.slice(0, 5));
        setRecentStudents(students.slice(0, 5));
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner spinner-lg"></div>
        <p>Loading administration dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administrator Dashboard</h1>
          <p className="text-muted text-sm">System oversight, educational resources, and live student exam metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Link to="/admin/courses" className="btn btn-primary btn-sm">
            <Plus size={16} /> Manage Courses
          </Link>
          <Link to="/admin/exams" className="btn btn-secondary btn-sm">
            <Plus size={16} /> Manage Exams
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-8)'
      }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={24} />
          </div>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Registered Students</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.studentsCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Total Courses</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.coursesCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#fef3c7',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Published Lessons</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.lessonsCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={24} />
          </div>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase' }}>Total Examinations</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.examsCount}</div>
          </div>
        </div>
      </div>

      {/* Two-column overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--spacing-6)' }}>
        {/* Recent Exam Submissions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Recent Examination Activity</h3>
            <Link to="/admin/results" className="text-sm font-semibold text-primary" style={{ textDecoration: 'none' }}>
              View All <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="text-muted text-sm" style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
              No examination attempts recorded yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Exam</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>
                        <div className="font-semibold text-sm">{attempt.profiles?.full_name || 'Student'}</div>
                        <div className="text-muted text-xs">{attempt.profiles?.email}</div>
                      </td>
                      <td className="text-sm">{attempt.exams?.title || 'Exam'}</td>
                      <td>
                        <span className="font-semibold">{attempt.score_percentage}%</span>
                        <div className="text-muted text-xs">{attempt.points_earned}/{attempt.total_points} pts</div>
                      </td>
                      <td>
                        {attempt.passed ? (
                          <span className="badge badge-success">
                            <CheckCircle size={12} /> PASSED
                          </span>
                        ) : (
                          <span className="badge badge-danger">
                            <XCircle size={12} /> FAILED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Student Signups */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Recent Student Registrations</h3>
            <Link to="/admin/students" className="text-sm font-semibold text-primary" style={{ textDecoration: 'none' }}>
              View All <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </Link>
          </div>

          {recentStudents.length === 0 ? (
            <div className="text-muted text-sm" style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
              No students registered yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((st) => (
                    <tr key={st.id}>
                      <td className="font-semibold text-sm">{st.full_name}</td>
                      <td className="text-muted text-sm">{st.email}</td>
                      <td className="text-xs text-muted">
                        {new Date(st.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

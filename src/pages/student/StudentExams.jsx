import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Clock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { examService } from '../../services/examService';

export const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const list = await examService.getAvailableExams();
        setExams(list);
      } catch (err) {
        console.error('Failed to load examinations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Examinations & Certifications</h1>
          <p className="text-muted text-sm">Validate your skills, take timed tests, and view instant evaluated results.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Loading available assessments...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Award size={32} />
          </div>
          <h3>No Examinations Scheduled</h3>
          <p className="text-muted text-sm">There are currently no active examinations available.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-6)' }}>
          {exams.map((exam) => (
            <div key={exam.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="badge badge-primary" style={{ alignSelf: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                {exam.courses?.title || 'General Examination'}
              </span>

              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-2)' }}>{exam.title}</h3>
              <p className="text-muted text-sm" style={{ flex: 1, marginBottom: 'var(--spacing-4)', lineHeight: 1.5 }}>
                {exam.description || 'Comprehensive evaluation covering course objectives.'}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-2)',
                backgroundColor: 'var(--color-secondary-light)',
                padding: 'var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                marginBottom: 'var(--spacing-4)'
              }}>
                <div><strong>Duration:</strong> {exam.duration_minutes ? `${exam.duration_minutes} mins` : 'Untimed'}</div>
                <div><strong>Passing:</strong> {exam.passing_percentage}%</div>
                <div><strong>Max Attempts:</strong> {exam.max_attempts ? exam.max_attempts : 'Unlimited'}</div>
                <div><strong>Review:</strong> {exam.review_answers_enabled ? 'Allowed' : 'Not Allowed'}</div>
              </div>

              <Link to={`/exams/${exam.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                <Award size={16} /> Take Examination
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

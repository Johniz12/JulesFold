import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { examService } from '../../services/examService';

export const ExamResult = () => {
  const { examId, attemptId } = useParams();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await examService.getExamAttemptReview(attemptId);
        setReviewData(data);
      } catch (err) {
        console.error('Failed to load examination result:', err);
        setError(err.message || 'Failed to load examination results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner-lg"></div>
        <p>Loading examination results...</p>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="page-container" style={{ maxWidth: 640 }}>
        <div className="alert alert-danger">{error || 'Result record not found.'}</div>
        <Link to="/exams" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return to Examinations
        </Link>
      </div>
    );
  }

  const { attempt, review_allowed, questions } = reviewData;
  const isPassed = attempt?.passed;

  return (
    <div className="page-container" style={{ maxWidth: 840 }}>
      {/* Score Header Card */}
      <div className="card" style={{
        textAlign: 'center',
        padding: 'var(--spacing-8)',
        marginBottom: 'var(--spacing-8)',
        borderTop: `6px solid ${isPassed ? 'var(--color-success)' : 'var(--color-danger)'}`
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 'var(--radius-full)',
          backgroundColor: isPassed ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
          color: isPassed ? 'var(--color-success)' : 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--spacing-4)',
        }}>
          {isPassed ? <CheckCircle size={40} /> : <XCircle size={40} />}
        </div>

        <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.875rem', padding: '0.4rem 1rem' }}>
          {isPassed ? 'PASSED' : 'FAILED'}
        </span>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 'var(--spacing-3) 0 var(--spacing-1)' }}>
          {attempt.score_percentage}%
        </h1>
        <p className="text-muted" style={{ fontSize: '1rem', marginBottom: 'var(--spacing-6)' }}>
          Points Earned: <strong>{attempt.points_earned}</strong> out of <strong>{attempt.total_points}</strong> total points
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--spacing-6)',
          paddingTop: 'var(--spacing-4)',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)'
        }}>
          <div>Attempt #{attempt.attempt_number}</div>
          <div>•</div>
          <div>Submitted: {new Date(attempt.submitted_at).toLocaleString()}</div>
        </div>
      </div>

      {/* Answer Review Section */}
      {review_allowed && questions?.length > 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
            <ShieldCheck size={20} className="text-primary" />
            <h3 style={{ margin: 0 }}>Detailed Answer Review</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
            {questions.map((q, idx) => (
              <div key={q.question_id || idx} className="card" style={{
                borderLeft: `4px solid ${q.is_correct ? 'var(--color-success)' : 'var(--color-danger)'}`,
                padding: 'var(--spacing-5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                    <span className="badge badge-secondary">Question {idx + 1}</span>
                    <span className={`badge ${q.is_correct ? 'badge-success' : 'badge-danger'}`}>
                      {q.is_correct ? `+${q.points_awarded} Points` : '0 Points'}
                    </span>
                  </div>
                  <span className="text-xs text-muted">Value: {q.points} pts</span>
                </div>

                <div className="font-semibold text-base" style={{ marginBottom: 'var(--spacing-3)' }}>
                  {q.question_text}
                </div>

                <div style={{
                  backgroundColor: 'var(--color-secondary-light)',
                  padding: 'var(--spacing-3) var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div>
                    <span className="text-muted">Your Answer: </span>
                    <strong style={{ color: q.is_correct ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {q.student_answer || '(No answer provided)'}
                    </strong>
                  </div>

                  {!q.is_correct && q.correct_answer && (
                    <div>
                      <span className="text-muted">Correct Answer: </span>
                      <strong className="text-success">{q.correct_answer}</strong>
                    </div>
                  )}

                  {q.explanation && (
                    <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(0,0,0,0.06)', color: 'var(--color-text-subtle)', fontSize: '0.8125rem' }}>
                      <em>Explanation: {q.explanation}</em>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="alert alert-info" style={{ marginBottom: 'var(--spacing-8)' }}>
          Detailed question-by-question review is disabled by the administrator for this examination.
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/exams" className="btn btn-secondary">
          <ArrowLeft size={16} /> All Examinations
        </Link>
        <Link to="/dashboard" className="btn btn-primary">
          Back to My Learning <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

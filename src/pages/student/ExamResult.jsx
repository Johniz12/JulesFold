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
  RotateCcw,
  Image as ImageIcon
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

  const correctCount = questions?.filter((q) => q.is_correct).length || 0;
  const incorrectCount = (questions?.length || 0) - correctCount;

  return (
    <div className="page-container" style={{ maxWidth: 880 }}>
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

        {/* Detailed Metrics Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--spacing-3)',
          padding: 'var(--spacing-4)',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-4)',
          textAlign: 'center'
        }}>
          <div>
            <div className="text-muted text-xs font-semibold">Total Questions</div>
            <div className="font-bold text-base">{questions?.length || 0}</div>
          </div>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ color: 'var(--color-success)' }}>Correct Answers</div>
            <div className="font-bold text-base text-success">{correctCount}</div>
          </div>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>Incorrect Answers</div>
            <div className="font-bold text-base text-danger">{incorrectCount}</div>
          </div>
          <div>
            <div className="text-muted text-xs font-semibold">Attempt</div>
            <div className="font-bold text-base">#{attempt.attempt_number}</div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'var(--spacing-6)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)'
        }}>
          <div>Submitted: {new Date(attempt.submitted_at).toLocaleString()}</div>
        </div>
      </div>

      {/* Answer Review Section */}
      {review_allowed && questions?.length > 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
            <ShieldCheck size={20} className="text-primary" />
            <h3 style={{ margin: 0 }}>Question-by-Question Detailed Review</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', marginBottom: 'var(--spacing-8)' }}>
            {questions.map((q, idx) => (
              <div key={q.question_id || idx} className="card" style={{
                borderLeft: `5px solid ${q.is_correct ? 'var(--color-success)' : 'var(--color-danger)'}`,
                padding: 'var(--spacing-6)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
                    <span className="badge badge-secondary">Question {idx + 1}</span>
                    <span className={`badge ${q.is_correct ? 'badge-success' : 'badge-danger'}`}>
                      {q.is_correct ? `+${q.points_awarded} Points (CORRECT)` : '0 Points (INCORRECT)'}
                    </span>
                  </div>
                  <span className="text-xs text-muted">Value: {q.points} pts</span>
                </div>

                <div className="font-semibold text-lg" style={{ marginBottom: 'var(--spacing-3)' }}>
                  {q.question_text}
                </div>

                {/* Optional Question Image in Review */}
                {q.image?.url && (
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <img
                      src={q.image.url}
                      alt={q.image.alt || 'Question illustration'}
                      style={{
                        maxHeight: 200,
                        maxWidth: '100%',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'contain',
                        backgroundColor: 'var(--color-surface-hover)'
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Choices listing if available */}
                {Array.isArray(q.choices) && q.choices.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-2)',
                    margin: 'var(--spacing-3) 0 var(--spacing-4)'
                  }}>
                    {q.choices.map((c, cIdx) => {
                      const cText = typeof c === 'string' ? c : c.text;
                      const cImg = typeof c === 'object' ? c.image?.url : null;
                      return (
                        <div key={cIdx} style={{
                          padding: 'var(--spacing-2) var(--spacing-3)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-2)'
                        }}>
                          {cImg && (
                            <img
                              src={cImg}
                              alt="Choice"
                              style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }}
                            />
                          )}
                          <span>{cText}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Student answer comparison */}
                <div style={{
                  backgroundColor: 'var(--color-secondary-light)',
                  padding: 'var(--spacing-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  <div>
                    <span className="text-muted">Your Selection: </span>
                    <strong style={{ color: q.is_correct ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {q.student_answer || '(No answer selected)'}
                    </strong>
                  </div>

                  {!q.is_correct && q.correct_answer && (
                    <div>
                      <span className="text-muted">Correct Answer: </span>
                      <strong className="text-success">{q.correct_answer}</strong>
                    </div>
                  )}

                  {q.explanation && (
                    <div style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      color: 'var(--color-text-main)',
                      fontSize: '0.8125rem'
                    }}>
                      <strong>Explanation: </strong>
                      <span>{q.explanation}</span>
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

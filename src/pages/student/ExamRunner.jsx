import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { examService } from '../../services/examService';
import './ExamRunner.css';

export const ExamRunner = () => {
  const { examId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: student_answer }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef(null);

  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        const [examData, studentQuestions] = await Promise.all([
          examService.getExamById(examId),
          examService.getQuestionsForStudent(examId),
        ]);

        if (!examData) {
          setError('Exam not found.');
          return;
        }

        if (!examData.is_enabled) {
          setError('This examination is currently disabled.');
          return;
        }

        if (user && examData.max_attempts > 0) {
          const priorAttempts = await examService.getStudentAttempts(examId, user.id);
          if (priorAttempts.length >= examData.max_attempts) {
            setError(`You have reached the maximum allowed attempts (${examData.max_attempts}) for this exam.`);
            return;
          }
        }

        setExam(examData);
        setQuestions(studentQuestions);
        setStartTime(Date.now());

        if (examData.duration_minutes > 0) {
          setTimeRemainingSeconds(examData.duration_minutes * 60);
        }
      } catch (err) {
        console.error('Failed to initialize exam:', err);
        setError(err.message || 'Error loading examination.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [examId, user]);

  useEffect(() => {
    if (timeRemainingSeconds === null || submitted) return;

    if (timeRemainingSeconds <= 0) {
      handleFinalSubmit(true);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeRemainingSeconds, submitted]);

  const handleSelectAnswer = (questionId, value) => {
    if (submitted || submitting) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleFinalSubmit = async (autoSubmitted = false) => {
    if (submitting || submitted) return;
    try {
      setSubmitting(true);
      setShowConfirmModal(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

      const formattedAnswers = questions.map((q) => ({
        question_id: q.id,
        student_answer: answers[q.id] || '',
      }));

      const gradingResult = await examService.submitAndGradeExam(
        examId,
        formattedAnswers,
        user.id,
        elapsedSeconds
      );

      setSubmitted(true);
      navigate(`/exams/${examId}/results/${gradingResult.attempt_id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit examination.');
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    if (seconds === null) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="spinner spinner-lg"></div>
        <p>Preparing examination runner...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ maxWidth: 640 }}>
        <div className="alert alert-danger" style={{ marginBottom: 'var(--spacing-4)' }}>
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
        <Link to="/exams" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Available Examinations
        </Link>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="page-container" style={{ maxWidth: 640 }}>
        <div className="alert alert-warning">
          There are currently no questions configured for this examination.
        </div>
        <Link to="/exams" className="btn btn-secondary">
          <ArrowLeft size={16} /> Return
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeRemainingSeconds !== null && timeRemainingSeconds <= 120;

  return (
    <div className="exam-runner-container">
      {/* Runner Top Bar */}
      <div className="exam-top-bar">
        <div className="exam-top-info">
          <h2 className="exam-runner-title">{exam.title}</h2>
          <span className="exam-progress-tracker">
            Question {currentIndex + 1} of {questions.length} • ({answeredCount} answered)
          </span>
        </div>

        {timeRemainingSeconds !== null && (
          <div className={`exam-timer-badge ${isTimeCritical ? 'critical' : ''}`}>
            <Clock size={16} />
            <span className="exam-timer-clock">{formatTimer(timeRemainingSeconds)}</span>
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className="exam-card">
        <div className="exam-question-header">
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'center' }}>
            <span className="badge badge-primary">Q{currentIndex + 1}</span>
            <span className="badge badge-secondary">{currentQuestion.points} Points</span>
            <span className="badge badge-secondary">{currentQuestion.question_type}</span>
          </div>
        </div>

        <h3 className="exam-question-text">{currentQuestion.question_text}</h3>

        {/* Optional Question Image */}
        {currentQuestion.image?.url && (
          <div className="exam-question-image-box" style={{ marginBottom: 'var(--spacing-6)', textAlign: 'center' }}>
            <img
              src={currentQuestion.image.url}
              alt={currentQuestion.image.alt || 'Question illustration'}
              style={{
                maxWidth: '100%',
                maxHeight: 340,
                borderRadius: 'var(--radius-card)',
                objectFit: 'contain',
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: 'var(--color-surface-hover)'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {currentQuestion.image.caption && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                {currentQuestion.image.caption}
              </div>
            )}
          </div>
        )}

        {/* Choices Grid (supports both text and choice images) */}
        <div className="exam-choices-grid">
          {currentQuestion.choices.map((choice, idx) => {
            const choiceVal = typeof choice === 'string' ? choice : (choice.text || choice.id);
            const choiceLabel = typeof choice === 'string' ? choice : choice.text;
            const choiceImage = typeof choice === 'object' ? choice.image?.url : null;
            const isSelected = answers[currentQuestion.id] === choiceVal;

            return (
              <button
                key={idx}
                type="button"
                className={`exam-choice-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectAnswer(currentQuestion.id, choiceVal)}
                disabled={submitting || submitted}
              >
                <div className="exam-choice-marker">
                  {isSelected ? <CheckCircle2 size={16} /> : String.fromCharCode(65 + idx)}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
                  <span className="exam-choice-text">{choiceLabel}</span>
                  {choiceImage && (
                    <img
                      src={choiceImage}
                      alt="Choice illustration"
                      style={{
                        maxHeight: 140,
                        maxWidth: 220,
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        marginTop: 4,
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation & Submission Controls */}
        <div className="exam-footer-controls">
          <div>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={currentIndex === 0 || submitting}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
            >
              <ChevronLeft size={16} /> Previous
            </button>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
              >
                <Send size={16} /> Finish & Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Confirm Exam Submission</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowConfirmModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: '0 0 var(--spacing-4)' }}>
                You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
              </p>
              {answeredCount < questions.length && (
                <div className="alert alert-warning" style={{ fontSize: '0.8125rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>
                    You have <strong>{questions.length - answeredCount}</strong> unanswered questions. Unanswered questions will receive 0 points.
                  </div>
                </div>
              )}
              <p className="text-muted text-sm" style={{ margin: 0 }}>
                Once submitted, your answers will be transmitted for server-side evaluation. This attempt cannot be edited.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Continue Reviewing
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
              >
                {submitting ? 'Evaluating...' : 'Yes, Submit Answers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

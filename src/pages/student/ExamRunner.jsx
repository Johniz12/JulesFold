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
  X
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

        // Check prior attempt limits
        if (user && examData.max_attempts > 0) {
          const priorAttempts = await examService.getStudentAttempts(examId, user.id);
          if (priorAttempts.length >= examData.max_attempts) {
            setError(`You have reached the maximum allowed attempts (${examData.max_attempts}) for this exam.`);
            return;
          }
        }

        setExam(examData);
        setQuestions(studentQuestions);

        // Initialize countdown timer if duration is specified
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

  // Active countdown timer with auto-submit
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

      // Format answers payload for secure server-side grading
      const formattedAnswers = questions.map((q) => ({
        question_id: q.id,
        student_answer: answers[q.id] || '',
      }));

      // Call secure server grading RPC
      const gradingResult = await examService.submitAndGradeExam(
        examId,
        formattedAnswers,
        user.id
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
  const isTimeCritical = timeRemainingSeconds !== null && timeRemainingSeconds <= 120; // under 2 mins

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
          </div>
        </div>

        <h3 className="exam-question-text">{currentQuestion.question_text}</h3>

        {/* Choices */}
        <div className="exam-choices-grid">
          {currentQuestion.choices.map((choice, idx) => {
            const isSelected = answers[currentQuestion.id] === choice;
            return (
              <button
                key={idx}
                type="button"
                className={`exam-choice-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectAnswer(currentQuestion.id, choice)}
                disabled={submitting || submitted}
              >
                <div className="exam-choice-marker">
                  {isSelected ? <CheckCircle2 size={16} /> : String.fromCharCode(65 + idx)}
                </div>
                <span className="exam-choice-text">{choice}</span>
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

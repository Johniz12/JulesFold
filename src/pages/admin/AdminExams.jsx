import React, { useState, useEffect } from 'react';
import {
  Plus,
  ClipboardList,
  Edit2,
  Trash2,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { examService } from '../../services/examService';
import { courseService } from '../../services/courseService';
import { QuestionBuilder } from '../../components/admin/QuestionBuilder';

export const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    duration_minutes: 30,
    passing_percentage: 70,
    max_attempts: 3,
    is_enabled: true,
    review_answers_enabled: true,
    randomize_questions: false,
    randomize_options: false,
  });

  const [examQuestions, setExamQuestions] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eList, cList] = await Promise.all([
        examService.getAllExams(),
        courseService.getAllCourses(),
      ]);
      setExams(eList);
      setCourses(cList);
    } catch (err) {
      console.error('Failed to load examinations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingExam(null);
    setFormData({
      title: '',
      description: '',
      course_id: courses[0]?.id || '',
      duration_minutes: 30,
      passing_percentage: 70,
      max_attempts: 3,
      is_enabled: true,
      review_answers_enabled: true,
      randomize_questions: false,
      randomize_options: false,
    });
    setExamQuestions([]);
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = async (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      course_id: exam.course_id || '',
      duration_minutes: exam.duration_minutes,
      passing_percentage: exam.passing_percentage,
      max_attempts: exam.max_attempts,
      is_enabled: exam.is_enabled,
      review_answers_enabled: exam.review_answers_enabled,
      randomize_questions: exam.randomize_questions,
      randomize_options: exam.randomize_options,
    });

    try {
      const qList = await examService.getQuestionsForAdmin(exam.id);
      setExamQuestions(qList);
    } catch (err) {
      console.error('Failed to load questions:', err);
    }

    setError('');
    setIsModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Exam title is required.');
      return;
    }
    if (examQuestions.length === 0) {
      setError('An examination must have at least one question.');
      return;
    }

    try {
      setSubmitting(true);
      let targetExamId = editingExam?.id;

      if (editingExam) {
        await examService.updateExam(editingExam.id, formData);
      } else {
        const created = await examService.createExam(formData);
        targetExamId = created.id;
      }

      // Upsert questions
      if (editingExam) {
        const existingQs = await examService.getQuestionsForAdmin(editingExam.id);
        for (const eq of existingQs) {
          if (!examQuestions.some((q) => q.id === eq.id)) {
            await examService.deleteQuestion(eq.id);
          }
        }
      }

      for (const q of examQuestions) {
        if (q.id && !q.id.startsWith('temp-')) {
          await examService.updateQuestion(q.id, {
            question_text: q.question_text,
            question_type: q.question_type,
            choices: q.choices,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            points: q.points,
          });
        } else {
          await examService.createQuestion({
            exam_id: targetExamId,
            question_text: q.question_text,
            question_type: q.question_type,
            choices: q.choices,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            points: q.points,
          });
        }
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save examination.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEnabled = async (exam) => {
    try {
      await examService.updateExam(exam.id, { is_enabled: !exam.is_enabled });
      await loadData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteExam = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete exam "${title}"? All questions and student attempts will be deleted.`)) {
      try {
        await examService.deleteExam(id);
        await loadData();
      } catch (err) {
        alert('Failed to delete exam: ' + err.message);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Examination Management</h1>
          <p className="text-muted text-sm">Configure assessments, timers, passing thresholds, randomized question banks, and answer reviews.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Create Examination
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Loading examinations...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <ClipboardList size={32} />
          </div>
          <h3>No Examinations Configured</h3>
          <p className="text-muted text-sm" style={{ maxWidth: 400, margin: '0 auto var(--spacing-4)' }}>
            Create examinations associated with your courses to evaluate student comprehension with automated grading.
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Create First Exam
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--spacing-6)' }}>
          {exams.map((exam) => (
            <div key={exam.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-3)' }}>
                <span className="badge badge-secondary">{exam.courses?.title || 'General Exam'}</span>
                <span className={`badge ${exam.is_enabled ? 'badge-success' : 'badge-warning'}`}>
                  {exam.is_enabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-2)' }}>{exam.title}</h3>
              <p className="text-muted text-sm" style={{ flex: 1, marginBottom: 'var(--spacing-4)' }}>
                {exam.description || 'No description provided.'}
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
                <div><strong>Duration:</strong> {exam.duration_minutes ? `${exam.duration_minutes} mins` : 'No limit'}</div>
                <div><strong>Passing:</strong> {exam.passing_percentage}%</div>
                <div><strong>Max Attempts:</strong> {exam.max_attempts ? exam.max_attempts : 'Unlimited'}</div>
                <div><strong>Review:</strong> {exam.review_answers_enabled ? 'Allowed' : 'Disabled'}</div>
              </div>

              <div style={{
                paddingTop: 'var(--spacing-4)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openEditModal(exam)}
                >
                  <Edit2 size={16} /> Configure & Questions
                </button>

                <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                  <button
                    className="btn btn-secondary btn-icon"
                    title={exam.is_enabled ? 'Disable Exam' : 'Enable Exam'}
                    onClick={() => handleToggleEnabled(exam)}
                  >
                    {exam.is_enabled ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    className="btn btn-secondary btn-icon"
                    title="Delete Exam"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleDeleteExam(exam.id, exam.title)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exam Configuration Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingExam ? 'Edit Examination' : 'Create Examination'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExam}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="examTitle">Exam Title *</label>
                  <input
                    id="examTitle"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Midterm Assessment: React Architecture"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="examCourse">Associated Course</label>
                    <select
                      id="examCourse"
                      className="form-select"
                      value={formData.course_id}
                      onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    >
                      <option value="">-- No specific course --</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="examDuration">Duration (Minutes, 0 for untimed)</label>
                    <input
                      id="examDuration"
                      type="number"
                      min={0}
                      className="form-control"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="examPassing">Passing Percentage (%)</label>
                    <input
                      id="examPassing"
                      type="number"
                      min={1}
                      max={100}
                      className="form-control"
                      value={formData.passing_percentage}
                      onChange={(e) => setFormData({ ...formData, passing_percentage: parseInt(e.target.value, 10) || 70 })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="examAttempts">Max Attempts Allowed (0 for unlimited)</label>
                    <input
                      id="examAttempts"
                      type="number"
                      min={0}
                      className="form-control"
                      value={formData.max_attempts}
                      onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="examDesc">Exam Description & Instructions</label>
                  <textarea
                    id="examDesc"
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide exam instructions, criteria, and allowed materials..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Toggles */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--color-secondary-light)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--spacing-6)'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_enabled}
                      onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    />
                    <span className="text-sm font-semibold">Enabled (Available to students)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.review_answers_enabled}
                      onChange={(e) => setFormData({ ...formData, review_answers_enabled: e.target.checked })}
                    />
                    <span className="text-sm font-semibold">Allow Answer Review</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.randomize_questions}
                      onChange={(e) => setFormData({ ...formData, randomize_questions: e.target.checked })}
                    />
                    <span className="text-sm font-semibold">Randomize Questions</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.randomize_options}
                      onChange={(e) => setFormData({ ...formData, randomize_options: e.target.checked })}
                    />
                    <span className="text-sm font-semibold">Randomize Answer Choices</span>
                  </label>
                </div>

                {/* Embedded Question Builder */}
                <QuestionBuilder
                  questions={examQuestions}
                  onQuestionsChange={setExamQuestions}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingExam ? 'Update Examination' : 'Save Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

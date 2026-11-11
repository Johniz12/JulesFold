import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  FileText,
  AlertCircle,
  X,
  Code
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import { lessonService } from '../../services/lessonService';

export const AdminLessons = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    sequence: 1,
    is_published: true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [c, l] = await Promise.all([
        courseService.getCourseById(courseId),
        lessonService.getLessonsByCourse(courseId, true),
      ]);
      setCourse(c);
      setLessons(l);
    } catch (err) {
      console.error('Failed to load course lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const openCreateModal = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      content: `### Lesson Introduction

Write your lesson content using Markdown formatting:

- Supports headings (###)
- Bulleted and numbered lists
- Inline code \`code\`
- Code blocks:

\`\`\`javascript
function example() {
  console.log("Hello LearnHub");
}
\`\`\`
`,
      sequence: lessons.length + 1,
      is_published: true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      sequence: lesson.sequence,
      is_published: lesson.is_published,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Lesson title is required.');
      return;
    }
    if (!formData.content.trim()) {
      setError('Lesson content cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingLesson) {
        await lessonService.updateLesson(editingLesson.id, formData);
      } else {
        await lessonService.createLesson({
          ...formData,
          course_id: courseId,
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (lesson) => {
    try {
      await lessonService.updateLesson(lesson.id, {
        is_published: !lesson.is_published,
      });
      await loadData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleMoveSequence = async (lesson, direction) => {
    const currentIndex = lessons.findIndex((l) => l.id === lesson.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const targetLesson = lessons[targetIndex];

    try {
      // Swap sequences
      await Promise.all([
        lessonService.updateLesson(lesson.id, { sequence: targetLesson.sequence }),
        lessonService.updateLesson(targetLesson.id, { sequence: lesson.sequence }),
      ]);
      await loadData();
    } catch (err) {
      alert('Failed to reorder lessons: ' + err.message);
    }
  };

  const handleDeleteLesson = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete lesson "${title}"?`)) {
      try {
        await lessonService.deleteLesson(id);
        await loadData();
      } catch (err) {
        alert('Failed to delete lesson: ' + err.message);
      }
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <Link to="/admin/courses" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Back to Courses
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{course?.title || 'Course'} — Lessons</h1>
          <p className="text-muted text-sm">Organize and sequence the syllabus modules for this course.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Add New Lesson
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Loading course modules...</p>
        </div>
      ) : lessons.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <FileText size={32} />
          </div>
          <h3>No Lessons in this Course</h3>
          <p className="text-muted text-sm" style={{ maxWidth: 400, margin: '0 auto var(--spacing-4)' }}>
            Start building your curriculum by adding your first educational lesson with headings, explanations, and code examples.
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Add First Lesson
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          {lessons.map((lesson, idx) => (
            <div key={lesson.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--spacing-4) var(--spacing-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)', flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  flexShrink: 0
                }}>
                  {lesson.sequence}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', marginBottom: 2 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lesson.title}
                    </h4>
                    <span className={`badge ${lesson.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {lesson.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-muted text-xs" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lesson.description || 'No summary'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flexShrink: 0 }}>
                <button
                  className="btn btn-secondary btn-icon"
                  title="Move Up"
                  disabled={idx === 0}
                  onClick={() => handleMoveSequence(lesson, 'up')}
                >
                  <MoveUp size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  title="Move Down"
                  disabled={idx === lessons.length - 1}
                  onClick={() => handleMoveSequence(lesson, 'down')}
                >
                  <MoveDown size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  title={lesson.is_published ? 'Unpublish' : 'Publish'}
                  onClick={() => handleTogglePublish(lesson)}
                >
                  {lesson.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  title="Edit Lesson"
                  onClick={() => openEditModal(lesson)}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  title="Delete Lesson"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lesson Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 750 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="lessonTitle">Lesson Title *</label>
                  <input
                    id="lessonTitle"
                    type="text"
                    className="form-control"
                    placeholder="e.g. 1. Introduction to State Management"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lessonDescription">Brief Description</label>
                  <input
                    id="lessonDescription"
                    type="text"
                    className="form-control"
                    placeholder="Quick summary shown in lesson overview..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lessonContent">Lesson Content (Markdown, Headings, Lists, Code) *</label>
                  <textarea
                    id="lessonContent"
                    className="form-textarea"
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lessonSeq">Sequence Order</label>
                    <input
                      id="lessonSeq"
                      type="number"
                      min={1}
                      className="form-control"
                      value={formData.sequence}
                      onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>

                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer', marginTop: 24 }}>
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                      />
                      <span className="font-semibold text-sm">Published & Visible</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

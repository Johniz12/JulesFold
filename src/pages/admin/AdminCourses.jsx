import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  ListOrdered,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { courseService } from '../../services/courseService';

export const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    cover_image_url: '',
    is_published: true,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      category: 'General',
      cover_image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
      is_published: true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      category: course.category || 'General',
      cover_image_url: course.cover_image_url || '',
      is_published: course.is_published,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Course title is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, formData);
      } else {
        await courseService.createCourse(formData);
      }
      setIsModalOpen(false);
      await loadCourses();
    } catch (err) {
      setError(err.message || 'Failed to save course.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (course) => {
    try {
      await courseService.updateCourse(course.id, {
        is_published: !course.is_published,
      });
      await loadCourses();
    } catch (err) {
      alert('Failed to update publication status: ' + err.message);
    }
  };

  const handleDeleteCourse = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete course "${title}"? All associated lessons and exams will also be removed.`)) {
      try {
        await courseService.deleteCourse(id);
        await loadCourses();
      } catch (err) {
        alert('Failed to delete course: ' + err.message);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Management</h1>
          <p className="text-muted text-sm">Create, edit, organize lessons, and publish learning courses.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Create New Course
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Loading course catalogue...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <BookOpen size={32} />
          </div>
          <h3>No Courses Found</h3>
          <p className="text-muted text-sm" style={{ maxWidth: 400, margin: '0 auto var(--spacing-4)' }}>
            You haven't created any courses yet. Start by authoring your first educational module.
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={18} /> Create Course
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-6)' }}>
          {courses.map((course) => (
            <div key={course.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
              {course.cover_image_url && (
                <div style={{
                  height: 160,
                  margin: 'calc(-1 * var(--spacing-6)) calc(-1 * var(--spacing-6)) var(--spacing-4)',
                  borderTopLeftRadius: 'var(--radius-card)',
                  borderTopRightRadius: 'var(--radius-card)',
                  overflow: 'hidden',
                  backgroundColor: '#e2e8f0',
                }}>
                  <img
                    src={course.cover_image_url}
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-2)' }}>
                <span className="badge badge-secondary">{course.category || 'General'}</span>
                <span className={`badge ${course.is_published ? 'badge-success' : 'badge-warning'}`}>
                  {course.is_published ? 'Published' : 'Draft (Unpublished)'}
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-2)' }}>{course.title}</h3>
              <p className="text-muted text-sm" style={{
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 'var(--spacing-4)'
              }}>
                {course.description || 'No description provided.'}
              </p>

              <div style={{
                paddingTop: 'var(--spacing-4)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}>
                <Link
                  to={`/admin/courses/${course.id}/lessons`}
                  className="btn btn-secondary btn-sm"
                  title="Manage lessons for this course"
                >
                  <ListOrdered size={16} /> Manage Lessons
                </Link>

                <div style={{ display: 'flex', gap: 'var(--spacing-1)' }}>
                  <button
                    className="btn btn-secondary btn-icon"
                    title={course.is_published ? 'Unpublish course' : 'Publish course'}
                    onClick={() => handleTogglePublish(course)}
                  >
                    {course.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    className="btn btn-secondary btn-icon"
                    title="Edit course details"
                    onClick={() => openEditModal(course)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn btn-secondary btn-icon"
                    title="Delete course"
                    style={{ color: 'var(--color-danger)' }}
                    onClick={() => handleDeleteCourse(course.id, course.title)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingCourse ? 'Edit Course' : 'Create New Course'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger">
                    <AlertCircle size={18} />
                    <div>{error}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="courseTitle">Course Title *</label>
                  <input
                    id="courseTitle"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Modern Full-Stack Development"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="courseCategory">Category</label>
                  <input
                    id="courseCategory"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Computer Science, Web Development"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="coverImageUrl">Cover Image URL</label>
                  <input
                    id="coverImageUrl"
                    type="url"
                    className="form-control"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  />
                  <small className="form-help">Enter a public HTTPS image URL for the course thumbnail.</small>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="courseDescription">Course Description</label>
                  <textarea
                    id="courseDescription"
                    className="form-textarea"
                    rows={4}
                    placeholder="Describe the curriculum, topics covered, and prerequisites..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    />
                    <span className="font-semibold text-sm">Publish immediately (visible to students)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

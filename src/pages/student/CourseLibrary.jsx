import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Layers } from 'lucide-react';
import { courseService } from '../../services/courseService';

export const CourseLibrary = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const list = await courseService.getPublishedCourses();
        setCourses(list);
      } catch (err) {
        console.error('Failed to load published courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categories = ['All', ...new Set(courses.map((c) => c.category || 'General'))];

  const filtered = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Catalog</h1>
          <p className="text-muted text-sm">Explore interactive lessons and structured educational programs.</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search courses by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Loading course offerings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <BookOpen size={32} />
          </div>
          <h3>No Courses Found</h3>
          <p className="text-muted text-sm">We couldn't find any courses matching your search filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-6)' }}>
          {filtered.map((course) => (
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

              <span className="badge badge-secondary" style={{ alignSelf: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                {course.category || 'General'}
              </span>

              <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-2)' }}>{course.title}</h3>
              <p className="text-muted text-sm" style={{
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: 'var(--spacing-4)',
                lineHeight: 1.5
              }}>
                {course.description}
              </p>

              <div style={{
                paddingTop: 'var(--spacing-4)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span className="text-xs text-muted">Self-paced study</span>
                <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm">
                  View Syllabus <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

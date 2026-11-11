import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { examService } from '../../services/examService';

export const AdminResults = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await examService.getAllAttempts();
        setAttempts(data);
      } catch (err) {
        console.error('Failed to load examination results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const filtered = attempts.filter((att) => {
    const matchesSearch =
      (att.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (att.profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (att.exams?.title || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'passed' && att.passed) ||
      (filterStatus === 'failed' && !att.passed);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Examination Results</h1>
          <p className="text-muted text-sm">Review submitted student test attempts, percentage scores, and evaluation records.</p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="card" style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by student name, email, or exam title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ width: 180 }}>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Submissions</option>
              <option value="passed">Passed Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Loading results ledger...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Award size={32} />
          </div>
          <h3>No Examination Submissions Found</h3>
          <p className="text-muted text-sm">No student has submitted an examination matching your filter criteria.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Examination</th>
                  <th>Attempt #</th>
                  <th>Score</th>
                  <th>Points</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((att) => (
                  <tr key={att.id}>
                    <td>
                      <div className="font-semibold text-sm">{att.profiles?.full_name || 'Student'}</div>
                      <div className="text-muted text-xs">{att.profiles?.email}</div>
                    </td>
                    <td className="font-semibold text-sm">{att.exams?.title || 'Exam'}</td>
                    <td className="text-sm">Attempt #{att.attempt_number}</td>
                    <td>
                      <span className="font-bold text-base">{att.score_percentage}%</span>
                    </td>
                    <td className="text-sm text-muted">
                      {att.points_earned} / {att.total_points} pts
                    </td>
                    <td>
                      {att.passed ? (
                        <span className="badge badge-success">
                          <CheckCircle size={12} /> PASSED
                        </span>
                      ) : (
                        <span className="badge badge-danger">
                          <XCircle size={12} /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="text-muted text-xs">
                      {new Date(att.submitted_at || att.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Users, Mail, Calendar, BookOpen, Award, CheckCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { progressService } from '../../services/progressService';

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const list = await authService.getStudents();
        setStudents(list);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Registered Students</h1>
          <p className="text-muted text-sm">Directory of enrolled student accounts and their activity status.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-lg"></div>
          <p>Loading student directory...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Users size={32} />
          </div>
          <h3>No Registered Students</h3>
          <p className="text-muted text-sm">When new students create accounts, they will appear here.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => (
                  <tr key={st.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}>
                          {st.full_name?.charAt(0) || 'S'}
                        </div>
                        <span className="font-semibold">{st.full_name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{st.email}</td>
                    <td>
                      <span className="badge badge-secondary">{st.role}</span>
                    </td>
                    <td className="text-muted text-xs">
                      {new Date(st.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
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

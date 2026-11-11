import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Register = () => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      // All public registrations navigate to student portal
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-1)' }}>Student Registration</h2>
        <p className="text-muted text-sm">Create your student account to access courses and examinations</p>
      </div>

      <div className="alert alert-info" style={{ fontSize: '0.8125rem', marginBottom: 'var(--spacing-4)' }}>
        <Shield size={16} style={{ flexShrink: 0 }} />
        <div>
          <strong>Security Notice:</strong> Public registration automatically assigns the student role. Administrator accounts must be assigned via secure backend database operation.
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            className="form-control"
            placeholder="e.g. Alex Johnson"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="e.g. alex.j@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password (min. 6 characters)</label>
          <input
            id="password"
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 'var(--spacing-2)' }}
          disabled={loading}
        >
          {loading ? (
            <div className="spinner" style={{ width: '18px', height: '18px' }} />
          ) : (
            <>
              <UserPlus size={18} /> Register Student Account
            </>
          )}
        </button>
      </form>

      <div style={{ marginTop: 'var(--spacing-6)', textAlign: 'center', fontSize: '0.875rem' }}>
        <span className="text-muted">Already have an account? </span>
        <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
          Sign In Here
        </Link>
      </div>
    </div>
  );
};

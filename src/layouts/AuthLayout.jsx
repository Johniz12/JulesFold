import React from 'react';
import { Outlet } from 'react-router-dom';
import { GraduationCap, Database, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import './AuthLayout.css';

export const AuthLayout = () => {
  const { isConfigured } = useAuth();

  return (
    <div className="auth-container">
      <div style={{ position: 'absolute', top: 'var(--spacing-4)', right: 'var(--spacing-4)', zIndex: 10 }}>
        <ThemeToggle />
      </div>
      <div className="auth-card-wrapper">
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <GraduationCap size={28} />
          </div>
          <div className="auth-brand-text">
            <h2>LearningMate</h2>
            <span className="auth-tagline">Learning Management & Examination Platform</span>
          </div>
        </div>

        {!isConfigured && (
          <div className="alert alert-info auth-config-banner">
            <Database size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Standalone Demo Mode Active:</strong> Running with browser-persisted mock database. Real Supabase integration can be activated anytime by setting <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
            </div>
          </div>
        )}

        <div className="card auth-main-card">
          <Outlet />
        </div>

        <div className="auth-footer-notes">
          <ShieldCheck size={14} />
          <span>Role-Based Access Control • Server-Side Exam Grading • RLS Enforced</span>
        </div>
      </div>
    </div>
  );
};

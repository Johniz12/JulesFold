import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  Award,
  LogOut,
  Menu,
  X,
  UserCheck,
  Shield,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

export const AdminLayout = () => {
  const { user, profile, logout, switchMockUser, isConfigured } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Courses', to: '/admin/courses', icon: BookOpen },
    { label: 'Examinations', to: '/admin/exams', icon: ClipboardList },
    { label: 'Students', to: '/admin/students', icon: Users },
    { label: 'Exam Results', to: '/admin/results', icon: Award },
  ];

  return (
    <div className="admin-wrapper">
      {/* Mobile top navigation bar */}
      <header className="admin-mobile-header">
        <div className="admin-brand">
          <div className="admin-logo">
            <GraduationCap size={22} />
          </div>
          <span className="admin-brand-title">LearnHub <small className="badge badge-primary">Admin</small></span>
        </div>
        <button
          className="btn btn-secondary btn-icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar navigation */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="admin-logo">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="admin-brand-title">LearnHub</h1>
              <div className="admin-brand-badge">
                <Shield size={12} /> Administrator
              </div>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section-title">ADMINISTRATION</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="admin-nav-section-title">VIEW PORTAL</div>
          <NavLink
            to="/dashboard"
            className="admin-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ExternalLink size={18} />
            <span>Student Learning Portal</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          {!isConfigured && (
            <div className="mock-role-switch">
              <small className="text-muted">Test Role Switcher:</small>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  switchMockUser('student');
                  navigate('/dashboard');
                }}
              >
                <UserCheck size={14} /> Switch to Student Alex
              </button>
            </div>
          )}

          <div className="admin-user-profile">
            <div className="admin-avatar">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{profile?.full_name || 'Admin'}</span>
              <span className="admin-user-email">{user?.email}</span>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm admin-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div className="admin-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main content body */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

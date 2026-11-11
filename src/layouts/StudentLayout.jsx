import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Compass,
  Award,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/common/ThemeToggle';
import './StudentLayout.css';

export const StudentLayout = () => {
  const { user, profile, isAdmin, logout, switchMockUser, isConfigured } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'My Learning', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Browse Courses', to: '/courses', icon: Compass },
    { label: 'Examinations', to: '/exams', icon: Award },
  ];

  return (
    <div className="student-wrapper">
      {/* Top Navbar */}
      <header className="student-header">
        <div className="student-header-inner">
          <div className="student-brand-container">
            <NavLink to="/dashboard" className="student-brand">
              <div className="student-logo">
                <GraduationCap size={24} />
              </div>
              <span className="student-brand-title">LearnHub</span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <nav className="student-desktop-nav">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `student-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Actions & Profile */}
          <div className="student-user-actions">
            {isAdmin && (
              <NavLink to="/admin" className="btn btn-secondary btn-sm admin-portal-btn">
                <ShieldAlert size={14} /> Admin Portal
              </NavLink>
            )}

            {!isConfigured && (
              <button
                className="btn btn-secondary btn-sm"
                title="Switch role in test mode"
                onClick={() => {
                  switchMockUser('admin');
                  navigate('/admin');
                }}
              >
                <UserCheck size={14} /> Test as Admin
              </button>
            )}

            <ThemeToggle />

            <div className="student-profile-pill">
              <div className="student-avatar">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'S'}
              </div>
              <span className="student-name-display">{profile?.full_name?.split(' ')[0] || 'Student'}</span>
            </div>

            <button
              className="btn btn-secondary btn-icon"
              title="Sign Out"
              onClick={handleLogout}
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>

            <button
              className="btn btn-secondary btn-icon mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="student-mobile-nav">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `student-mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="student-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShieldAlert size={18} />
                <span>Admin Portal</span>
              </NavLink>
            )}
          </div>
        )}
      </header>

      {/* Main Page Area */}
      <main className="student-main">
        <Outlet />
      </main>
    </div>
  );
};

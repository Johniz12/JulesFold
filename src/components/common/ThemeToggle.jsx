import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '', style = {} }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn btn-secondary theme-toggle-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-2)',
        minWidth: '44px',
        minHeight: '44px',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        ...style,
      }}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    >
      {isDark ? (
        <>
          <Sun size={18} style={{ color: '#f59e0b' }} />
          <span className="theme-toggle-label">Light</span>
        </>
      ) : (
        <>
          <Moon size={18} style={{ color: 'var(--color-primary)' }} />
          <span className="theme-toggle-label">Dark</span>
        </>
      )}
    </button>
  );
};

import React, { useState, useEffect } from 'react';

export default function Header({ userName, onOpenSettings, clock24Hour = true, showSeconds = true }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-based personalized greeting
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = () => {
    let hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    let ampm = '';

    if (!clock24Hour) {
      ampm = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }

    const pad = (n) => String(n).padStart(2, '0');
    let str = `${pad(hours)}:${pad(minutes)}`;
    if (showSeconds) {
      str += `:${pad(seconds)}`;
    }
    return str + ampm;
  };

  const formatDate = () => {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return currentTime.toLocaleDateString(undefined, options);
  };

  return (
    <header className="alfred-header" data-testid="alfred-header">
      {/* Left: Branding */}
      <div className="alfred-brand-section">
        <div className="alfred-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        </div>
        <div className="alfred-brand-info">
          <h1 className="alfred-title">
            ALFRED <span>//</span>
          </h1>
          <span className="alfred-subtitle">Host Workspace v1.0</span>
        </div>
      </div>

      {/* Center: Greeting & Status */}
      <div className="alfred-center-section">
        <div className="alfred-greeting" data-testid="alfred-greeting">
          {getGreeting()},{' '}
          <span className="alfred-greeting-name">{userName || 'Commander'}</span>
        </div>
        <div className="alfred-system-status">
          <span className="alfred-status-pulse"></span>
          <span>SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {/* Right: Clock & Actions */}
      <div className="alfred-right-section">
        <div className="alfred-header-clock">
          <span className="alfred-clock-time" data-testid="alfred-clock-time">
            {formatTime()}
          </span>
          <span className="alfred-clock-date" data-testid="alfred-clock-date">
            {formatDate()}
          </span>
        </div>

        <div className="alfred-header-actions">
          <button
            type="button"
            className="alfred-icon-btn"
            onClick={onOpenSettings}
            title="Workspace Settings"
            data-testid="settings-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

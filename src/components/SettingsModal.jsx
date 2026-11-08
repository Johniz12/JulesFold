import React, { useState } from 'react';

export default function SettingsModal({
  isOpen,
  preferences,
  onSave,
  onClose,
}) {
  if (!isOpen) return null;

  const [userName, setUserName] = useState(preferences.userName || 'Commander');
  const [clock24Hour, setClock24Hour] = useState(preferences.clock24Hour ?? true);
  const [showSeconds, setShowSeconds] = useState(preferences.showSeconds ?? true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      userName: userName.trim() || 'Commander',
      clock24Hour,
      showSeconds,
    });
    onClose();
  };

  return (
    <div className="alfred-modal-overlay" data-testid="settings-modal">
      <div className="alfred-modal-content">
        <div className="alfred-modal-header">
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            ALFRED Workspace Settings
          </h3>
          <button
            type="button"
            className="alfred-widget-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="alfred-modal-body">
            <div className="alfred-form-group">
              <label className="alfred-form-label" htmlFor="user-name-input">
                Personalized Name / Call Sign
              </label>
              <input
                id="user-name-input"
                type="text"
                className="alfred-input-text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Commander, Tony, Alex"
                data-testid="input-username"
              />
            </div>

            <div className="alfred-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
              <input
                id="clock-24h-input"
                type="checkbox"
                checked={clock24Hour}
                onChange={(e) => setClock24Hour(e.target.checked)}
                data-testid="input-clock-24h"
              />
              <label className="alfred-form-label" htmlFor="clock-24h-input" style={{ cursor: 'pointer' }}>
                Use 24-Hour Time Format (Header Clock)
              </label>
            </div>

            <div className="alfred-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
              <input
                id="clock-seconds-input"
                type="checkbox"
                checked={showSeconds}
                onChange={(e) => setShowSeconds(e.target.checked)}
                data-testid="input-clock-seconds"
              />
              <label className="alfred-form-label" htmlFor="clock-seconds-input" style={{ cursor: 'pointer' }}>
                Show Seconds (Header Clock)
              </label>
            </div>
          </div>

          <div className="alfred-modal-footer">
            <button
              type="button"
              className="alfred-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="alfred-btn-primary"
              data-testid="save-settings-btn"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

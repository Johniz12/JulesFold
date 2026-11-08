import React from 'react';

export default function EmptyState({ onOpenLauncher }) {
  return (
    <div className="alfred-empty-state" data-testid="alfred-empty-state">
      <div className="alfred-empty-state-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      </div>
      <h3>No Active Workspace Modules</h3>
      <p>
        ALFRED workspace currently has no active widgets on the dashboard. Use the module launcher above to activate tools and widgets.
      </p>
      {onOpenLauncher && (
        <button
          type="button"
          className="alfred-btn-primary"
          onClick={onOpenLauncher}
        >
          Explore Modules
        </button>
      )}
    </div>
  );
}

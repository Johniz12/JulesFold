import React from 'react';

export default function ModuleLauncher({
  modules = [],
  activeModuleIds = [],
  onToggleModule,
  amcsModules = [],
  onLaunchAmcsWindow,
}) {
  return (
    <section className="alfred-launcher" data-testid="alfred-launcher">
      {/* 1. Dashboard Subsystems / Internal Widgets */}
      <div className="alfred-launcher-header">
        <div className="alfred-launcher-title">
          <span>Dashboard Subsystems</span>
          <span className="alfred-launcher-title-tag">
            {activeModuleIds.length} / {modules.length} Active
          </span>
        </div>
      </div>

      <div className="alfred-launcher-grid" style={{ marginBottom: amcsModules.length > 0 ? '1.5rem' : 0 }}>
        {modules.map((module) => {
          const isActive = activeModuleIds.includes(module.id);
          return (
            <div key={module.id} className="alfred-module-card" data-testid={`module-card-${module.id}`}>
              <div className="alfred-module-meta">
                <div className="alfred-module-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="alfred-module-info">
                  <h4>{module.name}</h4>
                  <p>{module.description}</p>
                </div>
              </div>

              <button
                type="button"
                className={`alfred-module-toggle-btn ${isActive ? 'btn-active' : 'btn-inactive'}`}
                onClick={() => onToggleModule(module.id)}
                data-testid={`toggle-module-${module.id}`}
                title={isActive ? 'Remove module from dashboard' : 'Open module on dashboard'}
              >
                {isActive ? 'Hide' : '+ Open'}
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. AMCS v1 Independent Applications */}
      {amcsModules.length > 0 && (
        <>
          <div className="alfred-launcher-header" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <div className="alfred-launcher-title">
              <span>AMCS v1 Independent Applications</span>
              <span className="alfred-launcher-title-tag" style={{ background: 'rgba(20, 184, 166, 0.15)', color: 'var(--accent-teal)' }}>
                {amcsModules.length} Available
              </span>
            </div>
          </div>

          <div className="alfred-launcher-grid">
            {amcsModules.map((amcsMod) => (
              <div key={amcsMod.id} className="alfred-module-card" data-testid={`amcs-card-${amcsMod.id}`}>
                <div className="alfred-module-meta">
                  <div className="alfred-module-icon" style={{ color: 'var(--accent-teal)', background: 'rgba(20, 184, 166, 0.1)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <div className="alfred-module-info">
                    <h4>{amcsMod.name}</h4>
                    <p>{amcsMod.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="alfred-module-toggle-btn btn-inactive"
                  onClick={() => onLaunchAmcsWindow(amcsMod.id)}
                  data-testid={`launch-amcs-${amcsMod.id}`}
                  title="Launch independent application window"
                >
                  ↗ Launch
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

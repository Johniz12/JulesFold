import React from 'react';

export default function ModuleLauncher({
  modules = [],
  activeModuleIds = [],
  onToggleModule,
}) {
  return (
    <section className="alfred-launcher" data-testid="alfred-launcher">
      <div className="alfred-launcher-header">
        <div className="alfred-launcher-title">
          <span>Modular Host Subsystems</span>
          <span className="alfred-launcher-title-tag">
            {activeModuleIds.length} / {modules.length} Active
          </span>
        </div>
      </div>

      <div className="alfred-launcher-grid">
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
    </section>
  );
}

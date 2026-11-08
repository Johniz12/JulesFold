import React from 'react';
import { getModuleComponent } from '../modules/components.jsx';

export default function WidgetContainer({ module, onClose }) {
  if (!module) return null;

  const ModuleComponent = module.component || getModuleComponent(module.id);
  if (!ModuleComponent) return null;

  return (
    <article
      className="alfred-widget-card"
      data-testid={`widget-${module.id}`}
      style={{
        minWidth: module.minWidth ? `${module.minWidth}px` : undefined,
      }}
    >
      <header className="alfred-widget-header">
        <div className="alfred-widget-title-area">
          <h3 className="alfred-widget-title">{module.name}</h3>
          <span className="alfred-widget-badge">{module.category || 'Module'}</span>
        </div>

        <div className="alfred-widget-actions">
          <button
            type="button"
            className="alfred-widget-btn close-btn"
            onClick={() => onClose(module.id)}
            title="Close module widget"
            data-testid={`close-widget-${module.id}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <div className="alfred-widget-body">
        <ModuleComponent moduleId={module.id} />
      </div>
    </article>
  );
}

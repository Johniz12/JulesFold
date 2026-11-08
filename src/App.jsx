import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import ModuleLauncher from './components/ModuleLauncher.jsx';
import WidgetContainer from './components/WidgetContainer.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import EmptyState from './components/EmptyState.jsx';
import { getAllModules, getModuleById } from './modules/registry.js';
import { storageService } from './services/storage.js';

export default function App() {
  const [preferences, setPreferences] = useState(() => storageService.getPreferences());
  const [activeModuleIds, setActiveModuleIds] = useState(() => storageService.getActiveModules(['demo-clock']));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Available registered modules
  const allModules = getAllModules();

  // Save active modules to storage on change
  const handleToggleModule = (id) => {
    setActiveModuleIds((prev) => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter((mId) => mId !== id);
      } else {
        updated = [...prev, id];
      }
      storageService.saveActiveModules(updated);
      return updated;
    });
  };

  const handleCloseModule = (id) => {
    setActiveModuleIds((prev) => {
      const updated = prev.filter((mId) => mId !== id);
      storageService.saveActiveModules(updated);
      return updated;
    });
  };

  const handleSavePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    storageService.savePreferences(newPrefs);
  };

  // Get active module objects in preserved order
  const activeModules = activeModuleIds
    .map((id) => getModuleById(id))
    .filter(Boolean);

  return (
    <div className="alfred-dashboard" data-testid="alfred-dashboard">
      <Header
        userName={preferences.userName}
        clock24Hour={preferences.clock24Hour}
        showSeconds={preferences.showSeconds}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="alfred-content">
        <ModuleLauncher
          modules={allModules}
          activeModuleIds={activeModuleIds}
          onToggleModule={handleToggleModule}
        />

        {activeModules.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="alfred-widgets-grid" data-testid="alfred-widgets-grid">
            {activeModules.map((module) => (
              <WidgetContainer
                key={module.id}
                module={module}
                onClose={handleCloseModule}
              />
            ))}
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        preferences={preferences}
        onSave={handleSavePreferences}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

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
  const [amcsModules, setAmcsModules] = useState([]);

  useEffect(() => {
    async function loadAmcsModules() {
      if (window.alfredAPI && window.alfredAPI.getDiscoveredModules) {
        try {
          const list = await window.alfredAPI.getDiscoveredModules();
          setAmcsModules(list || []);
        } catch (err) {
          console.warn('[ALFRED] Failed to load AMCS modules:', err);
        }
      }
    }
    loadAmcsModules();
  }, []);

  const allModules = getAllModules();

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

  const handleLaunchAmcsWindow = async (moduleId) => {
    if (window.alfredAPI && window.alfredAPI.launchModuleWindow) {
      try {
        await window.alfredAPI.launchModuleWindow(moduleId);
      } catch (err) {
        console.error('[ALFRED] Launch error:', err);
      }
    }
  };

  const handleSavePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    storageService.savePreferences(newPrefs);
  };

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
          amcsModules={amcsModules}
          onLaunchAmcsWindow={handleLaunchAmcsWindow}
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

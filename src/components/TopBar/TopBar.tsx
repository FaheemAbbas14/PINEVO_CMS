import { useState } from 'react';
import { LanguageManagementModal } from './LanguageManagementModal';
import { locales as initialLocales } from '../../locales';
import type { Locale, Translations } from '../../../locales/types';

import { useCMS } from '../../context/AppContext';
import { FEATURE_FLAGS } from '../../config/project';
import type { DeployUIType } from '../../services/exportService';
import NewProjectModal from '../NewProjectModal/NewProjectModal';
import BLEModal from '../BLEMdal/BLEMdal';
import './TopBar.css';

interface TopBarProps {
  readonly onOpenSimulator?: () => void;
}

interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}

function getFirstEnabledDeployType(): DeployUIType {
  if (FEATURE_FLAGS.enableHtmlUiFormat) {
    return 'html';
  }

  return 'json';
}

export default function TopBar({ onOpenSimulator }: TopBarProps) {

  const { state, setProject, addScreen, deleteScreen, renameScreen, setActiveScreen, saveScreens, saveAsHtml, saveProject, loadProject, setPreviewMode, clearSession } = useCMS();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showBLEModal, setShowBLEModal] = useState(false);
  const [bleDevice, setBleDevice] = useState<BLEDevice | null>(null);
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [selectedDeployType, setSelectedDeployType] = useState<DeployUIType>(getFirstEnabledDeployType());

    // Language management modal state
    const [showLangModal, setShowLangModal] = useState(false);
    const [languages, setLanguages] = useState<{ [key: string]: Translations }>(initialLocales);
    const [langLocale, setLangLocale] = useState<Locale>('en');

  const handleBLEConnect = (device: BLEDevice) => {
    setBleDevice(device);
  };



  const handleCreateProject = (name: string, type: 'pin_evo' | 'flex') => {
    clearSession(); // Clear any saved session data
    setProject({ name, type });
    setLanguages(initialLocales); // Reset languages to default
    setShowNewProjectModal(false);
  };

  const handleScreenDoubleClick = (screenId: string, currentName: string) => {
    setEditingScreenId(screenId);
    setEditName(currentName);
  };

  const handleScreenRename = (screenId: string) => {
    if (editName.trim()) {
      renameScreen(screenId, editName.trim());
    }
    setEditingScreenId(null);
    setEditName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, screenId: string) => {
    if (e.key === 'Enter') {
      handleScreenRename(screenId);
    } else if (e.key === 'Escape') {
      setEditingScreenId(null);
      setEditName('');
    }
  };

  const hasAnyExportFormat = FEATURE_FLAGS.enableHtmlUiFormat || FEATURE_FLAGS.enableJsonUiFormat;

  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span className="topbar-title">
            {state.project ? `${state.project.name} - ` : ''}PINEVO CMS
          </span>
          {state.project && (
            <span className="project-type-badge">
              {state.project.type === 'pin_evo' ? 'PIN Evo' : 'Flex'}
            </span>
          )}
        </div>

        {state.project ? (
          <>
            <div className="topbar-screens">
              <span className="topbar-label" id="screens-label">SCREENS</span>
              <div className="screen-tabs" role="tablist" aria-labelledby="screens-label">
                {state.screens.map((screen) => (
                  <button
                    key={screen.id}
                    role="tab"
                    aria-selected={screen.id === state.activeScreenId}
                    aria-controls="canvas-panel"
                    className={`screen-tab ${screen.id === state.activeScreenId ? 'active' : ''}`}
                    onClick={() => setActiveScreen(screen.id)}
                    onDoubleClick={() => handleScreenDoubleClick(screen.id, screen.name)}
                    title="Double-click to rename"
                  >
                    {editingScreenId === screen.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleScreenRename(screen.id)}
                        onKeyDown={(e) => handleKeyDown(e, screen.id)}
                        autoFocus
                        className="screen-name-input"
                      />
                    ) : (
                      screen.name
                    )}
                  </button>
                ))}
              </div>
              <button className="btn-icon btn-add" onClick={addScreen} title="Add Screen">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                className="btn-icon btn-delete"
                onClick={() => deleteScreen(state.activeScreenId)}
                title="Delete Screen"
                disabled={state.screens.length <= 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>

            <div className="topbar-actions">
              <button className="btn-save btn-compact" onClick={() => loadProject(setLanguages)} aria-label="Open project">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span className="btn-text">Open</span>
              </button>
              <button className="btn-save btn-compact" onClick={() => saveProject(languages)} aria-label="Save project">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span className="btn-text">Save</span>
              </button>
              <button className="btn-save btn-compact" onClick={() => setShowNewProjectModal(true)} aria-label="Create new project">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="btn-text">New</span>
              </button>
              <button
                className={`btn-save btn-compact ${state.previewMode ? 'active' : ''}`}
                onClick={() => setPreviewMode(!state.previewMode)}
                aria-label={state.previewMode ? "Preview enabled - click to disable" : "Click to enable preview"}
                style={state.previewMode ? { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' } : {}}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  {state.previewMode ? (
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  ) : (
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  )}
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="btn-text">{state.previewMode ? 'On' : 'Preview'}</span>
              </button>
              <div className="export-dropdown-container">
                <button
                  className="btn-save btn-compact"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  aria-label="Export options"
                  aria-expanded={showExportDropdown}
                  disabled={!hasAnyExportFormat}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span className="btn-text">Export</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '2px' }} aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showExportDropdown && (
                  <div className="export-dropdown" role="menu">
                    <div className="export-dropdown-label">Select export format</div>
                    {FEATURE_FLAGS.enableHtmlUiFormat && (
                      <button className="export-option" onClick={() => { setSelectedDeployType('html'); void saveAsHtml(); setShowExportDropdown(false); }} role="menuitem" aria-label="Export project as HTML">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        HTML
                      </button>
                    )}
                    {FEATURE_FLAGS.enableJsonUiFormat && (
                      <button className="export-option" onClick={() => { setSelectedDeployType('json'); void saveScreens(); setShowExportDropdown(false); }} role="menuitem" aria-label="Export project as JSON">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        JSON
                      </button>
                    )}
                  </div>
                )}
              </div>
              {onOpenSimulator && (
                <button
                  className="btn-save btn-compact"
                  onClick={onOpenSimulator}
                  aria-label="Open PIN Simulator"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                  <span className="btn-text">Simulator</span>
                </button>
              )}
              <button
                className={`btn-deploy btn-compact ${bleDevice ? 'connected' : ''}`}
                onClick={() => setShowBLEModal(true)}
                aria-label={bleDevice ? `Connected to ${bleDevice.name}` : 'Deploy project'}
              >
                {bleDevice ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="btn-text">{bleDevice.name}</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    <span className="btn-text">Deploy</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="topbar-new-project">
            <span style={{ fontSize: '14px', color: '#666' }}>Create a project to get started</span>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-save btn-compact"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setShowLangModal(true)}
              aria-label="Manage languages"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16v2H4zM4 18h16v2H4zM4 8h16v8H4z" />
                <circle cx="8" cy="12" r="1.5" />
                <circle cx="16" cy="12" r="1.5" />
              </svg>
              <span>Languages</span>
            </button>
        </div>

        <LanguageManagementModal
          isOpen={showLangModal}
          onClose={() => setShowLangModal(false)}
          locale={langLocale}
          setLocale={setLangLocale}
          languages={languages}
          setLanguages={setLanguages}
        />
      </header>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreate={handleCreateProject}
      />

      <BLEModal
        isOpen={showBLEModal}
        onClose={() => setShowBLEModal(false)}
        onConnect={handleBLEConnect}
        selectedDeployType={selectedDeployType}
        onDeployTypeChange={setSelectedDeployType}
      />
    </>
  );
}

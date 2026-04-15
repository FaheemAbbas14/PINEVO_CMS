import React, { useState, createContext, useContext, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { locales } from './locales';
import { loadLanguageFromProject } from './locales/persistLanguage';
import type { Locale } from './locales/types';
// --- Language Context and Provider ---
type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
// (Removed duplicate export)

function LanguageProvider({ children }: { readonly children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  // Always use persisted translations; return empty string if not found
  const t = (key: string) => {
    const persisted = loadLanguageFromProject(locale);
    if (persisted && typeof persisted[key] === 'string') return persisted[key];
    return '';
  };

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale]);
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CMSProvider, useCMS } from './context/AppContext';
import TopBar from './components/TopBar/TopBar';
import { useRef } from 'react';
import LeftSidebar from './components/LeftSidebar/LeftSidebar';
import Canvas from './components/Canvas/Canvas';
import RightSidebar from './components/RightSidebar/RightSidebar';
import DeviceFrame from './components/DeviceFrame/DeviceFrame';
import NewProjectModal from './components/NewProjectModal/NewProjectModal';
import PINSimulator from './components/PINSimulator/PINSimulator';
import './App.css';

function AppContent() {
  const { locale, setLocale, t } = useLanguage();
  const { state, setProject, clearSession, loadProject } = useCMS();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showPINSimulator, setShowPINSimulator] = useState(false);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 75));
  const handleZoomReset = () => setZoom(100);

  // Handle trackpad pinch-to-zoom (like Figma)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prev => Math.min(Math.max(prev + delta, 75), 150));
    }
  };

  // Calculate scale factor (0.75 to 1.5)
  const scale = zoom / 100;

  const handleCreateProject = (name: string, type: 'pin_evo' | 'flex') => {
    clearSession(); // Clear any saved session data
    setProject({ name, type });
    setShowNewProjectModal(false);
  };

  // Show welcome screen when no project is selected
  const [inputValue, setInputValue] = useState<string>("");
  if (!state.project) {
    return (
      <div className="app-container">
        <TopBar />
        <main className="welcome-screen">
          <div className="welcome-content">
            <div className="welcome-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h1>{t('welcome')} to PINEVO CMS</h1>
            <p>{t('project')}: Create and manage content for your PIN devices</p>
            {/* Language-linked text field example */}
            <div style={{ margin: '16px 0' }}>
              <label htmlFor="home-input" style={{ fontWeight: 500 }}>{t('home_input_label')}:</label>
              <input
                id="home-input"
                type="text"
                style={{ marginLeft: 8, padding: 4, fontSize: 16 }}
                value={inputValue || t('home_input_value')}
                onChange={e => setInputValue(e.target.value)}
                placeholder={t('home_input_value')}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="lang-select">🌐 </label>
              <select
                id="lang-select"
                value={locale}
                onChange={e => setLocale(e.target.value as Locale)}
                style={{ fontSize: 16 }}
              >
                <option value="en">English</option>
                <option value="da">Dansk</option>
              </select>
            </div>
            <button className="btn-start" onClick={() => setShowNewProjectModal(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create New Project
            </button>
            <button className="btn-start" onClick={loadProject} style={{ marginTop: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Open Project
            </button>
            <button className="btn-start" onClick={() => setShowPINSimulator(true)} style={{ marginTop: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              Run PIN Simulator
            </button>
          </div>
        </main>
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onCreate={handleCreateProject}
        />
        <PINSimulator
          isOpen={showPINSimulator}
          onClose={() => setShowPINSimulator(false)}
        />
      </div>
    );
  }

  // Show editor when project exists
  const sidebarRef = useRef<any>(null);
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`app-container ${state.sandboxMode ? 'sandbox-mode' : ''} ${state.previewMode ? 'preview-mode' : ''}`}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <TopBar onOpenSimulator={() => setShowPINSimulator(true)} sidebarRef={sidebarRef} />
        {state.sandboxMode && (
          <div className="sandbox-banner" role="status" aria-live="polite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Sandbox Mode - Data will not affect production
          </div>
        )}
        {state.previewMode && (
          <div className="preview-banner" role="status" aria-live="polite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview Mode - Click "Preview" button to exit and edit
          </div>
        )}
        <main className="main-content" id="main-content">
          <LeftSidebar />
          <div className="center-panel">
            <div className="zoom-controls">
              <button onClick={handleZoomOut} title="Zoom Out">−</button>
              <span>{zoom}%</span>
              <button onClick={handleZoomIn} title="Zoom In">+</button>
              <button onClick={handleZoomReset} title="Reset Zoom">⟲</button>
            </div>
            <div className="center-panel-content" onWheel={handleWheel}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease', margin: '0 auto', width: 'fit-content' }}>
                <DeviceFrame>
                  <Canvas />
                </DeviceFrame>
              </div>
            </div>
          </div>
          <RightSidebar ref={sidebarRef} />
        </main>
        <PINSimulator
          isOpen={showPINSimulator}
          onClose={() => setShowPINSimulator(false)}
        />
      </div>
    </DndProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CMSProvider>
        <AppContent />
      </CMSProvider>
    </LanguageProvider>
  );
}

export { useLanguage };
export default App;

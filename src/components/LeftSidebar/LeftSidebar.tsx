import { useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { ComponentType } from '../../types';
import { useCMS } from '../../context/AppContext';
import './LeftSidebar.css';

const SCREENS_COLLAPSED_STORAGE_KEY = 'pinevo.leftSidebar.screensCollapsed';
const COMPONENTS_COLLAPSED_STORAGE_KEY = 'pinevo.leftSidebar.componentsCollapsed';

function getStoredCollapsedState(key: string, defaultValue: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return defaultValue;
    }
    return raw === 'true';
  } catch {
    return defaultValue;
  }
}

interface PaletteItem {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'text',
    label: 'Text Field',
    description: 'Editable text block',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7V4h16v3" />
        <path d="M9 20h6" />
        <path d="M12 4v16" />
      </svg>
    ),
  },
  {
    type: 'text_input',
    label: 'Text Input',
    description: 'Displays hardware button input',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <line x1="7" y1="12" x2="12" y2="12" />
        <line x1="7" y1="9" x2="10" y2="9" />
      </svg>
    ),
  },
  {
    type: 'button',
    label: 'Button',
    description: 'Interactive button',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="10" rx="5" />
        <path d="M7 12h10" />
      </svg>
    ),
  },
  {
    type: 'image',
    label: 'Image',
    description: 'Upload or link image',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    type: 'view',
    label: 'View',
    description: 'Container panel background',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="7" y1="8" x2="17" y2="8" />
      </svg>
    ),
  },
  {
    type: 'audio',
    label: 'Audio',
    description: 'Play sound file',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    type: 'api',
    label: 'API Request',
    description: 'Call external API',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    type: 'command',
    label: 'Run Command',
    description: 'Execute shell command',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
];


function DraggablePaletteItem({ item }: { item: PaletteItem }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DragTypes.NEW_COMPONENT,
    item: { componentType: item.type },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const event = new MouseEvent('click', { bubbles: true });
      (e.target as HTMLElement).dispatchEvent(event);
    }
  };

  return (
    <div
      ref={(node) => { drag(node); }}
      className={`palette-item ${isDragging ? 'dragging' : ''}`}
      title={`Drag to add ${item.label}`}
      tabIndex={0}
      role="button"
      aria-label={`${item.label}: ${item.description}. Press Enter to add to canvas.`}
      aria-grabbed={false}
      onKeyDown={handleKeyDown}
    >
      <div className="palette-icon" aria-hidden="true">{item.icon}</div>
      <div className="palette-info">
        <span className="palette-label">{item.label}</span>
        <span className="palette-desc">{item.description}</span>
      </div>
      <div className="palette-drag-hint" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
    </div>
  );
}

interface LeftSidebarProps {
  width?: number;
}

export default function LeftSidebar({ width }: Readonly<LeftSidebarProps>) {
  const {
    state,
    setSandboxMode,
    addScreen,
    duplicateActiveScreen,
    deleteScreen,
    renameScreen,
    setActiveScreen,
  } = useCMS();
  const [screensCollapsed, setScreensCollapsed] = useState(() =>
    getStoredCollapsedState(SCREENS_COLLAPSED_STORAGE_KEY, false)
  );
  const [componentsCollapsed, setComponentsCollapsed] = useState(() =>
    getStoredCollapsedState(COMPONENTS_COLLAPSED_STORAGE_KEY, false)
  );
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Disable dragging in preview mode
  const isPreviewMode = state.previewMode;

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

  const handleScreenRenameKeyDown = (e: React.KeyboardEvent, screenId: string) => {
    if (e.key === 'Enter') {
      handleScreenRename(screenId);
    } else if (e.key === 'Escape') {
      setEditingScreenId(null);
      setEditName('');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(SCREENS_COLLAPSED_STORAGE_KEY, String(screensCollapsed));
    } catch {
      // Ignore persistence errors (e.g. private mode or disabled storage).
    }
  }, [screensCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(COMPONENTS_COLLAPSED_STORAGE_KEY, String(componentsCollapsed));
    } catch {
      // Ignore persistence errors (e.g. private mode or disabled storage).
    }
  }, [componentsCollapsed]);

  return (
    <aside className="left-sidebar" style={typeof width === 'number' ? { width } : undefined}>
      {!isPreviewMode && (
        <>
          <div className="sidebar-header">
            <h2 className="sidebar-title">Workspace</h2>
            <span className="sidebar-subtitle">Manage screens and components</span>
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className="sidebar-section-toggle"
              onClick={() => setScreensCollapsed((prev) => !prev)}
              aria-expanded={!screensCollapsed}
            >
              <span>Screens</span>
              <span className={`sidebar-chevron ${screensCollapsed ? 'collapsed' : ''}`} aria-hidden="true">▾</span>
            </button>

            {!screensCollapsed && (
              <>
                <div className="screen-list">
                  {state.screens.map((screen) => (
                    <button
                      key={screen.id}
                      className={`screen-list-item ${screen.id === state.activeScreenId ? 'active' : ''}`}
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
                          onKeyDown={(e) => handleScreenRenameKeyDown(e, screen.id)}
                          autoFocus
                          className="screen-list-item-input"
                        />
                      ) : (
                        screen.name
                      )}
                    </button>
                  ))}
                </div>

                <div className="screen-controls">
                  <button type="button" className="screen-control-btn" onClick={addScreen} title="Add Screen">+ Add</button>
                  <button type="button" className="screen-control-btn" onClick={duplicateActiveScreen} title="Duplicate Active Screen">Duplicate</button>
                  <button
                    type="button"
                    className="screen-control-btn danger"
                    onClick={() => deleteScreen(state.activeScreenId)}
                    disabled={state.screens.length <= 1}
                    title="Delete Active Screen"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="sidebar-section">
            <button
              type="button"
              className="sidebar-section-toggle"
              onClick={() => setComponentsCollapsed((prev) => !prev)}
              aria-expanded={!componentsCollapsed}
            >
              <span>Components</span>
              <span className={`sidebar-chevron ${componentsCollapsed ? 'collapsed' : ''}`} aria-hidden="true">▾</span>
            </button>

            {!componentsCollapsed && (
              <>
                <div className="palette-list">
                  {PALETTE_ITEMS.map((item) => (
                    <DraggablePaletteItem key={item.type} item={item} />
                  ))}
                </div>

                <div className="sidebar-section-title">Coming Soon</div>
                <div className="palette-future">
                  {['QR Scanner', 'NFC Button', 'Animation'].map((name) => (
                    <div key={name} className="palette-item-future">{name}</div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="sidebar-section-title">Sandbox Mode</div>
          <div className="sandbox-toggle">
            <button
              className={`sandbox-btn ${state.sandboxMode ? 'active' : ''}`}
              onClick={() => setSandboxMode(!state.sandboxMode)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {state.sandboxMode ? (
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
              {state.sandboxMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </>
      )}
      {isPreviewMode && (
        <div className="sidebar-header">
          <h2 className="sidebar-title">Preview Mode</h2>
          <span className="sidebar-subtitle">Running your flow</span>
        </div>
      )}
    </aside>
  );
}

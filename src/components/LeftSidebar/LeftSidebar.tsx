import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { ComponentType } from '../../types';
import { useCMS } from '../../context/AppContext';
import './LeftSidebar.css';

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

export default function LeftSidebar() {
  const { state, setSandboxMode } = useCMS();

  // Disable dragging in preview mode
  const isPreviewMode = state.previewMode;

  return (
    <aside className="left-sidebar">
      {!isPreviewMode && (
        <>
          <div className="sidebar-header">
            <h2 className="sidebar-title">Components</h2>
            <span className="sidebar-subtitle">Drag onto canvas</span>
          </div>
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

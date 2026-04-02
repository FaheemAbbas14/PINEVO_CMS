# PINEVO CMS - Solution Design Document

**Version:** 1.0  
**Date:** March 18, 2026  
**Status:** Architecture & Design

---

## 1. Executive Summary

### 1.1 Purpose
This document outlines the technical architecture, component design, data flow, and implementation details for the PINEVO Content Management System (CMS). The CMS is a web-based visual editor for creating and managing content for PINEVO hardware devices.

### 1.2 Design Goals
- **Simplicity**: No-code visual editing interface
- **Performance**: 60fps drag-and-drop interaction
- **Accessibility**: WCAG 2.1 AA compliant
- **Extensibility**: Component-based architecture for future features
- **Portability**: Export to standard formats (JSON, HTML)

---

## 2. System Architecture

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PINEVO CMS                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   TopBar     │  │  LeftSidebar │  │     RightSidebar     │ │
│  │  (Header)    │  │  (Palette)   │  │   (Properties)       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │                  │                      │             │
│         └──────────────────┼──────────────────────┘             │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Main Content Area                        │ │
│  │  ┌─────────────────────┐  ┌────────────────────────────┐  │ │
│  │  │      Canvas         │  │       Preview              │  │ │
│  │  │  (Drag & Drop       │  │   (Device Frame            │  │ │
│  │  │   Editor)           │  │    Simulation)            │  │ │
│  │  └─────────────────────┘  └────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               AppContext (State Management)                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|------------|
| Framework | React 18 | Component-based UI, ecosystem |
| Language | TypeScript | Type safety, better tooling |
| Build Tool | Vite | Fast HMR, optimized builds |
| Drag & Drop | react-dnd | Flexible, extensible DnD |
| State Management | React Context + useReducer | Simple, built-in, sufficient |
| Testing | Vitest + React Testing Library | Fast, modern testing |
| Styling | CSS Modules | Scoped styles, no conflicts |

### 2.3 Directory Structure

```
src/
├── components/
│   ├── Canvas/
│   │   ├── Canvas.tsx          # Main canvas editor
│   │   └── Canvas.css
│   ├── CanvasItems/            # Individual component renderers
│   │   ├── TextItem.tsx
│   │   ├── ButtonItem.tsx
│   │   ├── ImageItem.tsx
│   │   ├── AudioItem.tsx
│   │   ├── APIItem.tsx
│   │   ├── CommandItem.tsx
│   │   └── CanvasItem.css      # Shared styles
│   ├── DeviceFrame/
│   │   ├── DeviceFrame.tsx     # Hardware simulation
│   │   └── DeviceFrame.css
│   ├── LeftSidebar/
│   │   ├── LeftSidebar.tsx     # Component palette
│   │   └── LeftSidebar.css
│   ├── NewProjectModal/
│   │   ├── NewProjectModal.tsx
│   │   └── NewProjectModal.css
│   ├── Preview/
│   │   ├── Preview.tsx         # Preview panel
│   │   └── Preview.css
│   ├── RightSidebar/
│   │   ├── RightSidebar.tsx    # Properties panel
│   │   └── RightSidebar.css
│   └── TopBar/
│       ├── TopBar.tsx          # Header with actions
│       └── TopBar.css
├── context/
│   └── AppContext.tsx          # Global state management
├── types/
│   └── index.ts                # TypeScript interfaces
├── App.tsx                     # Root component
├── App.css
├── index.css                   # Global styles
└── main.tsx                    # Entry point
```

---

## 3. Data Model

### 3.1 Core Types

```typescript
// Project Types
type ProjectType = 'pin_evo' | 'flex';

interface Project {
  id: string;
  name: string;
  type: ProjectType;
}

// Canvas Component
type ComponentType = 'text' | 'button' | 'image' | 'api' | 'command' | 'audio';

interface CanvasComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Text/Button properties
  text?: string;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  borderRadius?: string;
  
  // Button function
  goToScreen?: string;
  function?: 'none' | 'connect' | 'open_door' | 'get_capacity' | 'api_call' | 'play_sound';
  buttonSound?: string;
  
  // Image
  imageUrl?: string;
  
  // Audio
  audioUrl?: string;
  
  // API
  apiUrl?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: string;
  requestBody?: string;
  
  // Command
  command?: string;
}

// Screen
interface Screen {
  id: string;
  name: string;
  components: CanvasComponent[];
}

// CMS State
interface CMSState {
  project: Project | null;
  screens: Screen[];
  activeScreenId: string;
  selectedComponentId: string | null;
  sandboxMode: boolean;
  sandboxConfig: SandboxConfig;
}
```

### 3.2 Hardware Dimensions

```typescript
const PIN_EVO_CANVAS_WIDTH = 600;
const PIN_EVO_CANVAS_HEIGHT = 480;

const FLEX_CANVAS_WIDTH = 480;
const FLEX_CANVAS_HEIGHT = 800;
```

---

## 4. Component Design

### 4.1 Component Hierarchy

```
App
├── AppContent
│   ├── NewProjectModal (conditional)
│   ├── TopBar
│   │   └── NewProjectModal (for create)
│   ├── MainContent
│   │   ├── LeftSidebar (palette)
│   │   ├── TabsContainer
│   │   │   ├── Canvas (editor)
│   │   │   │   └── CanvasItem[] (TextItem, ButtonItem, etc.)
│   │   │   └── Preview
│   │   │       └── DeviceFrame
│   │   └── RightSidebar (properties)
│   └── SandboxBanner (conditional)
```

### 4.2 Canvas Component Item Pattern

All canvas items follow a consistent pattern for drag-and-drop:

```typescript
// Example: ButtonItem.tsx
export default function ButtonItem({ component }: Props) {
  const { selectComponent, state } = useCMS();
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Drag configuration
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DragTypes.EXISTING_COMPONENT,
    item: (monitor) => {
      const initialOffset = monitor.getInitialClientOffset();
      const elementRect = itemRef.current?.getBoundingClientRect();
      
      return {
        componentId: component.id,
        mouseOffsetX: initialOffset.x - elementRect.left,
        mouseOffsetY: initialOffset.y - elementRect.top
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [component]);
  
  // Combined ref
  const setRefs = (node: HTMLDivElement | null) => {
    itemRef.current = node;
    drag(node);
  };
  
  return (
    <div ref={setRefs} className={`canvas-item ${isDragging ? 'dragging' : ''}`}>
      {/* Component UI */}
    </div>
  );
}
```

### 4.3 Properties Panel Design

The RightSidebar adapts based on selected component:

```
┌─────────────────────────┐
│  Properties             │
├─────────────────────────┤
│  No Selection           │
│  ─────────────────      │
│  Click a component     │
│  to edit its properties│
└─────────────────────────┘

┌─────────────────────────┐
│  Text Properties       │
├─────────────────────────┤
│  Text          [_____] │
│  Font Size     [16  ▼] │
│  Color         [#1a1a2e]│
│  Width         [160 ▼] │
│  Height        [40  ▼] │
│  ─────────────────     │
│  [Delete Component]   │
└─────────────────────────┘
```

---

## 5. State Management

### 5.1 Context Architecture

```typescript
// AppContext.tsx
interface CMSContextValue {
  state: CMSState;
  // Actions
  setProject: (project: Project) => void;
  addScreen: () => void;
  deleteScreen: (screenId: string) => void;
  renameScreen: (screenId: string, name: string) => void;
  setActiveScreen: (screenId: string) => void;
  addComponent: (component: CanvasComponent) => void;
  updateComponent: (component: CanvasComponent) => void;
  deleteComponent: (componentId: string) => void;
  selectComponent: (componentId: string | null) => void;
  moveComponent: (componentId: string, x: number, y: number) => void;
  saveScreens: () => void;
  saveAsHtml: () => void;
  setSandboxMode: (enabled: boolean) => void;
  updateSandboxConfig: (config: Partial<SandboxConfig>) => void;
}
```

### 5.2 Action Types

```typescript
type CMSAction =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'ADD_SCREEN'; payload: Screen }
  | { type: 'DELETE_SCREEN'; payload: string }
  | { type: 'RENAME_SCREEN'; payload: { id: string; name: string } }
  | { type: 'SET_ACTIVE_SCREEN'; payload: string }
  | { type: 'ADD_COMPONENT'; payload: { screenId: string; component: CanvasComponent } }
  | { type: 'UPDATE_COMPONENT'; payload: { screenId: string; component: CanvasComponent } }
  | { type: 'DELETE_COMPONENT'; payload: { screenId: string; componentId: string } }
  | { type: 'SELECT_COMPONENT'; payload: string | null }
  | { type: 'REORDER_COMPONENT'; payload: { screenId: string; componentId: string; x: number; y: number } }
  | { type: 'SET_SANDBOX_MODE'; payload: boolean }
  | { type: 'UPDATE_SANDBOX_CONFIG'; payload: Partial<CMSState['sandboxConfig']> };
```

---

## 6. Drag and Drop Implementation

### 6.1 Drag Types

```typescript
const DragTypes = {
  NEW_COMPONENT: 'NEW_COMPONENT',      // From palette to canvas
  EXISTING_COMPONENT: 'EXISTING_COMPONENT' // Repositioning on canvas
} as const;
```

### 6.2 Drop Zone Logic (Canvas.tsx)

```typescript
const [{ isOver }, drop] = useDrop({
  accept: [DragTypes.NEW_COMPONENT, DragTypes.EXISTING_COMPONENT],
  drop: (item, monitor) => {
    const clientOffset = monitor.getClientOffset();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    
    if ('componentType' in item) {
      // New component - add to screen
      const newComponent = {
        id: uuidv4(),
        type: item.componentType,
        x: clientOffset.x - canvasRect.left,
        y: clientOffset.y - canvasRect.top,
        ...getDefaultComponentProps(item.componentType)
      };
      addComponent(newComponent);
    } else {
      // Existing component - move
      moveComponent(
        item.componentId,
        clientOffset.x - canvasRect.left - item.mouseOffsetX,
        clientOffset.y - canvasRect.top - item.mouseOffsetY
      );
    }
  }
});
```

---

## 7. Export Functionality

### 7.1 JSON Export

```typescript
const saveScreens = () => {
  const json = JSON.stringify({ screens: state.screens }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'screens.json';
  a.click();
  
  URL.revokeObjectURL(url);
};
```

### 7.2 HTML Export

Generates standalone HTML with embedded styles and rendered components:

```typescript
const saveAsHtml = () => {
  let html = `<!DOCTYPE html><html>...`;
  
  state.screens.forEach((screen) => {
    html += `<div class="screen">`;
    screen.components.forEach((comp) => {
      html += `<div class="component ${comp.type}" style="...">`;
      // Component HTML
      html += `</div>`;
    });
    html += `</div>`;
  });
  
  // Download logic
};
```

---

## 8. Preview System

### 8.1 Preview Component Structure

```typescript
// Preview renders the active screen in a device frame
// with interactive components

export default function Preview() {
  const { state } = useCMS();
  const activeScreen = state.screens.find(s => s.id === state.activeScreenId);
  
  const handleComponentClick = (component, e) => {
    if (component.type === 'button') {
      if (component.goToScreen) {
        // Navigate to target screen
      }
      if (component.function === 'play_sound' && component.buttonSound) {
        // Play sound
      }
    }
  };
  
  return (
    <DeviceFrame>
      {activeScreen?.components.map(comp => (
        <div 
          key={comp.id}
          onClick={(e) => handleComponentClick(comp, e)}
        >
          {/* Render component based on type */}
        </div>
      ))}
    </DeviceFrame>
  );
}
```

---

## 9. Accessibility Implementation

### 9.1 ARIA Attributes

| Component | ARIA Attributes |
|-----------|-----------------|
| Canvas | `role="application"`, `aria-label` |
| Modal | `role="dialog"`, `aria-modal`, `aria-labelledby` |
| Screen Tabs | `role="tablist"`, `role="tab"`, `aria-selected` |
| Buttons | `aria-label` (for icon buttons) |
| Sandbox Banner | `role="status"`, `aria-live="polite"` |

### 9.2 Focus Management

```typescript
// Modal focus trap
useEffect(() => {
  if (isOpen) {
    previousFocusRef.current = document.activeElement;
    setTimeout(() => closeButtonRef.current?.focus(), 100);
  } else {
    previousFocusRef.current?.focus();
  }
}, [isOpen]);

// Escape key handler
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, []);
```

### 9.3 Keyboard Navigation

- Skip link for main content
- Tab navigation through palette items
- Enter to add component from palette
- Arrow keys for screen tab navigation
- Delete key to remove selected component

---

## 10. Performance Optimizations

### 10.1 Rendering Strategies

| Optimization | Implementation |
|--------------|----------------|
| Memoization | `React.memo` on canvas items |
| Drag updates | `useDrag` with dependency arrays |
| State updates | Batched updates via reducer |

### 10.2 Canvas Rendering

- Components rendered only when needed
- CSS transforms for drag operations (GPU accelerated)
- Limited re-renders via selective context usage

---

## 11. Security Considerations

### 11.1 Input Sanitization
- Component properties stored as typed data
- URL inputs validated before use
- No `eval()` or dynamic code execution

### 11.2 Export Safety
- JSON export is read-only data
- HTML export uses safe DOM operations
- No sensitive data in exports

---

## 12. Testing Strategy

### 12.1 Test Structure

```
src/test/
├── setup.ts                              # Test configuration
├── NewProjectModal.accessibility.test.tsx
├── TopBar.accessibility.test.tsx
└── Canvas.accessibility.test.tsx
```

### 12.2 Test Categories

| Category | Tools | Coverage |
|----------|-------|----------|
| Unit | Vitest | Core logic, reducers |
| Integration | React Testing Library | Component interaction |
| Accessibility | axe-core, manual testing | WCAG compliance |

---

## 13. Future Enhancements

### 13.1 Planned Features

| Feature | Description | Complexity |
|---------|-------------|------------|
| Undo/Redo | Action history with revert | Medium |
| Copy/Paste | Duplicate components | Low |
| Templates | Pre-built screen layouts | Medium |
| Version Control | Git-like history | High |
| Custom Components | User-defined components | High |
| Cloud Sync | Save to cloud storage | Medium |

### 13.2 Extension Points

- **Custom Component Registry**: Plugin system for new component types
- **Export Adapters**: Pluggable export formats (XML, binary)
- **Device Profiles**: Add new device types with custom dimensions

---

## 14. API Reference

### 14.1 Context API

```typescript
// Usage in components
const { 
  state, 
  setProject, 
  addScreen, 
  addComponent, 
  updateComponent,
  deleteComponent,
  selectComponent,
  moveComponent,
  saveScreens,
  saveAsHtml,
  setSandboxMode,
  updateSandboxConfig
} = useCMS();
```

### 14.2 Key Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `addComponent` | `CanvasComponent` | Add component to active screen |
| `updateComponent` | `CanvasComponent` | Update component properties |
| `moveComponent` | `id, x, y` | Reposition component |
| `selectComponent` | `id \| null` | Select/deselect component |

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **Canvas** | The visual editing area where components are positioned |
| **Screen** | A single page in a multi-screen application |
| **Component** | A UI element (text, button, image, etc.) |
| **Palette** | The left sidebar containing draggable components |
| **Properties Panel** | The right sidebar for editing component settings |
| **Device Frame** | The hardware simulation in preview mode |
| **Sandbox Mode** | Test mode with configurable mock data |

---

*Document Version: 1.0*  
*Last Updated: March 18, 2026*

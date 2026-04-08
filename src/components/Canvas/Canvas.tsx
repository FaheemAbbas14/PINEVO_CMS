import { useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { DragTypes, PIN_EVO_CANVAS_WIDTH, PIN_EVO_CANVAS_HEIGHT, FLEX_CANVAS_WIDTH, FLEX_CANVAS_HEIGHT } from '../../types';
import type { NewComponentDragItem, ExistingComponentDragItem, CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import TextItem from '../CanvasItems/TextItem';
import { useLanguage } from '../../App';
import TextInputItem from '../CanvasItems/TextInputItem';
import ButtonItem from '../CanvasItems/ButtonItem';
import ImageItem from '../CanvasItems/ImageItem';
import AudioItem from '../CanvasItems/AudioItem';
import APIItem from '../CanvasItems/APIItem';
import CommandItem from '../CanvasItems/CommandItem';
import './Canvas.css';

function getDefaultComponentProps(type: string): Partial<CanvasComponent> {
  switch (type) {
    case 'text':
      return { width: 160, height: 40, text: 'Text Field', fontSize: 16, color: '#1a1a2e' };
    case 'text_input':
      return { width: 200, height: 48, text: 'Input', fontSize: 16, color: '#1a1a2e', bgColor: '#ffffff', borderRadius: 8, placeholder: 'Enter text...' };
    case 'button':
      return { width: 120, height: 40, text: 'Button', fontSize: 14, color: '#ffffff', bgColor: '#4f46e5', borderRadius: 8, function: 'none' };
    case 'image':
      return { width: 120, height: 90, imageUrl: '' };
    case 'audio':
      return { width: 200, height: 60, audioUrl: '' };
    case 'api':
      return { width: 140, height: 50, apiUrl: 'https://api.example.com', httpMethod: 'GET' };
    case 'command':
      return { width: 140, height: 50, command: 'echo "hello"' };
    default:
      return {};
  }
}

export default function Canvas() {
  const { locale } = useLanguage();
  const { state, activeScreen, addComponent, moveComponent, selectComponent } = useCMS();
  const canvasRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Get canvas dimensions based on project type
  const isFlex = state.project?.type === 'flex';
  const canvasWidth = isFlex ? FLEX_CANVAS_WIDTH : PIN_EVO_CANVAS_WIDTH;
  const canvasHeight = isFlex ? FLEX_CANVAS_HEIGHT : PIN_EVO_CANVAS_HEIGHT;

  // Disable drop functionality in preview mode
  const isPreviewMode = state.previewMode;

  // Track active screen ID to force drop re-registration on screen change
  const activeScreenId = state.activeScreenId;

  const [{ isOver }, drop] = useDrop<NewComponentDragItem | ExistingComponentDragItem, void, { isOver: boolean }>({
    accept: [DragTypes.NEW_COMPONENT, DragTypes.EXISTING_COMPONENT],
    drop: (item, monitor) => {
      // Skip drop handling in preview mode
      if (isPreviewMode) return;

      const clientOffset = monitor.getClientOffset();
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!clientOffset || !canvasRect) return;

      if ('componentType' in item) {
        // New component dropped from palette
        const defaults = getDefaultComponentProps(item.componentType);
        const mouseX = clientOffset.x - canvasRect.left;
        const mouseY = clientOffset.y - canvasRect.top;

        // Ensure component is centered on drop point
        const dropX = Math.max(0, Math.min(mouseX - (defaults.width ?? 60) / 2, canvasRect.width - (defaults.width ?? 60)));
        const dropY = Math.max(0, Math.min(mouseY - (defaults.height ?? 30) / 2, canvasRect.height - (defaults.height ?? 30)));

        const newComponent: CanvasComponent = {
          id: uuidv4(),
          type: item.componentType,
          x: dropX,
          y: dropY,
          ...getDefaultComponentProps(item.componentType),
        } as CanvasComponent;
        addComponent(newComponent);
      } else {
        // Existing component repositioned
        const x = Math.max(0, Math.min(clientOffset.x - canvasRect.left - item.mouseOffsetX, canvasRect.width - 40));
        const y = Math.max(0, Math.min(clientOffset.y - canvasRect.top - item.mouseOffsetY, canvasRect.height - 20));
        moveComponent(item.componentId, x, y);
      }
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }, [isPreviewMode, activeScreenId]);

  // Connect the drop ref to the canvas element
  const setCanvasRef = (node: HTMLDivElement | null) => {
    canvasRef.current = node;
    dropRef.current = node;
  };

  // Register/unregister drop target when preview mode or active screen changes
  useEffect(() => {
    const canvasNode = dropRef.current;
    if (!canvasNode) return;

    if (isPreviewMode) {
      drop(null);
    } else {
      drop(canvasNode);
    }
  }, [isPreviewMode, activeScreenId, drop]);

  return (
    <div className="canvas-wrapper">
      <div className="canvas-label" id="canvas-label">Canvas — {canvasWidth} × {canvasHeight}px</div>
      <div
        ref={setCanvasRef}
        className={`canvas ${isOver ? 'drag-over' : ''}`}
        style={{ width: '100%', height: '100%' }}
        onClick={() => selectComponent(null)}
        role="application"
        aria-label="Component canvas - drag and drop area"
        aria-describedby="canvas-label"
      >
        {/* Grid overlay */}
        <div className="canvas-grid" />

        {activeScreen?.components.length === 0 && (
          <div className="canvas-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
              <path d="M12 8v8M8 12h8" stroke="#d0d0d0" strokeWidth="1.5" />
            </svg>
            <p>{isPreviewMode ? 'Click components to interact' : 'Drag components here'}</p>
          </div>
        )}

        {activeScreen?.components.map((component) => {
          if (component.type === 'text') return <TextItem key={component.id + '-' + locale} component={component} locale={locale} />;
          if (component.type === 'text_input') return <TextInputItem key={component.id} component={component} />;
          if (component.type === 'button') return <ButtonItem key={component.id} component={component} />;
          if (component.type === 'image') return <ImageItem key={component.id} component={component} />;
          if (component.type === 'audio') return <AudioItem key={component.id} component={component} />;
          if (component.type === 'api') return <APIItem key={component.id} component={component} />;
          if (component.type === 'command') return <CommandItem key={component.id} component={component} />;
          return null;
        })}
      </div>
    </div>
  );
}

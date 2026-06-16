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
import ViewItem from '../CanvasItems/ViewItem';
import { measureText } from '../../utils/measureText';
import './Canvas.css';

function getTextBasedSize(text: string, fontSize: number, padW: number, padH: number) {
  const font = `${fontSize}px sans-serif`;
  const measured = measureText(text, font);
  return {
    width: measured.width + padW,
    height: measured.height + padH,
  };
}

function getDefaultComponentProps(type: string): Partial<CanvasComponent> {
  switch (type) {
    case 'text': {
      const text = 'Text Field';
      const fontSize = 16;
      const size = getTextBasedSize(text, fontSize, 24, 12);
      return { width: size.width, height: size.height, widthMode: 'wrap_content', heightMode: 'wrap_content', text, fontSize, color: '#1a1a2e', textAlign: 'left' };
    }
    case 'text_input': {
      const placeholder = 'Enter text...';
      const fontSize = 16;
      const size = getTextBasedSize(placeholder, fontSize, 32, 16);
      return {
        width: size.width,
        height: size.height,
        widthMode: 'wrap_content',
        heightMode: 'wrap_content',
        text: 'Input',
        fontSize,
        color: '#1a1a2e',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        bgColor: '#ffffff',
        borderRadius: 8,
        inputBorderStyle: 'rounded',
        textAlign: 'center',
        inputType: 'text',
        maxLength: 0,
        placeholder,
      };
    }
    case 'button': {
      const text = 'Button';
      const fontSize = 14;
      const size = getTextBasedSize(text, fontSize, 32, 16);
      return {
        width: size.width,
        height: size.height,
        widthMode: 'wrap_content',
        heightMode: 'wrap_content',
        text,
        fontSize,
        color: '#ffffff',
        bgColor: '#4f46e5',
        borderWidth: 0,
        borderColor: '#000000',
        borderRadius: 0,
        textAlign: 'center',
        function: 'none',
      };
    }
    case 'image':
      return { width: 120, height: 90, widthMode: 'wrap_content', heightMode: 'wrap_content', imageUrl: '', borderWidth: 0, borderColor: '#000000', borderRadius: 0 };
    case 'view':
      return { width: 180, height: 120, widthMode: 'wrap_content', heightMode: 'wrap_content', visible: true, bgColor: '#e5e7eb', borderWidth: 0, borderColor: '#000000', borderRadius: 0 };
    case 'audio':
      return { width: 200, height: 60, widthMode: 'wrap_content', heightMode: 'wrap_content', audioUrl: '', borderWidth: 0, borderColor: '#000000', borderRadius: 5 };
    case 'api':
      return { width: 140, height: 50, widthMode: 'wrap_content', heightMode: 'wrap_content', apiUrl: 'https://api.example.com', httpMethod: 'GET', borderWidth: 1, borderColor: '#bae6fd', borderRadius: 8 };
    case 'command':
      return { width: 140, height: 50, widthMode: 'wrap_content', heightMode: 'wrap_content', command: 'echo "hello"', borderWidth: 0, borderColor: '#000000', borderRadius: 8 };
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
  const canvasBackgroundColor = activeScreen?.backgroundColor || state.project?.defaultCanvasBgColor || '#ffffff';

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
        style={{ width: '100%', height: '100%', background: canvasBackgroundColor }}
        onClick={() => selectComponent(null)}
        role="application"
        aria-label="Component canvas - drag and drop area"
        aria-describedby="canvas-label"
      >
        {activeScreen?.components.length === 0 && (
          <div className="canvas-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d0d0d0" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
              <path d="M12 8v8M8 12h8" stroke="#d0d0d0" strokeWidth="1.5" />
            </svg>
            <p>{isPreviewMode ? 'Click components to interact' : 'Drag components here'}</p>
          </div>
        )}

        {[...(activeScreen?.components || [])]
          .filter((component) => component.visible !== false)
          .sort((a, b) => {
            const aIsView = a.type === 'view';
            const bIsView = b.type === 'view';
            if (aIsView === bIsView) return 0;
            return aIsView ? -1 : 1;
          })
          .map((component) => {
          if (component.type === 'view') return <ViewItem key={component.id} component={component} />;
          if (component.type === 'text') return <TextItem key={component.id} component={component} locale={locale} />;
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

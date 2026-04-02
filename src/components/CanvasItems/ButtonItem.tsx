import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import './CanvasItem.css';

interface Props {
  component: CanvasComponent;
}

export default function ButtonItem({ component }: Props) {
  const { selectComponent, setActiveScreen, state } = useCMS();
  const isSelected = state.selectedComponentId === component.id;
  const isPreviewMode = state.previewMode;
  const itemRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: DragTypes.EXISTING_COMPONENT,
    item: (monitor) => {
      const initialOffset = monitor.getInitialClientOffset();
      const elementRect = itemRef.current?.getBoundingClientRect();

      // Calculate offset relative to the element's top-left corner
      const mouseOffsetX = initialOffset && elementRect ? initialOffset.x - elementRect.left : 0;
      const mouseOffsetY = initialOffset && elementRect ? initialOffset.y - elementRect.top : 0;

      return {
        componentId: component.id,
        mouseOffsetX,
        mouseOffsetY
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [component]);

  // Connect both refs
  const setRefs = (node: HTMLDivElement | null) => {
    itemRef.current = node;
    drag(node);
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Handle preview mode - execute button action
    if (isPreviewMode) {
      // Check for goto_screen first
      if (component.goToScreen) {
        console.log('Navigating to screen:', component.goToScreen);
        setActiveScreen(component.goToScreen);
        return;
      }

      // Handle different functions
      if (component.function === 'open_door') {
        console.log('Opening door...');
      } else if (component.function === 'play_audio') {
        if (component.buttonSound) {
          const audio = new Audio(component.buttonSound);
          audio.play().catch(err => console.error('Error playing audio:', err));
        }
      } else if (component.function === 'api_call') {
        if (component.apiCall) {
          fetch(component.apiCall, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => console.error('API call error:', err));
        }
      }

      return;
    }

    // Normal mode - select component for editing
    selectComponent(component.id);
  };

  return (
    <div
      ref={setRefs}
      className={`canvas-item button-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
      }}
      onClick={handleButtonClick}
    >
      <button
        style={{
          backgroundColor: component.bgColor,
          color: component.color,
          fontSize: `${component.fontSize}px`,
          borderRadius: `${component.borderRadius}px`,
          width: '100%',
          height: '100%',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {component.text}
      </button>
    </div>
  );
}

import { useRef, useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import { useLanguage } from '../../App';
import './CanvasItem.css';
import { measureText } from '../../utils/measureText';

interface Props {
  component: CanvasComponent;
}

export default function ButtonItem({ component }: Props) {
  const { selectComponent, setActiveScreen, state, updateComponent } = useCMS();
  const isSelected = state.selectedComponentId === component.id;
  const isPreviewMode = state.previewMode;
  const itemRef = useRef<HTMLDivElement>(null);
  const [dynamicSize, setDynamicSize] = useState<{ width: number, height: number }>({ width: component.width, height: component.height });

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

  const { t } = useLanguage();
  const label = component.labelMode === 'lang'
    ? (component.labelKey ? t(component.labelKey) : '')
    : (component.text || 'Button');

  // Dynamically calculate width/height based on label
  useEffect(() => {
    // Compose font string
    const fontSize = component.fontSize || 14;
    const fontFamily = component.fontFamily ? `'${component.fontFamily}', sans-serif` : 'sans-serif';
    const font = `${fontSize}px ${fontFamily}`;
    const { width, height } = measureText(label, font);
    // Add some padding
    const padW = 32; // left+right
    const padH = 16; // top+bottom
    const newWidth = width + padW;
    const newHeight = height + padH;
    setDynamicSize({ width: newWidth, height: newHeight });
    // Optionally update component state if different
    if (component.width !== newWidth || component.height !== newHeight) {
      updateComponent({ ...component, width: newWidth, height: newHeight });
    }
  }, [label, component.fontSize, component.fontFamily]);

  return (
    <div
      ref={setRefs}
      className={`canvas-item button-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: dynamicSize.width,
        height: dynamicSize.height,
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
        {label}
      </button>
    </div>
  );
}

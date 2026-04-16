import { useRef, useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import './CanvasItem.css';
import { measureText } from '../../utils/measureText';

interface Props {
  component: CanvasComponent;
}

export default function CommandItem({ component }: Props) {
  const { selectComponent, state, updateComponent } = useCMS();
  const isSelected = state.selectedComponentId === component.id;
  const itemRef = useRef<HTMLDivElement>(null);
  const isPreviewMode = state.previewMode;
  const [dynamicSize, setDynamicSize] = useState<{ width: number, height: number }>({ width: component.width, height: component.height });
  // Dynamically calculate width/height based on label
  useEffect(() => {
    const label = 'CMD';
    const font = '11px monospace';
    const { width, height } = measureText(label, font);
    const padW = 40;
    const padH = 16;
    const newWidth = width + padW;
    const newHeight = height + padH;
    setDynamicSize({ width: newWidth, height: newHeight });
    if (component.width !== newWidth || component.height !== newHeight) {
      updateComponent({ ...component, width: newWidth, height: newHeight });
    }
  }, []);

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

  // Hide command component in preview mode and export mode
  if (isPreviewMode || state.sandboxMode) {
    return null;
  }

  return (
    <div
      ref={setRefs}
      className={`canvas-item command-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: dynamicSize.width,
        height: dynamicSize.height,
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        padding: '0 10px',
        gap: '8px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
      <span>CMD</span>
    </div>
  );
}

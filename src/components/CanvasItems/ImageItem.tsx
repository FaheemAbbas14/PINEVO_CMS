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

export default function ImageItem({ component }: Props) {
  const { selectComponent, state, updateComponent } = useCMS();
  const isSelected = state.selectedComponentId === component.id;
  const itemRef = useRef<HTMLDivElement>(null);
  const [dynamicSize, setDynamicSize] = useState<{ width: number, height: number }>({ width: component.width, height: component.height });
  // Dynamically calculate width/height based on image presence
  useEffect(() => {
    let newWidth = component.width;
    let newHeight = component.height;
    if (component.imageUrl) {
      // Use default or keep as is, or could measure image if needed
      newWidth = 160;
      newHeight = 120;
    } else {
      // Placeholder size
      newWidth = 120;
      newHeight = 80;
    }
    setDynamicSize({ width: newWidth, height: newHeight });
    if (component.width !== newWidth || component.height !== newHeight) {
      updateComponent({ ...component, width: newWidth, height: newHeight });
    }
  }, [component.imageUrl]);

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

  return (
    <div
      ref={setRefs}
      className={`canvas-item image-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: dynamicSize.width,
        height: dynamicSize.height,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
    >
      {component.imageUrl ? (
        <img
          src={component.imageUrl}
          alt="component"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div className="image-placeholder">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>No Image</span>
        </div>
      )}
    </div>
  );
}

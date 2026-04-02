import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import './CanvasItem.css';

interface Props {
  component: CanvasComponent;
}

export default function APIItem({ component }: Props) {
  const { selectComponent, state } = useCMS();
  const isSelected = state.selectedComponentId === component.id;
  const itemRef = useRef<HTMLDivElement>(null);
  const isPreviewMode = state.previewMode;

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

  // Hide API component in preview mode and export mode
  if (isPreviewMode || state.sandboxMode) {
    return null;
  }

  return (
    <div
      ref={setRefs}
      className={`canvas-item api-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: component.width,
        height: component.height,
        backgroundColor: '#f0f9ff',
        color: '#0369a1',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '0 8px',
        gap: '6px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
      <span className="api-tag">API</span>
      <span style={{ fontSize: '9px', fontWeight: '500', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {component.httpMethod}
      </span>
    </div>
  );
}

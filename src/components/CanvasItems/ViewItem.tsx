import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import { resolveComponentSize } from '../../utils/componentSizing';
import './CanvasItem.css';

interface Props {
  component: CanvasComponent;
}

export default function ViewItem({ component }: Props) {
  const { selectComponent, state } = useCMS();
  if (component.visible === false) {
    return null;
  }
  const isSelected = state.selectedComponentId === component.id;
  const itemRef = useRef<HTMLDivElement>(null);
  const size = resolveComponentSize(component, state.project?.type);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: DragTypes.EXISTING_COMPONENT,
    item: (monitor) => {
      const initialOffset = monitor.getInitialClientOffset();
      const elementRect = itemRef.current?.getBoundingClientRect();

      const mouseOffsetX = initialOffset && elementRect ? initialOffset.x - elementRect.left : 0;
      const mouseOffsetY = initialOffset && elementRect ? initialOffset.y - elementRect.top : 0;

      return {
        componentId: component.id,
        mouseOffsetX,
        mouseOffsetY,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [component]);

  const setRefs = (node: HTMLDivElement | null) => {
    itemRef.current = node;
    drag(node);
  };

  return (
    <div
      ref={setRefs}
      className={`canvas-item view-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: size.width,
        height: size.height,
        background: component.bgColor || '#e5e7eb',
        borderRadius: `${component.borderRadius ?? 0}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
    />
  );
}
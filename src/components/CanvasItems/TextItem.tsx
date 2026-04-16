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
  locale?: string;
}

export default function TextItem({ component }: Props) {
  const { selectComponent, state, updateComponent } = useCMS();
  const isSelected = state.selectedComponentId === component.id;
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

  const { t } = useLanguage();
  const label = component.labelMode === 'lang'
    ? (component.labelKey ? t(component.labelKey) : '')
    : (component.text || 'Text');

  // Dynamically calculate width/height based on label
  useEffect(() => {
    const fontSize = component.fontSize || 14;
    const fontFamily = component.fontFamily ? `'${component.fontFamily}', sans-serif` : 'sans-serif';
    const font = `${fontSize}px ${fontFamily}`;
    const { width, height } = measureText(label, font);
    const padW = 24;
    const padH = 12;
    const newWidth = width + padW;
    const newHeight = height + padH;
    setDynamicSize({ width: newWidth, height: newHeight });
    if (component.width !== newWidth || component.height !== newHeight) {
      updateComponent({ ...component, width: newWidth, height: newHeight });
    }
  }, [label, component.fontSize, component.fontFamily]);

  return (
    <div
      ref={setRefs}
      className={`canvas-item text-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: dynamicSize.width,
        height: dynamicSize.height,
        color: component.color,
        fontSize: `${component.fontSize}px`,
        fontWeight: component.fontWeight || 'normal',
        fontFamily: component.fontFamily ? `'${component.fontFamily}', sans-serif` : undefined,
        textAlign: 'left',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        display: 'flex',
        paddingLeft: 8,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.id);
      }}
    >
      {label}
    </div>
  );
}

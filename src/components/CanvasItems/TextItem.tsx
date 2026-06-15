import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import { useLanguage } from '../../App';
import { measureText } from '../../utils/measureText';
import { resolveComponentSize } from '../../utils/componentSizing';
import './CanvasItem.css';

interface Props {
  component: CanvasComponent;
  locale?: string;
}

export default function TextItem({ component }: Props) {
  const { selectComponent, state } = useCMS();
  const isSelected = state.selectedComponentId === component.id;
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

  const { t } = useLanguage();
  const label = component.labelMode === 'lang'
    ? (component.labelKey ? t(component.labelKey) : '')
    : (component.text || 'Text');
  const textAlign = component.textAlign || 'left';
  const justifyContent = textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start';
  const fontSize = component.fontSize || 14;
  const fontFamily = component.fontFamily ? `'${component.fontFamily}', sans-serif` : 'sans-serif';
  const measured = measureText(label || 'Text', `${fontSize}px ${fontFamily}`);
  const size = resolveComponentSize(component, state.project?.type, {
    width: measured.width + 24,
    height: measured.height + 12,
  });

  return (
    <div
      ref={setRefs}
      className={`canvas-item text-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: size.width,
        height: size.height,
        color: component.color,
        fontSize: `${fontSize}px`,
        fontWeight: component.fontWeight || 'normal',
        fontFamily: component.fontFamily ? `'${component.fontFamily}', sans-serif` : undefined,
        textAlign,
        justifyContent,
        alignItems: 'center',
        display: 'flex',
        paddingLeft: 8,
        paddingRight: 8,
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

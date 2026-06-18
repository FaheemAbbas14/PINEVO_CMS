import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import { useLanguage } from '../../App';
import { resolveComponentSize } from '../../utils/componentSizing';
import { getAvailableWidth, measureWrappedText } from '../../utils/textWrap';
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
      const targetScreen = component.function === 'submit'
        ? (component.submitGoToScreen || component.goToScreen)
        : component.goToScreen;

      // Screen navigation is only valid for goto_screen and submit actions.
      if ((component.function === 'goto_screen' || component.function === 'submit') && targetScreen) {
        console.log('Navigating to screen:', targetScreen);
        setActiveScreen(targetScreen);
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
  const textAlign = component.textAlign || 'center';
  const fontSize = component.fontSize || 14;
  const fontFamily = component.fontFamily ? `'${component.fontFamily}', sans-serif` : 'sans-serif';
  const fontSpec = `${fontSize}px ${fontFamily}`;
  const availableWidth = Math.max(24, getAvailableWidth(state.project?.type, component.x));
  const wrapBoxWidth = availableWidth;
  const maxContentWidth = Math.max(1, wrapBoxWidth - 16);
  const wrapped = measureWrappedText(label || 'Button', fontSpec, maxContentWidth);
  const isWrapWidth = (component.widthMode || 'fixed') === 'wrap_content';
  const size = resolveComponentSize(component, state.project?.type, {
    width: isWrapWidth ? wrapBoxWidth : (wrapped.width + 16),
    height: wrapped.height + 16,
  });
  const clampedWidth = isWrapWidth ? Math.min(size.width, availableWidth) : size.width;

  return (
    <div
      ref={setRefs}
      className={`canvas-item button-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: component.x,
        top: component.y,
        width: clampedWidth,
        height: size.height,
      }}
      onClick={handleButtonClick}
    >
      <button
        style={{
          backgroundColor: component.bgColor,
          color: component.color,
          fontSize: `${fontSize}px`,
          borderRadius: `${component.borderRadius ?? 0}px`,
          border: `${Math.max(0, Number(component.borderWidth ?? 0))}px solid ${component.borderColor || '#000000'}`,
          width: '100%',
          height: '100%',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          lineHeight: 1.25,
          padding: '0 8px',
          textAlign,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    </div>
  );
}

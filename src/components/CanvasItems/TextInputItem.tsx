import { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import './CanvasItem.css';

interface Props {
    readonly component: CanvasComponent;
}

export default function TextInputItem({ component }: Props) {
    const { selectComponent, state } = useCMS();
    const isSelected = state.selectedComponentId === component.id;
    const itemRef = useRef<HTMLDivElement>(null);
    const [displayText, setDisplayText] = useState(component.text || 'Input');

    const isPreviewMode = state.previewMode;

    // In preview mode, we need to listen for hardware button input
    useEffect(() => {
        if (!isPreviewMode) return;

        const handleKeyPress = (e: globalThis.KeyboardEvent) => {
            // Only capture if this component is on the active screen
            const activeScreen = state.screens.find(s => s.id === state.activeScreenId);
            const hasThisComponent = activeScreen?.components.some(c => c.id === component.id);

            if (hasThisComponent && e.key.length === 1) {
                setDisplayText(prev => prev + e.key);
            } else if (hasThisComponent && e.key === 'Backspace') {
                setDisplayText(prev => prev.slice(0, -1));
            } else if (hasThisComponent && e.key === 'Enter') {
                setDisplayText(''); // Clear on Enter
            }
        };

        // Listen for both keyboard events and custom hardware button events
        globalThis.addEventListener('keypress', handleKeyPress);
        globalThis.addEventListener('keydown', handleKeyPress);

        return () => {
            globalThis.removeEventListener('keypress', handleKeyPress);
            globalThis.removeEventListener('keydown', handleKeyPress);
        };
    }, [isPreviewMode, component.id, state.activeScreenId, state.screens]);

    // Listen for custom hardware button input events
    useEffect(() => {
        const handleHardwareInput = (e: CustomEvent) => {
            if (!isPreviewMode) return;

            const activeScreen = state.screens.find(s => s.id === state.activeScreenId);
            const hasThisComponent = activeScreen?.components.some(c => c.id === component.id);

            if (hasThisComponent) {
                if (e.detail.action === 'input') {
                    setDisplayText(e.detail.value || '');
                } else if (e.detail.action === 'append') {
                    setDisplayText(prev => prev + e.detail.value);
                } else if (e.detail.action === 'backspace') {
                    setDisplayText(prev => prev.slice(0, -1));
                } else if (e.detail.action === 'clear') {
                    setDisplayText('');
                }
            }
        };

        globalThis.addEventListener('hardwareButtonInput', handleHardwareInput as EventListener);
        return () => {
            globalThis.removeEventListener('hardwareButtonInput', handleHardwareInput as EventListener);
        };
    }, [isPreviewMode, component.id, state.activeScreenId, state.screens]);

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
                mouseOffsetY
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

    // In preview mode, show input field style
    const isEditable = !isPreviewMode;

    return (
        <div
            ref={setRefs}
            className={`canvas-item text-input-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
                left: component.x,
                top: component.y,
                width: component.width,
                height: component.height,
                fontSize: `${component.fontSize}px`,
            }}
            onClick={(e) => {
                e.stopPropagation();
                selectComponent(component.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    selectComponent(component.id);
                }
            }}
        >
            {isEditable ? (
                <div className="text-input-content" style={{
                    background: component.bgColor || '#ffffff',
                    borderRadius: `${component.borderRadius || 8}px`,
                    color: component.color || '#1a1a2e',
                }}>
                    <span className="text-input-label">{component.text || 'Input'}</span>
                    <span className="text-input-placeholder">{component.placeholder || 'Enter text...'}</span>
                </div>
            ) : (
                <div className="text-input-content text-input-preview" style={{
                    background: component.bgColor || '#ffffff',
                    borderRadius: `${component.borderRadius || 8}px`,
                    color: component.color || '#1a1a2e',
                }}>
                    {displayText || component.placeholder || 'Input'}
                </div>
            )}
        </div>
    );
}
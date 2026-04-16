import { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import { useLanguage } from '../../App';
import { measureText } from '../../utils/measureText';
import './CanvasItem.css';

interface Props {
    readonly component: CanvasComponent;
}

export default function TextInputItem({ component }: Props) {
    const { selectComponent, state } = useCMS();
    const isSelected = state.selectedComponentId === component.id;
    const itemRef = useRef<HTMLDivElement>(null);
    const [displayText, setDisplayText] = useState(component.text || 'Input');
    const [dynamicSize, setDynamicSize] = useState<{ width: number, height: number }>({ width: component.width, height: component.height });
    const { t } = useLanguage();

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

    // Determine label and placeholder based on mode
    const label = component.labelMode === 'lang'
        ? (component.labelKey ? t(component.labelKey) : '')
        : (component.text || 'Input');
    const placeholder = component.placeholderMode === 'lang'
        ? (component.placeholderKey ? t(component.placeholderKey) : '')
        : (component.placeholder || 'Enter text...');

    // Dynamically calculate width/height based on label and placeholder
    useEffect(() => {
        const fontSize = component.fontSize || 14;
        const fontFamily = component.fontFamily ? `'${component.fontFamily}', sans-serif` : 'sans-serif';
        const font = `${fontSize}px ${fontFamily}`;
        // Use the longer of label or placeholder
        const labelText = label || '';
        const placeholderText = placeholder || '';
        const mainText = labelText.length > placeholderText.length ? labelText : placeholderText;
        const { width, height } = measureText(mainText, font);
        const padW = 32;
        const padH = 16;
        const newWidth = width + padW;
        const newHeight = height + padH;
        setDynamicSize({ width: newWidth, height: newHeight });
        if (component.width !== newWidth || component.height !== newHeight) {
            // updateComponent is available from useCMS
            if (typeof (window as any).updateComponent === 'function') {
                (window as any).updateComponent({ ...component, width: newWidth, height: newHeight });
            }
        }
    }, [label, placeholder, component.fontSize, component.fontFamily]);

    return (
        <div
            ref={setRefs}
            className={`canvas-item text-input-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
                left: component.x,
                top: component.y,
                width: dynamicSize.width,
                height: dynamicSize.height,
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
                    <span className="text-input-label">{label}</span>
                    <span className="text-input-placeholder">{placeholder}</span>
                </div>
            ) : (
                <div className="text-input-content text-input-preview" style={{
                    background: component.bgColor || '#ffffff',
                    borderRadius: `${component.borderRadius || 8}px`,
                    color: component.color || '#1a1a2e',
                }}>
                    {displayText || placeholder}
                </div>
            )}
        </div>
    );
}
import { useRef, useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import type { CanvasComponent } from '../../types';
import { useCMS } from '../../context/AppContext';
import { useLanguage } from '../../App';
import { measureText } from '../../utils/measureText';
import { resolveComponentSize } from '../../utils/componentSizing';
import './CanvasItem.css';

interface Props {
    readonly component: CanvasComponent;
}

export default function TextInputItem({ component }: Props) {
    const { selectComponent, state } = useCMS();
    const isSelected = state.selectedComponentId === component.id;
    const itemRef = useRef<HTMLDivElement>(null);
    const [displayText, setDisplayText] = useState('');
    const { t } = useLanguage();

    const isPreviewMode = state.previewMode;
    const inputType = component.inputType || 'text';
    const maxLength = Math.max(0, Number(component.maxLength || 0));

    const sanitizeByType = (value: string): string => {
        if (inputType === 'number') {
            return value.replace(/[^0-9]/g, '');
        }
        return value;
    };

    const applyLength = (value: string): string => {
        if (maxLength > 0) {
            return value.slice(0, maxLength);
        }
        return value;
    };

    const normalizeInputValue = (value: string): string => applyLength(sanitizeByType(value));

    useEffect(() => {
        setDisplayText(prev => normalizeInputValue(prev));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputType, maxLength]);

    // In preview mode, we need to listen for hardware button input
    useEffect(() => {
        if (!isPreviewMode) return;

        const handleKeyPress = (e: globalThis.KeyboardEvent) => {
            // Only capture if this component is on the active screen
            const activeScreen = state.screens.find(s => s.id === state.activeScreenId);
            const hasThisComponent = activeScreen?.components.some(c => c.id === component.id);

            if (hasThisComponent && e.key.length === 1) {
                const nextChar = sanitizeByType(e.key);
                if (!nextChar) return;
                setDisplayText(prev => normalizeInputValue(prev + nextChar));
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
                    setDisplayText(normalizeInputValue(e.detail.value || ''));
                } else if (e.detail.action === 'append') {
                    const chunk = sanitizeByType(String(e.detail.value || ''));
                    if (!chunk) return;
                    setDisplayText(prev => normalizeInputValue(prev + chunk));
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
    }, [isPreviewMode, component.id, state.activeScreenId, state.screens, inputType, maxLength]);

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
    const useLangPlaceholder = component.placeholderMode === 'lang' || Boolean(component.placeholderKey);
    const placeholder = useLangPlaceholder
        ? (component.placeholderKey ? t(component.placeholderKey) : '')
        : (component.placeholder || 'Enter text...');
    const centeredText = placeholder || label;
    const textAlign = component.textAlign || 'center';
    const borderStyle = component.inputBorderStyle || 'rounded';
    const borderColor = component.borderColor || '#e5e7eb';
    const fontSize = component.fontSize || 14;
    const fontFamily = component.fontFamily ? `'${component.fontFamily}', sans-serif` : 'sans-serif';
    const measured = measureText(centeredText || 'Enter text...', `${fontSize}px ${fontFamily}`);
    const size = resolveComponentSize(component, state.project?.type, {
        width: measured.width + 32,
        height: measured.height + 16,
    });
    const borderStyles = borderStyle === 'underline'
        ? {
            border: 'none',
            borderBottom: `1px solid ${borderColor}`,
            borderRadius: '0px',
        }
        : {
            border: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            borderRadius: `${component.borderRadius || 8}px`,
        };

    return (
        <div
            ref={setRefs}
            className={`canvas-item text-input-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
                left: component.x,
                top: component.y,
                width: size.width,
                height: size.height,
                fontSize: `${fontSize}px`,
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
                    ...borderStyles,
                    color: component.color || '#1a1a2e',
                    alignItems: 'center',
                }}>
                    <span className="text-input-placeholder" style={{ width: '100%', textAlign, color: component.color || '#1a1a2e' }}>{centeredText}</span>
                </div>
            ) : (
                <div className="text-input-content text-input-preview" style={{
                    background: component.bgColor || '#ffffff',
                    ...borderStyles,
                    color: component.color || '#1a1a2e',
                    alignItems: 'center',
                }}>
                    <span style={{ width: '100%', textAlign, color: component.color || '#1a1a2e' }}>{displayText || centeredText}</span>
                </div>
            )}
        </div>
    );
}
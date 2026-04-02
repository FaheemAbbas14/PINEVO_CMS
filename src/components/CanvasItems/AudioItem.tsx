import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../../types';
import { useCMS } from '../../context/AppContext';
import type { CanvasComponent } from '../../types';
import './CanvasItem.css';

interface Props {
    component: CanvasComponent;
}

export default function AudioItem({ component }: Props) {
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

    // Hide audio component in preview mode and export mode
    if (state.previewMode || state.sandboxMode) {
        return null;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectComponent(component.id);
    };

    const playSound = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (component.audioUrl) {
            const audio = new Audio(component.audioUrl);
            audio.play().catch(err => console.error('Error playing audio:', err));
        }
    };

    return (
        <div
            ref={setRefs}
            className={`canvas-item audio-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
            style={{
                left: component.x,
                top: component.y,
                width: component.width || 200,
                height: component.height || 60,
            }}
            onClick={handleClick}
        >
            <div className="audio-content">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                </svg>
                <span className="audio-label">Audio</span>
            </div>
            <button
                className="audio-play-btn"
                onClick={playSound}
                title="Play sound"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            </button>
        </div>
    );
}

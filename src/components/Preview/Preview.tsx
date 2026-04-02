import { useCMS } from '../../context/AppContext';
import { PIN_EVO_CANVAS_WIDTH, PIN_EVO_CANVAS_HEIGHT, FLEX_CANVAS_WIDTH, FLEX_CANVAS_HEIGHT } from '../../types';
import './Preview.css';

export default function Preview() {
  const { activeScreen, selectComponent, state } = useCMS();
  const scale = 0.5; // Scale preview to 50%

  // Get canvas dimensions based on project type
  const isFlex = state.project?.type === 'flex';
  const canvasWidth = isFlex ? FLEX_CANVAS_WIDTH : PIN_EVO_CANVAS_WIDTH;
  const canvasHeight = isFlex ? FLEX_CANVAS_HEIGHT : PIN_EVO_CANVAS_HEIGHT;

  // Handle click on preview component - select it and open properties
  const handleComponentClick = (componentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selectComponent(componentId);
  };

  // Get target screen name for button navigation display
  const getTargetScreenName = (goToScreenId: string) => {
    const screen = state.screens.find(s => s.id === goToScreenId);
    return screen?.name || goToScreenId;
  };

  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3 className="preview-title">Live Preview</h3>
      </div>
      <div className="preview-frame">
        <div
          className="preview-content"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundColor: '#ffffff'
          }}
        >
          {activeScreen?.components.map((component) => (
            <div
              key={component.id}
              className="preview-item"
              style={{
                position: 'absolute',
                left: component.x,
                top: component.y,
                width: component.width,
                height: component.height,
                color: component.color,
                fontSize: `${component.fontSize}px`,
                fontWeight: component.fontWeight || 'normal',
                backgroundColor: component.bgColor,
                borderRadius: component.borderRadius ? `${component.borderRadius}px` : '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={(e) => handleComponentClick(component.id, e)}
            >
              {component.type === 'image' && component.imageUrl ? (
                <img src={component.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : component.type === 'image' ? (
                <div style={{ background: '#eee', width: '100%', height: '100%' }} />
              ) : component.type === 'api' ? (
                <div style={{ background: '#f0f9ff', color: '#0369a1', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }}>API</div>
              ) : component.type === 'command' ? (
                <div style={{ background: '#1e293b', color: '#fbbf24', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }}>CMD</div>
              ) : component.type === 'audio' ? (
                <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 'bold', color: '#92400e' }}>🔊 Audio</div>
              ) : component.type === 'button' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                  <span>{component.text}</span>
                  {/* Show interaction indicators */}
                  {(component.goToScreen || component.function !== 'none' || component.command || component.buttonSound) && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2px' }}>
                      {component.goToScreen && (
                        <span style={{ fontSize: '5px', padding: '1px 3px', background: '#dbeafe', color: '#1e40af', borderRadius: '2px' }}>
                          → {getTargetScreenName(component.goToScreen)}
                        </span>
                      )}
                      {component.function && component.function !== 'none' && (
                        <span style={{ fontSize: '5px', padding: '1px 3px', background: '#dcfce7', color: '#166534', borderRadius: '2px' }}>
                          ⚡ {component.function}
                        </span>
                      )}
                      {component.command && (
                        <span style={{ fontSize: '5px', padding: '1px 3px', background: '#fef3c7', color: '#92400e', borderRadius: '2px' }}>
                          ⌘ {component.command.substring(0, 8)}
                        </span>
                      )}
                      {component.buttonSound && (
                        <span style={{ fontSize: '5px', padding: '1px 3px', background: '#fce7f3', color: '#be185d', borderRadius: '2px' }}>
                          🔊 Sound
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                component.text
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

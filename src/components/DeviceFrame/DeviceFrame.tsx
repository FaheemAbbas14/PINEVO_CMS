import React, { useState } from 'react';
import './DeviceFrame.css';
import { useCMS } from '../../context/AppContext';
import { INPUT_ACTIONS } from '../../config/actions';

interface Props {
  children: React.ReactNode;
}

export type HardwareButtonId = 'power' | 'vol_up' | 'vol_down' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | 'star' | 'hash' | 'call' | 'end' | 'left_1' | 'left_2' | 'right_1' | 'right_2' | 'cancel' | 'enter' | 'backspace' | 'speaker' | 'menu';

const FLEX_KEYPAD_BUTTONS: { id: HardwareButtonId, label?: string, icon?: React.ReactNode }[] = [
  { id: '1', label: '1' },
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: 'cancel', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> },
  { id: '4', label: '4' },
  { id: '5', label: '5' },
  { id: '6', label: '6' },
  { id: 'enter', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> },
  { id: '7', label: '7' },
  { id: '8', label: '8' },
  { id: '9', label: '9' },
  { id: 'backspace', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg> },
  { id: 'power', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg> },
  { id: '0', label: '0' },
  { id: 'speaker', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path></svg> },
  { id: 'menu', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg> },
];

export default function DeviceFrame({ children }: Props) {
  const { state, setActiveScreen, updateScreenHardwareButton } = useCMS();
  const isFlex = state.project?.type === 'flex';
  const [selectedHardwareButton, setSelectedHardwareButton] = useState<HardwareButtonId | null>(null);

  // Get current screen's hardware button configurations
  const currentScreen = state.screens.find(s => s.id === state.activeScreenId);
  const hardwareButtons = currentScreen?.hardwareButtons || {};

  const handleHardwareButtonClick = (buttonId: HardwareButtonId) => {
    // In preview mode, trigger the configured action instead of selecting the button
    if (state.previewMode) {
      const btnConfig = hardwareButtons[buttonId];

      if (btnConfig?.goToScreen) {
        // Navigate to screen
        setActiveScreen(btnConfig.goToScreen);
      } else if (btnConfig?.inputAction) {
        // Send input to text input components
        let inputValue = '';
        if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(buttonId)) {
          inputValue = buttonId;
        } else if (buttonId === 'star') {
          inputValue = '*';
        } else if (buttonId === 'hash') {
          inputValue = '#';
        }

        if (inputValue) {
          const event = new CustomEvent('hardwareButtonInput', {
            detail: { action: 'append', value: inputValue }
          });
          window.dispatchEvent(event);
        } else if (buttonId === 'backspace') {
          const event = new CustomEvent('hardwareButtonInput', {
            detail: { action: 'backspace' }
          });
          window.dispatchEvent(event);
        } else if (buttonId === 'enter') {
          const event = new CustomEvent('hardwareButtonInput', {
            detail: { action: 'clear' }
          });
          window.dispatchEvent(event);
        }
      }
      return;
    }

    if (selectedHardwareButton === buttonId) {
      setSelectedHardwareButton(null);
    } else {
      setSelectedHardwareButton(buttonId);
    }
  };

  const handleHardwareButtonChange = (buttonId: HardwareButtonId, field: 'goToScreen' | 'inputAction', value: string) => {
    if (!currentScreen) return;
    const currentConfig = hardwareButtons[buttonId] || {};

    const nextConfig = {
      ...currentConfig,
      [field]: value || undefined,
    };

    if (field === 'goToScreen' && value) {
      nextConfig.inputAction = undefined;
    }

    if (field === 'inputAction' && value) {
      nextConfig.goToScreen = undefined;
    }

    updateScreenHardwareButton(currentScreen.id, buttonId, {
      ...nextConfig,
    });
  };

  const renderConfigBadge = (buttonId: HardwareButtonId) => {
    const config = hardwareButtons[buttonId];
    if (config?.goToScreen || config?.inputAction || config?.command) {
      return <div className="button-interaction-badge">⚡</div>;
    }
    return null;
  };

  return (
    <div className="device-frame-container">
      {isFlex ? (
        <div className="flex-device-skin-wrapper">
          <div className="flex-device-body">

            <div className="flex-side-buttons-left">
              <div className="flex-side-button-track">
                <button className={`flex-side-button ${selectedHardwareButton === 'left_1' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('left_1')}>
                  {renderConfigBadge('left_1')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
              <div className="flex-side-button-track">
                <button className={`flex-side-button ${selectedHardwareButton === 'left_2' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('left_2')}>
                  {renderConfigBadge('left_2')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>

            <div className="flex-device-screen-bezel">
              <div className="flex-screen-overlay">
                {children}
              </div>
            </div>

            <div className="flex-side-buttons-right">
              <div className="flex-side-button-track">
                <button className={`flex-side-button ${selectedHardwareButton === 'right_1' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('right_1')}>
                  {renderConfigBadge('right_1')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
              </div>
              <div className="flex-side-button-track">
                <button className={`flex-side-button ${selectedHardwareButton === 'right_2' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('right_2')}>
                  {renderConfigBadge('right_2')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
              </div>
            </div>

            <div className="flex-device-bottom">
              <div className="flex-keypad">
                {FLEX_KEYPAD_BUTTONS.map(btn => (
                  <button
                    key={btn.id}
                    className={`flex-keypad-button ${selectedHardwareButton === btn.id ? 'selected' : ''}`}
                    onClick={() => handleHardwareButtonClick(btn.id)}
                  >
                    {renderConfigBadge(btn.id)}
                    {btn.icon || btn.label}
                  </button>
                ))}
              </div>

              <div className="flex-sensors">
                <div className="flex-sensor-icon nfc">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 4c3.314 0 6 2.686 6 6 0 3.314-2.686 6-6 6"></path>
                    <path d="M10 2c4.418 0 8 3.582 8 8 0 4.418-3.582 8-8 8"></path>
                    <path d="M14 0c5.523 0 10 4.477 10 10 0 5.523-4.477 10-10 10"></path>
                    <rect x="2" y="14" width="8" height="6" rx="1"></rect>
                  </svg>
                </div>
                <div className="flex-sensor-icon scanner">
                  <svg width="32" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  </svg>
                  <div className="scanner-dot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pin-evo-device-skin-wrapper">
          <div className="pin-evo-device-body">

            <div className="pin-evo-device-screen-bezel">
              <div className="pin-evo-screen-overlay">
                {children}
              </div>
            </div>

            <div className="pin-evo-controls-section">
              <div className="pin-evo-keypad">
                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '1' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('1')}>{renderConfigBadge('1')}1</button>
                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '2' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('2')}>{renderConfigBadge('2')}2</button>
                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '3' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('3')}>{renderConfigBadge('3')}3</button>
                <button className={`pin-evo-keypad-button pin-evo-action-btn ${selectedHardwareButton === 'cancel' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('cancel')}>
                  {renderConfigBadge('cancel')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '4' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('4')}>{renderConfigBadge('4')}4</button>
                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '5' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('5')}>{renderConfigBadge('5')}5</button>
                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '6' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('6')}>{renderConfigBadge('6')}6</button>
                <button className={`pin-evo-keypad-button pin-evo-action-btn ${selectedHardwareButton === 'backspace' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('backspace')}>
                  {renderConfigBadge('backspace')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>

                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '7' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('7')}>{renderConfigBadge('7')}7</button>
                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '8' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('8')}>{renderConfigBadge('8')}8</button>
                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '9' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('9')}>{renderConfigBadge('9')}9</button>
                <button className={`pin-evo-keypad-button pin-evo-action-btn ${selectedHardwareButton === 'enter' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('enter')}>
                  {renderConfigBadge('enter')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>

                <button className={`pin-evo-keypad-button ${selectedHardwareButton === 'menu' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('menu')}>
                  {renderConfigBadge('menu')}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                </button>
                <button className={`pin-evo-keypad-button ${selectedHardwareButton === '0' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('0')}>{renderConfigBadge('0')}0</button>

                <div className="pin-evo-vol-rocker-wrapper">
                  <button className={`pin-evo-vol-btn vol-down ${selectedHardwareButton === 'vol_down' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('vol_down')}>
                    {renderConfigBadge('vol_down')}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <div className="pin-evo-speaker-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  </div>
                  <button className={`pin-evo-vol-btn vol-up ${selectedHardwareButton === 'vol_up' ? 'selected' : ''}`} onClick={() => handleHardwareButtonClick('vol_up')}>
                    {renderConfigBadge('vol_up')}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </div>
              </div>

              <div className="pin-evo-scanner-block">
                <div className="pin-evo-scanner-window">
                  <div className="pin-evo-scanner-laser"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedHardwareButton && !state.previewMode && (
        <div className="hardware-config-panel" style={{
          position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
          background: 'white', padding: '12px 16px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, display: 'flex', gap: '12px', alignItems: 'center'
        }}>
          <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'capitalize' }}>
            {selectedHardwareButton.replace('_', ' ')} Button
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Choose one interaction:</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={hardwareButtons[selectedHardwareButton]?.goToScreen || ''}
              onChange={(e) => handleHardwareButtonChange(selectedHardwareButton, 'goToScreen', e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }}
            >
              <option value="">Navigate to screen...</option>
              {state.screens.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={hardwareButtons[selectedHardwareButton]?.inputAction || ''}
              onChange={(e) => handleHardwareButtonChange(selectedHardwareButton, 'inputAction', e.target.value)}
              style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '11px' }}
            >
              <option value="">Select action...</option>
              {INPUT_ACTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="device-info">
        {isFlex ? (
          <>
            <h3>Flex Device Active</h3>
            <p>Click hardware buttons to configure interactions</p>
          </>
        ) : (
          <>
            <h3>PIN Evo Active</h3>
            <p>Click hardware buttons to configure interactions</p>
          </>
        )}
      </div>
    </div>
  );
}

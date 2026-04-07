import { useState, useEffect } from 'react';
// import { LanguageSection } from './LanguageSection';
import { locales as initialLocales } from '../../locales';
import type { Locale, Translations } from '../../locales/types';
import { useCMS } from '../../context/AppContext';
import './RightSidebar.css';

export default function RightSidebar() {
  const { state, selectedComponent, updateComponent, deleteComponent, updateSandboxConfig, resetSandboxConfig } = useCMS();
  const [localValues, setLocalValues] = useState(selectedComponent);
  const [showToast, setShowToast] = useState(false);

  // Language management state
  // const [languages, setLanguages] = useState<{ [key: string]: Translations }>(initialLocales);
  // const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    setLocalValues(selectedComponent);
  }, [selectedComponent]);

  // Show Sandbox Configuration when sandbox mode is enabled and no component is selected
  // Hide RightSidebar in preview mode
  if (state.previewMode) {
    return null;
  }

  if (!selectedComponent || !localValues) {
    if (state.sandboxMode) {
      return (
        <aside className="right-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Sandbox Config</h2>
            <span className="sandbox-badge">Sandbox</span>
          </div>
          <div className="properties-scroll">
            <section className="property-group sandbox-section">
              <h3 className="group-title">Sandbox Configuration</h3>
              <div className="property-field">
                <label>Carrier</label>
                <input
                  type="text"
                  value={state.sandboxConfig.carrier}
                  onChange={(e) => updateSandboxConfig({ carrier: e.target.value })}
                  placeholder="Enter carrier name"
                />
              </div>
              <div className="property-field">
                <label>Service Point</label>
                <input
                  type="text"
                  value={state.sandboxConfig.servicePoint}
                  onChange={(e) => updateSandboxConfig({ servicePoint: e.target.value })}
                  placeholder="Enter service point"
                />
              </div>

              <h3 className="group-title" style={{ marginTop: '16px' }}>Create Booking</h3>
              <div className="property-field">
                <label>Shipment ID</label>
                <input
                  type="text"
                  value={state.sandboxConfig.shipmentId}
                  onChange={(e) => updateSandboxConfig({ shipmentId: e.target.value })}
                  placeholder="Enter shipment ID"
                />
              </div>
              <div className="property-field">
                <label>Shipment Type</label>
                <select
                  value={state.sandboxConfig.shipmentType}
                  onChange={(e) => updateSandboxConfig({ shipmentType: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="first_mile">First mile</option>
                  <option value="last_mile">Last mile</option>
                </select>
              </div>
              <div className="property-field">
                <label>Allocation Type</label>
                <select
                  value={state.sandboxConfig.allocationType}
                  onChange={(e) => updateSandboxConfig({ allocationType: e.target.value })}
                >
                  <option value="">Select allocation</option>
                  <option value="soft">Soft</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="property-field">
                <label>Expiry</label>
                <input
                  type="datetime-local"
                  value={state.sandboxConfig.expiry}
                  onChange={(e) => updateSandboxConfig({ expiry: e.target.value })}
                />
              </div>
              <button
                className="btn-create-booking"
                onClick={() => {
                  resetSandboxConfig();
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create
              </button>
            </section>
            {/* <LanguageSection
              locale={locale}
              setLocale={setLocale}
              languages={languages}
              setLanguages={setLanguages}
            /> */}
          </div>

          {showToast && (
            <div className="toast-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Shipment has been created
            </div>
          )}
        </aside>
      );
    }

    return (
      <aside className="right-sidebar empty">
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <p>Select a component to edit properties</p>
        </div>
        {/* <LanguageSection
          locale={locale}
          setLocale={setLocale}
          languages={languages}
          setLanguages={setLanguages}
        /> */}
      </aside>
    );
  }

  const handleChange = (key: string, value: any) => {
    const updated = { ...localValues, [key]: value };
    setLocalValues(updated);
    updateComponent(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleChange('imageUrl', event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="right-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Properties</h2>
        <span className="component-type-tag">{selectedComponent.type.toUpperCase()}</span>
      </div>

      <div className="properties-scroll">
        <section className="property-group">
          <h3 className="group-title">Layout</h3>
          <div className="property-grid">
            <div className="property-field">
              <label>X</label>
              <input
                type="number"
                value={localValues.x}
                onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>Y</label>
              <input
                type="number"
                value={localValues.y}
                onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>Width</label>
              <input
                type="number"
                value={localValues.width}
                onChange={(e) => handleChange('width', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="property-field">
              <label>Height</label>
              <input
                type="number"
                value={localValues.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </section>

        {(selectedComponent.type === 'text' || selectedComponent.type === 'text_input' || selectedComponent.type === 'button') && (
          <section className="property-group">
            <h3 className="group-title">Content & Style</h3>
            <div className="property-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ minWidth: 110, marginRight: 8 }}>Label / Input Text</label>
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={localValues.text || ''}
                  onChange={(e) => handleChange('text', e.target.value)}
                  style={{ flex: 1 }}
                  placeholder="Enter label or input text..."
                />
              </div>
            </div>
            {selectedComponent.type === 'text_input' && (
              <div className="property-field">
                <label>Placeholder</label>
                <input
                  type="text"
                  value={localValues.placeholder || ''}
                  placeholder="Enter placeholder text..."
                  onChange={(e) => handleChange('placeholder', e.target.value)}
                />
              </div>
            )}
            <div className="property-grid">
              <div className="property-field">
                <label>Font Size</label>
                <input
                  type="number"
                  value={localValues.fontSize || 14}
                  onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || 12)}
                />
              </div>
              <div className="property-field">
                <label>Text Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={localValues.color || '#000000'}
                    onChange={(e) => handleChange('color', e.target.value)}
                  />
                </div>
              </div>
            </div>
            {selectedComponent.type === 'text_input' && (
              <div className="property-grid">
                <div className="property-field">
                  <label>Background</label>
                  <div className="color-picker-wrapper">
                    <input
                      type="color"
                      value={localValues.bgColor || '#ffffff'}
                      onChange={(e) => handleChange('bgColor', e.target.value)}
                    />
                  </div>
                </div>
                <div className="property-field">
                  <label>Border Radius</label>
                  <input
                    type="number"
                    value={localValues.borderRadius || 8}
                    onChange={(e) => handleChange('borderRadius', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {selectedComponent.type === 'button' && (
          <section className="property-group">
            <h3 className="group-title">Interaction</h3>
            <div className="property-field">
              <label>Go to Screen</label>
              <select
                value={localValues.goToScreen || ''}
                onChange={(e) => handleChange('goToScreen', e.target.value)}
              >
                <option value="">None</option>
                {state.screens.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="property-field">
              <label>Function</label>
              <select
                value={localValues.function || 'none'}
                onChange={(e) => handleChange('function', e.target.value)}
              >
                <option value="none">None</option>
                <option value="connect">Connect</option>
                <option value="open_door">Open Door</option>
                <option value="initiate_multi_connect">Initiate Multi-Connect</option>
                <option value="turn_on_modem">Turn-on Modem</option>
                <option value="dial_up_modem">Dial-up Modem</option>
                <option value="goto_screen">Goto Screen</option>
                <option value="play_audio">Play Audio</option>
                <option value="api_call">API Call</option>
                <option value="change_theme">Change Theme</option>
                <option value="change_language">Change Language</option>
                <option value="report_error">Report Error</option>
                <option value="retry">Retry</option>
                <option value="reopen">Re-open</option>
                <option value="cancel">Cancel</option>
              </select>
            </div>

            {localValues.function === 'play_audio' && (
              <div className="property-field">
                <label>Sound URL</label>
                <input
                  type="text"
                  value={localValues.buttonSound || ''}
                  placeholder="https://... or select file"
                  onChange={(e) => handleChange('buttonSound', e.target.value)}
                />
                <label className="file-upload-btn" style={{ marginTop: '8px' }}>
                  <span>Upload Sound</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          handleChange('buttonSound', event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            )}

            {localValues.function === 'api_call' && (
              <div className="property-field">
                <label>API URL Trigger</label>
                <input
                  type="text"
                  value={localValues.apiCall || ''}
                  placeholder="https://..."
                  onChange={(e) => handleChange('apiCall', e.target.value)}
                />
              </div>
            )}

            <div className="property-field">
              <label>Run Command</label>
              <input
                type="text"
                value={localValues.command || ''}
                placeholder="e.g. reboot"
                onChange={(e) => handleChange('command', e.target.value)}
              />
            </div>

            <h3 className="group-title" style={{ marginTop: '16px' }}>Appearance</h3>
            <div className="property-grid">
              <div className="property-field">
                <label>Background</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={localValues.bgColor || '#4f46e5'}
                    onChange={(e) => handleChange('bgColor', e.target.value)}
                  />
                </div>
              </div>
              <div className="property-field">
                <label>Radius</label>
                <input
                  type="number"
                  value={localValues.borderRadius || 0}
                  onChange={(e) => handleChange('borderRadius', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </section>
        )}

        {selectedComponent.type === 'image' && (
          <section className="property-group">
            <h3 className="group-title">Image</h3>
            <div className="property-field">
              <label>Image URL</label>
              <input
                type="text"
                value={localValues.imageUrl || ''}
                placeholder="https://..."
                onChange={(e) => handleChange('imageUrl', e.target.value)}
              />
            </div>
            <div className="property-field">
              <label>Or Upload</label>
              <label className="file-upload-btn">
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </section>
        )}

        {selectedComponent.type === 'audio' && (
          <section className="property-group">
            <h3 className="group-title">Audio</h3>
            <div className="property-field">
              <label>Audio URL</label>
              <input
                type="text"
                value={localValues.audioUrl || ''}
                placeholder="https://... or select file"
                onChange={(e) => handleChange('audioUrl', e.target.value)}
              />
            </div>
            <div className="property-field">
              <label>Or Upload</label>
              <label className="file-upload-btn">
                <span>Upload Audio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        handleChange('audioUrl', event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            {localValues.audioUrl && (
              <div className="property-field">
                <button
                  className="btn-play-preview"
                  onClick={() => {
                    const audio = new Audio(localValues.audioUrl);
                    audio.play().catch(err => console.error('Error playing audio:', err));
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Play Preview
                </button>
              </div>
            )}
          </section>
        )}

        {selectedComponent.type === 'api' && (
          <section className="property-group">
            <h3 className="group-title">API Configuration</h3>
            <div className="property-field">
              <label>API URL</label>
              <input
                type="text"
                value={localValues.apiUrl || ''}
                placeholder="https://..."
                onChange={(e) => handleChange('apiUrl', e.target.value)}
              />
            </div>
            <div className="property-field">
              <label>HTTP Method</label>
              <select
                value={localValues.httpMethod || 'GET'}
                onChange={(e) => handleChange('httpMethod', e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="property-field">
              <label>Headers (JSON)</label>
              <textarea
                placeholder='{"Authorization": "Bearer ..."}'
                value={localValues.headers || ''}
                onChange={(e) => handleChange('headers', e.target.value)}
                rows={3}
              />
            </div>
            <div className="property-field">
              <label>Request Body (JSON)</label>
              <textarea
                placeholder='{"key": "value"}'
                value={localValues.requestBody || ''}
                onChange={(e) => handleChange('requestBody', e.target.value)}
                rows={4}
              />
            </div>
          </section>
        )}

        {selectedComponent.type === 'command' && (
          <section className="property-group">
            <h3 className="group-title">Command Configuration</h3>
            <div className="property-field">
              <label>Custom Command</label>
              <textarea
                placeholder="Enter command here..."
                value={localValues.command || ''}
                onChange={(e) => handleChange('command', e.target.value)}
                rows={4}
              />
            </div>
          </section>
        )}

        <div className="actions-section">
          <button className="btn-delete-comp" onClick={() => deleteComponent(selectedComponent.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            Delete Component
          </button>
        </div>
      </div>
    </aside>
  );
}

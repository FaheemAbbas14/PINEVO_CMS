import { useState, useEffect } from 'react';
import { useLanguage } from '../../App';
import Modal from 'react-modal';

// Type for language translations
type Translations = { [key: string]: string };

// Add index signature to CanvasComponent type if not already present
type CanvasComponent = {
  [key: string]: any;
};
// Configuration for dynamic fields per component type
const FIELD_CONFIG = {
  text: [
    { key: 'labelKey', label: 'Text', type: 'langKey' },
    { key: 'fontSize', label: 'Font Size', type: 'number', default: 14 },
    { key: 'color', label: 'Text Color', type: 'color', default: '#000000' },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'bold', label: 'Bold' }] },
  ],
  text_input: [
    { key: 'labelKey', label: 'Label', type: 'langKey' },
    { key: 'placeholderKey', label: 'Placeholder', type: 'langKey' },
    { key: 'fontSize', label: 'Font Size', type: 'number', default: 14 },
    { key: 'color', label: 'Text Color', type: 'color', default: '#000000' },
    { key: 'bgColor', label: 'Background', type: 'color', default: '#ffffff' },
    { key: 'borderRadius', label: 'Border Radius', type: 'number', default: 8 },
  ],
  button: [
    { key: 'labelKey', label: 'Text', type: 'langKey' },
    { key: 'goToScreen', label: 'Go to Screen', type: 'screenSelect' },
    { key: 'function', label: 'Function', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'connect', label: 'Connect' },
      { value: 'open_door', label: 'Open Door' },
      { value: 'initiate_multi_connect', label: 'Initiate Multi-Connect' },
      { value: 'turn_on_modem', label: 'Turn-on Modem' },
      { value: 'dial_up_modem', label: 'Dial-up Modem' },
      { value: 'goto_screen', label: 'Goto Screen' },
      { value: 'play_audio', label: 'Play Audio' },
      { value: 'api_call', label: 'API Call' },
      { value: 'change_theme', label: 'Change Theme' },
      { value: 'change_language', label: 'Change Language' },
      { value: 'report_error', label: 'Report Error' },
      { value: 'retry', label: 'Retry' },
      { value: 'reopen', label: 'Re-open' },
      { value: 'cancel', label: 'Cancel' },
    ] },
    { key: 'buttonSound', label: 'Sound URL', type: 'text', dependsOn: { key: 'function', value: 'play_audio' } },
    { key: 'apiCall', label: 'API URL Trigger', type: 'text', dependsOn: { key: 'function', value: 'api_call' } },
    { key: 'command', label: 'Run Command', type: 'text' },
    { key: 'fontSize', label: 'Font Size', type: 'number', default: 14 },
    { key: 'color', label: 'Text Color', type: 'color', default: '#000000' },
    { key: 'bgColor', label: 'Background', type: 'color', default: '#4f46e5' },
    { key: 'borderRadius', label: 'Radius', type: 'number', default: 0 },
  ],
  image: [
    { key: 'imageUrl', label: 'Image URL', type: 'text' },
  ],
  audio: [
    { key: 'audioUrl', label: 'Audio URL', type: 'text' },
  ],
  api: [
    { key: 'apiUrl', label: 'API URL', type: 'text' },
    { key: 'httpMethod', label: 'HTTP Method', type: 'select', options: [
      { value: 'GET', label: 'GET' },
      { value: 'POST', label: 'POST' },
      { value: 'PUT', label: 'PUT' },
      { value: 'DELETE', label: 'DELETE' },
    ] },
    { key: 'headers', label: 'Headers (JSON)', type: 'textarea' },
    { key: 'requestBody', label: 'Request Body (JSON)', type: 'textarea' },
  ],
  command: [
    { key: 'command', label: 'Custom Command', type: 'textarea' },
  ],
};
// import { LanguageSection } from './LanguageSection';
// Helper to get all language keys
function getAllLangKeys(locales: { [key: string]: Translations }): string[] {
  const keys = new Set<string>();
  Object.values(locales).forEach((lang: Translations) => Object.keys(lang).forEach(k => keys.add(k)));
  return Array.from(keys);
}
// Modal styles for new key popup
const modalStyles = {
  overlay: { zIndex: 1000, background: 'rgba(0,0,0,0.2)' },
  content: {
    maxWidth: 400,
    margin: 'auto',
    borderRadius: 8,
    padding: 24,
    width: 'auto',
    height: 'auto',
    maxHeight: '40vh',
    overflowY: 'visible' as React.CSSProperties['overflowY'],
    display: 'inline-block',
  },
};
import { locales as initialLocales } from '../../locales';

// Add type-safe accessor for initialLocales
const getLocaleByKey = (lang: string): Translations => {
  if (lang in initialLocales) {
    // @ts-expect-error: Indexing by string is safe for known keys
    return initialLocales[lang];
  }
  return {};
};
// Do not re-import Translations type, already defined above
import { useCMS } from '../../context/AppContext';
import './RightSidebar.css';
import { saveLanguageToProject, loadLanguageFromProject } from '../../locales/persistLanguage';

export default function RightSidebar() {
  const { locale } = useLanguage();
  const { state, selectedComponent, updateComponent, deleteComponent, updateSandboxConfig, resetSandboxConfig } = useCMS();
  const [localValues, setLocalValues] = useState<CanvasComponent>(selectedComponent || {
    id: '', type: '', x: 0, y: 0, width: 0, height: 0
  });
  const [showToast, setShowToast] = useState(false);

  // Language management state

  // Load languages from localStorage if available, else fallback to initialLocales
  const getPersistedLocales = () => {
    const langs: { [key: string]: Translations } = {};
    for (const lang of Object.keys(initialLocales)) {
      const persisted = loadLanguageFromProject(lang);
      langs[lang] = Object.keys(persisted).length > 0 ? persisted : getLocaleByKey(lang);
    }
    return langs;
  };

  const [languages, setLanguages] = useState<{ [key: string]: Translations }>(getPersistedLocales());
  const [showLangModal, setShowLangModal] = useState(false);
  const [newLangKey, setNewLangKey] = useState('');
  const [newLangValues, setNewLangValues] = useState<{ [lang: string]: string }>({});
  const [langTargetField, setLangTargetField] = useState<string>('');
  const [allLangKeys, setAllLangKeys] = useState<string[]>(getAllLangKeys(getPersistedLocales()));

  useEffect(() => {
    if (selectedComponent) setLocalValues(selectedComponent);
  }, [selectedComponent]);


  // Update allLangKeys from persisted storage when languages change
  useEffect(() => {
    // Always reload from persisted storage to ensure dropdown is up to date
    const persistedLocales = getPersistedLocales();
    setAllLangKeys(getAllLangKeys(persistedLocales));
  }, [languages]);

  // When language changes, update localValues to force re-render of language key dropdowns and preview text
  useEffect(() => {
    if (selectedComponent) setLocalValues(selectedComponent);
  }, [locale, selectedComponent]);

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
                <label htmlFor="carrier-input">Carrier</label>
                <input
                  id="carrier-input"
                  type="text"
                  value={state.sandboxConfig.carrier}
                  onChange={(e) => updateSandboxConfig({ carrier: e.target.value })}
                  placeholder="Enter carrier name"
                />
              </div>
              <div className="property-field">
                <label htmlFor="service-point-input">Service Point</label>
                <input
                  id="service-point-input"
                  type="text"
                  value={state.sandboxConfig.servicePoint}
                  onChange={(e) => updateSandboxConfig({ servicePoint: e.target.value })}
                  placeholder="Enter service point"
                />
              </div>

              <h3 className="group-title" style={{ marginTop: '16px' }}>Create Booking</h3>
              <div className="property-field">
                <label htmlFor="shipment-id-input">Shipment ID</label>
                <input
                  id="shipment-id-input"
                  type="text"
                  value={state.sandboxConfig.shipmentId}
                  onChange={(e) => updateSandboxConfig({ shipmentId: e.target.value })}
                  placeholder="Enter shipment ID"
                />
              </div>
              <div className="property-field">
                <label htmlFor="shipment-type-input">Shipment Type</label>
                <select
                  id="shipment-type-input"
                  value={state.sandboxConfig.shipmentType}
                  onChange={(e) => updateSandboxConfig({ shipmentType: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="first_mile">First mile</option>
                  <option value="last_mile">Last mile</option>
                </select>
              </div>
              <div className="property-field">
                <label htmlFor="allocation-type-input">Allocation Type</label>
                <select
                  id="allocation-type-input"
                  value={state.sandboxConfig.allocationType}
                  onChange={(e) => updateSandboxConfig({ allocationType: e.target.value })}
                >
                  <option value="">Select allocation</option>
                  <option value="soft">Soft</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="property-field">
                <label htmlFor="expiry-input">Expiry</label>
                <input
                  id="expiry-input"
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
    if (!localValues) return;
    let updated = { ...localValues, [key]: value };
    // If a language key is being set, also set labelMode to 'lang'
    if (key === 'labelKey') {
      updated.labelMode = 'lang';
    }
    setLocalValues(updated);
    // Only update if required fields exist
    if (
      typeof updated.id === 'string' && updated.id &&
      typeof updated.type === 'string' && updated.type &&
      typeof updated.x === 'number' &&
      typeof updated.y === 'number' &&
      typeof updated.width === 'number' &&
      typeof updated.height === 'number'
    ) {
      // Type assertion is safe here due to the above checks
      updateComponent(updated as import('../../types').CanvasComponent);
    }
  };

  // Open modal to add new language key
  // openLangModal is only used inline, so remove unused assignment warning

  // Save new language key to all languages and persist to language files
  const saveLangModal = async (): Promise<void> => {
    if (!newLangKey.trim() || allLangKeys.includes(newLangKey)) return;
    // Require all language values to be filled
    const allFilled = Object.keys(languages).every(lang => (newLangValues[lang] || '').trim() !== '');
    if (!allFilled) return;
    const updatedLangs = { ...languages };
    Object.keys(updatedLangs).forEach(lang => {
      updatedLangs[lang][newLangKey] = newLangValues[lang];
      saveLanguageToProject(lang, updatedLangs[lang]); // Persist each language
    });
    setLanguages(updatedLangs);
    setAllLangKeys(getAllLangKeys(updatedLangs));
    handleChange(langTargetField, newLangKey);
    setShowLangModal(false);
    try {
      await (globalThis as any).__writeLangFile && (globalThis as any).__writeLangFile('en', updatedLangs['en']);
      await (globalThis as any).__writeLangFile && (globalThis as any).__writeLangFile('da', updatedLangs['da']);
      alert('Language files updated successfully!');
    } catch (e) {
      alert('Failed to update language files. Please check file permissions.');
    }
  };

  // Edit language key value and persist
  // editLangValue is only used inline, so remove unused assignment warning

  // Delete language key from all languages and persist
  // deleteLangKey is only used inline, so remove unused assignment warning
// --- Injected for language file writing ---
// This will be replaced by Copilot agent to persist language files
if (typeof globalThis !== 'undefined' && !(globalThis as any).__writeLangFile) {
  (globalThis as any).__writeLangFile = async (lang: string, data: any) => {
    // This function will be replaced by Copilot agent
    // eslint-disable-next-line no-console
    console.log('Persisting', lang, data);
  };
}

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
            {['x', 'y', 'width', 'height'].map((key) => (
              <div className="property-field" key={key}>
                <label>{key.toUpperCase()}</label>
                <input
                  type="number"
                  value={localValues[key]}
                  onChange={e => handleChange(key, Number.parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Dynamic fields based on type */}
        {FIELD_CONFIG[selectedComponent.type] && (
          <section className="property-group">
            <h3 className="group-title">Properties</h3>
            <div className="property-grid">
              {FIELD_CONFIG[selectedComponent.type].map(field => {
                // Conditional rendering based on dependencies
                if ('dependsOn' in field && field.dependsOn && localValues[field.dependsOn.key] !== field.dependsOn.value) return null;
                if (field.type === 'select' && 'options' in field && Array.isArray(field.options)) {
                  return (
                    <div className="property-field" key={field.key}>
                      <label>{field.label}</label>
                      <select
                        value={localValues[field.key] || (field.options[0]?.value ?? '')}
                        onChange={e => handleChange(field.key, e.target.value)}
                      >
                        {field.options.map((opt: any) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                if (field.type === 'langKey') {
                  return (
                    <div className="property-field" key={field.key}>
                      <label style={{ marginBottom: 2 }}>{field.label}</label>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%' }}>
                        <select
                          value={localValues[field.key] || ''}
                          onChange={e => {
                            // On dropdown open/change, reload keys from persisted storage
                            const persistedLocales = getPersistedLocales();
                            setAllLangKeys(getAllLangKeys(persistedLocales));
                            handleChange(field.key, e.target.value);
                          }}
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <option value="">Select text</option>
                          {allLangKeys.map(key => (
                            <option key={key} value={key}>{key} ({languages[locale][key] || ''})</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-add-lang"
                          style={{ padding: '2px 8px', fontSize: 18, fontWeight: 700, borderRadius: 4, border: '1px solid #e5e7eb', background: '#f3f4f6', cursor: 'pointer' }}
                          onClick={() => { setLangTargetField(field.key); setNewLangKey(''); setNewLangValues(Object.fromEntries(Object.keys(languages).map(l => [l, '']))); setShowLangModal(true); }}
                          title="Add new language string"
                        >+
                        </button>
                      </div>
                    </div>
                  );
                }
                if (field.type === 'screenSelect') {
                  return (
                    <div className="property-field" key={field.key}>
                      <label>{field.label}</label>
                      <select
                        value={localValues[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                      >
                        <option value="">None</option>
                        {state.screens.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                if (field.type === 'color') {
                  return (
                    <div className="property-field" key={field.key}>
                      <label>{field.label}</label>
                      <input
                        type="color"
                        value={localValues[field.key] || ('default' in field ? field.default : '')}
                        onChange={e => handleChange(field.key, e.target.value)}
                      />
                    </div>
                  );
                }
                if (field.type === 'number') {
                  return (
                    <div className="property-field" key={field.key}>
                      <label>{field.label}</label>
                      <input
                        type="number"
                        value={localValues[field.key] || ('default' in field ? field.default : 0)}
                        onChange={e => handleChange(field.key, Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                  );
                }
                if (field.type === 'textarea') {
                  return (
                    <div className="property-field" key={field.key}>
                      <label>{field.label}</label>
                      <textarea
                        value={localValues[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        rows={('rows' in field && typeof (field as any).rows === 'number') ? (field as any).rows : 3}
                      />
                    </div>
                  );
                }
                // Default: text input
                return (
                  <div className="property-field" key={field.key}>
                    <label>{field.label}</label>
                    <input
                      type="text"
                      value={localValues[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* File upload for image/audio */}
        {selectedComponent.type === 'image' && (
          <section className="property-group">
            <h3 className="group-title">Image Upload</h3>
            <div className="property-field">
              <label htmlFor="or-upload-input">Or Upload</label>
              <label className="file-upload-btn">
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </section>
        )}
        {selectedComponent.type === 'audio' && (
          <section className="property-group">
            <h3 className="group-title">Audio Upload</h3>
            <div className="property-field">
              <label htmlFor="or-upload-input-2">Or Upload</label>
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
      {/* Modal for adding new language key (moved outside the map for correct rendering) */}
      <Modal
        isOpen={showLangModal}
        onRequestClose={() => setShowLangModal(false)}
        style={modalStyles}
        contentLabel="Add New Language String"
        ariaHideApp={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ marginBottom: 16, color: '#000', fontWeight: 'bold' }}>Add New Key for Language</h3>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="property-field">
              <label htmlFor="new-lang-key-input">Key</label>
              <input
                id="new-lang-key-input"
                type="text"
                value={newLangKey}
                onChange={e => setNewLangKey(e.target.value)}
                placeholder="e.g. new_label_key"
                style={{ width: '100%' }}
              />
            </div>
            {Object.keys(languages).map(lang => (
              <div className="property-field" key={lang}>
                <label htmlFor={`new-lang-value-${lang}`}>{lang.toUpperCase()}</label>
                <input
                  id={`new-lang-value-${lang}`}
                  type="text"
                  value={newLangValues[lang] || ''}
                  onChange={e => setNewLangValues(v => ({ ...v, [lang]: e.target.value }))}
                  placeholder={`Value in ${lang}`}
                  style={{ width: '100%' }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              type="button"
              className="btn-save-lang"
              style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, padding: 8, fontWeight: 600, cursor: 'pointer' }}
              onClick={saveLangModal}
              disabled={
                !newLangKey.trim() ||
                allLangKeys.includes(newLangKey) ||
                Object.keys(languages).some(lang => (newLangValues[lang] || '').trim() === '')
              }
            >Save</button>
            <button
              type="button"
              className="btn-cancel-lang"
              style={{ flex: 1, background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 4, padding: 8, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setShowLangModal(false)}
            >Cancel</button>
          </div>
          {allLangKeys.includes(newLangKey) && <div style={{ color: 'red', marginTop: 8 }}>Key already exists.</div>}
        </div>
      </Modal>
    </aside>
  );
}

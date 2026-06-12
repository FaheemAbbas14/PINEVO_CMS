import React, { useState, useEffect } from 'react';

// ISO 639-1 language codes and names (short list, can be expanded)
const ISO_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'da', name: 'Danish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'tr', name: 'Turkish' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

import { saveLanguageToProject, loadLanguageFromProject, removeLanguageFromProject } from '../../locales/persistLanguage';
import type { Locale, Translations } from '../../locales/types';

interface LanguageManagerProps {
  currentLocale: Locale;
  // languages and setLanguages are now managed internally for persistence
}


export const LanguageManager: React.FC<LanguageManagerProps> = ({ currentLocale }) => {
    // Handler to start editing a translation key
    const handleEditTranslation = (key: string) => {
      setEditingKey(key);
      setEditKeyValue(key);
      setEditValueValue(languages[selectedLang]?.[key] || '');
    };
  // State for all languages, loaded from persistent storage on mount
  const [languages, setLanguages] = useState<{ [key: string]: Translations }>({});
  const [newLang, setNewLang] = useState('');
  const [langError, setLangError] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newLangValues, setNewLangValues] = useState<{ [lang: string]: string }>({});
  const [addError, setAddError] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>(currentLocale);
  // State for editing translation keys/values
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editKeyValue, setEditKeyValue] = useState('');
  const [editValueValue, setEditValueValue] = useState('');


  // Load all persisted languages from localStorage on mount
  useEffect(() => {
    const loaded: { [key: string]: Translations } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('project_lang_') && key.endsWith('.json')) {
        const lang = key.replace('project_lang_', '').replace('.json', '');
        loaded[lang] = loadLanguageFromProject(lang);
      }
    }
    setLanguages(loaded);
    // Set selectedLang to first available or default
    if (Object.keys(loaded).length > 0) {
      setSelectedLang(Object.keys(loaded)[0]);
    }
  }, []);

  // Keep newLangValues in sync with languages
  useEffect(() => {
    const obj: { [lang: string]: string } = {};
    Object.keys(languages).forEach(lang => { obj[lang] = ''; });
    setNewLangValues(obj);
  }, [languages]);


  // Delete translation key and persist to storage
  const handleDeleteTranslation = (key: string) => {
    const updated: Translations = { ...languages[selectedLang] };
    delete updated[key];
    const newLanguages = { ...languages, [selectedLang]: updated };
    setLanguages(newLanguages);
    saveLanguageToProject(selectedLang, updated);
    if (editingKey === key) setEditingKey(null);
  };

  // Save translation key edits and persist to storage
  const handleSaveTranslation = (oldKey: string) => {
    let updated: Translations = { ...languages[selectedLang] };
    // If key changed, delete old and add new
    if (editKeyValue !== oldKey) {
      delete updated[oldKey];
    }
    updated[editKeyValue] = editValueValue;
    const newLanguages = { ...languages, [selectedLang]: updated };
    setLanguages(newLanguages);
    saveLanguageToProject(selectedLang, updated);
    setEditingKey(null);
    setEditKeyValue('');
    setEditValueValue('');
  };
  // Add new language from dropdown
  const handleAddLanguage = () => {
    const lang = newLang.trim();
    if (!lang) {
      setLangError('Language code required');
      return;
    }
    if (languages[lang]) {
      setLangError('Language already exists');
      return;
    }
    // Copy all keys from any existing language, values empty
    const allKeys = Array.from(new Set(Object.values(languages).flatMap(obj => Object.keys(obj))));
    const newLangObj: Translations = {};
    allKeys.forEach(k => { newLangObj[k] = ''; });
    const updated = { ...languages, [lang]: newLangObj };
    setLanguages(updated);
    saveLanguageToProject(lang, newLangObj);
    setNewLang('');
    setLangError('');
    setSelectedLang(lang);
  };


  // (Edit language code functionality removed)

  // Delete language
  const handleDeleteLanguage = (lang: string) => {
    const updated = { ...languages };
    delete updated[lang];
    setLanguages(updated);
    removeLanguageFromProject(lang);
    if (selectedLang === lang) setSelectedLang(Object.keys(updated)[0] || '');
  };

  // (Removed: old effect that merged persisted keys)

  // Get keys for selected language
  const translationKeys = Object.keys(languages[selectedLang] || {});
  const translationValues = languages[selectedLang] || {};




  return (
    <div className="language-manager">
      {/* Section: Languages */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 8, color: '#000', fontWeight: 'bold' }}>Languages</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <select
            value={newLang}
            onChange={e => setNewLang(e.target.value)}
            style={{ padding: 4, border: '1px solid #e5e7eb', borderRadius: 4, minWidth: 120 }}
          >
            <option value="">Select language</option>
            {ISO_LANGUAGES.filter(l => !languages[l.code]).map(l => (
              <option key={l.code} value={l.code}>{l.name} ({l.code})</option>
            ))}
          </select>
          <button onClick={handleAddLanguage} style={{ padding: '6px 14px', borderRadius: 4, border: 'none', background: '#10b981', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Add Language</button>
        </div>
        {langError && <div style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{langError}</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '4px 8px', color: '#000', fontWeight: 'bold' }}>Code</th>
              <th style={{ borderBottom: '1px solid #e5e7eb', padding: '4px 8px', color: '#000', fontWeight: 'bold' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(languages).map(lang => (
              <tr key={lang}>
                <td style={{ padding: '4px 8px' }}>{lang}</td>
                <td style={{ padding: '4px 8px' }}>
                  <button onClick={() => handleDeleteLanguage(lang)} title="Delete" style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Section: Add New Key (for all languages) */}
      <section style={{ marginBottom: 28 }}>
        <h3 style={{ marginBottom: 8, color: '#000', fontWeight: 'bold' }}>Add New Key</h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (!newKey.trim()) {
              setAddError('Key is required.');
              return;
            }
            if (translationKeys.includes(newKey)) {
              setAddError('Key already added');
              return;
            }
            const allFilled = Object.keys(languages).every(lang => (newLangValues[lang] || '').trim() !== '');
            if (!allFilled) {
              setAddError('Value required for all languages.');
              return;
            }
            // Save to all languages, ensuring key-value is set for each
            const updatedLangs: { [lang: string]: Translations } = {};
            Object.keys(languages).forEach(lang => {
              updatedLangs[lang] = { ...languages[lang], [newKey]: newLangValues[lang] };
              saveLanguageToProject(lang, updatedLangs[lang]);
            });
            setLanguages(updatedLangs);
            setNewKey('');
            setNewLangValues(Object.fromEntries(Object.keys(languages).map(l => [l, ''])));
            setAddError('');
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}
        >
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <input
              type="text"
              placeholder="Key"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              style={{ flex: 1, padding: 4, border: '1px solid #e5e7eb', borderRadius: 4 }}
            />
            <button
              type="submit"
              style={{ padding: '6px 14px', borderRadius: 4, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 500, cursor: 'pointer' }}
              disabled={
                !newKey.trim() ||
                translationKeys.includes(newKey) ||
                Object.keys(languages).some(lang => (newLangValues[lang] || '').trim() === '')
              }
            >Add</button>
          </div>
          {Object.keys(languages).map(lang => (
            <div key={lang} style={{ width: '100%', display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ minWidth: 40 }}>{lang.toUpperCase()}:</label>
              <input
                type="text"
                placeholder={`Value in ${lang}`}
                value={newLangValues[lang] || ''}
                onChange={e => setNewLangValues(v => ({ ...v, [lang]: e.target.value }))}
                style={{ flex: 2, padding: 4, border: '1px solid #e5e7eb', borderRadius: 4 }}
              />
            </div>
          ))}
          {addError && <span style={{ color: 'red', fontSize: 12 }}>{addError}</span>}
        </form>
      </section>

      {/* Section: Translation Keys for selected language */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <h3 style={{ margin: 0, color: '#000', fontWeight: 'bold' }}>Translation Keys</h3>
          <select
            id="language-select"
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
            style={{ marginLeft: 12, padding: 4, border: '1px solid #e5e7eb', borderRadius: 4 }}
          >
            {Object.keys(languages).map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        {translationKeys.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>No keys in this language yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '4px 8px', color: '#000', fontWeight: 'bold' }}>Key</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '4px 8px', color: '#000', fontWeight: 'bold' }}>Value</th>
                <th style={{ borderBottom: '1px solid #e5e7eb', padding: '4px 8px', color: '#000', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {translationKeys.map((key) => (
                <tr key={key}>
                  {editingKey === key ? (
                    <>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          value={editKeyValue}
                          onChange={e => setEditKeyValue(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          value={editValueValue}
                          onChange={e => setEditValueValue(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                          <button onClick={() => handleSaveTranslation(key)} style={{ marginRight: 0 }}>Save</button>
                          <button onClick={() => setEditingKey(null)}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>{key}</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>{translationValues[key]}</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                          <button onClick={() => handleEditTranslation(key)} title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDeleteTranslation(key)} title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

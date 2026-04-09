import React, { useState } from 'react';
import en from '../../locales/en.json';
import da from '../../locales/da.json';
import { saveLanguageToProject, loadLanguageFromProject } from '../../locales/persistLanguage';
import type { Locale, Translations } from '../../locales/types';

interface LanguageManagerProps {
  currentLocale: Locale;
  languages: { [key: string]: Translations };
  setLanguages: (langs: { [key: string]: Translations }) => void;
}

export const LanguageManager: React.FC<LanguageManagerProps> = ({ currentLocale, languages, setLanguages }) => {
      // State for adding new key/value
      const [newKey, setNewKey] = useState('');
      const [newValue, setNewValue] = useState('');
      const [addError, setAddError] = useState('');
    // Edit translation key
    const handleEditTranslation = (key: string) => {
      setEditingKey(key);
      setEditKeyValue(key);
      setEditValueValue(translationValues[key] || '');
    };


    // Delete translation key and persist to file (in-memory for browser)
    const handleDeleteTranslation = (key: string) => {
      const updated: Translations = { ...translationValues };
      delete updated[key];
      setLanguages({ ...languages, [selectedLang]: updated });
      saveLanguageToProject(selectedLang, updated);
      if (selectedLang === 'en') {
        Object.assign(en, updated);
      } else if (selectedLang === 'da') {
        Object.assign(da, updated);
      }
      if (editingKey === key) setEditingKey(null);
    };

    // Save translation key edits and persist to file (in-memory for browser)
    const handleSaveTranslation = (oldKey: string) => {
      let updated: Translations = { ...translationValues };
      // If key changed, delete old and add new
      if (editKeyValue !== oldKey) {
        delete updated[oldKey];
      }
      updated[editKeyValue] = editValueValue;
      setLanguages({ ...languages, [selectedLang]: updated });
      saveLanguageToProject(selectedLang, updated);
      if (selectedLang === 'en') {
        Object.assign(en, updated);
      } else if (selectedLang === 'da') {
        Object.assign(da, updated);
      }
      setEditingKey(null);
      setEditKeyValue('');
      setEditValueValue('');
    };
  const [selectedLang, setSelectedLang] = useState<string>(currentLocale);

  // Load persisted language keys on mount or language change
  React.useEffect(() => {
    const loaded: { [key: string]: Translations } = {};
    Object.keys(languages).forEach(lang => {
      loaded[lang] = { ...languages[lang], ...loadLanguageFromProject(lang) };
    });
    setLanguages(loaded);
  }, []);

  // Get keys for selected language
  const translationKeys = Object.keys(languages[selectedLang] || {});
  const translationValues = languages[selectedLang] || {};


  // Edit translation key/value
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editKeyValue, setEditKeyValue] = useState('');
  const [editValueValue, setEditValueValue] = useState('');

  return (
    <div className="language-manager">
      <h3>Languages</h3>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="language-select">Select language: </label>
        <select
          id="language-select"
          value={selectedLang}
          onChange={e => setSelectedLang(e.target.value)}
        >
          {Object.keys(languages).map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Add new key/value form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!newKey.trim() || !newValue.trim()) {
            setAddError('Key and value are required.');
            return;
          }
          if (translationKeys.includes(newKey)) {
            setAddError('Key already added');
            return;
          }
          const updated: Translations = { ...translationValues, [newKey]: newValue };
          setLanguages({ ...languages, [selectedLang]: updated });
          saveLanguageToProject(selectedLang, updated);
          if (selectedLang === 'en') {
            Object.assign(en, updated);
          } else if (selectedLang === 'da') {
            Object.assign(da, updated);
          }
          setNewKey('');
          setNewValue('');
          setAddError('');
        }}
        style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}
      >
        <input
          type="text"
          placeholder="Key"
          value={newKey}
          onChange={e => setNewKey(e.target.value)}
          style={{ flex: 1, padding: 4, border: '1px solid #e5e7eb', borderRadius: 4 }}
        />
        <input
          type="text"
          placeholder="Value"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
          style={{ flex: 2, padding: 4, border: '1px solid #e5e7eb', borderRadius: 4 }}
        />
        <button type="submit" style={{ padding: '6px 14px', borderRadius: 4, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Add</button>
        {addError && <span style={{ color: 'red', fontSize: 12 }}>{addError}</span>}
      </form>

      <div style={{ marginTop: 20 }}>
        <h4>Translation Keys for "{selectedLang}"</h4>
        {translationKeys.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 13 }}>No keys in this language yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '4px 8px' }}>Key</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '4px 8px' }}>Value</th>
                <th style={{ borderBottom: '1px solid #e5e7eb', padding: '4px 8px' }}>Actions</th>
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
      </div>
    </div>
  );
};

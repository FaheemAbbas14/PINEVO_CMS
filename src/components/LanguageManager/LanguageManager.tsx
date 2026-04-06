        {/* Add translation key/value section moved below useState hooks */}
import React, { useState } from 'react';
import type { Locale, Translations } from '../../locales/types';

interface LanguageManagerProps {
  currentLocale: Locale;
  setLocale: (locale: Locale) => void;
  languages: { [key: string]: Translations };
  setLanguages: (langs: { [key: string]: Translations }) => void;
}

export const LanguageManager: React.FC<LanguageManagerProps> = ({ currentLocale, setLocale, languages, setLanguages }) => {
    // Edit translation key
    const handleEditTranslation = (key: string) => {
      setEditingKey(key);
      setEditKeyValue(key);
      setEditValueValue(translationValues[key] || '');
    };

    // Delete translation key
    const handleDeleteTranslation = (key: string) => {
      const updated: Translations = { ...translationValues };
      delete updated[key];
      setLanguages({ ...languages, [selectedLang]: updated });
      if (editingKey === key) setEditingKey(null);
    };

    // Save translation key edits
    const handleSaveTranslation = (oldKey: string) => {
      let updated: Translations = { ...translationValues };
      // If key changed, delete old and add new
      if (editKeyValue !== oldKey) {
        delete updated[oldKey];
      }
      updated[editKeyValue] = editValueValue;
      setLanguages({ ...languages, [selectedLang]: updated });
      setEditingKey(null);
      setEditKeyValue('');
      setEditValueValue('');
    };
  const [newLang, setNewLang] = useState('');
  const [editLang, setEditLang] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedLang, setSelectedLang] = useState<string>(currentLocale);

  // Add new language
  const handleAddLanguage = () => {
    if (!newLang.trim() || languages[newLang]) return;
    setLanguages({ ...languages, [newLang]: {} });
    setNewLang('');
  };

  // Delete language
  const handleDeleteLanguage = (lang: string) => {
    if (Object.keys(languages).length <= 1) return;
    const updated = { ...languages };
    delete updated[lang];
    setLanguages(updated);
    if (selectedLang === lang) setSelectedLang(Object.keys(updated)[0]);
    if (currentLocale === lang) setLocale(Object.keys(updated)[0] as Locale);
  };

  // Edit language name
  const handleEditLanguage = (lang: string) => {
    setEditLang(lang);
    setEditValue(lang);
  };

  const handleSaveEdit = () => {
    if (!editLang || !editValue.trim() || languages[editValue]) return;
    const updated: { [key: string]: Translations } = {};
    Object.entries(languages).forEach(([k, v]) => {
      updated[k === editLang ? editValue : k] = v;
    });
    setLanguages(updated);
    if (selectedLang === editLang) setSelectedLang(editValue);
    if (currentLocale === editLang) setLocale(editValue as Locale);
    setEditLang(null);
    setEditValue('');
  };

  // Get keys for selected language
  const translationKeys = Object.keys(languages[selectedLang] || {});
  const translationValues = languages[selectedLang] || {};


  // Edit translation key/value
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editKeyValue, setEditKeyValue] = useState('');
  const [editValueValue, setEditValueValue] = useState('');
  const [newTransKey, setNewTransKey] = useState('');
  const [newTransValue, setNewTransValue] = useState('');

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
      <div>
        <input
          placeholder="Add language (e.g., fr)"
          value={newLang}
          onChange={e => setNewLang(e.target.value)}
        />
        <button onClick={handleAddLanguage}>Add</button>
      </div>

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
                        <button onClick={() => handleSaveTranslation(key)} style={{ marginRight: 4 }}>Save</button>
                        <button onClick={() => setEditingKey(null)}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>{key}</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>{translationValues[key]}</td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #f3f4f6' }}>
                        <button onClick={() => handleEditTranslation(key)} style={{ marginRight: 4 }}>Edit</button>
                        <button onClick={() => handleDeleteTranslation(key)}>Delete</button>
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

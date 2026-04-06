import React from 'react';
import { LanguageManager } from '../LanguageManager/LanguageManager';
import '../LanguageManager/LanguageManager.css';
import type { Locale, Translations } from '../../../locales/types';

interface LanguageSectionProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  languages: { [key: string]: Translations };
  setLanguages: (langs: { [key: string]: Translations }) => void;
}

export const LanguageSection: React.FC<LanguageSectionProps> = ({ locale, setLocale, languages, setLanguages }) => {
  return (
    <section className="property-group">
      <h3 className="group-title">Language Management</h3>
      <LanguageManager
        currentLocale={locale}
        setLocale={setLocale}
        languages={languages}
        setLanguages={setLanguages}
      />
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
        Add, edit, or delete languages. Assign a language to the UI. Users cannot type text directly in the UI—use translation keys only.
      </div>
    </section>
  );
};

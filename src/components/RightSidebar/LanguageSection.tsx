import React from 'react';
import { LanguageManager } from '../LanguageManager/LanguageManager';
import '../LanguageManager/LanguageManager.css';
import type { Locale } from '../../locales/types.d';


interface LanguageSectionProps {
  locale: Locale;
}

export const LanguageSection: React.FC<LanguageSectionProps> = ({ locale }) => {

  return (
    <section className="property-group">
      <h3 className="group-title">Language Management</h3>
      <LanguageManager currentLocale={locale} />
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
        Add, edit, or delete languages. Assign a language to the UI. Users cannot type text directly in the UI—use translation keys only.
      </div>
    </section>
  );
};

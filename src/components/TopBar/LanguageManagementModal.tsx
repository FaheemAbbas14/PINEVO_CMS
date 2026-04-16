import React from 'react';
import { LanguageSection } from '../RightSidebar/LanguageSection';
import type { Locale } from '../../locales/types.d';


interface LanguageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

export const LanguageManagementModal: React.FC<LanguageManagementModalProps> = ({ isOpen, onClose, locale }) => {

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" style={{ background: '#fff', borderRadius: 8, padding: 24, minWidth: 400, maxWidth: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <h2>Language Management</h2>
        <LanguageSection
          locale={locale}
        />
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: '6px 18px', borderRadius: 4, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
};

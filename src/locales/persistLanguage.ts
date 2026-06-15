import type { Translations } from './types.d';

const LANG_CODE_REGEX = /^[a-z]{2,3}(?:-[a-z]{2})?$/i;
let languageStore: Record<string, Translations> = {};

interface ReplaceLanguagesOptions {
  emit?: boolean;
}

function normalizeLang(lang: string): string {
  return (lang || '').trim().toLowerCase();
}

function isValidLang(lang: string): boolean {
  return LANG_CODE_REGEX.test(lang);
}

function emitLanguagesChanged(): void {
  try {
    window.dispatchEvent(new CustomEvent('pinevo-languages-changed'));
  } catch {
    // no-op
  }
}

export function getPersistedLanguageCodes(): string[] {
  const codes = new Set<string>();

  Object.keys(languageStore).forEach((key) => {
    const lang = normalizeLang(key);
    if (isValidLang(lang)) {
      codes.add(lang);
    }
  });

  return Array.from(codes).sort();
}

export function getAllPersistedLanguages(): Record<string, Translations> {
  const out: Record<string, Translations> = {};

  Object.entries(languageStore).forEach(([lang, translations]) => {
    const normalizedLang = normalizeLang(lang);
    if (isValidLang(normalizedLang)) {
      out[normalizedLang] = translations || {};
    }
  });

  return out;
}

export function saveLanguageToProject(lang: string, translations: Translations) {
  const normalizedLang = normalizeLang(lang);
  if (!isValidLang(normalizedLang)) {
    return;
  }

  languageStore = {
    ...languageStore,
    [normalizedLang]: translations || {},
  };

  emitLanguagesChanged();
}

export function loadLanguageFromProject(lang: string): Translations {
  const normalizedLang = normalizeLang(lang);
  if (!isValidLang(normalizedLang)) {
    return {};
  }

  return languageStore[normalizedLang] || {};
}

export function removeLanguageFromProject(lang: string) {
  const normalizedLang = normalizeLang(lang);
  if (!isValidLang(normalizedLang)) {
    return;
  }

  const nextStore = { ...languageStore };
  delete nextStore[normalizedLang];
  languageStore = nextStore;

  emitLanguagesChanged();
}

export function replaceAllPersistedLanguages(languages: Record<string, Translations>, options?: ReplaceLanguagesOptions) {
  const shouldEmit = options?.emit ?? true;

  const normalized: Record<string, Translations> = {};
  Object.entries(languages || {}).forEach(([lang, translations]) => {
    const normalizedLang = normalizeLang(lang);
    if (isValidLang(normalizedLang)) {
      normalized[normalizedLang] = translations || {};
    }
  });

  languageStore = { ...normalized };

  if (shouldEmit) {
    emitLanguagesChanged();
  }
}

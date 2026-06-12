import type { Translations } from './types.d';

const LANGUAGE_CODE_PATTERN = /^[a-z]{2,8}(?:-[a-z0-9]{2,8})?$/i;

function normalizeLangCode(lang: string): string {
  return String(lang || '').trim().toLowerCase();
}

function isValidLangCode(lang: string): boolean {
  return LANGUAGE_CODE_PATTERN.test(lang);
}

export function getPersistedLanguageCodes(): string[] {
  const codes = new Set<string>();
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('project_lang_') || !key.endsWith('.json')) {
      continue;
    }

    const lang = normalizeLangCode(key.replace('project_lang_', '').replace('.json', ''));
    if (isValidLangCode(lang)) {
      codes.add(lang);
    }
  }
  return Array.from(codes);
}

export function getAllPersistedLanguages(): Record<string, Translations> {
  const langs: Record<string, Translations> = {};
  getPersistedLanguageCodes().forEach((lang) => {
    langs[lang] = loadLanguageFromProject(lang);
  });
  return langs;
}

export function saveLanguageToProject(lang: string, translations: Translations) {
  const normalizedLang = normalizeLangCode(lang);
  if (!isValidLangCode(normalizedLang)) {
    return;
  }
  // Save to localStorage as a simple persistence mechanism
  localStorage.setItem(`project_lang_${normalizedLang}.json`, JSON.stringify(translations));
}

export function loadLanguageFromProject(lang: string): Translations {
  const normalizedLang = normalizeLangCode(lang);
  if (!isValidLangCode(normalizedLang)) {
    return {};
  }

  const data = localStorage.getItem(`project_lang_${normalizedLang}.json`);
  if (!data) {
    return {};
  }

  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export function removeLanguageFromProject(lang: string) {
  const normalizedLang = normalizeLangCode(lang);
  if (!isValidLangCode(normalizedLang)) {
    return;
  }
  localStorage.removeItem(`project_lang_${normalizedLang}.json`);
}

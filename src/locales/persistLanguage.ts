import type { Translations } from './types.d';

const ACTIVE_LANGUAGE_SCOPE_KEY = 'pinevo_active_language_scope';
const GLOBAL_LANGUAGE_SCOPE = 'global';
const LANGUAGE_CODE_PATTERN = /^[a-z0-9-]{2,16}$/i;

function normalizeScope(scope?: string | null): string {
  const value = String(scope || '').trim();
  return value || GLOBAL_LANGUAGE_SCOPE;
}

function getScopedLanguageStorageKey(lang: string, scope?: string | null): string {
  return `project_lang_${normalizeScope(scope)}__${lang}.json`;
}

function getLegacyLanguageStorageKey(lang: string): string {
  return `project_lang_${lang}.json`;
}

function normalizeLanguageCode(lang: string): string {
  return String(lang || '').trim().toLowerCase();
}

function isValidLanguageCode(lang: string): boolean {
  if (!lang) {
    return false;
  }

  if (lang.includes('__') || lang.includes('.json') || lang.includes('project_lang_')) {
    return false;
  }

  return LANGUAGE_CODE_PATTERN.test(lang);
}

export function setActiveLanguageProjectScope(scope?: string | null) {
  localStorage.setItem(ACTIVE_LANGUAGE_SCOPE_KEY, normalizeScope(scope));
}

export function getActiveLanguageProjectScope(): string {
  return normalizeScope(localStorage.getItem(ACTIVE_LANGUAGE_SCOPE_KEY));
}

export function getPersistedLanguageCodes(scope?: string | null): string[] {
  const currentScope = normalizeScope(scope ?? getActiveLanguageProjectScope());
  const scopedPrefix = `project_lang_${currentScope}__`;
  const codes = new Set<string>();

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.endsWith('.json')) {
      continue;
    }

    if (key.startsWith(scopedPrefix)) {
      const lang = normalizeLanguageCode(key.slice(scopedPrefix.length, -'.json'.length));
      if (isValidLanguageCode(lang)) {
        codes.add(lang);
      }
    }
  }

  return Array.from(codes);
}

export function getAllPersistedLanguages(scope?: string | null): Record<string, Translations> {
  const langs: Record<string, Translations> = {};
  getPersistedLanguageCodes(scope).forEach((lang) => {
    langs[lang] = loadLanguageFromProject(lang, scope);
  });
  return langs;
}

export function restorePersistedLanguages(languages: Record<string, Translations>, scope?: string | null) {
  Object.entries(languages).forEach(([lang, translations]) => {
    saveLanguageToProject(lang, translations, scope);
  });
}

export function saveLanguageToProject(lang: string, translations: Translations, scope?: string | null) {
  const normalizedLang = normalizeLanguageCode(lang);
  if (!isValidLanguageCode(normalizedLang)) {
    console.warn(`[i18n] Ignoring invalid language code for persistence: ${lang}`);
    return;
  }

  const key = getScopedLanguageStorageKey(normalizedLang, scope ?? getActiveLanguageProjectScope());
  try {
    localStorage.setItem(key, JSON.stringify(translations));
  } catch (error) {
    if ((error as any)?.name === 'QuotaExceededError') {
      console.warn(`[i18n] Storage quota exceeded while saving language ${normalizedLang}.`);
      return;
    }
    throw error;
  }
}

export function loadLanguageFromProject(lang: string, scope?: string | null): Translations {
  const normalizedLang = normalizeLanguageCode(lang);
  if (!isValidLanguageCode(normalizedLang)) {
    return {};
  }

  const key = getScopedLanguageStorageKey(normalizedLang, scope ?? getActiveLanguageProjectScope());
  const scopedData = localStorage.getItem(key);
  if (scopedData) {
    try {
      return JSON.parse(scopedData);
    } catch {
      return {};
    }
  }

  // Backward compatibility for old global language keys.
  const legacyData = localStorage.getItem(getLegacyLanguageStorageKey(normalizedLang));
  if (legacyData) {
    let parsed: Translations;
    try {
      parsed = JSON.parse(legacyData);
    } catch {
      return {};
    }
    // Migrate on first read so future reads are project-scoped.
    saveLanguageToProject(normalizedLang, parsed, scope);
    return parsed;
  }

  return {};
}

export function removeLanguageFromProject(lang: string, scope?: string | null) {
  const normalizedLang = normalizeLanguageCode(lang);
  if (!isValidLanguageCode(normalizedLang)) {
    return;
  }

  const key = getScopedLanguageStorageKey(normalizedLang, scope ?? getActiveLanguageProjectScope());
  localStorage.removeItem(key);
}

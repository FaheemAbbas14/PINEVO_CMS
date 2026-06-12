import type { Translations } from './types.d';

export function saveLanguageToProject(lang: string, translations: Translations) {
  // Save to localStorage as a simple persistence mechanism
  localStorage.setItem(`project_lang_${lang}.json`, JSON.stringify(translations));
}

export function loadLanguageFromProject(lang: string): Translations {
  const data = localStorage.getItem(`project_lang_${lang}.json`);
  return data ? JSON.parse(data) : {};
}

export function removeLanguageFromProject(lang: string) {
  localStorage.removeItem(`project_lang_${lang}.json`);
}

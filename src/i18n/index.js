import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json';

const STORAGE_KEY = 'bvi_lang';

function getInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // ignore
  }
  return 'en';
}

function syncDocumentLang(lang) {
  // WCAG 3.1.1 Language of Page — keep the html lang attribute in sync with
  // the active i18n locale so screen readers pronounce content with the
  // correct language phonemes.
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = lang;
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: getInitialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnObjects: true,
  });

// Initial sync (in case the stored locale isn't 'en') and listen for changes.
syncDocumentLang(i18n.language || 'en');
i18n.on('languageChanged', syncDocumentLang);

export function setLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  i18n.changeLanguage(lang);
}

export default i18n;

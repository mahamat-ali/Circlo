import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translations
import arTranslations from './locales/ar/common.json';
import frTranslations from './locales/fr/common.json';

// the translations
const resources = {
  ar: {
    translation: arTranslations
  },
  fr: {
    translation: frTranslations
  }
};

// Supported languages
const supportedLngs = ['ar', 'fr'];

// Get device language or default to French
const deviceLanguage = Localization.locale.split('-')[0];
const defaultLanguage = supportedLngs.includes(deviceLanguage) ? deviceLanguage : 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'fr', // Fallback to French if translation is missing
    supportedLngs,
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    },
    compatibilityJSON: 'v3' // For Android compatibility
  } as any);

export default i18n;

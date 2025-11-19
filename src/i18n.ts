import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

console.log('🌍 i18n.ts file is loading...');

// Import translation files
import enRecipe from './locales/en/recipe.json';
import zhRecipe from './locales/zh/recipe.json';

console.log('📦 Translation files imported');
console.log('English translations:', enRecipe);
console.log('Chinese translations:', zhRecipe);

const resources = {
  en: {
    recipe: enRecipe,
  },
  zh: {
    recipe: zhRecipe,
  },
};

i18n
  .use(LanguageDetector) // Detects user language from browser
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language if detection fails
    debug: true, // Enable debug mode to see what's happening
    
    // Supported languages
    supportedLngs: ['en', 'zh'],
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser settings
      caches: ['localStorage'], // Cache the selected language
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Normalize language codes (zh-CN, zh-Hans, zh-TW all become 'zh')
    load: 'languageOnly',

    interpolation: {
      escapeValue: false, // React already escapes by default
    },

    ns: ['recipe'], // Namespaces we're using
    defaultNS: 'recipe', // Default namespace
    
    react: {
      useSuspense: false, // Disable suspense to avoid loading issues
    },
  });

console.log('i18n initialized, available languages:', i18n.languages);
console.log('Current language:', i18n.language);

export default i18n;


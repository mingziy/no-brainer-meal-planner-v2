import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

console.log('🌍 i18n.ts file is loading...');

// Import translation files
import enCommon from './locales/en/common.json';
import zhCommon from './locales/zh/common.json';
import enNavigation from './locales/en/navigation.json';
import zhNavigation from './locales/zh/navigation.json';
import enRecipe from './locales/en/recipe.json';
import zhRecipe from './locales/zh/recipe.json';
import enShopping from './locales/en/shopping.json';
import zhShopping from './locales/zh/shopping.json';
import enOnboarding from './locales/en/onboarding.json';
import zhOnboarding from './locales/zh/onboarding.json';
import enQuickfoods from './locales/en/quickfoods.json';
import zhQuickfoods from './locales/zh/quickfoods.json';

console.log('📦 Translation files imported');

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    recipe: enRecipe,
    shopping: enShopping,
    onboarding: enOnboarding,
    quickfoods: enQuickfoods,
  },
  zh: {
    common: zhCommon,
    navigation: zhNavigation,
    recipe: zhRecipe,
    shopping: zhShopping,
    onboarding: zhOnboarding,
    quickfoods: zhQuickfoods,
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

    ns: ['common', 'navigation', 'recipe', 'shopping', 'onboarding', 'quickfoods'], // Namespaces we're using
    defaultNS: 'common', // Default namespace
    
    react: {
      useSuspense: false, // Disable suspense to avoid loading issues
    },
  });

console.log('i18n initialized, available languages:', i18n.languages);
console.log('Current language:', i18n.language);

export default i18n;


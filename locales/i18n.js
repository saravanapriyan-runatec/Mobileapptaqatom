/* eslint-disable import/no-named-as-default-member */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './translations/en';
import { ar } from './translations/ar';
import moment from 'moment';
import 'moment/locale/ar';

// Function to sync moment locale
const syncMomentLocale = (lang) => {
  if (lang === 'ar') {
    moment.locale('ar');
  } else {
    moment.locale('en');
  }
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Sync moment on language change
i18n.on('languageChanged', (lng) => {
  syncMomentLocale(lng);
});

// Load saved language preference
AsyncStorage.getItem('appLanguage').then((lang) => {
  if (lang && (lang === 'en' || lang === 'ar')) {
    i18n.changeLanguage(lang);
    syncMomentLocale(lang);
  } else {
    syncMomentLocale('en'); // Default
  }
});

export default i18n;

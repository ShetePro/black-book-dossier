import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import zhCN from './zh-CN';
import enUS from './en-US';

const getDeviceLanguage = (): string => {
  const locale = Localization.getLocales()[0]?.languageTag || 'zh-CN';

  if (locale.startsWith('zh')) {
    return 'zh-CN';
  }

  if (locale.startsWith('en')) {
    return 'en-US';
  }

  return 'zh-CN';
};

const deviceLanguage = getDeviceLanguage();

const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'en-US': {
    translation: enUS,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
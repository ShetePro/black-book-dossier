import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// 获取设备语言
const getDeviceLanguage = () => {
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
    translation: {
      tabs: {
        index: '首页',
        contacts: '联系人',
      },
      app: {
        name: 'Black Book',
        tagline: '您的私人情报系统',
      },
    },
  },
  'en-US': {
    translation: {
      tabs: {
        index: 'Home',
        contacts: 'Contacts',
      },
      app: {
        name: 'Black Book', 
        tagline: 'Your Private Intelligence System',
      },
    },
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

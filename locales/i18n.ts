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
      // TabBar
      tabs: {
        index: '首页',
        contacts: '联系人',
      },
      // App 信息
      app: {
        name: 'Black Book',
        tagline: '您的私人情报系统',
      },
      // 通用
      common: {
        seeAll: '查看全部',
        cancel: '取消',
        save: '保存',
        delete: '删除',
        edit: '编辑',
        done: '完成',
        loading: '加载中...',
        error: '错误',
        success: '成功',
      },
      // 联系人
      contacts: {
        title: '人脉档案',
        all: '所有联系人',
        recent: '最近联系',
        noContacts: '暂无联系人',
        addByRecording: '开始语音记录来添加联系人',
        search: '搜索人脉...',
      },
      // 录音
      recording: {
        holdToRecord: '按住说话',
        tapToRecord: '点击开始录音',
        recording: '录音中...',
        releaseToComplete: '松手完成',
        releaseToCancel: '松开取消',
        dragToCancel: '拖动到此处取消',
        recordIntelligence: '记录情报',
        listening: '正在聆听... 请描述会面细节',
        aiAnalyzing: 'AI 正在分析情报...',
      },
      // 设置
      settings: {
        title: '设置',
      },
      // 关于
      about: {
        title: '关于我们',
        slogan: '您的私人情报系统',
        versionInfo: '版本信息',
        version: '版本',
        allRightsReserved: '版权所有',
      },
      // 帮助
      help: {
        title: '帮助与反馈',
        contactUs: '联系我们',
        responseTime: '我们通常会在 1-2 个工作日内回复。',
      },
      // 语言
      language: {
        title: '语言设置',
      },
      // 引导页
      onboarding: {
        voice: {
          title: '一句话记录人脉',
          description: '告别繁琐输入，长按录音即可自动记录会面信息、谈话要点和待办事项',
        },
        ai: {
          title: 'AI 智能提取',
          description: '自动识别姓名、公司、职位、需求等关键信息，生成结构化的人脉档案',
        },
        privacy: {
          title: '本地安全存储',
          description: '所有数据仅存储在您的设备上，支持面容/指纹解锁，确保人脉信息安全',
        },
        start: {
          title: '开启情报系统',
          description: '开始构建您的专属人脉数据库，让每一次会面都产生价值',
        },
        next: '下一步',
        skip: '跳过',
        getStarted: '开始使用',
      },
    },
  },
  'en-US': {
    translation: {
      // TabBar
      tabs: {
        index: 'Home',
        contacts: 'Contacts',
      },
      // App 信息
      app: {
        name: 'Black Book',
        tagline: 'Your Private Intelligence System',
      },
      // Common
      common: {
        seeAll: 'See All',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        done: 'Done',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
      },
      // Contacts
      contacts: {
        title: 'Network',
        all: 'All Contacts',
        recent: 'Recent',
        noContacts: 'No contacts yet',
        addByRecording: 'Start voice recording to add contacts',
        search: 'Search contacts...',
      },
      // Recording
      recording: {
        holdToRecord: 'Hold to Record',
        tapToRecord: 'Tap to Record',
        recording: 'Recording...',
        releaseToComplete: 'Release to Complete',
        releaseToCancel: 'Release to Cancel',
        dragToCancel: 'Drag here to cancel',
        recordIntelligence: 'Record Intelligence',
        listening: 'Listening... Describe the interaction',
        aiAnalyzing: 'AI is analyzing...',
      },
      // Settings
      settings: {
        title: 'Settings',
      },
      // About
      about: {
        title: 'About Us',
        slogan: 'Your Private Intelligence System',
        versionInfo: 'Version Info',
        version: 'Version',
        allRightsReserved: 'All rights reserved',
      },
      // Help
      help: {
        title: 'Help & Feedback',
        contactUs: 'Contact Us',
        responseTime: 'We typically reply within 1-2 business days.',
      },
      // Language
      language: {
        title: 'Language',
      },
      // Onboarding
      onboarding: {
        voice: {
          title: 'Record with Your Voice',
          description: 'Say goodbye to tedious typing. Long press to record and automatically capture meeting details, key points, and action items',
        },
        ai: {
          title: 'AI Smart Extraction',
          description: 'Automatically identify names, companies, positions, needs, and other key information to generate structured contact profiles',
        },
        privacy: {
          title: 'Local Secure Storage',
          description: 'All data is stored only on your device, with Face ID/Fingerprint unlock support to ensure your network information stays secure',
        },
        start: {
          title: 'Launch Intelligence System',
          description: 'Start building your exclusive contact database and make every meeting count',
        },
        next: 'Next',
        skip: 'Skip',
        getStarted: 'Get Started',
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

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

const resources = {
  'zh-CN': {
    translation: {
      app: {
        name: 'Black Book',
        tagline: '您的私人情报系统',
      },
      auth: {
        title: 'Black Book',
        subtitle: '您的私人情报系统',
        biometricPrompt: '验证身份以访问 Black Book',
        usePassword: '使用密码',
        privacyNote: '所有数据仅存储于您的设备',
      },
      onboarding: {
        privacy: {
          title: '零知隐私',
          description: '您的数据仅存储在 iPhone 的加密芯片中。没有云端，没有服务器，没有任何人可以访问。',
        },
        security: {
          title: '生物识别锁',
          description: 'Face ID / Touch ID 保护您的私密人脉信息。即使手机被盗，数据依然安全。',
        },
        destroy: {
          title: '一键自毁',
          description: '紧急情况？一键销毁所有数据，覆盖写入 0，确保无法恢复。',
        },
        voice: {
          title: '语音优先',
          description: '按住说话，AI 自动提取关键情报。专为忙碌的你设计。',
        },
        start: '开始使用',
        next: '下一步',
      },
      recording: {
        holdToRecord: '按住说话',
        recording: '录音中...',
        releaseToComplete: '松手完成',
        recordIntelligence: '记录情报',
        listening: '正在聆听... 请描述会面细节',
        aiAnalyzing: 'AI 正在分析情报...',
        recordAgain: '继续记录',
        intelligenceRecorded: '情报已记录',
        originalRecord: '原始记录',
        extractedInfo: '提取的情报',
        actionItems: '待办事项',
      },
      contacts: {
        title: '人脉档案',
        count: '{{count}} 位核心联系人',
        search: '搜索人脉...',
        noContacts: '暂无联系人',
        addByRecording: '开始记录语音来添加',
        health: '健康',
        preferences: '偏好',
        taboos: '禁忌',
        family: '家庭成员',
        interactions: '交往记录',
        lastUpdated: '更新于 {{date}}',
      },
      settings: {
        title: '设置',
        subtitle: '管理您的隐私与安全',
        security: '安全',
        privacy: '隐私',
        about: '关于',
        biometricLock: '生物识别锁',
        biometricDescription: '使用 Face ID 保护应用',
        killSwitch: 'Kill Switch',
        killSwitchDescription: '紧急情况下，一键销毁所有数据',
        destroyAllData: '销毁所有数据',
        destroyConfirm: '确认销毁？',
        destroyWarning: '此操作将永久删除所有数据',
        dataTypes: {
          contacts: '所有联系人档案',
          interactions: '所有交往记录',
          actions: '所有待办事项',
          recordings: '所有录音文件',
        },
        language: '语言',
        backup: '数据备份',
        exportData: '导出数据',
        importData: '导入数据',
        logout: '退出登录',
        version: '版本 {{version}}',
        privacyPromise: 'No Cloud. No Servers. Only on your Device.',
      },
      priority: {
        high: '高优先级',
        medium: '中优先级',
        low: '低优先级',
      },
      tabs: {
        index: '首页',
        contacts: '联系人',
        history: '记录',
        charts: '图表',
        user: '我的',
      },
    },
  },
  'en-US': {
    translation: {
      app: {
        name: 'Black Book',
        tagline: 'Your Private Intelligence System',
      },
      auth: {
        title: 'Black Book',
        subtitle: 'Your Private Intelligence System',
        biometricPrompt: 'Authenticate to access Black Book',
        usePassword: 'Use Password',
        privacyNote: 'All data stays on your device only',
      },
      onboarding: {
        privacy: {
          title: 'Zero-Knowledge Privacy',
          description: 'Your data lives only on your device\'s encrypted chip. No cloud, no servers, no one can access it.',
        },
        security: {
          title: 'Biometric Lock',
          description: 'Face ID / Touch ID protects your private network. Even if your phone is stolen, data remains secure.',
        },
        destroy: {
          title: 'Kill Switch',
          description: 'Emergency? Destroy all data with one tap. Overwritten with zeros, unrecoverable.',
        },
        voice: {
          title: 'Voice-First',
          description: 'Hold to speak, AI extracts key intelligence automatically. Designed for busy professionals.',
        },
        start: 'Get Started',
        next: 'Next',
      },
      recording: {
        holdToRecord: 'Hold to Speak',
        recording: 'Recording...',
        releaseToComplete: 'Release to Complete',
        recordIntelligence: 'Record Intelligence',
        listening: 'Listening... Describe meeting details',
        aiAnalyzing: 'AI analyzing intelligence...',
        recordAgain: 'Record Again',
        intelligenceRecorded: 'Intelligence Recorded',
        originalRecord: 'Original Record',
        extractedInfo: 'Extracted Information',
        actionItems: 'Action Items',
      },
      contacts: {
        title: 'Network',
        count: '{{count}} Core Contacts',
        search: 'Search contacts...',
        noContacts: 'No contacts yet',
        addByRecording: 'Start recording to add contacts',
        health: 'Health',
        preferences: 'Preferences',
        taboos: 'Taboos',
        family: 'Family',
        interactions: 'Interaction History',
        lastUpdated: 'Updated {{date}}',
      },
      settings: {
        title: 'Settings',
        subtitle: 'Manage your privacy and security',
        security: 'Security',
        privacy: 'Privacy',
        about: 'About',
        biometricLock: 'Biometric Lock',
        biometricDescription: 'Use Face ID to protect the app',
        killSwitch: 'Kill Switch',
        killSwitchDescription: 'Emergency destroy all data',
        destroyAllData: 'Destroy All Data',
        destroyConfirm: 'Confirm Destroy?',
        destroyWarning: 'This will permanently delete all data',
        dataTypes: {
          contacts: 'All contact profiles',
          interactions: 'All interaction records',
          actions: 'All action items',
          recordings: 'All recordings',
        },
        language: 'Language',
        backup: 'Data Backup',
        exportData: 'Export Data',
        importData: 'Import Data',
        logout: 'Logout',
        version: 'Version {{version}}',
        privacyPromise: 'No Cloud. No Servers. Only on your Device.',
      },
      priority: {
        high: 'High Priority',
        medium: 'Medium Priority',
        low: 'Low Priority',
      },
      tabs: {
        index: 'Home',
        contacts: 'Contacts',
        history: 'History',
        charts: 'Stats',
        user: 'Profile',
      },
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0]?.languageTag || 'zh-CN',
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

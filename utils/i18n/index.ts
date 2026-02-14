import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import {
  getStorageItemAsync,
} from "@/hooks/useStorageState";

const SETTINGS_STORAGE_KEY = "app-settings";

const getDefaultLanguage = (): string => {
  const locales = Localization.getLocales();
  if (locales.length > 0) {
    const languageCode = locales[0].languageCode;
    if (languageCode && languageCode.startsWith("zh")) {
      return "cn";
    }
  }
  return "en";
};

const resources = {
  en: {
    translation: {
      app: {
        name: "Black Book",
        tagline: "Your Private Intelligence System",
      },
      common: {
        today: "Today",
        yesterday: "Yesterday",
        time: "Time",
        error: "Error",
        cancel: "Cancel",
        saving: "Saving...",
        save: "Save",
        loading: "Loading",
        back: "Back",
        optional: "Optional",
        success: "Success",
        enabled: "Enabled",
        disabled: "Disabled",
        seeAll: "See All",
        greeting: {
          morning: "Good morning",
          afternoon: "Good afternoon",
          evening: "Good evening",
        },
      },
      tabs: {
        index: "Home",
        history: "History",
        charts: "Stats",
        user: "User",
        contacts: "Contacts",
      },
      contacts: {
        title: "Contacts",
        all: "All Contacts",
        recent: "Recent",
        noContacts: "No contacts yet",
        addByRecording: "Start voice recording to add contacts",
        search: "Search contacts...",
        priority: {
          high: "High Priority",
          medium: "Medium Priority",
          low: "Low Priority",
        },
      },
      recording: {
        holdToRecord: "Hold to Record",
        recording: "Recording...",
        releaseToComplete: "Release to Complete",
        recordIntelligence: "Record Intelligence",
        listening: "Listening... Describe the interaction",
        aiAnalyzing: "AI is analyzing...",
        recordAgain: "Record Again",
        intelligenceRecorded: "Intelligence Recorded",
        originalRecord: "Original Record",
        extractedInfo: "Extracted Information",
        actionItems: "Action Items",
      },
      history: {
        title: "History",
        noRecords: "No records yet",
        emptyTitle: "No Interactions Yet",
        emptySubtitle: "Start recording to track your network interactions",
      },
      settings: {
        title: "Settings",
        subtitle: "Manage your privacy and security",
        security: "Security",
        privacy: "Privacy",
        about: "About",
        biometricLock: "Biometric Lock",
        biometricDescription: "Use Face ID to protect the app",
        killSwitch: "Kill Switch",
        killSwitchDescription: "Emergency destroy all data",
        destroyAllData: "Destroy All Data",
        destroyConfirm: "Confirm Destroy?",
        destroyWarning: "This will permanently delete all data",
        language: "Language",
        backup: "Data Backup",
        exportData: "Export Data",
        importData: "Import Data",
        version: "Version {{version}}",
        privacyPromise: "No Cloud. No Servers. Only on your Device.",
      },
      about: {
        title: "About Us",
        slogan: "Your Private Intelligence System",
        versionInfo: "Version Info",
        version: "Version",
        allRightsReserved: "All rights reserved.",
      },
      help: {
        title: "Help & Feedback",
        contactUs: "Contact Us",
        responseTime: "We typically reply within 1-2 business days.",
      },
      language: {
        title: "Language",
        cn: "中文",
        en: "English",
      },
      onboarding: {
        privacy: {
          title: "Zero-Knowledge Privacy",
          description: "Your data lives only on your device's encrypted chip. No cloud, no servers, no one can access it.",
        },
        security: {
          title: "Biometric Lock",
          description: "Face ID / Touch ID protects your private network. Even if your phone is stolen, data remains secure.",
        },
        destroy: {
          title: "Kill Switch",
          description: "Emergency? Destroy all data with one tap. Overwritten with zeros, unrecoverable.",
        },
        voice: {
          title: "Voice-First",
          description: "Hold to speak, AI extracts key intelligence automatically. Designed for busy professionals.",
        },
        start: "Get Started",
        next: "Next",
      },
    },
  },
  cn: {
    translation: {
      app: {
        name: "Black Book",
        tagline: "您的私人情报系统",
      },
      common: {
        today: "今天",
        yesterday: "昨天",
        time: "时间",
        error: "错误",
        cancel: "取消",
        saving: "保存中...",
        save: "保存",
        loading: "加载中",
        back: "返回",
        optional: "选填",
        success: "成功",
        enabled: "已开启",
        disabled: "未开启",
        seeAll: "查看全部",
        greeting: {
          morning: "早上好",
          afternoon: "下午好",
          evening: "晚上好",
        },
      },
      tabs: {
        index: "首页",
        history: "记录",
        charts: "图表",
        user: "我的",
        contacts: "联系人",
      },
      contacts: {
        title: "人脉档案",
        all: "所有联系人",
        recent: "最近联系",
        noContacts: "暂无联系人",
        addByRecording: "开始语音记录来添加联系人",
        search: "搜索人脉...",
        priority: {
          high: "高优先级",
          medium: "中优先级",
          low: "低优先级",
        },
      },
      recording: {
        holdToRecord: "按住说话",
        recording: "录音中...",
        releaseToComplete: "松手完成",
        recordIntelligence: "记录情报",
        listening: "正在聆听...请描述会面细节",
        aiAnalyzing: "AI 正在分析情报...",
        recordAgain: "继续记录",
        intelligenceRecorded: "情报已记录",
        originalRecord: "原始记录",
        extractedInfo: "提取的情报",
        actionItems: "待办事项",
      },
      history: {
        title: "历史记录",
        noRecords: "暂无记录",
        emptyTitle: "还没有交往记录",
        emptySubtitle: "开始记录语音来追踪您的人脉交往",
      },
      settings: {
        title: "设置",
        subtitle: "管理您的隐私与安全",
        security: "安全",
        privacy: "隐私",
        about: "关于",
        biometricLock: "生物识别锁",
        biometricDescription: "使用 Face ID 保护应用",
        killSwitch: "Kill Switch",
        killSwitchDescription: "紧急情况下，一键销毁所有数据",
        destroyAllData: "销毁所有数据",
        destroyConfirm: "确认销毁？",
        destroyWarning: "此操作将永久删除所有数据",
        language: "语言",
        backup: "数据备份",
        exportData: "导出数据",
        importData: "导入数据",
        version: "版本 {{version}}",
        privacyPromise: "No Cloud. No Servers. Only on your Device.",
      },
      about: {
        title: "关于我们",
        slogan: "您的私人情报系统",
        versionInfo: "版本信息",
        version: "版本号",
        allRightsReserved: "版权所有",
      },
      help: {
        title: "帮助与反馈",
        contactUs: "联系我们",
        responseTime: "我们通常会在 1-2 个工作日内回复。",
      },
      language: {
        title: "语言设置",
        cn: "中文",
        en: "English",
      },
      onboarding: {
        privacy: {
          title: "零知隐私",
          description: "您的数据仅存储在 iPhone 的加密芯片中。没有云端，没有服务器，没有任何人可以访问。",
        },
        security: {
          title: "生物识别锁",
          description: "Face ID / Touch ID 保护您的私密人脉信息。即使手机被盗，数据依然安全。",
        },
        destroy: {
          title: "一键自毁",
          description: "紧急情况？一键销毁所有数据，覆盖写入 0，确保无法恢复。",
        },
        voice: {
          title: "语音优先",
          description: "按住说话，AI 自动提取关键情报。专为忙碌的你设计。",
        },
        start: "开始使用",
        next: "下一步",
      },
    },
  },
};

const getLanguageFromSettings = async (): Promise<string | null> => {
  try {
    const stored = (await getStorageItemAsync(SETTINGS_STORAGE_KEY)) as
      | string
      | null;
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.language || null;
    }
  } catch (error) {
    console.error("Failed to get language from settings:", error);
  }
  return null;
};

const initI18n = async () => {
  let savedLang = await getLanguageFromSettings();

  if (!savedLang) {
    savedLang = (await getStorageItemAsync("app-language")) as string | null;
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLang || getDefaultLanguage(),
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;

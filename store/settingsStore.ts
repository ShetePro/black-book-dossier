import { create } from "zustand";
import { getStorageItemAsync, setStorageItemAsync } from "@/hooks/useStorageState";
import { colorScheme as nativeWindColorScheme } from "nativewind";
import i18n from "@/utils/i18n";

// ==================== 类型定义 ====================

export type Language = "cn" | "en";
export type DistanceUnit = "km" | "mi";
export type ThemeMode = "light" | "dark" | "system";
export type MapType = "standard" | "satellite" | "hybrid";
export type PathColor = "blue" | "red" | "green" | "orange" | "purple";

/**
 * 应用设置配置接口
 * 添加新设置项时，只需在此接口中添加字段
 */
export interface AppSettings {
  // 语言设置
  language: Language;
  
  // 主题设置
  themeMode: ThemeMode;
  
  // 单位设置
  distanceUnit: DistanceUnit;
  
  // 隐私设置
  privacy: {
    shareLocation: boolean;
    analyticsEnabled: boolean;
  };
  
  // 同步设置
  sync: {
    autoSync: boolean;
    wifiOnly: boolean;
  };
  
  // 跑步设置
  run: {
    autoPause: boolean;
    voiceFeedback: boolean;
    targetDistance: number; // km, 0 表示无目标
  };
  
  // 跑步计划设置
  plan: {
    enabled: boolean;
    dailyDistance: number;      // 每日目标距离 (km)
    weeklyDistance: number;     // 每周目标距离 (km)
    weeklyRuns: number;         // 每周目标跑步次数
    monthlyDistance: number;    // 每月目标距离 (km)
    reminderEnabled: boolean;   // 是否开启提醒
    reminderTime: string;       // 提醒时间 (HH:mm)
  };
  
  // 地图设置
  map: {
    mapType: MapType;
    showUserLocation: boolean;
    followUserLocation: boolean;
    showCompass: boolean;
    showScale: boolean;
    tiltEnabled: boolean;  // 3D倾斜视角
    // 交互设置
    zoomEnabled: boolean;   // 允许缩放
    rotateEnabled: boolean; // 允许旋转
    scrollEnabled: boolean; // 允许滚动/平移
    pitchEnabled: boolean;  // 允许倾斜手势
    // 显示设置
    showTraffic: boolean;   // 显示交通状况
    showPOI: boolean;       // 显示兴趣点
    pathColor: PathColor;
    pathWidth: number;
  };
}

/**
 * 设置项路径类型（用于类型安全的更新）
 * 支持嵌套路径，如 "notifications.enabled"
 */
export type SettingPath = keyof AppSettings | 
  `privacy.${keyof AppSettings['privacy']}` |
  `sync.${keyof AppSettings['sync']}` |
  `run.${keyof AppSettings['run']}` |
  `plan.${keyof AppSettings['plan']}` |
  `map.${keyof AppSettings['map']}`;

// ==================== 默认值 ====================

/**
 * 默认设置
 * 所有新设置项都应在这里定义默认值
 */
export const DEFAULT_SETTINGS: AppSettings = {
  language: "cn",
  themeMode: "system",
  distanceUnit: "km",
  privacy: {
    shareLocation: false,
    analyticsEnabled: true,
  },
  sync: {
    autoSync: true,
    wifiOnly: false,
  },
  run: {
    autoPause: true,
    voiceFeedback: false,
    targetDistance: 0,
  },
  plan: {
    enabled: false,
    dailyDistance: 5,        // 默认每日 5km
    weeklyDistance: 20,      // 默认每周 20km
    weeklyRuns: 3,           // 默认每周 3 次
    monthlyDistance: 80,     // 默认每月 80km
    reminderEnabled: false,
    reminderTime: "07:00",   // 默认早上 7 点提醒
  },
  map: {
    mapType: "standard",
    showUserLocation: true,
    followUserLocation: true,
    showCompass: true,
    showScale: true,
    tiltEnabled: true,  // 默认开启3D倾斜
    // 交互设置默认开启
    zoomEnabled: true,
    rotateEnabled: true,
    scrollEnabled: true,
    pitchEnabled: true,
    // 显示设置
    showTraffic: false,  // 默认不显示交通
    showPOI: true,       // 默认显示兴趣点
    pathColor: "blue",
    pathWidth: 4,
  },
};

// Storage key
const SETTINGS_STORAGE_KEY = "app-settings";

// ==================== 辅助函数 ====================

/**
 * 深度合并对象
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof result[key] === "object" &&
        result[key] !== null
      ) {
        result[key] = deepMerge(result[key] as any, source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }
  
  return result;
}

/**
 * 根据路径获取嵌套值
 */
function getNestedValue<T>(obj: T, path: string): any {
  return path.split(".").reduce((acc: any, part) => acc?.[part], obj);
}

/**
 * 根据路径设置嵌套值（返回新对象）
 */
function setNestedValue<T>(obj: T, path: string, value: any): T {
  const parts = path.split(".");
  const result = { ...obj };
  let current: any = result;
  
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = { ...current[parts[i]] };
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
  return result;
}

// ==================== Zustand Store ====================

interface SettingsState {
  // 当前设置
  settings: AppSettings;
  
  // 是否已加载
  isLoaded: boolean;
  
  // 初始化（从存储加载）
  initialize: () => Promise<void>;
  
  // 更新单个设置（支持嵌套路径）
  updateSetting: <K extends SettingPath>(
    path: K,
    value: K extends keyof AppSettings ? AppSettings[K] : any
  ) => Promise<void>;
  
  // 批量更新设置
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  
  // 重置设置到默认值
  resetSettings: () => Promise<void>;
  
  // 重置特定分组的设置
  resetGroup: (group: "privacy" | "sync" | "run" | "plan" | "map") => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  initialize: async () => {
    try {
      const stored = await getStorageItemAsync(SETTINGS_STORAGE_KEY) as string | null;
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // 合并存储的设置和默认值（处理新增设置项）
        const merged = deepMerge(DEFAULT_SETTINGS, parsed);
        set({ settings: merged, isLoaded: true });
        
        // 同步语言到 i18n
        if (merged.language) {
          i18n.changeLanguage(merged.language);
        }
        
        // 同步主题到 nativewind
        if (merged.themeMode) {
          nativeWindColorScheme.set(merged.themeMode === "system" ? "system" : merged.themeMode);
        }
      } else {
        // 首次使用，保存默认设置
        await setStorageItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      set({ isLoaded: true });
    }
  },

  updateSetting: async (path, value) => {
    const { settings } = get();
    
    // 更新设置
    const newSettings = setNestedValue(settings, path, value);
    
    // 保存到存储
    await setStorageItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    
    // 更新状态
    set({ settings: newSettings });
    
    // 特殊处理：语言变更时同步到 i18n
    if (path === "language") {
      i18n.changeLanguage(value as Language);
    }
    
    // 特殊处理：主题变更时同步应用到 nativewind
    if (path === "themeMode") {
      const themeMode = value as ThemeMode;
      if (themeMode === "system") {
        nativeWindColorScheme.set("system");
      } else {
        nativeWindColorScheme.set(themeMode);
      }
    }
  },

  updateSettings: async (partial) => {
    const { settings } = get();
    const newSettings = deepMerge(settings, partial);
    
    await setStorageItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    set({ settings: newSettings });
    
    // 同步语言变更
    if (partial.language) {
      i18n.changeLanguage(partial.language);
    }
    
    // 同步主题变更
    if (partial.themeMode) {
      if (partial.themeMode === "system") {
        nativeWindColorScheme.set("system");
      } else {
        nativeWindColorScheme.set(partial.themeMode);
      }
    }
  },

  resetSettings: async () => {
    await setStorageItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    set({ settings: DEFAULT_SETTINGS });
    i18n.changeLanguage(DEFAULT_SETTINGS.language);
    // 重置主题
    nativeWindColorScheme.set(DEFAULT_SETTINGS.themeMode === "system" ? "system" : DEFAULT_SETTINGS.themeMode);
  },

  resetGroup: async (group) => {
    const { settings } = get();
    const newSettings = {
      ...settings,
      [group]: DEFAULT_SETTINGS[group],
    };
    
    await setStorageItemAsync(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    set({ settings: newSettings });
  },
}));

// ==================== 便捷 Hook ====================

/**
 * 获取特定设置项的 Hook（用于组件中）
 */
export function useSetting<K extends SettingPath>(path: K): 
  K extends keyof AppSettings ? AppSettings[K] : any {
  const { settings } = useSettingsStore();
  return getNestedValue(settings, path);
}

// ==================== 常量/辅助数据 ====================

export const LANGUAGE_NAMES: Record<Language, string> = {
  cn: "中文",
  en: "English",
};

export const THEME_NAMES: Record<ThemeMode, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统",
};

export const UNIT_NAMES: Record<DistanceUnit, { name: string; short: string }> = {
  km: { name: "公里", short: "km" },
  mi: { name: "英里", short: "mi" },
};

export const MAP_TYPE_NAMES: Record<MapType, { name: string; icon: string }> = {
  standard: { name: "标准", icon: "map-outline" },
  satellite: { name: "卫星", icon: "globe-outline" },
  hybrid: { name: "混合", icon: "layers-outline" },
};

export const PATH_COLOR_NAMES: Record<PathColor, { name: string; color: string }> = {
  blue: { name: "蓝色", color: "#3B82F6" },
  red: { name: "红色", color: "#EF4444" },
  green: { name: "绿色", color: "#10B981" },
  orange: { name: "橙色", color: "#F59E0B" },
  purple: { name: "紫色", color: "#A855F7" },
};

export const PATH_WIDTH_OPTIONS = [
  { value: 2, label: "细" },
  { value: 4, label: "标准" },
  { value: 6, label: "粗" },
  { value: 8, label: "特粗" },
];

// ==================== 迁移辅助（处理旧版本存储）====================

/**
 * 从旧版本迁移设置（如果存在）
 */
export async function migrateFromLegacy(): Promise<void> {
  try {
    // 迁移旧的语言设置
    const oldLang = await getStorageItemAsync("app-language") as Language | null;
    if (oldLang) {
      const { updateSetting } = useSettingsStore.getState();
      await updateSetting("language", oldLang);
      // 清理旧 key
      await setStorageItemAsync("app-language", null);
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

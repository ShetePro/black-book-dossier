/**
 * 暗夜金奢主题配色系统
 * Dark Luxury Gold Theme
 */

export const Colors = {
  light: {
    colors: {
      // 背景系统
      background: '#fafafa',
      surface: '#ffffff',
      elevated: '#f5f5f5',
      
      // 文字系统
      text: '#0a0a0a',
      textSecondary: '#525256',
      textMuted: '#737373',
      
      // 强调色 - 奢华金
      primary: '#c9a962',
      primaryLight: '#d4b978',
      primaryDark: '#a88b4a',
      
      // 功能色
      success: '#16a34a',
      warning: '#ca8a04',
      danger: '#dc2626',
      info: '#3b82f6',
      
      // 边框与分隔
      border: '#e5e5e5',
      divider: '#d4d4d4',
      
      // 图标
      icon: '#525256',
      iconMuted: '#a3a3a3',
    },
  },
  dark: {
    colors: {
      // 背景系统 - 深邃黑
      background: '#0a0a0a',
      surface: '#141414',
      elevated: '#1a1a1a',
      
      // 文字系统
      text: '#f5f5f5',
      textSecondary: '#a3a3a3',
      textMuted: '#737373',
      
      // 强调色 - 奢华金
      primary: '#c9a962',
      primaryLight: '#d4b978',
      primaryDark: '#a88b4a',
      
      // 功能色
      success: '#22c55e',
      warning: '#fbbf24',
      danger: '#ef4444',
      info: '#60a5fa',
      
      // 边框与分隔
      border: '#2a2a2a',
      divider: '#333333',
      
      // 图标
      icon: '#a3a3a3',
      iconMuted: '#737373',
    },
  },
};

// 方便使用的颜色常量
export const THEME = {
  // 深邃黑系列
  void: '#0a0a0a',
  voidLight: '#141414',
  voidLighter: '#1a1a1a',
  voidBorder: '#2a2a2a',
  
  // 米白文字系列
  elite: '#f5f5f5',
  eliteMuted: '#a3a3a3',
  eliteDim: '#737373',
  
  // 奢华金系列
  gold: '#c9a962',
  goldLight: '#d4b978',
  goldDark: '#a88b4a',
  
  // 功能色
  danger: '#dc2626',
  dangerLight: '#ef4444',
  success: '#16a34a',
  warning: '#ca8a04',
};

// 渐变定义
export const GRADIENTS = {
  gold: ['#c9a962', '#d4b978', '#c9a962'],
  goldShine: ['#a88b4a', '#c9a962', '#d4b978', '#c9a962', '#a88b4a'],
  darkElevated: ['#141414', '#1a1a1a'],
  danger: ['#dc2626', '#ef4444'],
};

// 阴影定义
export const SHADOWS = {
  gold: {
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AppSettings } from '@/types';

const SETTINGS_KEY = 'blackbook_settings';
const DECOY_MODE_KEY = 'blackbook_decoy_mode';

const defaultSettings: AppSettings = {
  hasCompletedOnboarding: false,
  useBiometricLock: true,
  decoyPassword: null,
  useDecoyMode: false,
  autoLockTimeout: 5 * 60 * 1000,
  lastActiveAt: 0,
  language: 'zh-CN',
};

export interface AuthState {
  isAuthenticated: boolean;
  isDecoyMode: boolean;
  isLoading: boolean;
  settings: AppSettings;
  
  initialize: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  logout: () => void;
  enableDecoyMode: () => void;
  disableDecoyMode: () => void;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isDecoyMode: false,
  isLoading: true,
  settings: defaultSettings,

  initialize: async () => {
    try {
      const settingsJson = await SecureStore.getItemAsync(SETTINGS_KEY);
      const decoyMode = await SecureStore.getItemAsync(DECOY_MODE_KEY);
      
      const settings = settingsJson ? JSON.parse(settingsJson) : defaultSettings;
      
      set({
        settings,
        isDecoyMode: decoyMode === 'true',
        isAuthenticated: !settings.useBiometricLock,
        isLoading: false,
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      set({ isLoading: false });
    }
  },

  authenticate: async () => {
    set({ isAuthenticated: true });
    return true;
  },

  logout: () => {
    set({ isAuthenticated: false });
  },

  enableDecoyMode: () => {
    SecureStore.setItemAsync(DECOY_MODE_KEY, 'true');
    set({ isDecoyMode: true });
  },

  disableDecoyMode: () => {
    SecureStore.setItemAsync(DECOY_MODE_KEY, 'false');
    set({ isDecoyMode: false });
  },

  updateSettings: async (newSettings) => {
    const current = get().settings;
    const updated = { ...current, ...newSettings };
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(updated));
    set({ settings: updated });
  },

  completeOnboarding: async () => {
    await get().updateSettings({ hasCompletedOnboarding: true });
  },
}));

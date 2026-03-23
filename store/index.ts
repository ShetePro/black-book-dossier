// Auth Store
export { useAuthStore, type AuthState } from './auth/authStore';

// Contact Store
export { useContactStore, type ContactState } from './contacts/contactStore';

// Recording Store
export { useRecordingStore, type RecordingState } from './recording/recordingStore';

// Settings Store (保留原有设置)
export { 
  useSettingsStore, 
  type AppSettings,
  type SettingPath,
  DEFAULT_SETTINGS,
  migrateFromLegacy,
} from './settingsStore';

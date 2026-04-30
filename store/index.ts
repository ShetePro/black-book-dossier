// Auth Store
export { useAuthStore, type AuthState } from './auth/authStore';

// Contact Store
export { useContactStore, type ContactState } from './contacts/contactStore';

// Recording Store
export { useRecordingStore, type RecordingState } from './recording/recordingStore';

// Interaction Store
export { useInteractionStore, type InteractionState } from './interactions/interactionStore';

// Action Item Store
export { useActionItemStore, type ActionItemState } from './actionItems/actionItemStore';

// Settings Store (保留原有设置)
export { 
  useSettingsStore, 
  type AppSettings,
  type SettingPath,
  DEFAULT_SETTINGS,
  migrateFromLegacy,
} from './settingsStore';

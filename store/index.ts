import { create } from 'zustand';
import { Contact, Interaction, ActionItem, AppSettings } from '@/types';
import * as SecureStore from 'expo-secure-store';
import * as db from '@/db/operations';

const SETTINGS_KEY = 'blackbook_settings';
const DECOY_MODE_KEY = 'blackbook_decoy_mode';

interface AuthState {
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

const defaultSettings: AppSettings = {
  hasCompletedOnboarding: false,
  useBiometricLock: true,
  decoyPassword: null,
  useDecoyMode: false,
  autoLockTimeout: 5 * 60 * 1000,
  lastActiveAt: 0,
  language: 'zh-CN',
};

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

interface ContactState {
  contacts: Contact[];
  isLoading: boolean;
  
  loadContacts: () => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  searchContacts: (query: string) => Promise<Contact[]>;
  getContactById: (id: string) => Contact | undefined;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isLoading: false,

  loadContacts: async () => {
    set({ isLoading: true });
    try {
      const database = await db.getDatabase();
      const contacts = await db.getAllContacts(database);
      set({ contacts, isLoading: false });
    } catch (error) {
      console.error('Failed to load contacts:', error);
      set({ isLoading: false });
    }
  },

  addContact: async (contact) => {
    try {
      const database = await db.getDatabase();
      await db.createContact(database, contact);
      await get().loadContacts();
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    }
  },

  updateContact: async (contact) => {
    try {
      const database = await db.getDatabase();
      await db.updateContact(database, contact);
      await get().loadContacts();
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  },

  deleteContact: async (id) => {
    try {
      const database = await db.getDatabase();
      await db.deleteContact(database, id);
      await get().loadContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  },

  searchContacts: async (query) => {
    try {
      const database = await db.getDatabase();
      return await db.searchContacts(database, query);
    } catch (error) {
      console.error('Failed to search contacts:', error);
      return [];
    }
  },

  getContactById: (id) => {
    return get().contacts.find((c) => c.id === id);
  },
}));

interface RecordingState {
  isRecording: boolean;
  recordingUri: string | null;
  transcript: string;
  isProcessing: boolean;
  
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  setTranscript: (transcript: string) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  recordingUri: null,
  transcript: '',
  isProcessing: false,

  startRecording: async () => {
    set({ isRecording: true });
  },

  stopRecording: async () => {
    set({ isRecording: false });
    return null;
  },

  setTranscript: (transcript) => set({ transcript }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  reset: () => set({ isRecording: false, recordingUri: null, transcript: '', isProcessing: false }),
}));

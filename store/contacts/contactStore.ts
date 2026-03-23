import { create } from 'zustand';
import { Contact } from '@/types';
import * as db from '@/db/operations';

export interface ContactState {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  
  loadContacts: () => Promise<void>;
  addContact: (contact: Contact) => Promise<void>;
  updateContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  searchContacts: (query: string) => Promise<Contact[]>;
  getContactById: (id: string) => Contact | undefined;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  isLoading: false,
  error: null,

  loadContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const database = await db.getDatabase();
      const contacts = await db.getAllContacts(database);
      set({ contacts, isLoading: false });
    } catch (error) {
      console.error('Failed to load contacts:', error);
      set({ error: '加载联系人失败', isLoading: false });
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

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

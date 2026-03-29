import { create } from 'zustand';
import { ActionItem } from '@/types';
import * as db from '@/db/operations';

export interface ActionItemState {
  actionItems: ActionItem[];
  isLoading: boolean;
  error: string | null;

  loadActionItems: (contactId?: string) => Promise<void>;
  loadPendingActionItems: (limit?: number) => Promise<void>;
  addActionItem: (actionItem: ActionItem) => Promise<void>;
  updateActionItem: (actionItem: ActionItem) => Promise<void>;
  deleteActionItem: (id: string) => Promise<void>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useActionItemStore = create<ActionItemState>((set, get) => ({
  actionItems: [],
  isLoading: false,
  error: null,

  loadActionItems: async (contactId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const database = await db.getDatabase();
      const actionItems = contactId
        ? await db.getActionItemsByContact(database, contactId)
        : await db.getAllActionItems(database);
      set({ actionItems, isLoading: false });
    } catch (error) {
      console.error('Failed to load action items:', error);
      set({ error: '加载待办事项失败', isLoading: false });
    }
  },

  loadPendingActionItems: async (limit?: number) => {
    set({ isLoading: true, error: null });
    try {
      const database = await db.getDatabase();
      const actionItems = await db.getPendingActionItems(database, limit);
      set({ actionItems, isLoading: false });
    } catch (error) {
      console.error('Failed to load pending action items:', error);
      set({ error: '加载待办事项失败', isLoading: false });
    }
  },

  addActionItem: async (actionItem: ActionItem) => {
    try {
      const database = await db.getDatabase();
      await db.createActionItem(database, actionItem);
      await get().loadActionItems(actionItem.relatedContactId);
    } catch (error) {
      console.error('Failed to add action item:', error);
      throw error;
    }
  },

  updateActionItem: async (actionItem: ActionItem) => {
    try {
      const database = await db.getDatabase();
      await db.updateActionItem(database, actionItem);
      set((state) => ({
        actionItems: state.actionItems.map((item) =>
          item.id === actionItem.id ? actionItem : item
        ),
      }));
    } catch (error) {
      console.error('Failed to update action item:', error);
      throw error;
    }
  },

  deleteActionItem: async (id: string) => {
    try {
      const database = await db.getDatabase();
      await db.deleteActionItem(database, id);
      set((state) => ({
        actionItems: state.actionItems.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete action item:', error);
      throw error;
    }
  },

  toggleComplete: async (id: string, completed: boolean) => {
    try {
      const database = await db.getDatabase();
      await db.toggleActionItemComplete(database, id, completed);
      set((state) => ({
        actionItems: state.actionItems.map((item) =>
          item.id === id ? { ...item, completed } : item
        ),
      }));
    } catch (error) {
      console.error('Failed to toggle action item:', error);
      throw error;
    }
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

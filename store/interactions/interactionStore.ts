import { create } from 'zustand';
import { Interaction } from '@/types';
import * as db from '@/db/operations';

export interface InteractionState {
  interactions: Interaction[];
  isLoading: boolean;
  error: string | null;

  loadInteractions: (contactId: string) => Promise<void>;
  addInteraction: (interaction: Interaction) => Promise<void>;
  updateInteraction: (interaction: Interaction) => Promise<void>;
  deleteInteraction: (id: string) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  interactions: [],
  isLoading: false,
  error: null,

  loadInteractions: async (contactId: string) => {
    set({ isLoading: true, error: null });
    try {
      const database = await db.getDatabase();
      const interactions = await db.getInteractionsByContact(database, contactId);
      set({ interactions, isLoading: false });
    } catch (error) {
      console.error('Failed to load interactions:', error);
      set({ error: '加载交往记录失败', isLoading: false });
    }
  },

  addInteraction: async (interaction: Interaction) => {
    try {
      const database = await db.getDatabase();
      await db.createInteraction(database, interaction);
      await get().loadInteractions(interaction.contactId);
    } catch (error) {
      console.error('Failed to add interaction:', error);
      throw error;
    }
  },

  updateInteraction: async (interaction: Interaction) => {
    try {
      const database = await db.getDatabase();
      await db.updateInteraction(database, interaction);
      await get().loadInteractions(interaction.contactId);
    } catch (error) {
      console.error('Failed to update interaction:', error);
      throw error;
    }
  },

  deleteInteraction: async (id: string) => {
    try {
      const database = await db.getDatabase();
      const interaction = get().interactions.find((i) => i.id === id);
      if (!interaction) {
        throw new Error('Interaction not found');
      }
      await db.deleteInteraction(database, id);
      set((state) => ({
        interactions: state.interactions.filter((i) => i.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete interaction:', error);
      throw error;
    }
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));

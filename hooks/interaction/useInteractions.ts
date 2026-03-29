import { useEffect, useState, useCallback } from 'react';
import { Interaction } from '@/types';
import { useInteractionStore } from '@/store/interactions/interactionStore';

export interface UseInteractionsReturn {
  interactions: Interaction[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addInteraction: (interaction: Interaction) => Promise<void>;
  updateInteraction: (interaction: Interaction) => Promise<void>;
  deleteInteraction: (id: string) => Promise<void>;
}

export const useInteractions = (contactId: string): UseInteractionsReturn => {
  const {
    interactions,
    isLoading,
    error,
    loadInteractions,
    addInteraction: storeAddInteraction,
    updateInteraction: storeUpdateInteraction,
    deleteInteraction: storeDeleteInteraction,
  } = useInteractionStore();

  useEffect(() => {
    if (contactId) {
      loadInteractions(contactId);
    }
  }, [contactId, loadInteractions]);

  const refresh = useCallback(async () => {
    if (contactId) {
      await loadInteractions(contactId);
    }
  }, [contactId, loadInteractions]);

  const addInteraction = useCallback(
    async (interaction: Interaction) => {
      await storeAddInteraction(interaction);
    },
    [storeAddInteraction]
  );

  const updateInteraction = useCallback(
    async (interaction: Interaction) => {
      await storeUpdateInteraction(interaction);
    },
    [storeUpdateInteraction]
  );

  const deleteInteraction = useCallback(
    async (id: string) => {
      await storeDeleteInteraction(id);
    },
    [storeDeleteInteraction]
  );

  return {
    interactions,
    isLoading,
    error,
    refresh,
    addInteraction,
    updateInteraction,
    deleteInteraction,
  };
};

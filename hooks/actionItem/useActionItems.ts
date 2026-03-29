import { useEffect, useState, useCallback } from 'react';
import { ActionItem } from '@/types';
import { useActionItemStore } from '@/store/actionItems/actionItemStore';

export interface UseActionItemsReturn {
  actionItems: ActionItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addActionItem: (actionItem: ActionItem) => Promise<void>;
  updateActionItem: (actionItem: ActionItem) => Promise<void>;
  deleteActionItem: (id: string) => Promise<void>;
  toggleComplete: (id: string, completed: boolean) => Promise<void>;
}

export const useActionItems = (contactId?: string): UseActionItemsReturn => {
  const {
    actionItems,
    isLoading,
    error,
    loadActionItems,
    addActionItem: storeAddActionItem,
    updateActionItem: storeUpdateActionItem,
    deleteActionItem: storeDeleteActionItem,
    toggleComplete: storeToggleComplete,
  } = useActionItemStore();

  useEffect(() => {
    loadActionItems(contactId);
  }, [contactId, loadActionItems]);

  const refresh = useCallback(async () => {
    await loadActionItems(contactId);
  }, [contactId, loadActionItems]);

  const addActionItem = useCallback(
    async (actionItem: ActionItem) => {
      await storeAddActionItem(actionItem);
    },
    [storeAddActionItem]
  );

  const updateActionItem = useCallback(
    async (actionItem: ActionItem) => {
      await storeUpdateActionItem(actionItem);
    },
    [storeUpdateActionItem]
  );

  const deleteActionItem = useCallback(
    async (id: string) => {
      await storeDeleteActionItem(id);
    },
    [storeDeleteActionItem]
  );

  const toggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      await storeToggleComplete(id, completed);
    },
    [storeToggleComplete]
  );

  return {
    actionItems,
    isLoading,
    error,
    refresh,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    toggleComplete,
  };
};

import { useEffect, useCallback } from 'react';
import { useContactStore } from '@/store';

export interface UseContactsReturn {
  contacts: import('@/types').Contact[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useContacts = (): UseContactsReturn => {
  const { contacts, isLoading, error, loadContacts } = useContactStore();

  useEffect(() => {
    if (contacts.length === 0 && !isLoading) {
      loadContacts();
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    isLoading,
    error,
    refresh,
  };
};

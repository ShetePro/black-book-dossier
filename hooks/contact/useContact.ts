import { useEffect, useState, useCallback } from 'react';
import { Contact } from '@/types';
import { useContactStore } from '@/store';

export interface UseContactReturn {
  contact: Contact | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useContact = (id: string): UseContactReturn => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { contacts, loadContacts } = useContactStore();

  useEffect(() => {
    const found = contacts.find((c) => c.id === id);
    if (found) {
      setContact(found);
      setIsLoading(false);
    } else if (!isLoading) {
      // Contact not found in cache, try loading from DB
      loadContacts().then(() => {
        const retry = useContactStore.getState().contacts.find((c) => c.id === id);
        if (retry) {
          setContact(retry);
        } else {
          setError('联系人不存在');
        }
        setIsLoading(false);
      });
    }
  }, [id, contacts]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadContacts();
    setIsLoading(false);
  }, [loadContacts]);

  return {
    contact,
    isLoading,
    error,
    refresh,
  };
};

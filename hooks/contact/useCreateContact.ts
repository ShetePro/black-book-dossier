import { useState, useCallback } from 'react';
import { Contact } from '@/types';
import { useContactStore } from '@/store';

export interface UseCreateContactReturn {
  createContact: (contact: Contact) => Promise<boolean>;
  isCreating: boolean;
  error: string | null;
}

export const useCreateContact = (): UseCreateContactReturn => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addContact } = useContactStore();

  const createContact = useCallback(async (contact: Contact): Promise<boolean> => {
    setIsCreating(true);
    setError(null);
    
    try {
      const { contacts } = useContactStore.getState();
      if (contacts.length >= 10) {
        setError('联系人数量已达上限（最多10个）');
        return false;
      }
      await addContact(contact);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建联系人失败';
      setError(message);
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [addContact]);

  return {
    createContact,
    isCreating,
    error,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { Contact } from '@/types';
import { useContactStore } from '@/store';

export interface UseContactSearchReturn {
  results: Contact[];
  isSearching: boolean;
  query: string;
  setQuery: (query: string) => void;
}

export const useContactSearch = (): UseContactSearchReturn => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { searchContacts, contacts } = useContactStore();

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await searchContacts(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, searchContacts]);

  return {
    results,
    isSearching,
    query,
    setQuery,
  };
};

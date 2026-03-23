import React from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Contact } from '@/types';
import { ContactCard } from './ContactCard';
import { ContactEmptyState } from './ContactEmptyState';
import { ContactSkeleton } from './ContactSkeleton';

interface ContactListProps {
  contacts: Contact[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onContactPress?: (contact: Contact) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onContactPress,
}) => {
  const colors = useThemeColor();

  if (isLoading) {
    return <ContactSkeleton count={5} />;
  }

  if (contacts.length === 0) {
    return <ContactEmptyState />;
  }

  return (
    <FlatList
      data={contacts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ContactCard contact={item} onPress={onContactPress} />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh && (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
});

export default ContactList;

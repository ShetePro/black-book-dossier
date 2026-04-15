import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Contact } from '@/types';
import { ContactCard } from './ContactCard';
import { ContactEmptyState } from './ContactEmptyState';
import { ContactSkeleton } from './ContactSkeleton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ESTIMATED_ITEM_HEIGHT = 80;

interface ContactListProps {
  contacts: Contact[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onContactPress?: (contact: Contact) => void;
  onAddContact?: () => void;
  onImportContact?: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onContactPress,
  onAddContact,
  onImportContact,
}) => {
  const colors = useThemeColor();

  const renderItem = useCallback(
    ({ item }: { item: Contact }) => (
      <ContactCard contact={item} onPress={onContactPress} />
    ),
    [onContactPress]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ESTIMATED_ITEM_HEIGHT,
      offset: ESTIMATED_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: Contact) => item.id, []);

  if (isLoading) {
    return <ContactSkeleton count={5} />;
  }

  if (contacts.length === 0) {
    return <ContactEmptyState onAddContact={onAddContact} onImportContact={onImportContact} />;
  }

  return (
    <FlatList
      data={contacts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      initialNumToRender={Math.ceil(SCREEN_HEIGHT / ESTIMATED_ITEM_HEIGHT)}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      getItemLayout={getItemLayout}
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

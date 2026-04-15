import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useContacts, useContactSearch } from '@/hooks/contact';
import { ContactList } from '@/components/contact';
import { Contact } from '@/types';
import { importDeviceContacts, showImportPreview } from '@/services/contactImport';
import { useContactStore } from '@/store';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const SearchEmptyState: React.FC<{ query: string; colors: ReturnType<typeof useThemeColor>; t: any }> = ({ query, colors, t }) => (
  <View style={styles.searchEmptyContainer}>
    <Ionicons name="search-outline" size={48} color={colors.textMuted} />
    <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>
      {t('contacts.searchNoResults')}
    </Text>
    <Text style={[styles.searchEmptySubtitle, { color: colors.textMuted }]}>
      {t('contacts.searchQueryNoResults', { query })}
    </Text>
  </View>
);

export default function ContactsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { contacts, isLoading, refresh } = useContacts();
  const { addContact } = useContactStore();
  const [isImporting, setIsImporting] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const { results: searchResults, isSearching, query, setQuery } = useContactSearch();

  const headerY = useSharedValue(-20);
  const headerOpacity = useSharedValue(0);
  const searchExpandProgress = useSharedValue(0);
  const searchInputRef = useRef<TextInput>(null);
  const closeSearchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    headerY.value = withSpring(0, { damping: 15 });
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOpacity.value,
  }));

  const searchOverlayStyle = useAnimatedStyle(() => ({
    opacity: searchExpandProgress.value,
    pointerEvents: searchExpandProgress.value > 0.5 ? 'auto' : 'none' as const,
  }));

  const searchBarExpandStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          searchExpandProgress.value,
          [0, 1],
          [1, 1.02],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const searchInputContainerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      searchExpandProgress.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          searchExpandProgress.value,
          [0, 1],
          [20, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const handleContactPress = useCallback((contact: Contact) => {
    if (isSearchActive && closeSearchRef.current) {
      closeSearchRef.current();
    }
    router.push(`/(views)/contact/${contact.id}`);
  }, [isSearchActive, router]);

  const openSearch = useCallback(() => {
    setIsSearchActive(true);
    searchExpandProgress.value = withTiming(1, { duration: 300 });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    searchExpandProgress.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setIsSearchActive)(false);
        runOnJS(setQuery)('');
      }
    });
  }, [setQuery]);

  useEffect(() => {
    closeSearchRef.current = closeSearch;
  }, [closeSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
  }, [setQuery]);

  const handleImportContacts = async () => {
    if (isImporting) return;

    setIsImporting(true);
    try {
      const importedContacts = await importDeviceContacts();

      if (importedContacts.length === 0) {
        Alert.alert(t('common.notice'), t('contacts.importNoContacts'));
        return;
      }

      showImportPreview(importedContacts, async (contactsToImport) => {
        try {
          let successCount = 0;
          let failCount = 0;

          for (const contact of contactsToImport) {
            try {
              await addContact(contact);
              successCount++;
            } catch (error) {
              console.error('Failed to add contact:', contact.name, error);
              failCount++;
            }
          }

          if (failCount === 0) {
            Alert.alert(t('common.success'), t('contacts.importSuccess', { count: successCount }));
          } else {
            Alert.alert(
              t('contacts.importCompleted'),
              `${t('contacts.importSuccessCount', { success: successCount })}\n${t('contacts.importFailCount', { fail: failCount })}`,
              [{ text: t('common.ok') }]
            );
          }
        } catch (error) {
          console.error('Import preview callback error:', error);
          Alert.alert(t('contacts.importError'), t('contacts.importSaveError'));
        }
      });
    } catch (error) {
      console.error('Import contacts handler error:', error);
      Alert.alert(t('contacts.importError'), t('contacts.importReadError'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('contacts.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {contacts.length > 0
              ? t('contacts.totalCount', { count: contacts.length })
              : t('contacts.noContacts')}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
            onPress={handleImportContacts}
            disabled={isImporting}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(views)/contact/new')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#0a0a0a" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <AnimatedTouchable
        style={[
          styles.searchBar,
          searchBarExpandStyle,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.8}
        onPress={openSearch}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <Text style={[styles.searchText, { color: colors.textMuted }]}>
          {t('contacts.search')}
        </Text>
      </AnimatedTouchable>

      <ContactList
        contacts={contacts}
        isLoading={isLoading}
        onRefresh={refresh}
        onContactPress={handleContactPress}
        onAddContact={() => router.push('/(views)/contact/new')}
        onImportContact={handleImportContacts}
      />

      <Animated.View
        style={[
          styles.searchOverlay,
          searchOverlayStyle,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.searchHeader}>
          <Animated.View
            style={[
              styles.searchInputContainer,
              searchInputContainerStyle,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('contacts.search')}
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </Animated.View>
          <TouchableOpacity style={styles.cancelButton} onPress={closeSearch}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContent}>
          {isSearching ? (
            <ContactList contacts={[]} isLoading={true} />
          ) : query.trim() && searchResults.length === 0 ? (
            <SearchEmptyState query={query} colors={colors} t={t} />
          ) : (
            <ContactList
              contacts={searchResults}
              isLoading={false}
              onContactPress={handleContactPress}
            />
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  searchText: {
    fontSize: 14,
    flex: 1,
  },
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0a',
    zIndex: 100,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
  },
  searchContent: {
    flex: 1,
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  searchEmptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
  },
  searchEmptySubtitle: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});

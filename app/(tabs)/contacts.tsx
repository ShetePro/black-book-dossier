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

// 搜索结果空状态组件
const SearchEmptyState: React.FC<{ query: string; colors: ReturnType<typeof useThemeColor> }> = ({ query, colors }) => (
  <View style={styles.searchEmptyContainer}>
    <Ionicons name="search-outline" size={48} color={colors.textMuted} />
    <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>
      未找到联系人
    </Text>
    <Text style={[styles.searchEmptySubtitle, { color: colors.textMuted }]}>
      搜索 "{query}" 没有结果
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

  // 搜索 hook
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

  // 搜索界面展开动画
  const searchOverlayStyle = useAnimatedStyle(() => ({
    opacity: searchExpandProgress.value,
    pointerEvents: searchExpandProgress.value > 0.5 ? 'auto' : 'none' as const,
  }));

  // 搜索栏展开动画
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

  // 搜索输入框动画
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

  // 打开搜索
  const openSearch = useCallback(() => {
    setIsSearchActive(true);
    searchExpandProgress.value = withTiming(1, { duration: 300 });
    // 延迟聚焦，等待动画开始
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // 关闭搜索
  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    searchExpandProgress.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setIsSearchActive)(false);
        runOnJS(setQuery)('');
      }
    });
  }, [setQuery]);

  // 存储 closeSearch 到 ref 供 handleContactPress 使用
  useEffect(() => {
    closeSearchRef.current = closeSearch;
  }, [closeSearch]);

  // 清空搜索
  const clearSearch = useCallback(() => {
    setQuery('');
  }, [setQuery]);

  const handleImportContacts = async () => {
    if (isImporting) return;
    
    setIsImporting(true);
    try {
      const importedContacts = await importDeviceContacts();
      
      if (importedContacts.length === 0) {
        Alert.alert('提示', '未找到可导入的联系人');
        return;
      }

      showImportPreview(importedContacts, async (contactsToImport) => {
        try {
          for (const contact of contactsToImport) {
            await addContact(contact as Contact);
          }
          Alert.alert('导入成功', `成功导入 ${contactsToImport.length} 个联系人`);
        } catch (error) {
          Alert.alert('导入失败', '保存联系人时出错');
        }
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('contacts.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {contacts.length > 0
              ? `${contacts.length} ${t('contacts.all')}`
              : t('contacts.noContacts')}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.importButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleImportContacts}
            disabled={isImporting}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(views)/recording')}
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
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <Text style={[styles.searchText, { color: colors.textMuted }]}>
          {t('contacts.search')}
        </Text>
      </AnimatedTouchable>

      <ContactList
        contacts={contacts}
        isLoading={isLoading}
        onRefresh={refresh}
        onContactPress={handleContactPress}
      />

      {/* 搜索覆盖层 */}
      <Animated.View
        style={[
          styles.searchOverlay,
          searchOverlayStyle,
          { backgroundColor: colors.background },
        ]}
      >
        {/* 搜索头部 */}
        <View style={styles.searchHeader}>
          <Animated.View
            style={[
              styles.searchInputContainer,
              searchInputContainerStyle,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={20} color={colors.textMuted} />
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
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </Animated.View>
          <TouchableOpacity style={styles.cancelButton} onPress={closeSearch}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              取消
            </Text>
          </TouchableOpacity>
        </View>

        {/* 搜索结果 */}
        <View style={styles.searchContent}>
          {isSearching ? (
            <ContactList contacts={[]} isLoading={true} />
          ) : query.trim() && searchResults.length === 0 ? (
            <SearchEmptyState query={query} colors={colors} />
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
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: 'Georgia',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  importButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  searchText: {
    fontSize: 15,
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    borderRadius: 12,
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  searchEmptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';

import { ActionItemList } from '@/components/actionItem/ActionItemList';
import { useActionItems } from '@/hooks/actionItem';
import { useContacts } from '@/hooks/contact';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ActionItem } from '@/types';

type FilterType = 'all' | 'pending' | 'completed';

export default function ActionItemManagementScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { t } = useTranslation();
  const { actionItems, isLoading, toggleComplete, deleteActionItem } = useActionItems();
  const { contacts } = useContacts();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'pending':
        return actionItems.filter((item) => !item.completed);
      case 'completed':
        return actionItems.filter((item) => item.completed);
      default:
        return actionItems;
    }
  }, [actionItems, filter]);

  const contactMap = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [contacts]);

  const itemsWithContactName = useMemo(() => {
    return filteredItems.map((item) => ({
      ...item,
      contactName: item.relatedContactId ? contactMap.get(item.relatedContactId) : undefined,
    }));
  }, [filteredItems, contactMap]);

  const handleToggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      await toggleComplete(id, completed);
    },
    [toggleComplete]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteActionItem(id);
    },
    [deleteActionItem]
  );

  const handleItemPress = useCallback(
    (item: ActionItem) => {
      router.push({
        pathname: '/(views)/action-item/new',
        params: { itemId: item.id },
      });
    },
    [router]
  );

  const handleAdd = useCallback(() => {
    router.push('/(views)/action-item/new');
  }, [router]);

  const getEmptyText = useCallback((): string => {
    switch (filter) {
      case 'pending':
        return t('actionItem.emptyPending');
      case 'completed':
        return t('actionItem.emptyCompleted');
      default:
        return t('actionItem.empty');
    }
  }, [filter, t]);

  const getEmptyHint = useCallback((): string => {
    switch (filter) {
      case 'pending':
        return t('actionItem.emptyPendingHint');
      case 'completed':
        return t('actionItem.emptyCompletedHint');
      default:
        return t('actionItem.emptyHint');
    }
  }, [filter, t]);

  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('actionItem.filterAll') },
    { key: 'pending', label: t('actionItem.filterPending') },
    { key: 'completed', label: t('actionItem.filterCompleted') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('actionItem.title')}
        </Text>

        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.iconButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="#0a0a0a" />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[
              styles.tab,
              filter === tab.key && {
                backgroundColor: `${colors.primary}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: filter === tab.key ? colors.primary : colors.textMuted,
                  fontWeight: filter === tab.key ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isLoading && actionItems.length > 0 && (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.statsBar, { borderColor: colors.border }]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {actionItems.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t('actionItem.total')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#22c55e' }]}>
              {actionItems.filter((i) => i.completed).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t('actionItem.completed')}
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
              {actionItems.filter((i) => !i.completed).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t('actionItem.pending')}
            </Text>
          </View>
        </Animated.View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {t('actionItem.loading')}
          </Text>
        </View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(300)}
          layout={Layout.springify()}
          style={styles.listContainer}
        >
          <ActionItemList
            actionItems={itemsWithContactName as ActionItem[]}
            isLoading={false}
            onToggleComplete={handleToggleComplete}
            onDelete={handleDelete}
            onItemPress={handleItemPress}
            emptyText={getEmptyText()}
            scrollable={false}
          />
          {filteredItems.length === 0 && (
            <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
              {getEmptyHint()}
            </Text>
          )}
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
});

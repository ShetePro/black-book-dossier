import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { ActionItem } from '@/types';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ActionItemListProps {
  actionItems: ActionItem[];
  isLoading?: boolean;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onItemPress?: (actionItem: ActionItem) => void;
  emptyText?: string;
}

const priorityConfig = {
  high: {
    color: '#ef4444',
    label: '高',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  medium: {
    color: '#f59e0b',
    label: '中',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  low: {
    color: '#6b7280',
    label: '低',
    bgColor: 'rgba(107, 114, 128, 0.15)',
  },
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ActionItemList: React.FC<ActionItemListProps> = ({
  actionItems,
  isLoading,
  onToggleComplete,
  onDelete,
  onItemPress,
  emptyText = '暂无待办事项',
}) => {
  const colors = useThemeColor();

  const handleLongPress = useCallback(
    (actionItem: ActionItem) => {
      Alert.alert(
        '删除待办',
        `确定要删除 "${actionItem.description}" 吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: () => onDelete(actionItem.id),
          },
        ]
      );
    },
    [onDelete]
  );

  const formatDate = useCallback((timestamp?: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.setDate(now.getDate() + 1)).toDateString() === date.toDateString();
    
    if (isToday) return '今天';
    if (isTomorrow) return '明天';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }, []);

  const isOverdue = useCallback((timestamp?: number): boolean => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    date.setHours(23, 59, 59, 999);
    return date.getTime() < Date.now();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ActionItem }) => {
      const priority = priorityConfig[item.priority];
      const overdue = !item.completed && isOverdue(item.dueDate);

      return (
        <AnimatedTouchable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}
          style={[
            styles.item,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: item.completed ? 0.6 : 1,
            },
          ]}
          onPress={() => onItemPress?.(item)}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={500}
          activeOpacity={0.8}
        >
          <TouchableOpacity
            style={[
              styles.checkbox,
              {
                borderColor: item.completed ? colors.primary : colors.border,
                backgroundColor: item.completed ? colors.primary : 'transparent',
              },
            ]}
            onPress={() => onToggleComplete(item.id, !item.completed)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {item.completed && (
              <Ionicons name="checkmark" size={14} color="#0a0a0a" />
            )}
          </TouchableOpacity>

          <View style={styles.content}>
            <Text
              style={[
                styles.description,
                {
                  color: colors.text,
                  textDecorationLine: item.completed ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>

            <View style={styles.meta}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: priority.bgColor },
                ]}
              >
                <Text style={[styles.priorityText, { color: priority.color }]}>
                  {priority.label}
                </Text>
              </View>

              {item.dueDate && (
                <View style={styles.dueDate}>
                  <Ionicons
                    name="calendar-outline"
                    size={12}
                    color={overdue ? '#ef4444' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.dueDateText,
                      {
                        color: overdue ? '#ef4444' : colors.textMuted,
                        fontWeight: overdue ? '600' : '400',
                      },
                    ]}
                  >
                    {overdue ? '已逾期 · ' : ''}
                    {formatDate(item.dueDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </AnimatedTouchable>
      );
    },
    [colors, onToggleComplete, handleLongPress, onItemPress, formatDate, isOverdue]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: `${colors.primary}15` },
          ]}
        >
          <Ionicons name="checkbox-outline" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {emptyText}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          长按录音按钮记录待办事项
        </Text>
      </View>
    );
  }, [isLoading, colors, emptyText]);

  return (
    <FlatList
      data={actionItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});

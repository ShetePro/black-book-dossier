import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { reminderService, Reminder, ReminderSettings } from '@/services/reminders/reminderService';

const ReminderItem: React.FC<{
  reminder: Reminder;
  onPress: () => void;
  onDismiss: () => void;
  colors: ReturnType<typeof useThemeColor>;
}> = ({ reminder, onPress, onDismiss, colors }) => {
  const priorityColors = {
    high: colors.danger,
    medium: colors.warning,
    low: colors.success,
  };

  const icons = {
    dormant_contact: 'people-outline',
    birthday: 'gift-outline',
    anniversary: 'calendar-outline',
    suggestion: 'bulb-outline',
  };

  return (
    <Animated.View entering={FadeInUp.duration(300)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center p-4 mb-2 bg-surface rounded-xl mx-4"
      >
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: priorityColors[reminder.priority] + '20' }}
        >
          <Ionicons
            name={icons[reminder.type] as any}
            size={24}
            color={priorityColors[reminder.priority]}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-elite flex-1">
              {reminder.title}
            </Text>
            {reminder.priority === 'high' && (
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: colors.danger + '20' }}
              >
                <Text className="text-xs" style={{ color: colors.danger }}>
                  重要
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-elite-muted mt-1" numberOfLines={2}>
            {reminder.description}
          </Text>
          {reminder.contactName && (
            <Text className="text-xs text-primary mt-1">
              联系人: {reminder.contactName}
            </Text>
          )}
        </View>

        <TouchableOpacity onPress={onDismiss} className="p-2 ml-2">
          <Ionicons name="close-circle-outline" size={24} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RemindersScreen(): React.ReactElement {
  const router = useRouter();
  const colors = useThemeColor();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await reminderService.init();
      const [remindersData, settingsData] = await Promise.all([
        reminderService.checkReminders(),
        Promise.resolve(reminderService.getSettings()),
      ]);
      setReminders(remindersData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  const handleDismiss = useCallback((reminderId: string) => {
    reminderService.dismissReminder(reminderId);
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  }, []);

  const handleReminderPress = useCallback((reminder: Reminder) => {
    if (reminder.contactId) {
      router.push(`/(views)/contact/${reminder.contactId}`);
    }
  }, [router]);

  const updateSettings = useCallback(async (newSettings: Partial<ReminderSettings>) => {
    await reminderService.saveSettings(newSettings);
    setSettings(prev => prev ? { ...prev, ...newSettings } : null);
  }, []);

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-4">
        <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
      </View>
      <Text className="text-lg font-medium text-elite mb-2">
        暂无提醒
      </Text>
      <Text className="text-sm text-elite-muted text-center">
        您的关系维护状况良好，继续保持！
      </Text>
    </View>
  );

  const renderSettings = () => (
    <View className="px-4 mb-6">
      <Text className="text-sm font-medium text-elite-muted mb-3">
        提醒设置
      </Text>
      <View className="bg-surface rounded-xl p-4">
        <View className="flex-row items-center justify-between py-3 border-b border-elite-muted/10">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text className="text-elite ml-3">休眠提醒阈值</Text>
          </View>
          <Text className="text-elite-muted">
            {settings?.dormantContactThreshold || 90} 天
          </Text>
        </View>

        <View className="flex-row items-center justify-between py-3 border-b border-elite-muted/10">
          <View className="flex-row items-center">
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text className="text-elite ml-3">推送通知</Text>
          </View>
          <Switch
            value={settings?.enablePushNotifications ?? true}
            onValueChange={(value) => updateSettings({ enablePushNotifications: value })}
            trackColor={{ false: colors.textMuted, true: colors.primary }}
          />
        </View>

        <View className="flex-row items-center justify-between py-3">
          <View className="flex-row items-center">
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            <Text className="text-elite ml-3">检查频率</Text>
          </View>
          <Text className="text-elite-muted">
            {settings?.reminderFrequency === 'daily' ? '每天' :
             settings?.reminderFrequency === 'weekly' ? '每周' : '每月'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-elite-muted/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-elite">智能提醒</Text>
        <TouchableOpacity onPress={loadData} className="p-2">
          <Ionicons name="refresh-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {renderSettings()}

      <View className="px-4 mb-2">
        <Text className="text-lg font-semibold text-elite">
          待处理提醒 ({reminders.length})
        </Text>
      </View>

      {reminders.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={reminders}
          renderItem={({ item }) => (
            <ReminderItem
              reminder={item}
              onPress={() => handleReminderPress(item)}
              onDismiss={() => handleDismiss(item.id)}
              colors={colors}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerClassName="pb-20"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getDatabase } from '@/db/operations';
import { getActivities, getActivityStats } from '@/services/db/activities';
import { getAllActivityTypes } from '@/services/db/activityTypes';
import { Activity, ActivityType, ActivityStats } from '@/types/database';
import dayjs from 'dayjs';

interface ActivityWithType extends Activity {
  typeInfo?: ActivityType;
}

const ActivityItem: React.FC<{
  activity: ActivityWithType;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColor>;
}> = ({ activity, onPress, colors }) => {
  const date = dayjs(activity.startedAt);
  const isToday = date.isSame(dayjs(), 'day');
  const isYesterday = date.isSame(dayjs().subtract(1, 'day'), 'day');

  let dateText = date.format('MM月DD日');
  if (isToday) dateText = '今天';
  else if (isYesterday) dateText = '昨天';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        entering={FadeInUp.duration(300)}
        className="flex-row items-center p-4 mb-2 bg-surface rounded-xl mx-4"
      >
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          style={{
            backgroundColor: activity.typeInfo?.color
              ? `${activity.typeInfo.color}20`
              : colors.primary + '20',
          }}
        >
          <Ionicons
            name={
              (activity.typeInfo?.icon as any) ||
              'calendar-outline'
            }
            size={24}
            color={activity.typeInfo?.color || colors.primary}
          />
        </View>

        <View className="flex-1">
          <Text className="text-base font-semibold text-elite" numberOfLines={1}>
            {activity.title}
          </Text>
          <Text className="text-sm text-elite-muted mt-1">
            {dateText} · {activity.activityType}
            {activity.locationName ? ` · ${activity.locationName}` : ''}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  colors: ReturnType<typeof useThemeColor>;
}> = ({ title, value, icon, colors }) => (
  <View className="bg-surface rounded-xl p-4 flex-1 mx-2">
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon as any} size={16} color={colors.primary} />
      <Text className="text-xs text-elite-muted ml-1">{title}</Text>
    </View>
    <Text className="text-2xl font-bold text-elite">{value}</Text>
  </View>
);

export default function ActivitiesScreen(): React.ReactElement {
  const router = useRouter();
  const colors = useThemeColor();
  const [activities, setActivities] = useState<ActivityWithType[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const db = await getDatabase();

      const [activitiesData, typesData, statsData] = await Promise.all([
        getActivities(db, { limit: 50 }),
        getAllActivityTypes(db),
        getActivityStats(db),
      ]);

      const activitiesWithType = activitiesData.map(activity => ({
        ...activity,
        typeInfo: typesData.find(t => t.name === activity.activityType),
      }));

      setActivities(activitiesWithType);
      setActivityTypes(typesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load activities:', error);
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

  const filteredActivities = selectedType
    ? activities.filter(a => a.activityType === selectedType)
    : activities;

  const renderHeader = () => (
    <View>
      <View className="flex-row px-2 mb-4">
        <StatCard
          title="总活动"
          value={stats?.totalCount || 0}
          icon="calendar"
          colors={colors}
        />
        <StatCard
          title="活动类型"
          value={Object.keys(stats?.byType || {}).length}
          icon="grid"
          colors={colors}
        />
      </View>

      <View className="px-4 mb-4">
        <Text className="text-sm font-medium text-elite-muted mb-2">
          筛选活动类型
        </Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: '全部', icon: 'apps', color: colors.primary }, ...activityTypes]}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedType(item.id === 'all' ? null : item.name)}
              className={`mr-2 px-4 py-2 rounded-full border ${
                (item.id === 'all' && !selectedType) || item.name === selectedType
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-elite-muted/20'
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={
                    (item.id === 'all' && !selectedType) || item.name === selectedType
                      ? colors.background
                      : item.color || colors.text
                  }
                />
                <Text
                  className={`text-sm ml-1 ${
                    (item.id === 'all' && !selectedType) || item.name === selectedType
                      ? 'text-background'
                      : 'text-elite'
                  }`}
                >
                  {item.name === 'all' ? '全部' : item.name}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <View className="px-4 mb-2">
        <Text className="text-lg font-semibold text-elite">
          活动记录
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-4">
        <Ionicons name="calendar-outline" size={40} color={colors.textMuted} />
      </View>
      <Text className="text-lg font-medium text-elite mb-2">
        暂无活动记录
      </Text>
      <Text className="text-sm text-elite-muted text-center">
        点击右下角按钮创建您的第一个活动
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-elite-muted/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-elite">活动记录</Text>
        <TouchableOpacity onPress={() => {}} className="p-2">
          <Ionicons name="filter-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {activities.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredActivities}
          renderItem={({ item }) => (
            <ActivityItem
              activity={item}
              onPress={() => router.push(`/(views)/activities/${item.id}`)}
              colors={colors}
            />
          )}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
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

      <TouchableOpacity
        onPress={() => router.push('/(views)/activities/new')}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
        style={{ shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 8 }}
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

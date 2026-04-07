import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getDatabase } from '@/db/operations';
import { getActivityStats } from '@/services/db/activities';
import { getMostActiveContacts } from '@/services/db/contactQueries';
import { ActivityStats } from '@/types/database';
import dayjs from 'dayjs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  colors: ReturnType<typeof useThemeColor>;
}> = ({ title, value, subtitle, icon, colors }) => (
  <View className="bg-surface rounded-xl p-4 flex-1 mx-2">
    <View className="flex-row items-center mb-2">
      <Ionicons name={icon as any} size={20} color={colors.primary} />
      <Text className="text-xs text-elite-muted ml-2">{title}</Text>
    </View>
    <Text className="text-2xl font-bold text-elite">{value}</Text>
    {subtitle && (
      <Text className="text-xs text-elite-muted mt-1">{subtitle}</Text>
    )}
  </View>
);

const SimpleBarChart: React.FC<{
  data: { label: string; value: number }[];
  colors: ReturnType<typeof useThemeColor>;
}> = ({ data, colors }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View className="py-2">
      {data.map((item, index) => (
        <View key={index} className="mb-3">
          <View className="flex-row items-center mb-1">
            <Text className="text-xs text-elite-muted w-12">{item.label}</Text>
            <View className="flex-1 h-6 bg-elite-muted/10 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
            <Text className="text-xs text-elite ml-2 w-8 text-right">{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const ContactRankItem: React.FC<{
  rank: number;
  name: string;
  activityCount: number;
  colors: ReturnType<typeof useThemeColor>;
}> = ({ rank, name, activityCount, colors }) => (
  <View className="flex-row items-center py-3 border-b border-elite-muted/10">
    <View
      className="w-8 h-8 rounded-full items-center justify-center mr-3"
      style={{
        backgroundColor:
          rank === 1 ? colors.primary + '30' :
          rank === 2 ? colors.warning + '30' :
          rank === 3 ? colors.success + '30' :
          colors.surface,
      }}
    >
      <Text
        className="font-bold"
        style={{
          color:
            rank === 1 ? colors.primary :
            rank === 2 ? colors.warning :
            rank === 3 ? colors.success :
            colors.textMuted,
        }}
      >
        {rank}
      </Text>
    </View>
    <Text className="flex-1 text-elite font-medium">{name}</Text>
    <Text className="text-elite-muted">{activityCount} 次</Text>
  </View>
);

export default function StatisticsScreen(): React.ReactElement {
  const router = useRouter();
  const colors = useThemeColor();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [topContacts, setTopContacts] = useState<Array<{ contactId: string; contactName: string; activityCount: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const loadData = useCallback(async () => {
    try {
      const db = await getDatabase();
      const [statsData, contactsData] = await Promise.all([
        getActivityStats(db),
        getMostActiveContacts(db, 10),
      ]);
      setStats(statsData);
      setTopContacts(contactsData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getActivityTypeData = () => {
    if (!stats?.byType) return [];

    return Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ label: name, value }));
  };

  const getMonthlyData = () => {
    if (!stats?.byMonth) return [];

    return Object.entries(stats.byMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, value]) => ({
        label: dayjs(month).format('MM月'),
        value,
      }));
  };

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
        <Text className="text-lg font-semibold text-elite">数据统计</Text>
        <TouchableOpacity onPress={loadData} className="p-2">
          <Ionicons name="refresh-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        <Animated.View entering={FadeInUp.duration(300)}>
          <View className="flex-row px-2 py-4">
            <StatCard
              title="总活动"
              value={stats?.totalCount || 0}
              subtitle="累计记录"
              icon="calendar"
              colors={colors}
            />
            <StatCard
              title="活动类型"
              value={Object.keys(stats?.byType || {}).length}
              subtitle="不同类型"
              icon="grid"
              colors={colors}
            />
            <StatCard
              title="本月活动"
              value={Object.entries(stats?.byMonth || {})
                .filter(([month]) => dayjs(month).isSame(dayjs(), 'month'))
                .reduce((sum, [, count]) => sum + count, 0)}
              subtitle={dayjs().format('YYYY年MM月')}
              icon="trending-up"
              colors={colors}
            />
          </View>

          <View className="px-4 mb-4">
            <View className="flex-row bg-surface rounded-xl p-1">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  onPress={() => setTimeRange(range)}
                  className={`flex-1 py-2 rounded-lg ${
                    timeRange === range ? 'bg-primary' : ''
                  }`}
                >
                  <Text
                    className={`text-center text-sm ${
                      timeRange === range ? 'text-background font-medium' : 'text-elite-muted'
                    }`}
                  >
                    {range === '7d' ? '7天' :
                     range === '30d' ? '30天' :
                     range === '90d' ? '90天' : '1年'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {getActivityTypeData().length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-lg font-semibold text-elite mb-4">
                活动类型分布
              </Text>
              <View className="bg-surface rounded-xl p-4">
                <SimpleBarChart data={getActivityTypeData()} colors={colors} />
              </View>
            </View>
          )}

          {getMonthlyData().length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-lg font-semibold text-elite mb-4">
                月度趋势
              </Text>
              <View className="bg-surface rounded-xl p-4">
                <SimpleBarChart data={getMonthlyData()} colors={colors} />
              </View>
            </View>
          )}

          {topContacts.length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-lg font-semibold text-elite mb-4">
                互动排行榜
              </Text>
              <View className="bg-surface rounded-xl p-4">
                {topContacts.map((contact, index) => (
                  <ContactRankItem
                    key={contact.contactId}
                    rank={index + 1}
                    name={contact.contactName}
                    activityCount={contact.activityCount}
                    colors={colors}
                  />
                ))}
              </View>
            </View>
          )}

          {stats?.byContact && stats.byContact.length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-lg font-semibold text-elite mb-4">
                活动类型详情
              </Text>
              <View className="bg-surface rounded-xl p-4">
                {Object.entries(stats.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <View
                      key={type}
                      className="flex-row items-center justify-between py-3 border-b border-elite-muted/10"
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <Text className="text-elite capitalize">{type}</Text>
                      </View>
                      <Text className="text-elite-muted">{count} 次</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          <View className="px-4 py-8">
            <Text className="text-xs text-elite-muted text-center">
              数据最后更新于 {dayjs().format('YYYY-MM-DD HH:mm')}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

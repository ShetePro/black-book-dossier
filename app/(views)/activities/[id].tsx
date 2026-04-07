import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getDatabase } from '@/db/operations';
import { getActivityWithParticipants, deleteActivity } from '@/services/db/activities';
import { getActivityTypeByName } from '@/services/db/activityTypes';
import { ActivityWithParticipants, ActivityType } from '@/types/database';
import dayjs from 'dayjs';

const ParticipantAvatar: React.FC<{
  name: string;
  avatar?: string | null;
  colors: ReturnType<typeof useThemeColor>;
}> = ({ name, avatar, colors }) => (
  <View className="items-center mr-4">
    <View className="w-12 h-12 rounded-full bg-surface border border-elite-muted/20 items-center justify-center mb-1">
      {avatar ? (
        <Text>Avatar</Text>
      ) : (
        <Text className="text-lg font-semibold text-elite">
          {name.charAt(0)}
        </Text>
      )}
    </View>
    <Text className="text-xs text-elite-muted" numberOfLines={1}>
      {name}
    </Text>
  </View>
);

const InfoRow: React.FC<{
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColor>;
}> = ({ icon, label, value, colors }) => (
  <View className="flex-row items-center py-3 border-b border-elite-muted/10">
    <View className="w-8 h-8 rounded-lg bg-surface items-center justify-center mr-3">
      <Ionicons name={icon as any} size={16} color={colors.primary} />
    </View>
    <View className="flex-1">
      <Text className="text-xs text-elite-muted">{label}</Text>
      <Text className="text-sm text-elite">{value}</Text>
    </View>
  </View>
);

export default function ActivityDetailScreen(): React.ReactElement {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColor();
  const [activity, setActivity] = useState<ActivityWithParticipants | null>(null);
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadActivity = useCallback(async () => {
    if (!id) return;

    try {
      const db = await getDatabase();
      const activityData = await getActivityWithParticipants(db, id);

      if (activityData) {
        setActivity(activityData);
        const typeData = await getActivityTypeByName(db, activityData.activityType);
        setActivityType(typeData);
      }
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      '删除活动',
      '确定要删除这个活动吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await deleteActivity(db, id);
              router.back();
            } catch (error) {
              console.error('Failed to delete activity:', error);
              Alert.alert('错误', '删除活动失败');
            }
          },
        },
      ]
    );
  }, [id, router]);

  const handleEdit = useCallback(() => {
    router.push(`/(views)/activities/edit?id=${id}`);
  }, [id, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text className="text-lg font-medium text-elite mt-4">
            活动不存在
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 px-6 py-2 bg-primary rounded-full"
          >
            <Text className="text-background font-medium">返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const startDate = dayjs(activity.startedAt);
  const endDate = activity.endedAt ? dayjs(activity.endedAt) : null;
  const duration = endDate
    ? endDate.diff(startDate, 'minute')
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-elite-muted/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-elite">活动详情</Text>
        <View className="flex-row">
          <TouchableOpacity onPress={handleEdit} className="p-2 mr-2">
            <Ionicons name="create-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} className="p-2">
            <Ionicons name="trash-outline" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        <Animated.View entering={FadeInUp.duration(300)}>
          <View className="px-4 py-6 items-center">
            <View
              className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
              style={{
                backgroundColor: activityType?.color
                  ? `${activityType.color}30`
                  : colors.primary + '30',
              }}
            >
              <Ionicons
                name={(activityType?.icon as any) || 'calendar'}
                size={40}
                color={activityType?.color || colors.primary}
              />
            </View>
            <Text className="text-2xl font-bold text-elite text-center">
              {activity.title}
            </Text>
            <Text className="text-sm text-elite-muted mt-2">
              {activity.activityType}
            </Text>
          </View>

          <View className="px-4 mb-6">
            <View className="bg-surface rounded-xl p-4">
              <InfoRow
                icon="calendar-outline"
                label="日期"
                value={startDate.format('YYYY年MM月DD日')}
                colors={colors}
              />
              <InfoRow
                icon="time-outline"
                label="时间"
                value={`${startDate.format('HH:mm')}${endDate ? ` - ${endDate.format('HH:mm')}` : ''}`}
                colors={colors}
              />
              {duration && (
                <InfoRow
                  icon="hourglass-outline"
                  label="时长"
                  value={`${Math.floor(duration / 60)}小时 ${duration % 60}分钟`}
                  colors={colors}
                />
              )}
              {activity.locationName && (
                <InfoRow
                  icon="location-outline"
                  label="地点"
                  value={activity.locationName}
                  colors={colors}
                />
              )}
            </View>
          </View>

          {activity.description && (
            <View className="px-4 mb-6">
              <Text className="text-sm font-medium text-elite-muted mb-2">
                活动描述
              </Text>
              <View className="bg-surface rounded-xl p-4">
                <Text className="text-base text-elite leading-relaxed">
                  {activity.description}
                </Text>
              </View>
            </View>
          )}

          {activity.participants && activity.participants.length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-sm font-medium text-elite-muted mb-3">
                参与者 ({activity.participants.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {activity.participants.map((participant) => (
                  <TouchableOpacity
                    key={participant.contactId}
                    onPress={() => router.push(`/(views)/contact/${participant.contactId}`)}
                  >
                    <ParticipantAvatar
                      name={participant.contactName}
                      avatar={participant.contactAvatar}
                      colors={colors}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {activity.rawInput && (
            <View className="px-4 mb-6">
              <Text className="text-sm font-medium text-elite-muted mb-2">
                原始记录
              </Text>
              <View className="bg-surface/50 rounded-xl p-4 border border-elite-muted/10">
                <Text className="text-sm text-elite-muted italic">
                  "{activity.rawInput}"
                </Text>
              </View>
            </View>
          )}

          {activity.aiAnalysis && Object.keys(activity.aiAnalysis).length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-sm font-medium text-elite-muted mb-2">
                AI 分析
              </Text>
              <View className="bg-surface rounded-xl p-4">
                {activity.aiAnalysis.summary && (
                  <Text className="text-sm text-elite mb-2">
                    {activity.aiAnalysis.summary}
                  </Text>
                )}
                {activity.aiAnalysis.keyPoints && (
                  <View className="mt-2">
                    {activity.aiAnalysis.keyPoints.map((point: string, index: number) => (
                      <View key={index} className="flex-row items-start mt-1">
                        <Text className="text-primary mr-2">•</Text>
                        <Text className="text-sm text-elite-muted flex-1">{point}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          <View className="px-4 py-4">
            <Text className="text-xs text-elite-muted text-center">
              创建于 {dayjs(activity.createdAt).format('YYYY-MM-DD HH:mm')}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

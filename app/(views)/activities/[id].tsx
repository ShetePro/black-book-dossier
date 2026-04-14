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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      t('activities.deleteConfirmTitle'),
      t('activities.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await deleteActivity(db, id);
              router.back();
            } catch (error) {
              console.error('Failed to delete activity:', error);
              Alert.alert(t('common.error'), t('activities.deleteError'));
            }
          },
        },
      ]
    );
  }, [id, router, t]);

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
            {t('activities.notFound')}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 px-6 py-2 bg-primary rounded-full"
          >
            <Text className="text-background font-medium">{t('common.back')}</Text>
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
        <Text className="text-lg font-semibold text-elite">{t('activities.detailTitle')}</Text>
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
                label={t('activities.date')}
                value={startDate.format('YYYY/MM/DD')}
                colors={colors}
              />
              <InfoRow
                icon="time-outline"
                label={t('activities.time')}
                value={`${startDate.format('HH:mm')}${endDate ? ` - ${endDate.format('HH:mm')}` : ''}`}
                colors={colors}
              />
              {duration && (
                <InfoRow
                  icon="hourglass-outline"
                  label={t('activities.duration')}
                  value={`${Math.floor(duration / 60)}h ${duration % 60}m`}
                  colors={colors}
                />
              )}
              {activity.locationName && (
                <InfoRow
                  icon="location-outline"
                  label={t('activities.location')}
                  value={activity.locationName}
                  colors={colors}
                />
              )}
            </View>
          </View>

          {activity.description && (
            <View className="px-4 mb-6">
              <Text className="text-sm font-medium text-elite-muted mb-2">
                {t('activities.description')}
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
                {t('activities.participants')} ({activity.participants.length})
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
                {t('activities.rawRecord')}
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
                {t('activities.aiAnalysis')}
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
              {t('activities.createdAt', { date: dayjs(activity.createdAt).format('YYYY-MM-DD HH:mm') })}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

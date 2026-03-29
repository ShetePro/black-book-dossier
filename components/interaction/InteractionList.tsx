import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { Interaction } from '@/types';
import { useThemeColor } from '@/hooks/useThemeColor';

interface InteractionListProps {
  interactions: Interaction[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onPress?: (interaction: Interaction) => void;
}

const INTERACTION_TYPE_CONFIG: Record<
  Interaction['type'],
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
> = {
  meeting: { icon: 'people', label: '会议', color: '#22c55e' },
  call: { icon: 'call', label: '电话', color: '#3b82f6' },
  message: { icon: 'chatbubble', label: '消息', color: '#8b5cf6' },
  gift: { icon: 'gift', label: '礼物', color: '#f59e0b' },
  other: { icon: 'ellipsis-horizontal', label: '其他', color: '#6b7280' },
};

const VALUE_EXCHANGE_ICONS: Record<Interaction['valueExchange'], keyof typeof Ionicons.glyphMap> = {
  given: 'arrow-up-circle',
  received: 'arrow-down-circle',
  neutral: 'remove-circle',
};

const VALUE_EXCHANGE_COLORS: Record<Interaction['valueExchange'], string> = {
  given: '#ef4444',
  received: '#22c55e',
  neutral: '#6b7280',
};

export function InteractionList({
  interactions,
  isLoading,
  onDelete,
  onPress,
}: InteractionListProps) {
  const colors = useThemeColor();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View className="px-4 py-8">
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className="mb-4 p-4 rounded-2xl"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center">
              <View
                className="w-12 h-12 rounded-full"
                style={{ backgroundColor: `${colors.primary}20` }}
              />
              <View className="ml-3 flex-1">
                <View
                  className="h-4 w-24 rounded"
                  style={{ backgroundColor: `${colors.text}20` }}
                />
                <View
                  className="h-3 w-32 rounded mt-2"
                  style={{ backgroundColor: `${colors.textMuted}20` }}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (interactions.length === 0) {
    return (
      <View className="px-4 py-12 items-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: `${colors.primary}15` }}
        >
          <Ionicons name="chatbubbles-outline" size={32} color={colors.primary} />
        </View>
        <Text style={{ color: colors.text }} className="text-lg font-semibold mb-2">
          暂无交往记录
        </Text>
        <Text style={{ color: colors.textMuted }} className="text-sm text-center">
          点击右上角按钮添加新的交往记录
        </Text>
      </View>
    );
  }

  const handleLongPress = (interaction: Interaction) => {
    Alert.alert(
      '删除记录',
      '确定要删除这条交往记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => onDelete?.(interaction.id),
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFullDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View className="px-4 py-4">
      {interactions.map((interaction, index) => {
        const typeConfig = INTERACTION_TYPE_CONFIG[interaction.type];
        const isExpanded = expandedId === interaction.id;

        return (
          <Animated.View
            key={interaction.id}
            entering={FadeInUp.delay(index * 50)}
            exiting={FadeOut}
            layout={Layout.springify()}
            className="mb-3"
          >
            <Pressable
              onPress={() => {
                setExpandedId(isExpanded ? null : interaction.id);
                onPress?.(interaction);
              }}
              onLongPress={() => handleLongPress(interaction)}
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.surface }}
            >
              <View className="p-4">
                <View className="flex-row items-center">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${typeConfig.color}20` }}
                  >
                    <Ionicons
                      name={typeConfig.icon}
                      size={22}
                      color={typeConfig.color}
                    />
                  </View>

                  <View className="ml-3 flex-1">
                    <View className="flex-row items-center">
                      <Text
                        style={{ color: colors.text }}
                        className="text-base font-semibold"
                      >
                        {typeConfig.label}
                      </Text>
                      <View
                        className="ml-2 px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${VALUE_EXCHANGE_COLORS[interaction.valueExchange]}20`,
                        }}
                      >
                        <Ionicons
                          name={VALUE_EXCHANGE_ICONS[interaction.valueExchange]}
                          size={12}
                          color={VALUE_EXCHANGE_COLORS[interaction.valueExchange]}
                        />
                      </View>
                    </View>

                    <Text
                      style={{ color: colors.textMuted }}
                      className="text-sm mt-0.5"
                    >
                      {formatDate(interaction.date)}
                    </Text>
                  </View>

                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMuted}
                  />
                </View>

                <View className="mt-3">
                  <Text
                    style={{ color: colors.textSecondary }}
                    className="text-sm leading-5"
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {interaction.content}
                  </Text>
                </View>

                {isExpanded && (
                  <Animated.View entering={FadeInUp} className="mt-4 pt-4 border-t"
                    style={{ borderColor: colors.border }}
                  >
                    <View className="flex-row items-center mb-2">
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={colors.textMuted}
                      />
                      <Text
                        style={{ color: colors.textMuted }}
                        className="text-xs ml-1.5"
                      >
                        {formatFullDate(interaction.date)}
                      </Text>
                    </View>

                    {interaction.location && (
                      <View className="flex-row items-center mb-2"
                      >
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.textMuted}
                        />
                        <Text
                          style={{ color: colors.textMuted }}
                          className="text-xs ml-1.5"
                        >
                          {interaction.location}
                        </Text>
                      </View>
                    )}

                    {interaction.valueDescription && (
                      <View className="flex-row items-center"
                      >
                        <Ionicons
                          name={VALUE_EXCHANGE_ICONS[interaction.valueExchange]}
                          size={14}
                          color={VALUE_EXCHANGE_COLORS[interaction.valueExchange]}
                        />
                        <Text
                          style={{ color: colors.textMuted }}
                          className="text-xs ml-1.5"
                        >
                          {interaction.valueDescription}
                        </Text>
                      </View>
                    )}

                    {onDelete && (
                      <TouchableOpacity
                        onPress={() => handleLongPress(interaction)}
                        className="mt-3 flex-row items-center justify-center py-2 rounded-lg"
                        style={{ backgroundColor: `${colors.danger}15` }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colors.danger}
                        />
                        <Text
                          style={{ color: colors.danger }}
                          className="text-sm font-medium ml-2"
                        >
                          删除记录
                        </Text>
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { EnhancedEntity } from '@/types/entity';

interface EntityCardConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

const ENTITY_CONFIG: Record<string, EntityCardConfig> = {
  time: { label: '时间', icon: 'time', color: '#10b981', bgColor: '#10b98120' },
  location: { label: '地点', icon: 'location', color: '#3b82f6', bgColor: '#3b82f620' },
  person: { label: '人物', icon: 'person', color: '#c9a962', bgColor: '#c9a96220' },
  event: { label: '事件', icon: 'calendar', color: '#8b5cf6', bgColor: '#8b5cf620' },
  need: { label: '需求', icon: 'help-circle', color: '#f59e0b', bgColor: '#f59e0b20' },
  preference: { label: '偏好', icon: 'heart', color: '#ec4899', bgColor: '#ec489920' },
  health: { label: '健康', icon: 'medical', color: '#ef4444', bgColor: '#ef444420' },
  suggestion: { label: '建议', icon: 'bulb', color: '#06b6d4', bgColor: '#06b6d420' },
  organization: { label: '组织', icon: 'business', color: '#6366f1', bgColor: '#6366f120' },
};

interface EnhancedEntityCardProps {
  entity: EnhancedEntity;
  onPress?: () => void;
}

export const EnhancedEntityCard: React.FC<EnhancedEntityCardProps> = ({ entity, onPress }) => {
  const config = ENTITY_CONFIG[entity.type] || {
    label: entity.type,
    icon: 'information-circle',
    color: '#888',
    bgColor: '#88888820',
  };

  const renderNormalizedData = () => {
    switch (entity.type) {
      case 'time':
        return entity.normalized.recurrence ? (
          <ThemedText style={styles.normalizedText}>周期: {entity.normalized.recurrence}</ThemedText>
        ) : null;

      case 'location':
        return entity.normalized.venue || entity.normalized.city ? (
          <ThemedText style={styles.normalizedText}>
            {entity.normalized.city} {entity.normalized.venue}
          </ThemedText>
        ) : null;

      case 'person':
        return entity.normalized.company || entity.normalized.title ? (
          <ThemedText style={styles.normalizedText}>
            {entity.normalized.title} {entity.normalized.company}
          </ThemedText>
        ) : null;

      case 'event':
        return (
          <View style={styles.eventMeta}>
            <View style={[styles.badge, { backgroundColor: getImportanceColor(entity.normalized.importance) }]}>
              <ThemedText style={styles.badgeText}>
                {entity.normalized.importance === 'critical' ? '关键' :
                 entity.normalized.importance === 'high' ? '重要' :
                 entity.normalized.importance === 'medium' ? '一般' : '次要'}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(entity.normalized.status) }]}>
              <ThemedText style={styles.badgeText}>
                {entity.normalized.status === 'planned' ? '计划中' :
                 entity.normalized.status === 'ongoing' ? '进行中' :
                 entity.normalized.status === 'completed' ? '已完成' : '已取消'}
              </ThemedText>
            </View>
          </View>
        );

      case 'need':
        return (
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(entity.normalized.urgency) }]}>
            <ThemedText style={styles.badgeText}>
              {entity.normalized.urgency === 'immediate' ? '紧急' :
               entity.normalized.urgency === 'shortterm' ? '近期' : '长期'}
            </ThemedText>
          </View>
        );

      case 'suggestion':
        return (
          <View style={styles.eventMeta}>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(entity.normalized.priority) }]}>
              <ThemedText style={styles.badgeText}>
                {entity.normalized.priority === 'high' ? '高优先级' :
                 entity.normalized.priority === 'medium' ? '中优先级' : '低优先级'}
              </ThemedText>
            </View>
            {!entity.normalized.actionable && (
              <View style={[styles.badge, { backgroundColor: '#88888840' }]}>
                <ThemedText style={styles.badgeText}>仅供参考</ThemedText>
              </View>
            )}
          </View>
        );

      case 'health':
        return (
          <View style={[styles.urgencyBadge, { backgroundColor: getSeverityColor(entity.normalized.severity || 'mild') }]}>
            <ThemedText style={styles.badgeText}>
              {entity.normalized.severity === 'critical' ? '严重' :
               entity.normalized.severity === 'moderate' ? '中等' : '轻微'}
              {entity.normalized.isOngoing ? ' · 持续中' : ''}
            </ThemedText>
          </View>
        );

      case 'preference':
        return (
          <View style={styles.eventMeta}>
            <View style={[styles.badge, { backgroundColor: getSentimentColor(entity.normalized.sentiment) }]}>
              <ThemedText style={styles.badgeText}>
                {entity.normalized.sentiment === 'positive' ? '喜欢' :
                 entity.normalized.sentiment === 'negative' ? '不喜欢' : '中性'}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: getIntensityColor(entity.normalized.intensity) }]}>
              <ThemedText style={styles.badgeText}>
                {entity.normalized.intensity === 'strong' ? '强烈' :
                 entity.normalized.intensity === 'moderate' ? '一般' : '轻微'}
              </ThemedText>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.header, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon as any} size={14} color={config.color} />
        <ThemedText style={[styles.typeLabel, { color: config.color }]}>
          {config.label}
        </ThemedText>
        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(entity.confidence.level) }]}>
          <ThemedText style={styles.confidenceText}>
            {Math.round(entity.confidence.score * 100)}%
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.value}>{entity.value}</ThemedText>
        {renderNormalizedData()}
        {entity.context && entity.context !== entity.value && (
          <ThemedText style={styles.context} numberOfLines={2}>
            {entity.context}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
};

const getConfidenceColor = (level: string) => {
  switch (level) {
    case 'high': return '#10b98140';
    case 'medium': return '#f59e0b40';
    case 'low': return '#ef444440';
    default: return '#88888840';
  }
};

const getImportanceColor = (importance: string) => {
  switch (importance) {
    case 'critical': return '#dc262640';
    case 'high': return '#ef444440';
    case 'medium': return '#f59e0b40';
    default: return '#10b98140';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return '#10b98140';
    case 'ongoing': return '#3b82f640';
    case 'cancelled': return '#dc262640';
    default: return '#f59e0b40';
  }
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'immediate': return '#dc262640';
    case 'shortterm': return '#f59e0b40';
    default: return '#10b98140';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#ef444440';
    case 'medium': return '#f59e0b40';
    default: return '#10b98140';
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return '#dc262640';
    case 'moderate': return '#f59e0b40';
    default: return '#10b98140';
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '#10b98140';
    case 'negative': return '#ef444440';
    default: return '#88888840';
  }
};

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'strong': return '#dc262640';
    case 'moderate': return '#f59e0b40';
    default: return '#10b98140';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  content: {
    padding: 12,
    gap: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f5f5f5',
  },
  normalizedText: {
    fontSize: 12,
    color: '#a3a3a3',
  },
  context: {
    fontSize: 12,
    color: '#737373',
    fontStyle: 'italic',
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0a0a0a',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
});

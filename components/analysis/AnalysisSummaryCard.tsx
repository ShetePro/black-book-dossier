import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface AnalysisSummaryCardProps {
  mainTopic: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  urgency: 'high' | 'medium' | 'low';
  entityCounts: Record<string, number>;
}

export const AnalysisSummaryCard: React.FC<AnalysisSummaryCardProps> = ({
  mainTopic,
  keyPoints,
  sentiment,
  urgency,
  entityCounts,
}) => {
  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive': return { icon: 'happy', color: '#10b981', label: '积极' };
      case 'negative': return { icon: 'sad', color: '#ef4444', label: '消极' };
      case 'mixed': return { icon: 'git-compare', color: '#f59e0b', label: '复杂' };
      default: return { icon: 'remove', color: '#888', label: '中性' };
    }
  };

  const getUrgencyIcon = () => {
    switch (urgency) {
      case 'high': return { icon: 'alert-circle', color: '#dc2626', label: '紧急' };
      case 'medium': return { icon: 'time', color: '#f59e0b', label: '一般' };
      default: return { icon: 'checkmark-circle', color: '#10b981', label: '平缓' };
    }
  };

  const sentimentInfo = getSentimentIcon();
  const urgencyInfo = getUrgencyIcon();

  const totalEntities = Object.values(entityCounts).reduce((sum, count) => sum + count, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={20} color="#c9a962" />
        <ThemedText style={styles.title}>分析摘要</ThemedText>
      </View>

      <ThemedText style={styles.mainTopic}>{mainTopic}</ThemedText>

      <View style={styles.indicators}>
        <View style={[styles.indicator, { backgroundColor: `${sentimentInfo.color}20` }]}>
          <Ionicons name={sentimentInfo.icon as any} size={16} color={sentimentInfo.color} />
          <ThemedText style={[styles.indicatorText, { color: sentimentInfo.color }]}>
            {sentimentInfo.label}
          </ThemedText>
        </View>
        <View style={[styles.indicator, { backgroundColor: `${urgencyInfo.color}20` }]}>
          <Ionicons name={urgencyInfo.icon as any} size={16} color={urgencyInfo.color} />
          <ThemedText style={[styles.indicatorText, { color: urgencyInfo.color }]}>
            {urgencyInfo.label}
          </ThemedText>
        </View>
      </View>

      {keyPoints.length > 0 && (
        <View style={styles.keyPoints}>
          {keyPoints.map((point, index) => (
            <View key={index} style={styles.keyPoint}>
              <View style={styles.keyPointDot} />
              <ThemedText style={styles.keyPointText}>{point}</ThemedText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.stats}>
        <ThemedText style={styles.statsText}>
          共识别 {totalEntities} 个实体
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f5f5',
  },
  mainTopic: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c9a962',
    marginBottom: 16,
  },
  indicators: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  indicatorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  keyPoints: {
    gap: 8,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  keyPointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c9a962',
    marginTop: 6,
  },
  keyPointText: {
    fontSize: 14,
    color: '#a3a3a3',
    flex: 1,
  },
  stats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statsText: {
    fontSize: 12,
    color: '#737373',
  },
});

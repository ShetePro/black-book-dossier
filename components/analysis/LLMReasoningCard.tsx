import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { LLMAnalysisResult } from '@/services/ai/llmAnalyzer';

interface LLMReasoningCardProps {
  result: LLMAnalysisResult;
  onApplyCorrection?: (original: string, corrected: string) => void;
}

export const LLMReasoningCard: React.FC<LLMReasoningCardProps> = ({
  result,
  onApplyCorrection,
}) => {
  const renderContactMatch = () => {
    const { contactMatch } = result;
    
    if (contactMatch.found) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <ThemedText style={styles.sectionTitle}>✓ 找到匹配联系人</ThemedText>
          </View>
          <View style={styles.matchCard}>
            <ThemedText style={styles.matchedName}>{contactMatch.matchedName}</ThemedText>
            <ThemedText style={styles.confidenceText}>
              匹配度: {Math.round(contactMatch.confidence * 100)}%
            </ThemedText>
          </View>
        </View>
      );
    }

    if (contactMatch.suggestedName) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={18} color="#f59e0b" />
            <ThemedText style={styles.sectionTitle}>? 相似建议</ThemedText>
          </View>
          <View style={[styles.matchCard, styles.suggestionCard]}>
            <ThemedText style={styles.suggestionName}>{contactMatch.suggestedName}</ThemedText>
            <ThemedText style={styles.confidenceText}>
              相似度: {Math.round(contactMatch.confidence * 100)}%
            </ThemedText>
            <ThemedText style={styles.reasonText}>{contactMatch.reason}</ThemedText>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={18} color="#60a5fa" />
          <ThemedText style={styles.sectionTitle}>智能分析结果</ThemedText>
        </View>
        
        {/* 显示从文本中提取的实体信息 */}
        {result.suggestedTags && result.suggestedTags.length > 0 && (
          <View style={styles.extractedEntitiesCard}>
            <ThemedText style={styles.extractedTitle}>提取的信息：</ThemedText>
            
            {/* 人名 */}
            {result.suggestedTags.filter(tag => !tag.includes(':'))?.length > 0 && (
              <View style={styles.entityRow}>
                <ThemedText style={styles.entityLabel}>人物:</ThemedText>
                <View style={styles.tagsRow}>
                  {result.suggestedTags.filter(tag => !tag.includes(':')).map((tag, i) => (
                    <View key={i} style={[styles.tagBadge, styles.personTag]}>
                      <ThemedText style={styles.tagText}>{tag}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* 时间 */}
            {result.suggestedTags.filter(tag => tag.startsWith('时间:'))?.length > 0 && (
              <View style={styles.entityRow}>
                <ThemedText style={styles.entityLabel}>时间:</ThemedText>
                <View style={styles.tagsRow}>
                  {result.suggestedTags.filter(tag => tag.startsWith('时间:')).map((tag, i) => (
                    <View key={i} style={[styles.tagBadge, styles.timeTag]}>
                      <ThemedText style={styles.tagText}>{tag.replace('时间:', '')}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* 地点 */}
            {result.suggestedTags.filter(tag => tag.startsWith('地点:'))?.length > 0 && (
              <View style={styles.entityRow}>
                <ThemedText style={styles.entityLabel}>地点:</ThemedText>
                <View style={styles.tagsRow}>
                  {result.suggestedTags.filter(tag => tag.startsWith('地点:')).map((tag, i) => (
                    <View key={i} style={[styles.tagBadge, styles.locationTag]}>
                      <ThemedText style={styles.tagText}>{tag.replace('地点:', '')}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
        
        {/* 显示活动和偏好 */}
        {result.insights && (
          <View style={styles.insightsCard}>
            {result.insights.activities?.length > 0 && (
              <View style={styles.entityRow}>
                <ThemedText style={styles.entityLabel}>活动:</ThemedText>
                <View style={styles.tagsRow}>
                  {result.insights.activities.map((activity, i) => (
                    <View key={i} style={[styles.tagBadge, styles.activityTag]}>
                      <ThemedText style={styles.tagText}>{activity}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {result.insights.preferences?.length > 0 && (
              <View style={styles.entityRow}>
                <ThemedText style={styles.entityLabel}>偏好:</ThemedText>
                <View style={styles.tagsRow}>
                  {result.insights.preferences.map((pref, i) => (
                    <View key={i} style={styles.tagBadge}>
                      <ThemedText style={styles.tagText}>{pref}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderCorrections = () => {
    if (result.corrections.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="create" size={18} color="#3b82f6" />
          <ThemedText style={styles.sectionTitle}>文本修正</ThemedText>
        </View>
        <View style={styles.correctionsList}>
          {result.corrections.map((correction, index) => (
            <TouchableOpacity
              key={index}
              style={styles.correctionItem}
              onPress={() => onApplyCorrection?.(correction.original, correction.corrected)}
            >
              <View style={styles.correctionRow}>
                <ThemedText style={styles.originalText}>{correction.original}</ThemedText>
                <Ionicons name="arrow-forward" size={16} color="#888" />
                <ThemedText style={styles.correctedText}>{correction.corrected}</ThemedText>
              </View>
              <View style={styles.typeBadge}>
                <ThemedText style={styles.typeText}>
                  {correction.type === 'name' ? '姓名' : 
                   correction.type === 'typo' ? '错字' : '语法'}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderInsights = () => {
    const { insights } = result;
    
    if (!insights) return null;
    
    const hasInsights = insights.activities?.length > 0 || 
                        insights.preferences?.length > 0 || 
                        insights.personality?.length > 0 ||
                        insights.profession;

    if (!hasInsights) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb" size={18} color="#c9a962" />
          <ThemedText style={styles.sectionTitle}>情境分析</ThemedText>
        </View>
        <View style={styles.insightsCard}>
          {insights.profession && (
            <View style={styles.insightRow}>
              <ThemedText style={styles.insightLabel}>职业:</ThemedText>
              <View style={styles.tagBadge}>
                <ThemedText style={styles.tagText}>{insights.profession}</ThemedText>
              </View>
            </View>
          )}
          
          {insights.activities?.length > 0 && (
            <View style={styles.insightRow}>
              <ThemedText style={styles.insightLabel}>活动:</ThemedText>
              <View style={styles.tagsRow}>
                {insights.activities.map((activity, i) => (
                  <View key={i} style={styles.tagBadge}>
                    <ThemedText style={styles.tagText}>{activity}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {insights.preferences?.length > 0 && (
            <View style={styles.insightRow}>
              <ThemedText style={styles.insightLabel}>偏好:</ThemedText>
              <View style={styles.tagsRow}>
                {insights.preferences.map((pref, i) => (
                  <View key={i} style={styles.tagBadge}>
                    <ThemedText style={styles.tagText}>{pref}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {insights.personality?.length > 0 && (
            <View style={styles.insightRow}>
              <ThemedText style={styles.insightLabel}>性格:</ThemedText>
              <View style={styles.tagsRow}>
                {insights.personality.map((trait, i) => (
                  <View key={i} style={[styles.tagBadge, styles.personalityTag]}>
                    <ThemedText style={styles.tagText}>{trait}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderReasoning = () => {
    if (!result.reasoning || result.reasoning === '未提供推理过程') return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="analytics" size={18} color="#8b5cf6" />
          <ThemedText style={styles.sectionTitle}>推理过程</ThemedText>
        </View>
        <View style={styles.reasoningCard}>
          <ThemedText style={styles.reasoningText}>{result.reasoning}</ThemedText>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color="#c9a962" />
        <ThemedText style={styles.title}>🤖 LLM 智能分析</ThemedText>
      </View>

      {renderContactMatch()}
      {renderCorrections()}
      {renderInsights()}
      {renderReasoning()}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f5f5',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e5e5',
  },
  matchCard: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  suggestionCard: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderLeftColor: '#f59e0b',
  },
  matchedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  confidenceText: {
    fontSize: 12,
    color: '#a3a3a3',
    marginTop: 4,
  },
  reasonText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noMatchText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  correctionsList: {
    gap: 8,
  },
  correctionItem: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  originalText: {
    fontSize: 14,
    color: '#ef4444',
    textDecorationLine: 'line-through',
  },
  correctedText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 11,
    color: '#888',
  },
  insightsCard: {
    backgroundColor: 'rgba(201,169,98,0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightLabel: {
    fontSize: 13,
    color: '#a3a3a3',
    width: 50,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tagBadge: {
    backgroundColor: 'rgba(201,169,98,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  personalityTag: {
    backgroundColor: 'rgba(139,92,246,0.3)',
  },
  tagText: {
    fontSize: 12,
    color: '#f5f5f5',
    fontWeight: '500',
  },
  reasoningCard: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  reasoningText: {
    fontSize: 13,
    color: '#d4d4d4',
    lineHeight: 20,
  },
  extractedEntitiesCard: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  extractedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#60a5fa',
    marginBottom: 10,
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  entityLabel: {
    fontSize: 12,
    color: '#a3a3a3',
    width: 40,
    marginTop: 4,
  },
  personTag: {
    backgroundColor: 'rgba(16,185,129,0.3)',
  },
  timeTag: {
    backgroundColor: 'rgba(245,158,11,0.3)',
  },
  locationTag: {
    backgroundColor: 'rgba(139,92,246,0.3)',
  },
  activityTag: {
    backgroundColor: 'rgba(59,130,246,0.3)',
  },
});

export default LLMReasoningCard;

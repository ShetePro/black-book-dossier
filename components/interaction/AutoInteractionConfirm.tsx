import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Contact } from '@/types';
import { SmartAnalysisResult } from '@/services/ai/smartAnalyzer';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface AutoInteractionConfirmProps {
  visible: boolean;
  analysis: SmartAnalysisResult;
  matchedContact: Contact | null;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: (editedAnalysis: SmartAnalysisResult) => void;
}

export const AutoInteractionConfirm: React.FC<AutoInteractionConfirmProps> = ({
  visible,
  analysis,
  matchedContact,
  onConfirm,
  onCancel,
  onEdit,
}) => {
  const colors = useThemeColor();
  const [isEditing, setIsEditing] = useState(false);

  if (!visible) return null;

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      activity: '活动',
      meeting: '会议',
      meal: '用餐',
      call: '通话',
      gift: '送礼',
      other: '其他',
    };
    return labels[type] || '其他';
  };

  const getEventTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      activity: 'fitness',
      meeting: 'people',
      meal: 'restaurant',
      call: 'call',
      gift: 'gift',
      other: 'ellipsis-horizontal',
    };
    return icons[type] || 'ellipsis-horizontal';
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeInUp.duration(300).springify()}
        style={[styles.container, { backgroundColor: colors.surface }]}
      >
        {/* 标题 */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="sparkles" size={28} color={colors.primary} />
          </View>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            智能识别结果
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
            已自动提取以下信息
          </ThemedText>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 联系人 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={16} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                联系人
              </ThemedText>
            </View>
            <View style={[styles.card, { backgroundColor: colors.elevated }]}>
              {matchedContact ? (
                <>
                  <ThemedText style={[styles.contactName, { color: colors.text }]}>
                    {matchedContact.name}
                  </ThemedText>
                  {matchedContact.company && (
                    <ThemedText style={[styles.contactInfo, { color: colors.textMuted }]}>
                      {matchedContact.company}
                    </ThemedText>
                  )}
                  <View style={[styles.confidenceBadge, { backgroundColor: `${colors.success}20` }]}>
                    <ThemedText style={[styles.confidenceText, { color: colors.success }]}>
                      匹配度 {Math.round(analysis.confidence * 100)}%
                    </ThemedText>
                  </View>
                </>
              ) : (
                <ThemedText style={[styles.noMatch, { color: colors.textMuted }]}>
                  未匹配到联系人
                </ThemedText>
              )}
            </View>
          </View>

          {/* 事件 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name={getEventTypeIcon(analysis.eventType)} size={16} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                事件
              </ThemedText>
            </View>
            <View style={[styles.card, { backgroundColor: colors.elevated }]}>
              <View style={styles.eventTypeRow}>
                <View style={[styles.eventTypeBadge, { backgroundColor: `${colors.primary}20` }]}>
                  <ThemedText style={[styles.eventTypeText, { color: colors.primary }]}>
                    {getEventTypeLabel(analysis.eventType)}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[styles.eventDescription, { color: colors.text }]}>
                {analysis.eventDescription}
              </ThemedText>
            </View>
          </View>

          {/* 时间 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                时间
              </ThemedText>
            </View>
            <View style={[styles.card, { backgroundColor: colors.elevated }]}>
              <ThemedText style={[styles.dateText, { color: colors.text }]}>
                {analysis.date}
              </ThemedText>
              {analysis.time && (
                <ThemedText style={[styles.timeText, { color: colors.textMuted }]}>
                  {analysis.time}
                </ThemedText>
              )}
            </View>
          </View>

          {/* 地点 */}
          {analysis.location && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  地点
                </ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: colors.elevated }]}>
                <ThemedText style={[styles.locationText, { color: colors.text }]}>
                  {analysis.location}
                </ThemedText>
              </View>
            </View>
          )}

          {/* 参与人 */}
          {analysis.participants.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={16} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  参与人
                </ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: colors.elevated }]}>
                <View style={styles.participantsRow}>
                  {analysis.participants.map((participant, index) => (
                    <View
                      key={index}
                      style={[styles.participantBadge, { backgroundColor: `${colors.primary}15` }]}
                    >
                      <ThemedText style={[styles.participantText, { color: colors.primary }]}>
                        {participant}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 按钮 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
            onPress={onCancel}
          >
            <ThemedText style={[styles.buttonText, { color: colors.text }]}>
              取消
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={onConfirm}
          >
            <ThemedText style={[styles.buttonText, { color: '#0a0a0a' }]}>
              确认添加
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    maxHeight: 400,
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
  },
  card: {
    borderRadius: 12,
    padding: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    fontSize: 13,
    marginTop: 2,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noMatch: {
    fontSize: 14,
    textAlign: 'center',
  },
  eventTypeRow: {
    marginBottom: 8,
  },
  eventTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 13,
    marginTop: 2,
  },
  locationText: {
    fontSize: 15,
  },
  participantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  participantText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  primaryButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AutoInteractionConfirm;

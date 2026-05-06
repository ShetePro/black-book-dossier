import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Contact } from '@/types';
import { LLMAnalysisResult } from '@/services/ai/llmAnalyzer';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface AutoInteractionConfirmProps {
  visible: boolean;
  analysis: LLMAnalysisResult | null;
  matchedContact: Contact | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AutoInteractionConfirm: React.FC<AutoInteractionConfirmProps> = ({
  visible,
  analysis,
  matchedContact,
  onConfirm,
  onCancel,
}) => {
  const colors = useThemeColor();

  if (!visible || !analysis) return null;

  const confidence = analysis.contactMatch.confidence || 0;

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeInUp.duration(300).springify()}
        style={[styles.container, { backgroundColor: colors.surface }]}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="sparkles" size={28} color={colors.primary} />
          </View>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            智能识别结果
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
            {analysis.reasoning}
          </ThemedText>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {matchedContact && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={16} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  联系人
                </ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: colors.elevated }]}>
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
                    匹配度 {Math.round(confidence * 100)}%
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {analysis.entities.events.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  事件
                </ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: colors.elevated }]}>
                <ThemedText style={[styles.contentText, { color: colors.text }]}>
                  {analysis.entities.events.join(', ')}
                </ThemedText>
              </View>
            </View>
          )}

          {analysis.entities.times.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={16} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  时间
                </ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: colors.elevated }]}>
                <ThemedText style={[styles.contentText, { color: colors.text }]}>
                  {analysis.entities.times.join(', ')}
                </ThemedText>
              </View>
            </View>
          )}

          {analysis.entities.locations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  地点
                </ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: colors.elevated }]}>
                <ThemedText style={[styles.contentText, { color: colors.text }]}>
                  {analysis.entities.locations.join(', ')}
                </ThemedText>
              </View>
            </View>
          )}

          {analysis.entities.persons.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={16} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  参与人
                </ThemedText>
              </View>
              <View style={[styles.card, { backgroundColor: colors.elevated }]}>
                <View style={styles.tagsRow}>
                  {analysis.entities.persons.map((person, index) => (
                    <View
                      key={index}
                      style={[styles.tagBadge, { backgroundColor: `${colors.primary}15` }]}
                    >
                      <ThemedText style={[styles.tagText, { color: colors.primary }]}>
                        {person}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

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
    textAlign: 'center',
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
  contentText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
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
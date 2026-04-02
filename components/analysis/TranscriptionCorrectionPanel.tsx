import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { TranscriptionCorrection } from '@/types/entity';

interface TranscriptionCorrectionPanelProps {
  corrections: TranscriptionCorrection[];
  onApplyCorrection: (original: string, suggestion: string) => void;
}

export const TranscriptionCorrectionPanel: React.FC<TranscriptionCorrectionPanelProps> = ({
  corrections,
  onApplyCorrection,
}) => {
  if (corrections.length === 0) return null;

  const highConfidenceCorrections = corrections.filter((c) => c.confidence > 0.8);
  const mediumConfidenceCorrections = corrections.filter(
    (c) => c.confidence >= 0.6 && c.confidence <= 0.8
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={18} color="#c9a962" />
        <ThemedText style={styles.title}>语音识别修正建议</ThemedText>
        <View style={styles.countBadge}>
          <ThemedText style={styles.countText}>{corrections.length}</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.subtitle}>
        基于通讯录匹配，发现可能的识别错误
      </ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {highConfidenceCorrections.map((correction, index) => (
          <TouchableOpacity
            key={`high-${index}`}
            style={[styles.correctionCard, styles.highConfidence]}
            onPress={() => onApplyCorrection(correction.original, correction.suggestion)}
            activeOpacity={0.8}
          >
            <View style={styles.correctionHeader}>
              <Ionicons name="warning" size={14} color="#f59e0b" />
              <ThemedText style={styles.confidenceText}>
                {Math.round(correction.confidence * 100)}% 匹配
              </ThemedText>
            </View>
            <View style={styles.correctionContent}>
              <ThemedText style={styles.originalText}>{correction.original}</ThemedText>
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={14} color="#888" />
              </View>
              <ThemedText style={styles.suggestionText}>{correction.suggestion}</ThemedText>
            </View>
            <ThemedText style={styles.reasonText}>{correction.reason}</ThemedText>
          </TouchableOpacity>
        ))}

        {mediumConfidenceCorrections.map((correction, index) => (
          <TouchableOpacity
            key={`medium-${index}`}
            style={[styles.correctionCard, styles.mediumConfidence]}
            onPress={() => onApplyCorrection(correction.original, correction.suggestion)}
            activeOpacity={0.8}
          >
            <View style={styles.correctionHeader}>
              <Ionicons name="help-circle" size={14} color="#3b82f6" />
              <ThemedText style={styles.confidenceText}>
                {Math.round(correction.confidence * 100)}% 匹配
              </ThemedText>
            </View>
            <View style={styles.correctionContent}>
              <ThemedText style={styles.originalText}>{correction.original}</ThemedText>
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={14} color="#888" />
              </View>
              <ThemedText style={styles.suggestionText}>{correction.suggestion}</ThemedText>
            </View>
            <ThemedText style={styles.reasonText}>{correction.reason}</ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c9a962',
  },
  countBadge: {
    backgroundColor: 'rgba(201, 169, 98, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#c9a962',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  scrollView: {
    marginTop: 8,
  },
  correctionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
    maxWidth: 280,
  },
  highConfidence: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  mediumConfidence: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  correctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#888',
  },
  correctionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  originalText: {
    fontSize: 14,
    color: '#ef4444',
    textDecorationLine: 'line-through',
  },
  arrow: {
    opacity: 0.5,
  },
  suggestionText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 11,
    color: '#666',
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ModelId } from '@/services/ai/llmModelManager';

interface ModelCardProps {
  modelId: ModelId;
  name: string;
  description: string;
  size: number;
  isDownloaded: boolean;
  isEnabled?: boolean;
  isRecommended?: boolean;
  onDownload: () => void;
  onDelete: () => void;
  onPress: () => void;
  downloadProgress?: number;
  isDownloading?: boolean;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  name,
  description,
  size,
  isDownloaded,
  isEnabled,
  isRecommended,
  onDownload,
  onDelete,
  onPress,
  downloadProgress,
  isDownloading,
}) => {
  const colors = useThemeColor();

  const formatSize = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isEnabled ? colors.primary : colors.border,
          borderWidth: isEnabled ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          {isEnabled && (
            <View style={[styles.enabledBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.enabledText}>当前使用</Text>
            </View>
          )}
          {!isEnabled && isRecommended && (
            <View style={[styles.recommendedBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.recommendedText}>推荐</Text>
            </View>
          )}
        </View>
        {isDownloaded && (
          <Ionicons name="checkmark-circle" size={24} color={isEnabled ? colors.primary : colors.success} />
        )}
      </View>

      <Text style={[styles.description, { color: colors.textMuted }]}>
        {description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.sizeContainer}>
          <Ionicons name="cube-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.size, { color: colors.textSecondary }]}>
            {formatSize(size)}
          </Text>
        </View>

        {isDownloading ? (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colors.elevated,
                  width: 100,
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${downloadProgress || 0}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textMuted }]}>
              {downloadProgress?.toFixed(0)}%
            </Text>
          </View>
        ) : isDownloaded ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.danger}15` }]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>删除</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>下载</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  enabledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  enabledText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  size: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
});

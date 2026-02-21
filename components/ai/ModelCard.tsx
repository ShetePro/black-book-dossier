import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  AVAILABLE_MODELS,
  downloadModel,
  deleteModel,
  formatFileSize,
  type ModelId,
} from '@/services/ai/modelManager';

interface ModelCardProps {
  model: typeof AVAILABLE_MODELS[ModelId];
  isDownloaded: boolean;
  isCurrent?: boolean;
  fileSize?: number;
  onDetail: () => void;
  onDownloaded?: () => void;
  onDeleted?: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isDownloaded,
  isCurrent = false,
  fileSize = 0,
  onDetail,
  onDownloaded,
  onDeleted,
}) => {
  const colors = useThemeColor();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadTask, setDownloadTask] = useState<any>(null);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setProgress(0);
    
    const result = await downloadModel(
      model.id,
      (p) => setProgress(p.percentage)
    );
    
    setIsDownloading(false);
    
    if (result.success) {
      onDownloaded?.();
    } else {
      Alert.alert('下载失败', result.error || '请检查网络连接');
    }
  }, [model.id, onDownloaded]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    // TODO: 实现暂停逻辑
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    // TODO: 实现继续逻辑
  }, []);

  const handleCancel = useCallback(() => {
    Alert.alert(
      '取消下载',
      '确定要取消下载吗？',
      [
        { text: '继续下载', style: 'cancel' },
        {
          text: '取消',
          style: 'destructive',
          onPress: () => {
            setIsDownloading(false);
            setProgress(0);
            setIsPaused(false);
            // TODO: 取消下载任务
          },
        },
      ]
    );
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert(
      `删除 ${model.name}`,
      '确定要删除此模型吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteModel(model.id);
            if (result.success) {
              onDeleted?.();
            } else {
              Alert.alert('删除失败', result.error || '请重试');
            }
          },
        },
      ]
    );
  }, [model.id, model.name, onDeleted]);

  if (isDownloaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="cube" size={24} color={colors.primary} />
          </View>
          
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {model.name}
              </Text>
              {isCurrent && (
                <View style={[styles.badge, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    使用中
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {model.description}
            </Text>
            
            <Text style={[styles.size, { color: colors.textSecondary }]}>
              {formatFileSize(fileSize)} / {model.size} MB
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={onDetail}
          >
            <Text style={[styles.actionText, { color: colors.text }]} >
              详情
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { borderColor: colors.danger }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]} >
              删除
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="cloud-outline" size={24} color={colors.textMuted} />
        </View>
        
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.text }]}>
              {model.name}
            </Text>
            {model.recommended && (
              <View style={[styles.badge, { backgroundColor: `${colors.success}20` }]}>
                <Ionicons name="star" size={12} color={colors.success} />
                <Text style={[styles.badgeText, { color: colors.success }]} >
                  推荐
                </Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {model.description}
          </Text>
          
          <Text style={[styles.size, { color: colors.textSecondary }]}>
            {model.size} MB
          </Text>
        </View>
      </View>

      {isDownloading ? (
        <View style={styles.downloadingContainer}>
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, { backgroundColor: colors.elevated }]}>
              <View
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: colors.primary,
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {progress.toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.downloadActions}>
            {isPaused ? (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: `${colors.success}15` }]}
                onPress={handleResume}
              >
                <Ionicons name="play" size={20} color={colors.success} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: `${colors.warning}15` }]}
                onPress={handlePause}
              >
                <Ionicons name="pause" size={20} color={colors.warning} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: `${colors.danger}15` }]}
              onPress={handleCancel}
            >
              <Ionicons name="close" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={onDetail}
          >
            <Text style={[styles.actionText, { color: colors.text }]} >
              详情
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
          >
            <Ionicons name="cloud-download" size={16} color="#0a0a0a" />
            <Text style={styles.downloadButtonText}>
              下载
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  size: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  downloadButtonText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: '600',
  },
  downloadingContainer: {
    marginTop: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  downloadActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

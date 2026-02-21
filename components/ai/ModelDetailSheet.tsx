import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import {
  AVAILABLE_MODELS,
  downloadModel,
  deleteModel,
  formatFileSize,
  getModelFileSize,
  type ModelId,
} from '@/services/ai/modelManager';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModelDetailSheetProps {
  visible: boolean;
  modelId: ModelId | null;
  isDownloaded: boolean;
  onClose: () => void;
  onDownloaded?: () => void;
  onDeleted?: () => void;
}

export const ModelDetailSheet: React.FC<ModelDetailSheetProps> = ({
  visible,
  modelId,
  isDownloaded,
  onClose,
  onDownloaded,
  onDeleted,
}) => {
  const colors = useThemeColor();
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const model = modelId ? AVAILABLE_MODELS[modelId] : null;

  const handleDownload = useCallback(async () => {
    if (!modelId) return;
    
    setIsDownloading(true);
    setProgress(0);
    
    const result = await downloadModel(
      modelId,
      (p) => setProgress(p.percentage)
    );
    
    setIsDownloading(false);
    
    if (result.success) {
      onDownloaded?.();
      onClose();
    } else {
      Alert.alert('下载失败', result.error || '请检查网络连接');
    }
  }, [modelId, onDownloaded, onClose]);

  const handleDelete = useCallback(() => {
    if (!modelId) return;
    
    Alert.alert(
      `删除 ${model?.name}`,
      '确定要删除此模型吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteModel(modelId);
            if (result.success) {
              onDeleted?.();
              onClose();
            } else {
              Alert.alert('删除失败', result.error || '请重试');
            }
          },
        },
      ]
    );
  }, [modelId, model?.name, onDeleted, onClose]);

  if (!model) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
        />
        
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
          
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons 
                name={isDownloaded ? "cube" : "cloud-outline"} 
                size={40} 
                color={colors.primary} 
              />
            </View>
            
            <Text style={[styles.title, { color: colors.text }]}>
              {model.name}
            </Text>
            
            {model.recommended && (
              <View style={[styles.recommendedBadge, { backgroundColor: `${colors.success}20` }]}>
                <Ionicons name="star" size={14} color={colors.success} />
                <Text style={[styles.recommendedText, { color: colors.success }]} >
                  推荐
                </Text>
              </View>
            )}
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {model.description}
            </Text>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]} >
                技术参数
              </Text>
              
              <View style={styles.params}>
                <View style={styles.paramItem}>
                  <Text style={[styles.paramLabel, { color: colors.textMuted }]} >
                    模型大小
                  </Text>
                  <Text style={[styles.paramValue, { color: colors.text }]} >
                    {model.size} MB
                  </Text>
                </View>
                
                <View style={styles.paramItem}>
                  <Text style={[styles.paramLabel, { color: colors.textMuted }]} >
                    量化方式
                  </Text>
                  <Text style={[styles.paramValue, { color: colors.text }]} >
                    INT4 量化
                  </Text>
                </View>
                
                <View style={styles.paramItem}>
                  <Text style={[styles.paramLabel, { color: colors.textMuted }]} >
                    模型格式
                  </Text>
                  <Text style={[styles.paramValue, { color: colors.text }]} >
                    {model.format.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]} >
                性能指标
              </Text>
              
              <View style={styles.metrics}>
                <MetricItem
                  label="推理速度"
                  value={model.size < 1000 ? "⚡ 极快" : model.size < 1500 ? "🚀 快" : "⏱️ 中等"}
                  colors={colors}
                />
                
                <MetricItem
                  label="准确度"
                  value={model.recommended ? "⭐⭐⭐⭐⭐" : "⭐⭐⭐⭐"}
                  colors={colors}
                />
                
                <MetricItem
                  label="内存占用"
                  value={model.size < 500 ? "🟢 低" : model.size < 1000 ? "🟡 中" : "🟠 高"}
                  colors={colors}
                />
                
                <MetricItem
                  label="中文支持"
                  value={model.id.includes('qwen') ? "🇨🇳 优秀" : model.id.includes('llama') ? "🇨🇳 良好" : "🇺🇸 英文为主"}
                  colors={colors}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]} >
                适用场景
              </Text>
              
              <View style={styles.tags}>
                <Tag text="语音分析" colors={colors} />
                <Tag text="实体提取" colors={colors} />
                <Tag text="离线推理" colors={colors} />
                {model.size > 1000 && <Tag text="长文本理解" colors={colors} />}
              </View>
            </View>

            {isDownloaded && (
              <View style={[styles.installedInfo, { backgroundColor: colors.elevated }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.installedText, { color: colors.success }]} >
                  已安装
                </Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            {isDownloaded ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton, { borderColor: colors.danger }]}
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={20} color={colors.danger} />
                <Text style={[styles.actionText, { color: colors.danger }]} >
                  删除模型
                </Text>
              </TouchableOpacity>
            ) : isDownloading ? (
              <View style={styles.downloadingContainer}>
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
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton, { backgroundColor: colors.primary }]}
                onPress={handleDownload}
              >
                <Ionicons name="cloud-download" size={20} color="#0a0a0a" />
                <Text style={styles.downloadText}>
                  下载模型 ({formatFileSize(model.size * 1024 * 1024)})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// 指标项组件
const MetricItem: React.FC<{
  label: string;
  value: string;
  colors: any;
}> = ({ label, value, colors }) => (
  <View style={styles.metricItem}>
    <Text style={[styles.metricLabel, { color: colors.textMuted }]} >
      {label}
    </Text>
    <Text style={[styles.metricValue, { color: colors.text }]} >
      {value}
    </Text>
  </View>
);

// 标签组件
const Tag: React.FC<{
  text: string;
  colors: any;
}> = ({ text, colors }) => (
  <View style={[styles.tag, { backgroundColor: colors.elevated }]}>
    <Text style={[styles.tagText, { color: colors.textSecondary }]} >
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 8,
    gap: 4,
  },
  recommendedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  params: {
    gap: 12,
  },
  paramItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paramLabel: {
    fontSize: 15,
  },
  paramValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  installedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  installedText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    borderWidth: 1,
  },
  downloadButton: {
    borderWidth: 0,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  downloadText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
});

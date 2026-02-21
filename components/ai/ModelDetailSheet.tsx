import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ModelId } from '@/services/ai/llmModelManager';

interface ModelDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  modelId: ModelId | null;
  modelInfo: {
    id: ModelId;
    name: string;
    description: string;
    size: number;
    format: string;
    recommended: boolean;
  } | null;
  isDownloaded: boolean;
  onDownload: () => void;
  onDelete: () => void;
  onEnable: () => void;
  onDisable: () => void;
  isEnabled: boolean;
}

export const ModelDetailSheet: React.FC<ModelDetailSheetProps> = ({
  visible,
  onClose,
  modelInfo,
  isDownloaded,
  onDownload,
  onDelete,
  onEnable,
  onDisable,
  isEnabled,
}) => {
  const colors = useThemeColor();

  const formatSize = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${modelInfo?.name} 吗？删除后将无法使用本地 AI 功能。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  if (!modelInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>模型详情</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Model Info Card */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <View style={styles.modelHeader}>
                <Text style={[styles.modelName, { color: colors.text }]}>
                  {modelInfo.name}
                </Text>
                {modelInfo.recommended && (
                  <View
                    style={[
                      styles.recommendedBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.recommendedText}>推荐</Text>
                  </View>
                )}
              </View>

              <Text
                style={[styles.description, { color: colors.textSecondary }]}
              >
                {modelInfo.description}
              </Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="cube-outline" size={20} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    模型大小
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {formatSize(modelInfo.size)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="document-outline" size={20} color={colors.primary} />
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    格式
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {modelInfo.format.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name={isDownloaded ? 'checkmark-circle' : 'cloud-offline'}
                    size={20}
                    color={isDownloaded ? colors.success : colors.textMuted}
                  />
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    状态
                  </Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: isDownloaded ? colors.success : colors.textMuted },
                    ]}
                  >
                    {isDownloaded ? '已下载' : '未下载'}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons
                    name={isEnabled ? 'power' : 'power-outline'}
                    size={20}
                    color={isEnabled ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    启用状态
                  </Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: isEnabled ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {isEnabled ? '已启用' : '已禁用'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Features */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                功能特点
              </Text>
              <View style={[styles.featuresCard, { backgroundColor: colors.surface }]}>
                <FeatureItem
                  icon="chatbubble-outline"
                  title="实体提取"
                  description="从语音中自动识别人名、公司、需求等关键信息"
                  colors={colors}
                />
                <FeatureItem
                  icon="git-merge-outline"
                  title="智能匹配"
                  description="自动匹配和关联联系人信息"
                  colors={colors}
                />
                <FeatureItem
                  icon="shield-checkmark-outline"
                  title="隐私保护"
                  description="本地运行，数据不会上传到云端"
                  colors={colors}
                />
                <FeatureItem
                  icon="wifi-outline"
                  title="离线可用"
                  description="无需网络连接即可使用 AI 功能"
                  colors={colors}
                  isLast
                />
              </View>
            </View>

            {/* Bottom Spacer */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Bottom Actions */}
          <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            {isDownloaded ? (
              <>
                {isEnabled ? (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.elevated }]}
                    onPress={onDisable}
                  >
                    <Ionicons name="power-outline" size={20} color={colors.text} />
                    <Text style={[styles.actionText, { color: colors.text }]}>
                      禁用模型
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={onEnable}
                  >
                    <Ionicons name="power" size={20} color="#0a0a0a" />
                    <Text style={[styles.actionText, { color: '#0a0a0a' }]}>
                      启用模型
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: `${colors.danger}15` }]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.fullButton, { backgroundColor: colors.primary }]}
                onPress={onDownload}
              >
                <Ionicons name="download-outline" size={20} color="#0a0a0a" />
                <Text style={[styles.fullButtonText, { color: '#0a0a0a' }]}>
                  下载模型
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: any;
  isLast?: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({
  icon,
  title,
  description,
  colors,
  isLast,
}) => (
  <View style={[styles.featureItem, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
    <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}15` }]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <View style={styles.featureContent}>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
        {description}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modelName: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  recommendedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0a0a0a',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statItem: {
    width: '50%',
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuresCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  featureDesc: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  fullButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettingsStore } from '@/store/settingsStore';
import {
  AVAILABLE_MODELS,
  ModelId,
  isModelDownloaded,
  downloadModel,
  deleteModel,
  getDownloadedModels,
  formatFileSize,
  getModelFileSize,
} from '@/services/ai/llmModelManager';
import { ModelCard } from '@/components/ai/ModelCard';
import { ModelDetailSheet } from '@/components/ai/ModelDetailSheet';

export default function AIModelsScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { settings, updateSetting } = useSettingsStore();

  const [downloadedModels, setDownloadedModels] = useState<ModelId[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Partial<Record<ModelId, number>>>({});
  const [downloadingModels, setDownloadingModels] = useState<Set<ModelId>>(new Set());
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => {
    loadDownloadedModels();
  }, []);

  const loadDownloadedModels = async () => {
    const models = await getDownloadedModels();
    setDownloadedModels(models);
  };

  const handleDownload = async (modelId: ModelId) => {
    try {
      setDownloadingModels((prev) => new Set(prev).add(modelId));
      setDownloadProgress((prev) => ({ ...prev, [modelId]: 0 }));

      const result = await downloadModel(modelId, (progress) => {
        setDownloadProgress((prev) => ({
          ...prev,
          [modelId]: progress.percentage,
        }));
      });

      if (result.success) {
        await loadDownloadedModels();
        Alert.alert('下载完成', `${AVAILABLE_MODELS[modelId].name} 下载成功！`);
      } else {
        Alert.alert('下载失败', result.error || '未知错误');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('下载失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setDownloadingModels((prev) => {
        const next = new Set(prev);
        next.delete(modelId);
        return next;
      });
      setDownloadProgress((prev) => {
        const next = { ...prev };
        delete next[modelId];
        return next;
      });
    }
  };

  const handleDelete = async (modelId: ModelId) => {
    try {
      const result = await deleteModel(modelId);
      if (result.success) {
        await loadDownloadedModels();
        // 如果删除的是当前启用的模型，禁用本地模型
        if (settings.ai.localModel.enabled) {
          const remaining = await getDownloadedModels();
          if (remaining.length === 0) {
            await updateSetting('ai.localModel.enabled', false);
          }
        }
      } else {
        Alert.alert('删除失败', result.error || '未知错误');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('删除失败', error instanceof Error ? error.message : '未知错误');
    }
  };

  const handleEnable = async () => {
    if (selectedModel) {
      await updateSetting('ai.localModel.enabled', true);
      await updateSetting('ai.localModel.modelId', selectedModel);
      await updateSetting('ai.localModel.modelName', AVAILABLE_MODELS[selectedModel].name);
      await updateSetting('ai.localModel.modelSize', AVAILABLE_MODELS[selectedModel].size);
    }
  };

  const handleDisable = async () => {
    await updateSetting('ai.localModel.enabled', false);
  };

  const openDetail = (modelId: ModelId) => {
    setSelectedModel(modelId);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedModel(null);
  };

  const models = Object.values(AVAILABLE_MODELS);
  const selectedModelInfo = selectedModel ? AVAILABLE_MODELS[selectedModel] : null;

  // 获取当前启用的模型ID
  const getEnabledModelId = (): ModelId | null => {
    if (!settings.ai.localModel.enabled) return null;
    const storedModelId = settings.ai.localModel.modelId as ModelId | undefined;
    if (storedModelId && AVAILABLE_MODELS[storedModelId]) {
      return storedModelId;
    }
    const enabledModel = models.find(m => m.name === settings.ai.localModel.modelName);
    return enabledModel?.id || null;
  };

  const enabledModelId = getEnabledModelId();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>AI 模型管理</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="hardware-chip-outline" size={28} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>本地 AI 模型</Text>
          </View>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}
          >
            下载本地 AI 模型后，语音转文字和实体提取功能可以在设备本地运行，无需联网，更好地保护您的隐私。
          </Text>

          {settings.ai.localModel.enabled && (
            <View style={[styles.statusBadge, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.statusText, { color: colors.success }]}>
                本地 AI 已启用
              </Text>
            </View>
          )}
        </View>

        {/* Downloaded Models */}
        {downloadedModels.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              已下载的模型
            </Text>
            {downloadedModels.map((modelId) => (
              <ModelCard
                key={modelId}
                modelId={modelId}
                name={AVAILABLE_MODELS[modelId].name}
                description={AVAILABLE_MODELS[modelId].description}
                size={AVAILABLE_MODELS[modelId].size}
                isDownloaded={true}
                isEnabled={enabledModelId === modelId}
                isRecommended={AVAILABLE_MODELS[modelId].recommended}
                onDownload={() => handleDownload(modelId)}
                onDelete={() => handleDelete(modelId)}
                onPress={() => openDetail(modelId)}
              />
            ))}
          </View>
        )}

        {/* Available Models */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            可用模型
          </Text>
          {models
            .filter((model) => !downloadedModels.includes(model.id))
            .map((model) => (
              <ModelCard
                key={model.id}
                modelId={model.id}
                name={model.name}
                description={model.description}
                size={model.size}
                isDownloaded={false}
                isRecommended={model.recommended}
                onDownload={() => handleDownload(model.id)}
                onDelete={() => handleDelete(model.id)}
                onPress={() => openDetail(model.id)}
                isDownloading={downloadingModels.has(model.id)}
                downloadProgress={downloadProgress[model.id]}
              />
            ))}
        </View>

        {/* Storage Info */}
        <View style={[styles.storageCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="server-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.storageText, { color: colors.textSecondary }]}>
            模型文件将存储在本地，不会上传到云端
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Model Detail Sheet */}
      <ModelDetailSheet
        visible={detailVisible}
        onClose={closeDetail}
        modelId={selectedModel}
        modelInfo={selectedModelInfo}
        isDownloaded={selectedModel ? downloadedModels.includes(selectedModel) : false}
        onDownload={() => selectedModel && handleDownload(selectedModel)}
        onDelete={() => selectedModel && handleDelete(selectedModel)}
        onEnable={handleEnable}
        onDisable={handleDisable}
        isEnabled={enabledModelId === selectedModel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  storageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  storageText: {
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
});

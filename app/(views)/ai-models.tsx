import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { StatusBar } from 'expo-status-bar';
import {
  AVAILABLE_MODELS,
  getAllModels,
  getDownloadedModels,
  getModelFileSize,
  getTotalModelSize,
  formatFileSize,
  type ModelId,
} from '@/services/ai/modelManager';
import { ModelCard } from '@/components/ai/ModelCard';
import { ModelDetailSheet } from '@/components/ai/ModelDetailSheet';

export default function AIModelsScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  
  const [downloadedModels, setDownloadedModels] = useState<ModelId[]>([]);
  const [modelSizes, setModelSizes] = useState<Record<string, number>>({});
  const [selectedModel, setSelectedModel] = useState<ModelId | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [currentModel, setCurrentModel] = useState<ModelId | null>(null);

  useEffect(() => {
    loadModelStatus();
  }, []);

  const loadModelStatus = async () => {
    const downloaded = await getDownloadedModels();
    setDownloadedModels(downloaded);
    
    const sizes: Record<string, number> = {};
    for (const modelId of downloaded) {
      sizes[modelId] = await getModelFileSize(modelId);
    }
    setModelSizes(sizes);
    
    const total = await getTotalModelSize();
    setTotalSize(total);
    
    if (downloaded.length > 0) {
      setCurrentModel(downloaded[downloaded.length - 1]);
    }
  };

  const handleModelDownloaded = useCallback(() => {
    loadModelStatus();
  }, []);

  const handleModelDeleted = useCallback(() => {
    loadModelStatus();
  }, []);

  const openDetail = (modelId: ModelId) => {
    setSelectedModel(modelId);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setTimeout(() => setSelectedModel(null), 300);
  };

  const downloadedModelList = downloadedModels.map(id => AVAILABLE_MODELS[id]);
  const availableModelList = getAllModels().filter(
    model => !downloadedModels.includes(model.id)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text }]}>
          AI 模型管理
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewNumber, { color: colors.primary }]}>
                {downloadedModels.length}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>
                已下载
              </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewNumber, { color: colors.primary }]}>
                {formatFileSize(totalSize)}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>
                存储占用
              </Text>
            </View>
          </View>
          
          {currentModel && (
            <View style={[styles.currentModelBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.currentModelText, { color: colors.primary }]}>
                当前使用: {AVAILABLE_MODELS[currentModel].name}
              </Text>
            </View>
          )}
        </View>

        {downloadedModelList.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              已下载模型
            </Text>
            
            <View style={styles.downloadedList}>
              {downloadedModelList.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isDownloaded={true}
                  isCurrent={currentModel === model.id}
                  fileSize={modelSizes[model.id] || 0}
                  onDetail={() => openDetail(model.id)}
                  onDeleted={handleModelDeleted}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            可用模型 ({availableModelList.length}个)
          </Text>
          
          <View style={styles.availableList}>
            {availableModelList.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isDownloaded={false}
                onDetail={() => openDetail(model.id)}
                onDownloaded={handleModelDownloaded}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="information-circle" size={16} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            同时只能下载一个模型。建议在 Wi-Fi 环境下下载大型模型。
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ModelDetailSheet
        visible={detailVisible}
        modelId={selectedModel}
        isDownloaded={selectedModel ? downloadedModels.includes(selectedModel) : false}
        onClose={closeDetail}
        onDownloaded={handleModelDownloaded}
        onDeleted={handleModelDeleted}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  overviewLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
  },
  currentModelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: 'center',
  },
  currentModelText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  downloadedList: {
    gap: 12,
  },
  availableList: {
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    flex: 1,
  },
});

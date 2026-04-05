import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useSettingsStore } from '@/store/settingsStore';
import { 
  isModelDownloaded, 
  getDownloadedModels,
  AVAILABLE_MODELS 
} from '@/services/ai/llmModelManager';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

interface LLMStatusCheckProps {
  onStatusChange?: (isReady: boolean) => void;
  showAlways?: boolean; // 即使模型已准备好也显示状态
}

export const LLMStatusCheck: React.FC<LLMStatusCheckProps> = ({ 
  onStatusChange,
  showAlways = false 
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { settings } = useSettingsStore();
  const [status, setStatus] = useState<'checking' | 'no-model' | 'not-downloaded' | 'ready'>('checking');
  const [modelName, setModelName] = useState<string>('');

  useEffect(() => {
    checkModelStatus();
  }, [settings.ai.localModel.modelId, settings.ai.localModel.enabled]);

  const checkModelStatus = async () => {
    setStatus('checking');
    
    try {
      const modelId = settings.ai.localModel.modelId as keyof typeof AVAILABLE_MODELS;
      
      // 1. 检查是否设置了模型
      if (!modelId || !settings.ai.localModel.enabled) {
        setStatus('no-model');
        onStatusChange?.(false);
        return;
      }

      const modelConfig = AVAILABLE_MODELS[modelId];
      if (!modelConfig) {
        setStatus('no-model');
        onStatusChange?.(false);
        return;
      }

      setModelName(modelConfig.name);

      // 2. 检查模型是否已下载
      const isDownloaded = await isModelDownloaded(modelId);
      
      if (isDownloaded) {
        setStatus('ready');
        onStatusChange?.(true);
      } else {
        setStatus('not-downloaded');
        onStatusChange?.(false);
      }
    } catch (error) {
      console.error('[LLMStatusCheck] Error checking status:', error);
      setStatus('no-model');
      onStatusChange?.(false);
    }
  };

  const navigateToAIModels = () => {
    router.push('/(views)/ai-models');
  };

  // 如果模型已准备好且不显示 always，返回 null
  if (status === 'ready' && !showAlways) {
    return null;
  }

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <View style={styles.container}>
            <View style={styles.iconContainer}>
              <Ionicons name="sync" size={24} color="#c9a962" />
            </View>
            <ThemedText style={styles.title}>
              {t('aiModels.checking') || '检查 AI 模型状态...'}
            </ThemedText>
          </View>
        );

      case 'no-model':
        return (
          <TouchableOpacity style={styles.container} onPress={navigateToAIModels}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Ionicons name="alert-circle" size={24} color="#f59e0b" />
            </View>
            <View style={styles.content}>
              <ThemedText style={styles.title}>
                {t('aiModels.notSet') || 'AI 模型未设置'}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {t('aiModels.tapToSet') || '点击前往 AI 模型管理页面设置'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        );

      case 'not-downloaded':
        return (
          <TouchableOpacity style={styles.container} onPress={navigateToAIModels}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Ionicons name="cloud-download" size={24} color="#ef4444" />
            </View>
            <View style={styles.content}>
              <ThemedText style={styles.title}>
                {t('aiModels.notDownloaded') || '模型未下载'}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {modelName} {t('aiModels.tapToDownload') || '点击前往下载'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        );

      case 'ready':
        return (
          <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <View style={styles.content}>
              <ThemedText style={styles.title}>
                {t('aiModels.ready') || 'AI 模型已就绪'}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {modelName} {t('aiModels.available') || '已可用'}
              </ThemedText>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.wrapper}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f5f5',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});

export default LLMStatusCheck;

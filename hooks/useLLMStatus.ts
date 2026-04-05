import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { isModelDownloaded, AVAILABLE_MODELS } from '@/services/ai/llmModelManager';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

interface UseLLMStatusReturn {
  isReady: boolean;
  isChecking: boolean;
  status: 'checking' | 'no-model' | 'not-downloaded' | 'ready';
  modelName: string;
  checkStatus: () => Promise<void>;
  showSetupPrompt: () => void;
}

export const useLLMStatus = (): UseLLMStatusReturn => {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const [status, setStatus] = useState<'checking' | 'no-model' | 'not-downloaded' | 'ready'>('checking');
  const [modelName, setModelName] = useState<string>('');

  const checkStatus = useCallback(async () => {
    setStatus('checking');
    
    try {
      const modelId = settings.ai.localModel.modelId as keyof typeof AVAILABLE_MODELS;
      
      // 检查是否设置了模型
      if (!modelId || !settings.ai.localModel.enabled) {
        setStatus('no-model');
        return;
      }

      const modelConfig = AVAILABLE_MODELS[modelId];
      if (!modelConfig) {
        setStatus('no-model');
        return;
      }

      setModelName(modelConfig.name);

      // 检查模型是否已下载
      const isDownloaded = await isModelDownloaded(modelId);
      
      if (isDownloaded) {
        setStatus('ready');
      } else {
        setStatus('not-downloaded');
      }
    } catch (error) {
      console.error('[useLLMStatus] Error checking status:', error);
      setStatus('no-model');
    }
  }, [settings.ai.localModel.modelId, settings.ai.localModel.enabled]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const showSetupPrompt = useCallback(() => {
    switch (status) {
      case 'no-model':
        Alert.alert(
          t('aiModels.notSet'),
          t('aiModels.tapToSet'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { 
              text: t('common.ok'), 
              onPress: () => {
                // 导航到 AI 模型页面
                // 使用 expo-router
                const { router } = require('expo-router');
                router.push('/(views)/ai-models');
              }
            }
          ]
        );
        break;
      
      case 'not-downloaded':
        Alert.alert(
          t('aiModels.notDownloaded'),
          `${modelName} ${t('aiModels.tapToDownload')}`,
          [
            { text: t('common.cancel'), style: 'cancel' },
            { 
              text: t('aiModels.downloadModel'), 
              onPress: () => {
                const { router } = require('expo-router');
                router.push('/(views)/ai-models');
              }
            }
          ]
        );
        break;
    }
  }, [status, modelName, t]);

  return {
    isReady: status === 'ready',
    isChecking: status === 'checking',
    status,
    modelName,
    checkStatus,
    showSetupPrompt,
  };
};

export default useLLMStatus;

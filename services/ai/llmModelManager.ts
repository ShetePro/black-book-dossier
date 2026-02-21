import { Paths } from 'expo-file-system';
import { useSettingsStore } from '@/store/settingsStore';

// 可用模型配置列表
export const AVAILABLE_MODELS = {
  'qwen2.5-0.5b': {
    id: 'qwen2.5-0.5b',
    name: 'Qwen 2.5 (0.5B)',
    description: '阿里通义千问，中文优化，适合中文语音识别',
    filename: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    size: 350, // MB
    format: 'gguf' as const,
    recommended: true,
  },
  'tinyllama-1.1b': {
    id: 'tinyllama-1.1b',
    name: 'TinyLlama (1.1B)',
    description: '轻量级英文模型，推理速度快',
    filename: 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    downloadUrl: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
    size: 600, // MB
    format: 'gguf' as const,
    recommended: false,
  },
  'phi-2': {
    id: 'phi-2',
    name: 'Phi-2 (2.7B)',
    description: '微软出品，性能优秀，多语言支持',
    filename: 'phi-2.Q4_K_M.gguf',
    downloadUrl: 'https://huggingface.co/TheBloke/phi-2-GGUF/resolve/main/phi-2.Q4_K_M.gguf',
    size: 1600, // MB
    format: 'gguf' as const,
    recommended: false,
  },
  'gemma-2b': {
    id: 'gemma-2b',
    name: 'Gemma (2B)',
    description: 'Google 出品，多语言支持',
    filename: 'gemma-2b-it.Q4_K_M.gguf',
    downloadUrl: 'https://huggingface.co/TheBloke/gemma-2b-it-GGUF/resolve/main/gemma-2b-it.Q4_K_M.gguf',
    size: 1500, // MB
    format: 'gguf' as const,
    recommended: false,
  },
  'llama-3.2-1b': {
    id: 'llama-3.2-1b',
    name: 'Llama 3.2 (1B)',
    description: 'Meta 最新，多语言，长上下文',
    filename: 'Llama-3.2-1B-Instruct.Q4_K_M.gguf',
    downloadUrl: 'https://huggingface.co/TheBloke/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct.Q4_K_M.gguf',
    size: 800, // MB
    format: 'gguf' as const,
    recommended: false,
  },
  'stablelm-2-1.6b': {
    id: 'stablelm-2-1.6b',
    name: 'Stable LM 2 (1.6B)',
    description: 'Stability AI 出品，稳定高效',
    filename: 'stablelm-2-1_6b-chat.Q4_K_M.gguf',
    downloadUrl: 'https://huggingface.co/TheBloke/stablelm-2-1_6b-chat-GGUF/resolve/main/stablelm-2-1_6b-chat.Q4_K_M.gguf',
    size: 1000, // MB
    format: 'gguf' as const,
    recommended: false,
  },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

// 获取模型配置
export const getModelConfig = (modelId: ModelId) => {
  return AVAILABLE_MODELS[modelId];
};

// 获取所有可用模型列表
export const getAllModels = () => {
  return Object.values(AVAILABLE_MODELS);
};

// 获取推荐的模型
export const getRecommendedModel = () => {
  return Object.values(AVAILABLE_MODELS).find(m => m.recommended) || AVAILABLE_MODELS['qwen2.5-0.5b'];
};

// 模型存储路径
const getModelDirectory = (): string => {
  const dir = Paths.document?.uri || Paths.cache?.uri;
  if (!dir) {
    throw new Error('Storage directory not available');
  }
  return `${dir}ai-models/`;
};

// 获取特定模型的路径
export const getModelPath = (modelId: ModelId): string => {
  const config = getModelConfig(modelId);
  return `${getModelDirectory()}${config.filename}`;
};

// 下载进度回调类型
export type DownloadProgressCallback = (progress: {
  downloadedBytes: number;
  totalBytes: number;
  percentage: number;
}) => void;

/**
 * 检查特定模型是否已下载
 */
export const isModelDownloaded = async (modelId: ModelId): Promise<boolean> => {
  try {
    const { File } = await import('expo-file-system');
    const modelPath = getModelPath(modelId);
    const file = new File(modelPath);
    return file.exists;
  } catch (error) {
    console.error('[LLMManager] Error checking model:', error);
    return false;
  }
};

/**
 * 检查是否有任何模型已下载
 */
export const hasAnyModelDownloaded = async (): Promise<boolean> => {
  for (const modelId of Object.keys(AVAILABLE_MODELS) as ModelId[]) {
    if (await isModelDownloaded(modelId)) {
      return true;
    }
  }
  return false;
};

/**
 * 获取已下载的模型列表
 */
export const getDownloadedModels = async (): Promise<ModelId[]> => {
  const downloaded: ModelId[] = [];
  for (const modelId of Object.keys(AVAILABLE_MODELS) as ModelId[]) {
    if (await isModelDownloaded(modelId)) {
      downloaded.push(modelId);
    }
  }
  return downloaded;
};

/**
 * 获取模型文件大小
 */
export const getModelFileSize = async (modelId: ModelId): Promise<number> => {
  try {
    const { File } = await import('expo-file-system');
    const modelPath = getModelPath(modelId);
    const file = new File(modelPath);
    if (file.exists) {
      return file.size;
    }
    return 0;
  } catch (error) {
    console.error('[LLMManager] Error getting model size:', error);
    return 0;
  }
};

/**
 * 下载特定模型
 */
export const downloadModel = async (
  modelId: ModelId,
  onProgress?: DownloadProgressCallback
): Promise<{ success: boolean; error?: string }> => {
  try {
    const config = getModelConfig(modelId);
    console.log(`[LLMManager] Starting download of ${config.name}...`);
    
    const { Directory, File } = await import('expo-file-system');
    const FileSystemLegacy = await import('expo-file-system/legacy');
    
    // 确保目录存在
    const modelDir = getModelDirectory();
    const dir = new Directory(modelDir);
    if (!dir.exists) {
      dir.create();
    }
    
    const modelPath = getModelPath(modelId);
    const file = new File(modelPath);
    
    // 检查是否已存在
    if (file.exists) {
      console.log(`[LLMManager] ${config.name} already exists`);
      return { success: true };
    }
    
    // 开始下载
    const downloadResumable = FileSystemLegacy.createDownloadResumable(
      config.downloadUrl,
      modelPath,
      {},
      (downloadProgress) => {
        const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
        const percentage = totalBytesExpectedToWrite > 0 
          ? (totalBytesWritten / totalBytesExpectedToWrite) * 100 
          : 0;
        
        onProgress?.({
          downloadedBytes: totalBytesWritten,
          totalBytes: totalBytesExpectedToWrite,
          percentage: Math.round(percentage),
        });
      }
    );
    
    const result = await downloadResumable.downloadAsync();
    
    if (!result) {
      throw new Error('Download failed');
    }
    
    // 下载成功，更新设置
    const { updateSetting } = useSettingsStore.getState();
    await updateSetting('ai.localModel.downloaded', true);
    await updateSetting('ai.localModel.modelName', config.name);
    await updateSetting('ai.localModel.modelSize', config.size);
    
    console.log(`[LLMManager] ${config.name} downloaded successfully`);
    return { success: true };
    
  } catch (error) {
    console.error(`[LLMManager] Download failed for ${modelId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * 删除特定模型
 */
export const deleteModel = async (modelId: ModelId): Promise<{ success: boolean; error?: string }> => {
  try {
    const { File } = await import('expo-file-system');
    const modelPath = getModelPath(modelId);
    const file = new File(modelPath);
    
    if (file.exists) {
      file.delete();
      console.log(`[LLMManager] Deleted ${modelId}`);
    }
    
    // 检查是否还有其他模型
    const hasOthers = await hasAnyModelDownloaded();
    if (!hasOthers) {
      const { updateSetting } = useSettingsStore.getState();
      await updateSetting('ai.localModel.downloaded', false);
      await updateSetting('ai.localModel.enabled', false);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error(`[LLMManager] Delete failed for ${modelId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * 删除所有模型
 */
export const deleteAllModels = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    for (const modelId of Object.keys(AVAILABLE_MODELS) as ModelId[]) {
      await deleteModel(modelId);
    }
    
    const { updateSetting } = useSettingsStore.getState();
    await updateSetting('ai.localModel.downloaded', false);
    await updateSetting('ai.localModel.enabled', false);
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * 获取当前使用的模型 ID
 */
export const getCurrentModelId = async (): Promise<ModelId | null> => {
  const { settings } = useSettingsStore.getState();
  
  // 尝试从已下载的模型中找到第一个
  const downloaded = await getDownloadedModels();
  if (downloaded.length > 0) {
    return downloaded[downloaded.length - 1];
  }
  
  return null;
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 计算所有已下载模型的总大小
 */
export const getTotalModelSize = async (): Promise<number> => {
  let totalSize = 0;
  const downloaded = await getDownloadedModels();
  
  for (const modelId of downloaded) {
    totalSize += await getModelFileSize(modelId);
  }
  
  return totalSize;
};

/**
 * 检查是否有足够的存储空间
 */
export const checkStorageSpace = async (requiredMB: number): Promise<{
  hasEnoughSpace: boolean;
  freeSpaceMB: number;
  message?: string;
}> => {
  try {
    // 注意：expo-file-system 没有直接提供剩余空间 API
    // 这里简化处理，实际项目中需要使用原生模块
    // 或尝试创建临时文件来估算剩余空间
    
    // 模拟检查：假设至少有 2GB 可用空间
    const freeSpaceMB = 4096; // 模拟 4GB 可用空间
    const MIN_FREE_SPACE_MB = 2048; // 2GB
    const totalRequired = requiredMB + MIN_FREE_SPACE_MB;
    
    if (freeSpaceMB < requiredMB) {
      return {
        hasEnoughSpace: false,
        freeSpaceMB,
        message: `存储空间不足。需要 ${formatFileSize(requiredMB * 1024 * 1024)}，但只剩 ${formatFileSize(freeSpaceMB * 1024 * 1024)}`,
      };
    }
    
    if (freeSpaceMB < totalRequired) {
      return {
        hasEnoughSpace: true,
        freeSpaceMB,
        message: `警告：下载后存储空间将不足 ${MIN_FREE_SPACE_MB}MB，可能影响应用性能`,
      };
    }
    
    return {
      hasEnoughSpace: true,
      freeSpaceMB,
    };
  } catch (error) {
    console.error('[LLMManager] Error checking storage:', error);
    return {
      hasEnoughSpace: false,
      freeSpaceMB: 0,
      message: '无法检查存储空间',
    };
  }
};

/**
 * 检查是否有足够的存储空间（旧接口兼容）
 */
export const hasEnoughStorage = async (requiredMB: number): Promise<boolean> => {
  const result = await checkStorageSpace(requiredMB);
  return result.hasEnoughSpace;
};

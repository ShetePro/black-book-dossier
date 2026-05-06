import { Paths } from 'expo-file-system';
import { useSettingsStore } from '@/store/settingsStore';

// 模型分组类型
export type ModelCategory = 'efficient' | 'powerful';

// 可用模型配置列表（精简高效组 + 强性能组）
export const AVAILABLE_MODELS = {
  // === 精简高效组（节省空间）===
'llama-3.2-1b': {
    id: 'llama-3.2-1b',
    name: 'Llama 3.2 1B',
    description: 'Meta 最新，多语言支持，体积小性能均衡',
    category: 'efficient' as ModelCategory,
    filename: 'llama-3.2-1b-instruct-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/hugging-quants/Llama-3.2-1B-Instruct-Q4_K_M-GGUF/resolve/main/llama-3.2-1b-instruct-q4_k_m.gguf',
    size: 808,
    contextLength: 8000,
    format: 'gguf' as const,
    recommended: true,
    highlight: '体积小，速度快',
  },
  'gemma-2-2b': {
    id: 'gemma-2-2b',
    name: 'Gemma 2 2B',
    description: 'Google 最新，多语言支持，8K 上下文',
    category: 'efficient' as ModelCategory,
    filename: 'gemma-2-2b-it-Q4_K_M.gguf',
    downloadUrl: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    size: 1710,
    contextLength: 8000,
    format: 'gguf' as const,
    recommended: false,
    highlight: 'Google 最新',
  },
  'qwen-2.5-1.5b': {
    id: 'qwen-2.5-1.5b',
    name: 'Qwen 2.5 1.5B',
    description: '阿里通义千问，中文优化最佳，32K 长上下文',
    category: 'efficient' as ModelCategory,
    filename: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    size: 1120,
    contextLength: 32000,
    format: 'gguf' as const,
    recommended: false,
    highlight: '中文最佳',
  },

  // === 强性能组（更好效果）===
  'llama-3.2-3b': {
    id: 'llama-3.2-3b',
    name: 'Llama 3.2 3B',
    description: 'Meta 最新，性能更强，多语言支持',
    category: 'powerful' as ModelCategory,
    filename: 'llama-3.2-3b-instruct-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/hugging-quants/Llama-3.2-3B-Instruct-Q4_K_M-GGUF/resolve/main/llama-3.2-3b-instruct-q4_k_m.gguf',
    size: 2020,
    contextLength: 8000,
    format: 'gguf' as const,
    recommended: false,
    highlight: '性能强劲',
  },
  'gemma-2-9b': {
    id: 'gemma-2-9b',
    name: 'Gemma 2 9B',
    description: 'Google 最新，最强性能，体积较大',
    category: 'powerful' as ModelCategory,
    filename: 'gemma-2-9b-it-Q4_K_M.gguf',
    downloadUrl: 'https://huggingface.co/bartowski/gemma-2-9b-it-GGUF/resolve/main/gemma-2-9b-it-Q4_K_M.gguf',
    size: 5760,
    contextLength: 8000,
    format: 'gguf' as const,
    recommended: false,
    highlight: '最强性能',
  },
  'qwen-2.5-3b': {
    id: 'qwen-2.5-3b',
    name: 'Qwen 2.5 3B',
    description: '阿里通义千问，中文最佳性能，32K 长上下文',
    category: 'powerful' as ModelCategory,
    filename: 'qwen2.5-3b-instruct-q4_k_m.gguf',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf',
    size: 1930,
    contextLength: 32000,
    format: 'gguf' as const,
    recommended: false,
    highlight: '中文最佳性能',
  },
} as const;

export type ModelId = keyof typeof AVAILABLE_MODELS;

export type ModelConfig = {
  id: ModelId;
  name: string;
  description: string;
  category: ModelCategory;
  filename: string;
  downloadUrl: string;
  size: number;
  contextLength: number;
  format: 'gguf';
  recommended: boolean;
  highlight: string;
};

export const getModelsByCategory = (category: ModelCategory): ModelConfig[] => {
  return Object.values(AVAILABLE_MODELS).filter(m => m.category === category);
};

export const getEfficientModels = (): ModelConfig[] => getModelsByCategory('efficient');
export const getPowerfulModels = (): ModelConfig[] => getModelsByCategory('powerful');

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
  return Object.values(AVAILABLE_MODELS).find(m => m.recommended) || AVAILABLE_MODELS['llama-3.2-1b'];
};

// 模型存储路径
const getModelDirectory = (): string => {
  const dir = Paths.document?.uri || Paths.cache?.uri;
  if (!dir) {
    throw new Error('Storage directory not available');
  }
  // 移除 file:// 前缀（如果存在），llama.rn 需要绝对路径
  const cleanDir = dir.replace(/^file:\/\//, '');
  return `${cleanDir}ai-models/`;
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
    if (!file.exists) return false;
    // 检查文件大小，至少 10MB 才认为是有效文件
    if (file.size < 10 * 1024 * 1024) {
      console.warn(`[LLMManager] Model file too small (${file.size} bytes), considered incomplete`);
      return false;
    }
    return true;
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
    
    // 检查是否存在不完整的文件，如果有则删除重新下载
    if (file.exists && file.size < 10 * 1024 * 1024) {
      console.log(`[LLMManager] Found incomplete file (${file.size} bytes), deleting and re-downloading`);
      file.delete();
    }
    
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
    await updateSetting('ai.localModel.modelId', modelId);
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

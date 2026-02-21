import { Paths } from 'expo-file-system';
import { useSettingsStore } from '@/store/settingsStore';

// 模型配置
export const MODEL_CONFIG = {
  name: 'Phi-3 Mini',
  version: '1.0',
  filename: 'phi3-mini-int4.onnx',
  // 这里使用示例URL，实际应该替换为真实的模型下载地址
  downloadUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-onnx/resolve/main/cpu_and_mobile/cpu-int4-rtn-block-32-acc-level-4/phi3-mini-4k-instruct-cpu-int4-rtn-block-32-acc-level-4.onnx',
  size: 3800, // MB
  format: 'onnx' as const,
};

// 模型存储路径
const getModelDirectory = (): string => {
  const dir = Paths.document?.uri || Paths.cache?.uri;
  if (!dir) {
    throw new Error('Storage directory not available');
  }
  return `${dir}ai-models/`;
};

const getModelPath = (): string => {
  return `${getModelDirectory()}${MODEL_CONFIG.filename}`;
};

// 下载进度回调类型
export type DownloadProgressCallback = (progress: {
  downloadedBytes: number;
  totalBytes: number;
  percentage: number;
}) => void;

/**
 * 检查模型是否已下载
 */
export const isModelDownloaded = async (): Promise<boolean> => {
  try {
    const { Directory, File } = await import('expo-file-system');
    const modelPath = getModelPath();
    const file = new File(modelPath);
    return file.exists;
  } catch (error) {
    console.error('[ModelManager] Error checking model:', error);
    return false;
  }
};

/**
 * 获取模型文件大小
 */
export const getModelFileSize = async (): Promise<number> => {
  try {
    const { File } = await import('expo-file-system');
    const modelPath = getModelPath();
    const file = new File(modelPath);
    if (file.exists) {
      return file.size;
    }
    return 0;
  } catch (error) {
    console.error('[ModelManager] Error getting model size:', error);
    return 0;
  }
};

/**
 * 下载模型
 */
export const downloadModel = async (
  onProgress?: DownloadProgressCallback
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[ModelManager] Starting model download...');
    
    const { Directory, File } = await import('expo-file-system');
    const FileSystemLegacy = await import('expo-file-system/legacy');
    
    // 确保目录存在
    const modelDir = getModelDirectory();
    const dir = new Directory(modelDir);
    if (!dir.exists) {
      dir.create();
    }
    
    const modelPath = getModelPath();
    const file = new File(modelPath);
    
    // 检查是否已存在
    if (file.exists) {
      console.log('[ModelManager] Model already exists');
      return { success: true };
    }
    
    // 开始下载
    const downloadResumable = FileSystemLegacy.createDownloadResumable(
      MODEL_CONFIG.downloadUrl,
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
    const { updateLocalModelStatus } = useSettingsStore.getState();
    await updateLocalModelStatus(true, MODEL_CONFIG.size);
    
    console.log('[ModelManager] Model downloaded successfully');
    return { success: true };
    
  } catch (error) {
    console.error('[ModelManager] Download failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * 删除模型
 */
export const deleteModel = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[ModelManager] Deleting model...');
    
    const { File } = await import('expo-file-system');
    const modelPath = getModelPath();
    const file = new File(modelPath);
    
    if (file.exists) {
      file.delete();
    }
    
    // 更新设置
    const { updateLocalModelStatus } = useSettingsStore.getState();
    await updateLocalModelStatus(false, 0);
    
    console.log('[ModelManager] Model deleted successfully');
    return { success: true };
    
  } catch (error) {
    console.error('[ModelManager] Delete failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * 获取模型信息
 */
export const getModelInfo = () => {
  return {
    name: MODEL_CONFIG.name,
    version: MODEL_CONFIG.version,
    size: MODEL_CONFIG.size,
    format: MODEL_CONFIG.format,
    path: getModelPath(),
  };
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
 * 检查是否有足够的存储空间
 */
export const checkStorageSpace = async (requiredBytes: number): Promise<boolean> => {
  try {
    // 这里简化处理，实际应该检查设备剩余空间
    // 由于 expo-file-system 没有直接提供剩余空间 API
    // 我们可以尝试创建一个临时文件来测试
    return true;
  } catch (error) {
    return false;
  }
};

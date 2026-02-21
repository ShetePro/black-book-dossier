import { initWhisper, WhisperContext } from 'whisper.rn';
import { Paths } from 'expo-file-system';

// Whisper Tiny 模型配置
const MODEL_FILE_NAME = 'ggml-tiny.bin';
const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin';
const MODEL_SIZE = 75; // MB

// 全局 Whisper 上下文实例
let whisperContext: WhisperContext | null = null;
let isModelLoading = false;

/**
 * 获取模型存储路径
 */
const getModelPath = (): string => {
  const dir = Paths.document?.uri || Paths.cache?.uri;
  if (!dir) {
    throw new Error('Storage directory not available');
  }
  return `${dir}${MODEL_FILE_NAME}`;
};

/**
 * 检查模型是否已下载
 */
export const isModelDownloaded = async (): Promise<boolean> => {
  try {
    const { File } = await import('expo-file-system');
    const modelPath = getModelPath();
    const file = new File(modelPath);
    return file.exists;
  } catch (error) {
    console.error('[Whisper] Error checking model:', error);
    return false;
  }
};

/**
 * 下载 Whisper 模型
 */
export const downloadModel = async (
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { Directory, File } = await import('expo-file-system');
    const FileSystemLegacy = await import('expo-file-system/legacy');
    
    const modelPath = getModelPath();
    const file = new File(modelPath);
    
    // 检查是否已存在
    if (file.exists) {
      console.log('[Whisper] Model already exists');
      return { success: true };
    }
    
    console.log('[Whisper] Downloading model...');
    const downloadResumable = FileSystemLegacy.createDownloadResumable(
      MODEL_URL,
      modelPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress?.(progress);
      }
    );
    
    const result = await downloadResumable.downloadAsync();
    
    if (!result) {
      throw new Error('Download failed');
    }
    
    console.log('[Whisper] Model downloaded successfully');
    return { success: true };
    
  } catch (error) {
    console.error('[Whisper] Download failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * 初始化 Whisper
 */
export const initializeWhisper = async (): Promise<void> => {
  if (whisperContext) {
    return;
  }
  
  if (isModelLoading) {
    // 等待加载完成
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }
  
  isModelLoading = true;
  
  try {
    const modelPath = getModelPath();
    console.log('[Whisper] Loading model from:', modelPath);
    
    const context = await initWhisper({
      filePath: modelPath,
    });
    
    whisperContext = context;
    console.log('[Whisper] Model loaded successfully');
    
  } catch (error) {
    console.error('[Whisper] Failed to initialize:', error);
    throw error;
  } finally {
    isModelLoading = false;
  }
};

/**
 * 转录音频文件
 */
export const transcribeAudio = async (
  audioPath: string
): Promise<{ success: boolean; text?: string; error?: string }> => {
  try {
    if (!whisperContext) {
      await initializeWhisper();
    }
    
    if (!whisperContext) {
      throw new Error('Whisper not initialized');
    }
    
    console.log('[Whisper] Transcribing:', audioPath);
    
    // whisper.rn 返回可取消的操作对象，包含 promise 和 stop 函数
    const { promise, stop } = await whisperContext.transcribe(audioPath, {
      language: 'zh',
    });
    
    // 等待转录完成
    const result = await promise;
    
    console.log('[Whisper] Transcription result:', result);
    
    // 尝试多种可能的属性名
    let transcription = null;
    
    if (typeof result === 'string') {
      transcription = result;
    } else if (result && typeof result === 'object') {
      // 尝试常见的属性名
      transcription = result.result || result.text || result.transcription || result.data;
    }
    
    console.log('[Whisper] Extracted transcription:', transcription);
    
    if (!transcription || typeof transcription !== 'string') {
      return {
        success: false,
        error: `转录结果格式错误: ${JSON.stringify(result)}`,
      };
    }
    
    return {
      success: true,
      text: transcription.trim(),
    };
    
  } catch (error) {
    console.error('[Whisper] Transcription failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transcription failed',
    };
  }
};

/**
 * 释放 Whisper 资源
 */
export const releaseWhisper = (): void => {
  if (whisperContext) {
    try {
      whisperContext.release();
      whisperContext = null;
      console.log('[Whisper] Released');
    } catch (error) {
      console.error('[Whisper] Error releasing:', error);
    }
  }
};

/**
 * 获取模型信息
 */
export const getModelInfo = () => {
  return {
    name: 'Whisper Tiny',
    size: MODEL_SIZE,
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

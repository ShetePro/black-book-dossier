import { initWhisper, WhisperContext, TranscribeResult } from 'whisper.rn';
import { Paths } from 'expo-file-system';

// Whisper 模型文件路径
const MODEL_FILE_NAME = 'ggml-tiny.bin';
const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin';

// 全局 Whisper 上下文实例
let whisperContext: WhisperContext | null = null;
let isModelLoading = false;
let modelLoadPromise: Promise<WhisperContext> | null = null;

// 转录队列
interface TranscribeTask {
  audioPath: string;
  resolve: (result: string) => void;
  reject: (error: Error) => void;
}

let transcribeQueue: TranscribeTask[] = [];
let isTranscribing = false;

/**
 * 处理转录队列
 */
const processTranscribeQueue = async () => {
  if (isTranscribing || transcribeQueue.length === 0) {
    return;
  }

  isTranscribing = true;
  const task = transcribeQueue.shift();

  if (!task) {
    isTranscribing = false;
    return;
  }

  try {
    console.log(`[Whisper] Processing transcription for: ${task.audioPath}`);
    const result = await performTranscription(task.audioPath);
    console.log(`[Whisper] Transcription completed: "${result.substring(0, 50)}..."`);
    task.resolve(result);
  } catch (error) {
    console.error(`[Whisper] Transcription failed:`, error);
    task.reject(error as Error);
  } finally {
    isTranscribing = false;
    // 处理队列中的下一个任务
    if (transcribeQueue.length > 0) {
      setTimeout(processTranscribeQueue, 0);
    }
  }
};

/**
 * 执行实际的转录
 */
const performTranscription = async (audioPath: string): Promise<string> => {
  if (!whisperContext) {
    throw new Error('Whisper context not initialized');
  }

  const result: TranscribeResult = await whisperContext.transcribe(audioPath, {
    language: 'zh',
    maxLen: 100,
    timestamp: false,
  });

  if (!result || !result.result) {
    return '';
  }

  return result.result.trim();
};

/**
 * 获取存储目录（使用新的 FileSystem API）
 */
const getStorageDirectory = (): string => {
  const dir = Paths.document?.uri || Paths.cache?.uri;
  if (!dir) {
    throw new Error('No storage directory available');
  }
  return dir;
};

/**
 * 检查模型文件是否存在
 */
const checkModelExists = async (): Promise<boolean> => {
  try {
    const baseDir = getStorageDirectory();
    const modelPath = `${baseDir}models/${MODEL_FILE_NAME}`;
    const dir = new (await import('expo-file-system')).Directory(modelPath);
    return dir.exists;
  } catch (error) {
    console.error('Error checking model:', error);
    return false;
  }
};

/**
 * 下载 Whisper 模型文件
 */
const downloadModel = async (onProgress?: (progress: number) => void): Promise<string> => {
  const baseDir = getStorageDirectory();
  const modelDir = `${baseDir}models`;
  const modelPath = `${modelDir}/${MODEL_FILE_NAME}`;

  try {
    const { Directory, File } = await import('expo-file-system');
    const dir = new Directory(modelDir);
    
    if (!dir.exists) {
      dir.create();
    }

    const file = new File(modelPath);
    if (file.exists) {
      return modelPath;
    }

    const FileSystemLegacy = await import('expo-file-system/legacy');
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
      throw new Error('Model download failed');
    }

    return result.uri;
  } catch (error) {
    console.error('Failed to download model:', error);
    throw error;
  }
};

/**
 * 初始化 Whisper 上下文
 */
export const initializeWhisper = async (
  onProgress?: (progress: number) => void
): Promise<WhisperContext> => {
  if (whisperContext) {
    return whisperContext;
  }

  if (isModelLoading && modelLoadPromise) {
    return modelLoadPromise;
  }

  isModelLoading = true;

  modelLoadPromise = (async () => {
    try {
      const modelPath = await downloadModel(onProgress);

      const context = await initWhisper({
        filePath: modelPath,
        language: 'zh',
      });

      whisperContext = context;
      return context;
    } catch (error) {
      console.error('Failed to initialize Whisper:', error);
      throw error;
    } finally {
      isModelLoading = false;
      modelLoadPromise = null;
    }
  })();

  return modelLoadPromise;
};

/**
 * 获取 Whisper 上下文
 */
export const getWhisperContext = (): WhisperContext => {
  if (!whisperContext) {
    throw new Error('Whisper not initialized. Call initializeWhisper() first.');
  }
  return whisperContext;
};

/**
 * 转录音频文件（队列版本）
 * 所有转录请求会自动排队，确保不会并发执行
 */
export const transcribeAudio = async (audioPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    transcribeQueue.push({
      audioPath,
      resolve,
      reject,
    });
    
    console.log(`[Whisper] Added to queue. Queue length: ${transcribeQueue.length}`);
    
    // 尝试处理队列
    processTranscribeQueue();
  });
};

/**
 * 释放 Whisper 上下文资源
 */
export const releaseWhisper = async (): Promise<void> => {
  if (whisperContext) {
    await whisperContext.release();
    whisperContext = null;
  }
};

/**
 * 检查模型是否已下载
 */
export const isModelReady = async (): Promise<boolean> => {
  return await checkModelExists();
};

/**
 * 获取队列状态（用于调试）
 */
export const getTranscribeQueueStatus = (): { queueLength: number; isProcessing: boolean } => {
  return {
    queueLength: transcribeQueue.length,
    isProcessing: isTranscribing,
  };
};

/**
 * 等待所有转录任务完成
 * @param maxWait 最大等待时间（毫秒）
 */
export const waitForAllTranscriptions = async (maxWait = 10000): Promise<void> => {
  const startTime = Date.now();
  while ((isTranscribing || transcribeQueue.length > 0) && Date.now() - startTime < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (isTranscribing || transcribeQueue.length > 0) {
    console.warn('[Whisper] Wait for transcriptions timed out');
  }
};

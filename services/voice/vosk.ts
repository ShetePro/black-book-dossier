import * as Vosk from 'react-native-vosk';
import { Platform } from 'react-native';
import { Paths } from 'expo-file-system';

// Vosk 模型配置
const MODEL_FILE_NAME = 'vosk-model-small-cn-0.22';
const MODEL_URL = 'https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip';

// 是否已初始化
let isModelLoaded = false;
let isModelLoading = false;
let modelLoadPromise: Promise<void> | null = null;

// 事件监听器
let partialResultListener: any = null;
let resultListener: any = null;
let finalResultListener: any = null;
let errorListener: any = null;
let timeoutListener: any = null;

// 回调函数类型
export type PartialResultCallback = (text: string) => void;
export type ResultCallback = (text: string) => void;
export type ErrorCallback = (error: string) => void;

// 当前回调引用
let currentPartialResultCallback: PartialResultCallback | null = null;
let currentResultCallback: ResultCallback | null = null;
let currentFinalResultCallback: ResultCallback | null = null;
let currentErrorCallback: ErrorCallback | null = null;

/**
 * 获取存储目录
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
    const { Directory } = await import('expo-file-system');
    const baseDir = getStorageDirectory();
    const modelPath = `${baseDir}${MODEL_FILE_NAME}`;
    const dir = new Directory(modelPath);
    return dir.exists;
  } catch (error) {
    console.error('[Vosk] Error checking model:', error);
    return false;
  }
};

/**
 * 下载 Vosk 模型文件
 */
const downloadModel = async (onProgress?: (progress: number) => void): Promise<string> => {
  const baseDir = getStorageDirectory();
  const modelDir = `${baseDir}${MODEL_FILE_NAME}`;
  const zipPath = `${baseDir}${MODEL_FILE_NAME}.zip`;

  try {
    const { Directory, File } = await import('expo-file-system');
    
    // 检查是否已存在
    const dir = new Directory(modelDir);
    if (dir.exists) {
      console.log('[Vosk] Model already exists');
      return modelDir;
    }

    // 下载模型
    console.log('[Vosk] Downloading model...');
    const FileSystemLegacy = await import('expo-file-system/legacy');
    const downloadResumable = FileSystemLegacy.createDownloadResumable(
      MODEL_URL,
      zipPath,
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

    // 解压模型
    console.log('[Vosk] Extracting model...');
    // 注意：需要安装 react-native-zip-archive 来解压
    // 这里简化处理，实际使用时需要解压
    
    return modelDir;
  } catch (error) {
    console.error('[Vosk] Failed to download model:', error);
    throw error;
  }
};

/**
 * 初始化 Vosk
 */
export const initializeVosk = async (
  onProgress?: (progress: number) => void
): Promise<void> => {
  if (isModelLoaded) {
    return;
  }

  if (isModelLoading && modelLoadPromise) {
    return modelLoadPromise;
  }

  isModelLoading = true;

  modelLoadPromise = (async () => {
    try {
      // 检查并下载模型
      const modelExists = await checkModelExists();
      let modelPath: string;
      
      if (modelExists) {
        const baseDir = getStorageDirectory();
        modelPath = `${baseDir}${MODEL_FILE_NAME}`;
      } else {
        modelPath = await downloadModel(onProgress);
      }

      // 加载模型
      console.log('[Vosk] Loading model from:', modelPath);
      await Vosk.loadModel(modelPath);
      isModelLoaded = true;
      console.log('[Vosk] Model loaded successfully');

    } catch (error) {
      console.error('[Vosk] Failed to initialize:', error);
      throw error;
    } finally {
      isModelLoading = false;
      modelLoadPromise = null;
    }
  })();

  return modelLoadPromise;
};

/**
 * 开始语音识别（流式）
 */
export const startRecognition = async (
  onPartialResult: PartialResultCallback,
  onResult: ResultCallback,
  onError?: ErrorCallback,
  onFinalResult?: ResultCallback,
  options?: {
    timeout?: number;
    grammar?: string[];
  }
): Promise<void> => {
  if (!isModelLoaded) {
    throw new Error('Vosk not initialized. Call initializeVosk() first.');
  }

  // 清理旧的监听器
  cleanupListeners();

  // 保存回调引用
  currentPartialResultCallback = onPartialResult;
  currentResultCallback = onResult;
  currentFinalResultCallback = onFinalResult || null;
  currentErrorCallback = onError || null;

  try {
    // 设置事件监听器
    partialResultListener = Vosk.onPartialResult((res: string) => {
      console.log('[Vosk] Partial result:', res);
      currentPartialResultCallback?.(res);
    });

    resultListener = Vosk.onResult((res: string) => {
      console.log('[Vosk] Result:', res);
      currentResultCallback?.(res);
    });

    if (onFinalResult) {
      finalResultListener = Vosk.onFinalResult((res: string) => {
        console.log('[Vosk] Final result:', res);
        currentFinalResultCallback?.(res);
      });
    }

    if (onError) {
      errorListener = Vosk.onError((err: any) => {
        console.error('[Vosk] Error:', err);
        currentErrorCallback?.(String(err));
      });
    }

    if (options?.timeout) {
      timeoutListener = Vosk.onTimeout(() => {
        console.log('[Vosk] Timeout');
      });
    }

    // 开始识别
    const startOptions: any = {};
    if (options?.grammar) {
      startOptions.grammar = options.grammar;
    }
    if (options?.timeout) {
      startOptions.timeout = options.timeout;
    }

    await Vosk.start(startOptions);
    console.log('[Vosk] Recognition started');

  } catch (error) {
    console.error('[Vosk] Failed to start recognition:', error);
    cleanupListeners();
    throw error;
  }
};

/**
 * 停止语音识别
 */
export const stopRecognition = (): void => {
  try {
    Vosk.stop();
    console.log('[Vosk] Recognition stopped');
  } catch (error) {
    console.error('[Vosk] Error stopping recognition:', error);
  }
  
  // 清理监听器
  cleanupListeners();
};

/**
 * 清理事件监听器
 */
const cleanupListeners = (): void => {
  if (partialResultListener) {
    partialResultListener.remove();
    partialResultListener = null;
  }
  if (resultListener) {
    resultListener.remove();
    resultListener = null;
  }
  if (finalResultListener) {
    finalResultListener.remove();
    finalResultListener = null;
  }
  if (errorListener) {
    errorListener.remove();
    errorListener = null;
  }
  if (timeoutListener) {
    timeoutListener.remove();
    timeoutListener = null;
  }
  
  currentPartialResultCallback = null;
  currentResultCallback = null;
  currentFinalResultCallback = null;
  currentErrorCallback = null;
};

/**
 * 释放 Vosk 资源
 */
export const releaseVosk = (): void => {
  cleanupListeners();
  
  try {
    Vosk.unload();
    isModelLoaded = false;
  } catch (error) {
    console.error('[Vosk] Error unloading:', error);
  }
};

/**
 * 检查模型是否已下载
 */
export const isVoskModelReady = async (): Promise<boolean> => {
  return await checkModelExists();
};

/**
 * 检查 Vosk 是否已加载
 */
export const isVoskLoaded = (): boolean => {
  return isModelLoaded;
};

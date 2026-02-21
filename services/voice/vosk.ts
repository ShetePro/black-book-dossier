import * as Vosk from 'react-native-vosk';
import { Platform } from 'react-native';

// Vosk 模型名称（必须与 assets 目录名匹配）
const MODEL_NAME = 'model-cn-cn';

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
 * 获取模型路径
 * 
 * 当使用 Expo Config Plugin 时，模型会被自动复制到：
 * - iOS: Main Bundle 根目录
 * - Android: assets 目录
 * 
 * react-native-vosk 可以直接使用模型名称从 Bundle/Assets 加载
 */
const getModelPath = (): string => {
  // Expo Config Plugin 会将模型复制到原生项目的资源目录
  // react-native-vosk 可以通过模型名称直接访问
  return MODEL_NAME;
};

/**
 * 初始化 Vosk
 * 
 * 注意：使用 Expo Config Plugin 时，模型会在 prebuild 阶段自动复制到原生项目
 * 首次使用前请确保：
 * 1. 下载模型：wget https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip
 * 2. 解压到 assets/model-cn-cn/ 目录
 * 3. 运行 npx expo prebuild 重新生成原生项目
 */
export const initializeVosk = async (): Promise<void> => {
  if (isModelLoaded) {
    console.log('[Vosk] Already initialized');
    return;
  }

  if (isModelLoading && modelLoadPromise) {
    return modelLoadPromise;
  }

  isModelLoading = true;

  modelLoadPromise = (async () => {
    try {
      console.log('[Vosk] Starting initialization...');
      console.log('[Vosk] Platform:', Platform.OS);
      
      // 获取模型路径
      const modelPath = getModelPath();
      console.log('[Vosk] Model name:', modelPath);
      console.log('[Vosk] Make sure the model is downloaded to assets/' + MODEL_NAME + '/');
      
      // 加载模型
      console.log('[Vosk] Loading model...');
      await Vosk.loadModel(modelPath);
      
      isModelLoaded = true;
      console.log('[Vosk] Model loaded successfully');

    } catch (error) {
      console.error('[Vosk] Failed to initialize:', error);
      isModelLoaded = false;
      
      // 提供更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to load Vosk model: ${errorMessage}\n\n` +
        `Please ensure:\n` +
        `1. Download the model: wget https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip\n` +
        `2. Extract to: assets/${MODEL_NAME}/\n` +
        `3. Run: npx expo prebuild --clean\n` +
        `4. Rebuild the app: npx expo run:ios (or run:android)`
      );
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
    console.log('[Vosk] Setting up event listeners...');
    
    // 设置事件监听器
    partialResultListener = Vosk.onPartialResult((res: string) => {
      if (res && res.trim()) {
        console.log('[Vosk] Partial result:', res);
        currentPartialResultCallback?.(res);
      }
    });

    resultListener = Vosk.onResult((res: string) => {
      if (res && res.trim()) {
        console.log('[Vosk] Result:', res);
        currentResultCallback?.(res);
      }
    });

    if (onFinalResult) {
      finalResultListener = Vosk.onFinalResult((res: string) => {
        if (res && res.trim()) {
          console.log('[Vosk] Final result:', res);
          currentFinalResultCallback?.(res);
        }
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

    console.log('[Vosk] Starting recognition...');
    await Vosk.start(startOptions);
    console.log('[Vosk] Recognition started successfully');

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
    console.log('[Vosk] Unloaded');
  } catch (error) {
    console.error('[Vosk] Error unloading:', error);
  }
};

/**
 * 检查 Vosk 是否已加载
 */
export const isVoskLoaded = (): boolean => {
  return isModelLoaded;
};

/**
 * 获取 Vosk 初始化状态
 */
export const getVoskStatus = (): { 
  isLoaded: boolean; 
  isLoading: boolean;
} => {
  return {
    isLoaded: isModelLoaded,
    isLoading: isModelLoading,
  };
};

import { getModelPath, getCurrentModelId, ModelId, isModelDownloaded } from './llmModelManager';
import { useSettingsStore } from '@/store/settingsStore';

// LLM 上下文类型
interface LLMContext {
  contacts?: string[];
  vocabulary?: string[];
  language?: string;
}

// LLM 推理结果
export interface LLMResult {
  success: boolean;
  text?: string;
  error?: string;
  tokensUsed?: number;
}

// 单例实例
let llmContext: any = null;
let currentModelId: string | null = null;

/**
 * 初始化 LLM 上下文
 * 使用 llama.rn 加载本地模型
 */
const initializeLLM = async (modelId: ModelId): Promise<boolean> => {
  // 如果已经初始化且模型未变，直接返回
  if (llmContext && currentModelId === modelId) {
    return true;
  }

  // 如果模型变了，先释放旧的
  if (llmContext && currentModelId !== modelId) {
    await releaseLLM();
  }

  try {
    // 检查模型是否已下载
    const isDownloaded = await isModelDownloaded(modelId);
    if (!isDownloaded) {
      throw new Error(`Model ${modelId} not downloaded`);
    }

    const modelPath = getModelPath(modelId);
    
    // 动态导入 llama.rn
    const { initLlama } = await import('llama.rn');
    
    llmContext = await initLlama({
      model: modelPath,
      use_mlock: true,
      n_ctx: 2048,
      n_gpu_layers: 99,
    });
    
    currentModelId = modelId;
    console.log('[LLMInference] Initialized with model:', modelId);
    return true;
  } catch (error) {
    console.error('[LLMInference] Failed to initialize:', error);
    return false;
  }
};

/**
 * 构建转录修正的 Prompt
 */
const buildCorrectionPrompt = (
  text: string,
  context: LLMContext
): string => {
  const contactsList = context.contacts?.join(', ') || '';
  const vocabList = context.vocabulary?.join(', ') || '';
  const language = context.language === 'en-US' ? 'English' : 'Chinese';

  return `You are a speech recognition text correction assistant. Your task is to correct errors in transcribed speech text.

Instructions:
1. Fix obvious speech recognition errors (homophones, similar sounding words)
2. Correct grammar and make the text more fluent
3. Convert spoken language to written language where appropriate
4. Keep the original meaning intact
5. Do not add information not present in the original text
6. Output ONLY the corrected text, no explanations

Context Information:
- Language: ${language}
- Known Contacts: ${contactsList}
- Domain Vocabulary: ${vocabList}

Original Text:
"${text}"

Corrected Text:`;
};

/**
 * 使用 LLM 修正转录文本
 */
export const correctTranscriptionWithLLM = async (
  text: string,
  context?: LLMContext
): Promise<LLMResult> => {
  try {
    // 检查是否启用本地 LLM
    const { settings } = useSettingsStore.getState();
    if (!settings.ai.localModel.enabled) {
      return {
        success: false,
        error: 'Local LLM not enabled',
      };
    }

    const modelId = settings.ai.localModel.modelId as ModelId;

    // 检查模型是否已下载
    const isDownloaded = await isModelDownloaded(modelId);
    if (!isDownloaded) {
      return {
        success: false,
        error: `Model ${modelId} not downloaded`,
      };
    }

    // 初始化 LLM
    const initialized = await initializeLLM(modelId);
    if (!initialized) {
      return {
        success: false,
        error: 'Failed to initialize LLM',
      };
    }

    // 构建 Prompt
    const prompt = buildCorrectionPrompt(text, context || {});

    // 执行推理
    console.log('[LLMInference] Starting inference with model:', modelId);
    const startTime = Date.now();
    
    const result = await llmContext.completion({
      prompt,
      n_predict: 512,
      temperature: 0.3,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.1,
      stop: ['\n\n', 'Original:', 'Context:'],
    });

    const duration = Date.now() - startTime;
    console.log('[LLMInference] Inference completed in', duration, 'ms');

    if (!result.text) {
      return {
        success: false,
        error: 'LLM returned empty result',
      };
    }

    // 清理输出
    const correctedText = result.text
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim();

    return {
      success: true,
      text: correctedText,
      tokensUsed: result.tokens_predicted,
    };
  } catch (error) {
    console.error('[LLMInference] Correction failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * 快速修正（便捷函数）
 */
export const quickCorrect = async (text: string): Promise<string> => {
  const result = await correctTranscriptionWithLLM(text);
  return result.success ? result.text! : text;
};

/**
 * 批量修正（用于较长文本）
 */
export const correctLongTranscription = async (
  text: string,
  context?: LLMContext
): Promise<LLMResult> => {
  if (text.length < 500) {
    return correctTranscriptionWithLLM(text, context);
  }

  // 长文本分段处理
  const sentences = text.match(/[^。！？.!?]+[。！？.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > 300) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        chunks.push(sentence);
      }
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  const correctedChunks: string[] = [];
  for (const chunk of chunks) {
    const result = await correctTranscriptionWithLLM(chunk, context);
    correctedChunks.push(result.success ? result.text! : chunk);
  }

  return {
    success: true,
    text: correctedChunks.join(''),
  };
};

/**
 * 释放 LLM 资源
 */
export const releaseLLM = async (): Promise<void> => {
  if (llmContext) {
    try {
      await llmContext.release();
      llmContext = null;
      currentModelId = null;
      console.log('[LLMInference] Released');
    } catch (error) {
      console.error('[LLMInference] Error releasing:', error);
    }
  }
};

/**
 * 检查 LLM 是否可用
 */
export const isLLMAvailable = async (): Promise<boolean> => {
  const { settings } = useSettingsStore.getState();
  if (!settings.ai.localModel.enabled || !settings.ai.localModel.downloaded) {
    return false;
  }
  
  const modelId = settings.ai.localModel.modelId as ModelId;
  const isDownloaded = await isModelDownloaded(modelId);
  if (!isDownloaded) {
    return false;
  }
  
  return await initializeLLM(modelId);
};

/**
 * 获取当前使用的模型 ID
 */
export const getCurrentLLMModelId = (): string | null => {
  return currentModelId;
};

export default {
  correctTranscriptionWithLLM,
  quickCorrect,
  correctLongTranscription,
  releaseLLM,
  isLLMAvailable,
  getCurrentLLMModelId,
};

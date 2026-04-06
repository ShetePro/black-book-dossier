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
    
    // 调试：检查原始路径
    console.log('[LLMInference] Raw model path:', modelPath);
    
    // llama.rn 在 iOS 上需要使用完整路径，不需要 file:// 前缀
    // 检查路径是否正确
    if (!modelPath.endsWith('.gguf')) {
      throw new Error(`Invalid model path: ${modelPath}`);
    }
    
    console.log('[LLMInference] Loading model:', modelId);
    console.log('[LLMInference] Model path:', modelPath);
    
    // 动态导入 llama.rn
    const { initLlama } = await import('llama.rn');
    
    llmContext = await initLlama({
      model: modelPath,
      use_mlock: true,
      n_ctx: 2048,
      n_gpu_layers: 0, // 暂时禁用 GPU，先测试 CPU 加载
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

  return `你是一位语音识别纠错专家。请修正以下语音转录文本中的错误。

重要指令：
1. **联系人姓名匹配（最高优先级）** - 如果文本中出现与已知联系人相似的名字（同音字、近音字、形近字），必须修正为正确的联系人姓名
2. 修正语音识别错误（同音字、近音字混淆）
3. 修正语法，使文本更通顺
4. 将口语转换为书面语
5. 保持原意不变，不添加原文没有的信息
6. 只输出修正后的文本，不要解释

已知联系人列表：${contactsList}
专业词汇：${vocabList}
语言：${language}

待修正文本：
"${text}"

修正后文本：`;
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

    // 清理输出 - 移除重复的 "修正后文本" 和多余内容
    let correctedText = result.text
      .trim()
      .replace(/^["']|["']$/g, '')
      .trim();
    
    // 如果文本包含 "修正后文本"，只取最后一部分
    const correctionMarker = '修正后文本：';
    if (correctedText.includes(correctionMarker)) {
      const parts = correctedText.split(correctionMarker);
      // 取最后一部分（实际的修正结果）
      correctedText = parts[parts.length - 1].trim();
    }
    
    // 移除可能重复的原始文本
    const lines = correctedText.split('\n');
    const uniqueLines: string[] = [];
    const seen = new Set<string>();
    
    for (const line of lines) {
      const trimmed = line.trim();
      // 跳过空行和重复行
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        uniqueLines.push(trimmed);
      }
    }
    
    correctedText = uniqueLines.join('\n');
    
    // 如果结果太长（超过原始文本3倍），可能是重复了，取第一行
    if (correctedText.length > text.length * 3) {
      correctedText = uniqueLines[0] || text;
    }

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

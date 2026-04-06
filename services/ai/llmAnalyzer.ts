import { Contact } from '@/types';
import { 
  getModelPath, 
  getCurrentModelId, 
  ModelId, 
  isModelDownloaded 
} from './llmModelManager';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * LLM 分析结果类型
 */
export interface LLMAnalysisResult {
  reasoning: string;
  contactMatch: {
    found: boolean;
    matchedName: string | null;
    suggestedName: string | null;
    confidence: number;
    reason: string;
  };
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'name' | 'typo' | 'grammar';
  }>;
  insights: {
    activities: string[];
    preferences: string[];
    personality: string[];
    profession: string | null;
  };
  suggestedTags: string[];
}

// 单例实例
let llmContext: any = null;
let currentModelId: string | null = null;

/**
 * 初始化 LLM
 */
const initializeLLM = async (modelId: ModelId): Promise<boolean> => {
  if (llmContext && currentModelId === modelId) {
    return true;
  }

  if (llmContext && currentModelId !== modelId) {
    await releaseLLM();
  }

  try {
    const downloaded = await isModelDownloaded(modelId);
    if (!downloaded) {
      throw new Error(`Model ${modelId} not downloaded`);
    }

    const modelPath = getModelPath(modelId);
    if (!modelPath.endsWith('.gguf')) {
      throw new Error(`Invalid model path: ${modelPath}`);
    }

    console.log('[LLMAnalyzer] Loading model:', modelId);
    const { initLlama } = await import('llama.rn');
    
    llmContext = await initLlama({
      model: modelPath,
      use_mlock: true,
      n_ctx: 2048,
      n_gpu_layers: 0,
    });
    
    currentModelId = modelId;
    console.log('[LLMAnalyzer] Model loaded successfully');
    return true;
  } catch (error) {
    console.error('[LLMAnalyzer] Failed to load model:', error);
    return false;
  }
};

/**
 * 释放 LLM
 */
const releaseLLM = async (): Promise<void> => {
  if (llmContext) {
    try {
      await llmContext.release();
      llmContext = null;
      currentModelId = null;
    } catch (error) {
      console.error('[LLMAnalyzer] Error releasing:', error);
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
  const downloaded = await isModelDownloaded(modelId);
  if (!downloaded) {
    return false;
  }
  
  return await initializeLLM(modelId);
};

/**
 * 构建分析 Prompt
 */
const buildAnalysisPrompt = (text: string, contacts: Contact[]): string => {
  const contactsList = contacts.map(c => c.name).join(', ');

  return `你是一位智能助手，负责分析语音转录文本并提取关键信息。

## 任务
1. 分析文本中的关键人物
2. 尝试匹配已知联系人
3. 提取活动、偏好、性格特征
4. 生成合适的标签
5. 修正语音识别错误

## 已知联系人列表
${contactsList || '无'}

## 待分析文本
"${text}"

## 输出格式（严格JSON）
你必须只输出以下格式的JSON，不要输出任何其他文字、解释或markdown标记：

{\n  "reasoning": "详细的推理过程描述...",\n  "contactMatch": {\n    "found": false,\n    "matchedName": null,\n    "suggestedName": "施佳祺",\n    "confidence": 0.85,\n    "reason": "匹配原因..."\n  },\n  "corrections": [],\n  "insights": {\n    "activities": [],\n    "preferences": [],\n    "personality": [],\n    "profession": null\n  },\n  "suggestedTags": []\n}\n\n重要规则：\n1. 只输出JSON，不要任何其他文字\n2. 不要输出markdown代码块（\`\`\`）\n3. 确保JSON格式完整，所有字段都存在\n4. 如果文本中没有明确信息，使用空数组或null值`;
};

/**
 * 解析 LLM 输出
 */
const parseLLMResult = (text: string): Partial<LLMAnalysisResult> | null => {
  try {
    // 清理文本：移除 markdown 代码块标记
    const cleanedText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .replace(/```/g, '')
      .trim();
    
    // 尝试直接解析整个文本
    try {
      const parsed = JSON.parse(cleanedText);
      return {
        reasoning: parsed.reasoning || '未提供推理过程',
        contactMatch: parsed.contactMatch || {
          found: false,
          matchedName: null,
          suggestedName: null,
          confidence: 0,
          reason: '未找到匹配',
        },
        corrections: parsed.corrections || [],
        insights: parsed.insights || {
          activities: [],
          preferences: [],
          personality: [],
          profession: null,
        },
        suggestedTags: parsed.suggestedTags || [],
      };
    } catch {
      // 直接解析失败，尝试提取 JSON
    }
    
    // 尝试找到 JSON 对象 - 查找第一个 { 和最后一个匹配的 }
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonCandidate = cleanedText.substring(firstBrace, lastBrace + 1);
      try {
        const parsed = JSON.parse(jsonCandidate);
        return {
          reasoning: parsed.reasoning || '未提供推理过程',
          contactMatch: parsed.contactMatch || {
            found: false,
            matchedName: null,
            suggestedName: null,
            confidence: 0,
            reason: '未找到匹配',
          },
          corrections: parsed.corrections || [],
          insights: parsed.insights || {
            activities: [],
            preferences: [],
            personality: [],
            profession: null,
          },
          suggestedTags: parsed.suggestedTags || [],
        };
      } catch {
        // 继续尝试其他方法
      }
    }
    
    // 使用正则表达式匹配 JSON 对象
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        reasoning: parsed.reasoning || '未提供推理过程',
        contactMatch: parsed.contactMatch || {
          found: false,
          matchedName: null,
          suggestedName: null,
          confidence: 0,
          reason: '未找到匹配',
        },
        corrections: parsed.corrections || [],
        insights: parsed.insights || {
          activities: [],
          preferences: [],
          personality: [],
          profession: null,
        },
        suggestedTags: parsed.suggestedTags || [],
      };
    }
  } catch (error) {
    console.error('[LLMAnalyzer] Failed to parse result:', error);
    console.error('[LLMAnalyzer] Raw text:', text.substring(0, 500));
  }
  return null;
};

/**
 * 使用 LLM 分析文本
 */
export const analyzeWithLLM = async (
  text: string,
  contacts: Contact[]
): Promise<LLMAnalysisResult> => {
  const defaultResult: LLMAnalysisResult = {
    reasoning: 'LLM 分析失败，使用默认结果',
    contactMatch: {
      found: false,
      matchedName: null,
      suggestedName: null,
      confidence: 0,
      reason: '分析失败',
    },
    corrections: [],
    insights: {
      activities: [],
      preferences: [],
      personality: [],
      profession: null,
    },
    suggestedTags: [],
  };

  try {
    console.log('[LLMAnalyzer] Starting analysis...');
    
    const available = await isLLMAvailable();
    if (!available) {
      console.warn('[LLMAnalyzer] LLM not available');
      return defaultResult;
    }

    const { settings } = useSettingsStore.getState();
    const modelId = settings.ai.localModel.modelId as ModelId;
    
    await initializeLLM(modelId);
    
    const prompt = buildAnalysisPrompt(text, contacts);
    
    console.log('[LLMAnalyzer] Running inference...');
    const startTime = Date.now();
    
    const result = await llmContext.completion({
      prompt,
      n_predict: 1024,
      temperature: 0.3,
      top_k: 40,
      top_p: 0.9,
      repeat_penalty: 1.1,
      stop: ['\n\n'],
    });

    console.log('[LLMAnalyzer] Inference completed in', Date.now() - startTime, 'ms');

    if (!result.text) {
      console.warn('[LLMAnalyzer] Empty response');
      return defaultResult;
    }

    console.log('[LLMAnalyzer] Raw response:', result.text.substring(0, 200));

    const parsed = parseLLMResult(result.text);
    if (parsed) {
      console.log('[LLMAnalyzer] Analysis successful');
      return {
        reasoning: parsed.reasoning || defaultResult.reasoning,
        contactMatch: parsed.contactMatch || defaultResult.contactMatch,
        corrections: parsed.corrections || [],
        insights: parsed.insights || defaultResult.insights,
        suggestedTags: parsed.suggestedTags || [],
      };
    }

    console.warn('[LLMAnalyzer] Failed to parse response');
    return defaultResult;

  } catch (error) {
    console.error('[LLMAnalyzer] Error:', error);
    return defaultResult;
  }
};

/**
 * 提取联系人建议
 */
export const extractContactSuggestion = (
  result: LLMAnalysisResult
): { name: string | null; confidence: number; reason: string } => {
  if (result.contactMatch.found && result.contactMatch.matchedName) {
    return {
      name: result.contactMatch.matchedName,
      confidence: result.contactMatch.confidence,
      reason: result.contactMatch.reason,
    };
  }

  if (result.contactMatch.suggestedName) {
    return {
      name: result.contactMatch.suggestedName,
      confidence: result.contactMatch.confidence,
      reason: result.contactMatch.reason,
    };
  }

  return { name: null, confidence: 0, reason: '未找到匹配' };
};

/**
 * 格式化标签
 */
export const formatTags = (result: LLMAnalysisResult): string[] => {
  const tags = [...result.suggestedTags];
  
  if (result.insights.profession) {
    tags.push(result.insights.profession);
  }
  
  return [...new Set(tags)];
};

export default {
  analyzeWithLLM,
  extractContactSuggestion,
  formatTags,
};

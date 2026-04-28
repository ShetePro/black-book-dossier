import { Contact } from '@/types';
import {
  getModelPath,
  getCurrentModelId,
  ModelId,
  isModelDownloaded
} from './llmModelManager';
import { useSettingsStore } from '@/store/settingsStore';
import { findBestMatch, shouldAutoSelect, shouldShowSuggestion } from './contactMatcher';
import { initLlama } from 'llama.rn';
import { Platform } from 'react-native';

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
    console.log('[LLMAnalyzer] isModelDownloaded:', downloaded);
    if (!downloaded) {
      throw new Error(`Model ${modelId} not downloaded`);
    }

    const modelPath = getModelPath(modelId);
    console.log('[LLMAnalyzer] Loading model:', modelId);
    console.log('[LLMAnalyzer] Model path:', modelPath);

    const { File } = await import('expo-file-system');
    const file = new File(modelPath);
    console.log('[LLMAnalyzer] File exists:', file.exists, 'Size:', file.size);

    if (!modelPath.endsWith('.gguf')) {
      throw new Error(`Invalid model path: ${modelPath}`);
    }

    llmContext = await initLlama({
      model: modelPath,
      use_mlock: Platform.OS !== 'ios',
      n_ctx: 2048,
      n_gpu_layers: 0,
    });

    currentModelId = modelId;
    console.log('[LLMAnalyzer] Model loaded successfully');
    return true;
  } catch (error) {
    console.error('[LLMAnalyzer] Failed to load model:', error);
    if (error instanceof Error) {
      console.error('[LLMAnalyzer] Error name:', error.name);
      console.error('[LLMAnalyzer] Error message:', error.message);
      console.error('[LLMAnalyzer] Error stack:', error.stack);
    }
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
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const weekdayIndex = today.getDay();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][weekdayIndex];

  // 计算示例日期用于 prompt
  const yesterday = new Date(today.getTime() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 计算上周三（上个完整周的周三）
  const daysToWednesday = 3 - weekdayIndex; // 本周距周三的天数差
  const lastWednesday = new Date(today.getTime() + (daysToWednesday - 7) * 86400000);
  const lastWednesdayStr = lastWednesday.toISOString().split('T')[0];

  return `当前日期：${dateStr}（星期${weekday}）

日期推理规则：
- "今天" = ${dateStr}
- "昨天" = ${yesterdayStr}
- "上周三/上个周三" = 上个完整周的星期三 = ${lastWednesdayStr}
- "本周三" = 本周的星期三（即使还未到来）
- 所有相对时间都要根据当前日期计算为YYYY-MM-DD格式

分析文本，提取所有人名、时间、地点、活动，返回JSON。
时间必须推理为具体日期格式YYYY-MM-DD，在reasoning中展示计算过程。

示例1：
输入：昨天和李明在公园散步
输出：{"reasoning":"提取到人名李明。日期：昨天=${yesterdayStr}（${dateStr}的前一天）","suggestedTags":["李明","time:${yesterdayStr}","location:公园"],"insights":{"activities":["散步"],"preferences":[],"personality":[],"profession":null},"contactMatch":{"found":false,"matchedName":null,"suggestedName":null,"confidence":0,"reason":""},"corrections":[]}

示例2：
输入：上周三和张三喝茶
输出：{"reasoning":"提取到人名张三。日期：上周三=${lastWednesdayStr}（上个完整周的星期三）","suggestedTags":["张三","time:${lastWednesdayStr}","location:茶馆"],"insights":{"activities":["喝茶"],"preferences":[],"personality":[],"profession":null},"contactMatch":{"found":false,"matchedName":null,"suggestedName":null,"confidence":0,"reason":""},"corrections":[]}

示例3：
输入：今天和李四、王五去爬山
输出：{"reasoning":"提取到人名李四、王五。日期：今天=${dateStr}","suggestedTags":["李四","王五","time:${dateStr}","location:山"],"insights":{"activities":["爬山"],"preferences":[],"personality":[],"profession":null},"contactMatch":{"found":false,"matchedName":null,"suggestedName":null,"confidence":0,"reason":""},"corrections":[]}

输入：${text}

输出：`;
};

/**
 * 解析 LLM 输出
 */
const parseLLMResult = (text: string): Partial<LLMAnalysisResult> | null => {
  try {
    // 首先尝试找到第一个 JSON 对象（从第一个 { 开始）
    const firstBrace = text.indexOf('{');
    if (firstBrace === -1) return null;

    // 使用括号计数找到匹配的结束位置
    let braceCount = 0;
    let jsonEnd = -1;
    let inString = false;
    let escapeNext = false;

    for (let i = firstBrace; i < text.length; i++) {
      const char = text[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        continue;
      }

      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
    }

    // 如果找到了完整的 JSON
    if (jsonEnd !== -1) {
      const jsonCandidate = text.substring(firstBrace, jsonEnd + 1);
      try {
        const parsed = JSON.parse(jsonCandidate);
        const tags: string[] = parsed.suggestedTags || [];
        const uniqueTags = [...new Set(tags)];
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
          suggestedTags: uniqueTags,
        };
      } catch {
        // 解析失败
      }
    }

    // 回退：清理后尝试解析
    const cleanedText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace2 = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');

    if (firstBrace2 !== -1 && lastBrace !== -1 && lastBrace > firstBrace2) {
      const jsonCandidate = cleanedText.substring(firstBrace2, lastBrace + 1);
      try {
        const parsed = JSON.parse(jsonCandidate);
        const tags: string[] = parsed.suggestedTags || [];
        const uniqueTags = [...new Set(tags)];
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
          suggestedTags: uniqueTags,
        };
      } catch {
        // 解析失败
      }
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

    console.log("[LLMAnalyzer] Running inference...", prompt);
    const startTime = Date.now();

    const result = await llmContext.completion({
      prompt,
      n_predict: 256,
      temperature: 0.2,
      top_k: 15,
      top_p: 0.6,
      repeat_penalty: 1.8,
      stop: ['}\n', '}\n\n', '```'],
    });

    console.log('[LLMAnalyzer] Inference completed in', Date.now() - startTime, 'ms');
    console.log('[LLMAnalyzer] Result length:', result.text ? result.text.length : 0);
    console.log('[LLMAnalyzer] Full raw response:', result.text || 'EMPTY');

    if (!result.text || result.text.trim().length === 0) {
      console.warn('[LLMAnalyzer] Empty response');
      return defaultResult;
    }

    console.log('[LLMAnalyzer] Raw response:', result.text.substring(0, 500));

    const parsed = parseLLMResult(result.text);
    if (parsed) {
      console.log('[LLMAnalyzer] Analysis successful');
      console.log('[LLMAnalyzer] Parsed result:', JSON.stringify(parsed, null, 2));

      // 打印分析过程
      if (parsed.reasoning) {
        console.log('[LLMAnalyzer] Reasoning:', parsed.reasoning);
      }

      // 打印提取的信息
      console.log('[LLMAnalyzer] Extracted info:', {
        suggestedTags: parsed.suggestedTags || [],
        activities: parsed.insights?.activities || [],
        preferences: parsed.insights?.preferences || [],
      });

      // 从 suggestedTags 获取提取到的人名，进行模糊匹配
      const extractedNames = parsed.suggestedTags || [];
      let contactMatch = parsed.contactMatch || defaultResult.contactMatch;

      for (const name of extractedNames) {
        const match = findBestMatch(name, contacts);

        if (match) {
          if (shouldAutoSelect(match.confidence)) {
            // 高置信度匹配
            contactMatch = {
              found: true,
              matchedName: match.contact.name,
              suggestedName: null,
              confidence: match.confidence,
              reason: match.reason,
            };
            break; // 找到高置信度匹配，停止
          } else if (shouldShowSuggestion(match.confidence)) {
            // 中置信度，显示建议
            contactMatch = {
              found: false,
              matchedName: null,
              suggestedName: match.contact.name,
              confidence: match.confidence,
              reason: match.reason,
            };
          }
        }
      }

      // 打印最终匹配结果
      console.log('[LLMAnalyzer] Contact match result:', contactMatch);

      return {
        reasoning: parsed.reasoning || defaultResult.reasoning,
        contactMatch,
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

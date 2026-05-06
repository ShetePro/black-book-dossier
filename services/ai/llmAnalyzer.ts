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
 * LLM 分析结果类型（统一实体提取）
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
  entities: {
    persons: string[];
    times: string[];
    locations: string[];
    events: string[];
    needs: string[];
    preferences: string[];
    health: string[];
    suggestions: string[];
    organizations: string[];
  };
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

const buildAnalysisPrompt = (text: string, contacts: Contact[]): string => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const weekdayIndex = today.getDay();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][weekdayIndex];

  const yesterday = new Date(today.getTime() - 86400000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const daysToWednesday = 3 - weekdayIndex;
  const lastWednesday = new Date(today.getTime() + (daysToWednesday - 7) * 86400000);
  const lastWednesdayStr = lastWednesday.toISOString().split('T')[0];

  const contactList = contacts
    .slice(0, 20)
    .map(c => c.name)
    .join(',');

  return `当前日期：${dateStr}（星期${weekday}）

日期推理规则：
- "今天" = ${dateStr}
- "昨天" = ${yesterdayStr}
- "上周三" = ${lastWednesdayStr}
- 所有相对时间转换为YYYY-MM-DD格式

分析文本，提取以下9种实体，返回JSON：

1. persons: 人名（从文本中提取）
2. times: 时间（YYYY-MM-DD格式）
3. locations: 地点
4. events: 事件/活动
5. needs: 需求/意图（需要、想要、缺）
6. preferences: 偏好（喜欢、不喜欢、禁忌）
7. health: 健康信息（疾病、过敏、用药）
8. suggestions: 建议行动（应该、建议、提醒）
9. organizations: 组织/公司

已知联系人：${contactList}

示例输入：昨天和李明在星巴克喝茶，他最近胃不舒服，不能喝咖啡，建议下次约他去喝茶或者吃清淡的东西。他提到想找一份新工作。

示例输出：
{"reasoning":"提取人名李明（已知联系人）。时间：昨天=${yesterdayStr}。地点：星巴克。事件：喝茶。健康：胃不舒服、不能喝咖啡。偏好：不能喝咖啡（禁忌）。建议：下次喝茶或吃清淡。需求：找新工作。","entities":{"persons":["李明"],"times":["${yesterdayStr}"],"locations":["星巴克"],"events":["喝茶"],"needs":["找新工作"],"preferences":["不能喝咖啡"],"health":["胃不舒服"],"suggestions":["下次喝茶或吃清淡"],"organizations":[]},"suggestedTags":["李明","time:${yesterdayStr}","location:星巴克","health:胃不舒服","preference:不能喝咖啡"],"insights":{"activities":["喝茶"],"preferences":["不能喝咖啡"],"personality":[],"profession":null},"contactMatch":{"found":true,"matchedName":"李明","suggestedName":null,"confidence":0.95,"reason":"精确匹配已知联系人"},"corrections":[]}

输入：${text}

输出：`;
};

const parseLLMResult = (text: string): Partial<LLMAnalysisResult> | null => {
  try {
    const firstBrace = text.indexOf('{');
    if (firstBrace === -1) return null;

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

    if (jsonEnd !== -1) {
      const jsonCandidate = text.substring(firstBrace, jsonEnd + 1);
      try {
        const parsed = JSON.parse(jsonCandidate);
        const tags: string[] = parsed.suggestedTags || [];
        return {
          reasoning: parsed.reasoning || '未提供推理过程',
          entities: parsed.entities || {
            persons: [],
            times: [],
            locations: [],
            events: [],
            needs: [],
            preferences: [],
            health: [],
            suggestions: [],
            organizations: [],
          },
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
          suggestedTags: [...new Set(tags)],
        };
      } catch {}
    }

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
        return {
          reasoning: parsed.reasoning || '未提供推理过程',
          entities: parsed.entities || {
            persons: [],
            times: [],
            locations: [],
            events: [],
            needs: [],
            preferences: [],
            health: [],
            suggestions: [],
            organizations: [],
          },
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
          suggestedTags: [...new Set(tags)],
        };
      } catch {}
    }
  } catch (error) {
    console.error('[LLMAnalyzer] Failed to parse result:', error);
    console.error('[LLMAnalyzer] Raw text:', text.substring(0, 500));
  }
  return null;
};

export const analyzeWithLLM = async (
  text: string,
  contacts: Contact[]
): Promise<LLMAnalysisResult> => {
  const defaultResult: LLMAnalysisResult = {
    reasoning: 'LLM 分析失败，使用默认结果',
    entities: {
      persons: [],
      times: [],
      locations: [],
      events: [],
      needs: [],
      preferences: [],
      health: [],
      suggestions: [],
      organizations: [],
    },
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

    console.log("[LLMAnalyzer] Running inference...");
    const startTime = Date.now();

    const result = await llmContext.completion({
      prompt,
      n_predict: 512,
      temperature: 0.2,
      top_k: 15,
      top_p: 0.6,
      repeat_penalty: 1.8,
      stop: ['}\n', '}\n\n', '```'],
    });

    console.log('[LLMAnalyzer] Inference completed in', Date.now() - startTime, 'ms');

    if (!result.text || result.text.trim().length === 0) {
      console.warn('[LLMAnalyzer] Empty response');
      return defaultResult;
    }

    const parsed = parseLLMResult(result.text);
    if (parsed) {
      console.log('[LLMAnalyzer] Analysis successful');

      const extractedNames = parsed.entities?.persons || [];
      let contactMatch = parsed.contactMatch || defaultResult.contactMatch;

      for (const name of extractedNames) {
        const match = findBestMatch(name, contacts);

        if (match) {
          if (shouldAutoSelect(match.confidence)) {
            contactMatch = {
              found: true,
              matchedName: match.contact.name,
              suggestedName: null,
              confidence: match.confidence,
              reason: match.reason,
            };
            break;
          } else if (shouldShowSuggestion(match.confidence)) {
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

      console.log('[LLMAnalyzer] Entities:', parsed.entities);
      console.log('[LLMAnalyzer] Contact match:', contactMatch);

      return {
        reasoning: parsed.reasoning || defaultResult.reasoning,
        entities: parsed.entities || defaultResult.entities,
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

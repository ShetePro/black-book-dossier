import { Contact, ExtractedEntity } from '@/types';
import { calculateSimilarity, toPinyin } from '@/services/transcription/similarity';

/**
 * 匹配结果接口
 */
export interface MatchResult {
  contact: Contact;
  confidence: number;
  reason: string;
  matchedFields: string[];
}

/**
 * 匹配选项接口
 */
export interface MatchOptions {
  threshold?: number;
  maxResults?: number;
  useContext?: boolean;
}

/**
 * 匹配上下文信息
 */
export interface MatchContext {
  company?: string;
  title?: string;
  entities?: ExtractedEntity[];
}

/**
 * 置信度阈值常量
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.3,
} as const;

/**
 * 计算字符串相似度（基于编辑距离）
 * @param s1 字符串1
 * @param s2 字符串2
 * @returns 相似度得分（0-1）
 */
export const calculateStringSimilarity = (s1: string, s2: string): number => {
  if (!s1 || !s2) return 0;
  return calculateSimilarity(s1.toLowerCase().trim(), s2.toLowerCase().trim());
};

/**
 * 获取拼音首字母
 * @param name 中文字符串
 * @returns 拼音首字母（如 "张三" -> "ZS"）
 */
export const getPinyinInitials = (name: string): string => {
  if (!name) return '';
  
  return name
    .split('')
    .map((char) => {
      const pinyin = toPinyin(char);
      return pinyin.charAt(0).toUpperCase();
    })
    .join('');
};

/**
 * 计算拼音相似度
 * @param name1 姓名1
 * @param name2 姓名2
 * @returns 相似度得分（0-1）
 */
const calculatePinyinSimilarity = (name1: string, name2: string): number => {
  const initials1 = getPinyinInitials(name1);
  const initials2 = getPinyinInitials(name2);
  
  if (!initials1 || !initials2) return 0;
  
  // 完全匹配拼音首字母
  if (initials1 === initials2) return 1;
  
  // 部分匹配
  const minLength = Math.min(initials1.length, initials2.length);
  let matchCount = 0;
  
  for (let i = 0; i < minLength; i++) {
    if (initials1[i] === initials2[i]) {
      matchCount++;
    }
  }
  
  return matchCount / Math.max(initials1.length, initials2.length);
};

/**
 * 计算上下文匹配加成
 * @param contact 联系人
 * @param context 上下文信息
 * @returns 加成值（0-0.2）
 */
export const calculateContextBoost = (
  contact: Contact,
  context: MatchContext
): number => {
  let boost = 0;
  const matchedFields: string[] = [];
  
  // 公司匹配
  if (context.company && contact.company) {
    const companySim = calculateStringSimilarity(context.company, contact.company);
    if (companySim >= 0.8) {
      boost += 0.15;
      matchedFields.push('company');
    } else if (companySim >= 0.5) {
      boost += 0.08;
      matchedFields.push('company_partial');
    }
  }
  
  // 职位匹配
  if (context.title && contact.title) {
    const titleSim = calculateStringSimilarity(context.title, contact.title);
    if (titleSim >= 0.8) {
      boost += 0.1;
      matchedFields.push('title');
    } else if (titleSim >= 0.5) {
      boost += 0.05;
      matchedFields.push('title_partial');
    }
  }
  
  // 从实体中提取信息匹配
  if (context.entities) {
    for (const entity of context.entities) {
      // 组织匹配
      if (entity.type === 'organization' && contact.company) {
        const orgSim = calculateStringSimilarity(entity.value, contact.company);
        if (orgSim >= 0.8) {
          boost += 0.12;
          matchedFields.push('entity_company');
        }
      }
      
      // 位置匹配（可用于推断公司）
      if (entity.type === 'location' && contact.tags) {
        const locationMatch = contact.tags.some((tag) =>
          tag.toLowerCase().includes(entity.value.toLowerCase())
        );
        if (locationMatch) {
          boost += 0.05;
          matchedFields.push('location_tag');
        }
      }
    }
  }
  
  // 标签匹配
  if (context.entities && contact.tags.length > 0) {
    for (const entity of context.entities) {
      const tagMatch = contact.tags.some((tag) =>
        calculateStringSimilarity(entity.value, tag) >= 0.7
      );
      if (tagMatch) {
        boost += 0.05;
        matchedFields.push('tag');
        break;
      }
    }
  }
  
  return Math.min(boost, 0.25); // 最大加成不超过 0.25
};

/**
 * 获取匹配原因描述
 * @param matchType 匹配类型
 * @param confidence 置信度
 * @returns 原因描述
 */
const getMatchReason = (matchType: string, confidence: number): string => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    return '姓名完全匹配';
  }
  
  switch (matchType) {
    case 'exact':
      return '姓名完全匹配';
    case 'contains':
      return '姓名包含匹配';
    case 'pinyin':
      return '拼音首字母匹配';
    case 'fuzzy':
      return confidence >= CONFIDENCE_THRESHOLDS.MEDIUM
        ? '姓名高度相似'
        : '姓名可能相似';
    case 'context':
      return '上下文信息匹配';
    default:
      return '综合匹配';
  }
};

/**
 * 计算单个联系人的匹配分数
 * @param queryName 查询姓名
 * @param contact 联系人
 * @param context 上下文信息
 * @returns 匹配结果（若低于阈值返回 null）
 */
const calculateMatchScore = (
  queryName: string,
  contact: Contact,
  context?: MatchContext
): MatchResult | null => {
  const normalizedQuery = queryName.toLowerCase().trim();
  const normalizedContactName = contact.name.toLowerCase().trim();
  
  let confidence = 0;
  let matchType = '';
  const matchedFields: string[] = [];
  
  // 1. 完全匹配（置信度：1.0）
  if (normalizedQuery === normalizedContactName) {
    confidence = 1.0;
    matchType = 'exact';
  }
  // 2. 包含匹配（置信度：0.8）
  else if (
    normalizedContactName.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedContactName)
  ) {
    const lengthRatio =
      Math.min(normalizedQuery.length, normalizedContactName.length) /
      Math.max(normalizedQuery.length, normalizedContactName.length);
    confidence = 0.7 + lengthRatio * 0.1; // 0.7 - 0.8
    matchType = 'contains';
    matchedFields.push('name_contains');
  }
  // 3. 拼音首字母匹配（置信度：0.6）
  else {
    const pinyinSim = calculatePinyinSimilarity(queryName, contact.name);
    if (pinyinSim >= 0.8) {
      confidence = 0.6;
      matchType = 'pinyin';
      matchedFields.push('pinyin_initials');
    }
    // 4. 模糊匹配（置信度：0.4-0.5）
    else {
      const fuzzySim = calculateStringSimilarity(queryName, contact.name);
      if (fuzzySim >= 0.6) {
        confidence = 0.4 + fuzzySim * 0.1; // 0.4 - 0.5
        matchType = 'fuzzy';
        matchedFields.push('name_similar');
      }
    }
  }
  
  // 5. 上下文加成
  if (context && confidence > 0) {
    const contextBoost = calculateContextBoost(contact, context);
    confidence = Math.min(confidence + contextBoost, 0.98); // 不完全匹配最高到 0.98
    if (contextBoost > 0) {
      matchedFields.push('context_boost');
    }
  }
  
  if (confidence === 0) {
    return null;
  }
  
  return {
    contact,
    confidence: Math.round(confidence * 100) / 100,
    reason: getMatchReason(matchType, confidence),
    matchedFields,
  };
};

/**
 * 查找匹配的联系人
 * @param queryName 查询姓名
 * @param contacts 联系人列表
 * @param context 可选的上下文信息
 * @param options 匹配选项
 * @returns 匹配结果列表（按置信度降序排列）
 */
export const findMatchingContacts = (
  queryName: string,
  contacts: Contact[],
  context?: MatchContext,
  options: MatchOptions = {}
): MatchResult[] => {
  const {
    threshold = CONFIDENCE_THRESHOLDS.LOW,
    maxResults = 5,
    useContext = true,
  } = options;
  
  if (!queryName || !contacts.length) {
    return [];
  }
  
  const matchContext = useContext ? context : undefined;
  const results: MatchResult[] = [];
  
  for (const contact of contacts) {
    const match = calculateMatchScore(queryName, contact, matchContext);
    
    if (match && match.confidence >= threshold) {
      results.push(match);
    }
  }
  
  // 按置信度降序排序
  results.sort((a, b) => b.confidence - a.confidence);
  
  // 限制返回数量
  return results.slice(0, maxResults);
};

/**
 * 获取置信度级别
 * @param confidence 置信度分数
 * @returns 置信度级别
 */
export const getConfidenceLevel = (
  confidence: number
): 'high' | 'medium' | 'low' | 'none' => {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'low';
  return 'none';
};

/**
 * 判断是否可以直接自动选择（高置信度）
 * @param confidence 置信度分数
 * @returns 是否可以自动选择
 */
export const shouldAutoSelect = (confidence: number): boolean => {
  return confidence >= CONFIDENCE_THRESHOLDS.HIGH;
};

/**
 * 判断是否显示建议（中置信度）
 * @param confidence 置信度分数
 * @returns 是否显示建议
 */
export const shouldShowSuggestion = (confidence: number): boolean => {
  return confidence >= CONFIDENCE_THRESHOLDS.MEDIUM && confidence < CONFIDENCE_THRESHOLDS.HIGH;
};

/**
 * 批量匹配多个查询名称
 * @param queryNames 查询姓名列表
 * @param contacts 联系人列表
 * @param context 可选的上下文信息
 * @param options 匹配选项
 * @returns 每个查询的最佳匹配结果
 */
export const batchFindMatchingContacts = (
  queryNames: string[],
  contacts: Contact[],
  context?: MatchContext,
  options: MatchOptions = {}
): Map<string, MatchResult[]> => {
  const results = new Map<string, MatchResult[]>();
  
  for (const queryName of queryNames) {
    const matches = findMatchingContacts(queryName, contacts, context, options);
    results.set(queryName, matches);
  }
  
  return results;
};

/**
 * 获取最佳匹配（单个结果）
 * @param queryName 查询姓名
 * @param contacts 联系人列表
 * @param context 可选的上下文信息
 * @param minConfidence 最小置信度
 * @returns 最佳匹配结果或 null
 */
export const findBestMatch = (
  queryName: string,
  contacts: Contact[],
  context?: MatchContext,
  minConfidence: number = CONFIDENCE_THRESHOLDS.MEDIUM
): MatchResult | null => {
  const matches = findMatchingContacts(queryName, contacts, context, {
    threshold: minConfidence,
    maxResults: 1,
  });
  
  return matches.length > 0 ? matches[0] : null;
};

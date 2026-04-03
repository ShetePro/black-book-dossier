import { Contact } from '@/types';
import { getContactNameMatcher, ContactNameMatcher } from './nameMatcher';
import { correctTranscriptionWithLLM, isLLMAvailable } from '@/services/ai/llmInference';

export interface EnhancementResult {
  originalText: string;
  enhancedText: string;
  corrections: Array<{
    original: string;
    corrected: string;
    confidence: number;
  }>;
  applied: boolean;
  llmApplied?: boolean;
}

// 默认行业词汇
const DEFAULT_VOCABULARY = [
  // 公司名
  '阿里巴巴', '腾讯', '字节跳动', '美团', '京东', '百度', '华为', '小米',
  '滴滴', '拼多多', '网易', '快手', '哔哩哔哩', 'B站',
  // 职位
  '董事长', '总裁', '总经理', '总监', '经理', '主管', '专员',
  'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CIO',
  '创始人', '合伙人', '投资人', '顾问',
  // 行业术语
  '融资', '投资', '并购', '上市', 'IPO', '估值', '股权', '期权',
  '营收', '利润', '成本', '预算', '现金流',
  '客户', '用户', '渠道', '供应商', '合作伙伴',
  // 会议相关
  '会议', '约谈', '拜访', '接待', '宴请', '聚会', '活动',
];

/**
 * 转录增强器
 * 用于语音识别后处理，纠正联系人姓名和常用词汇
 */
class TranscriptionEnhancer {
  private matcher: ContactNameMatcher;
  private contactsLoaded: boolean = false;
  private vocabularyLoaded: boolean = false;

  constructor() {
    this.matcher = getContactNameMatcher();
  }

  /**
   * 加载联系人数据
   * @param contacts 联系人列表
   */
  loadContacts(contacts: Contact[]): void {
    if (contacts.length > 0) {
      this.matcher.loadContacts(contacts);
      this.contactsLoaded = true;
      console.log(`[TranscriptionEnhancer] Loaded ${contacts.length} contacts`);
    }
  }

  /**
   * 加载自定义词库
   * @param vocabulary 词汇列表
   */
  loadVocabulary(vocabulary: string[]): void {
    this.matcher.loadCustomVocabulary(vocabulary);
    this.vocabularyLoaded = true;
    console.log(`[TranscriptionEnhancer] Loaded ${vocabulary.length} custom words`);
  }

  /**
   * 加载默认词库
   */
  loadDefaultVocabulary(): void {
    this.matcher.loadCustomVocabulary(DEFAULT_VOCABULARY);
    this.vocabularyLoaded = true;
    console.log('[TranscriptionEnhancer] Loaded default vocabulary');
  }

  /**
   * 增强转录文本
   * @param text 原始转录文本
   * @param threshold 相似度阈值（默认0.75）
   * @param useLLM 是否使用 LLM 修正（默认 true）
   * @returns 增强结果
   */
  async enhance(text: string, threshold: number = 0.75, useLLM: boolean = true): Promise<EnhancementResult> {
    if (!text || text.trim().length === 0) {
      return {
        originalText: text,
        enhancedText: text,
        corrections: [],
        applied: false,
        llmApplied: false,
      };
    }

    // 如果没有加载任何词库，加载默认词库
    if (!this.contactsLoaded && !this.vocabularyLoaded) {
      this.loadDefaultVocabulary();
    }

    // 1. 规则修正
    const { corrected, corrections } = this.matcher.correctText(text, threshold);
    
    // 2. LLM 修正（可选）
    let finalText = corrected;
    let llmApplied = false;
    
    if (useLLM && await isLLMAvailable()) {
      console.log('[TranscriptionEnhancer] Applying LLM correction...');
      const llmResult = await correctTranscriptionWithLLM(corrected);
      if (llmResult.success && llmResult.text) {
        finalText = llmResult.text;
        llmApplied = true;
        console.log('[TranscriptionEnhancer] LLM correction applied');
      }
    }

    console.log('[TranscriptionEnhancer] Enhancement result:', {
      original: text,
      ruleCorrected: corrected,
      finalText,
      correctionsCount: corrections.length,
      llmApplied,
    });

    return {
      originalText: text,
      enhancedText: finalText,
      corrections: corrections.map(c => ({
        original: c.original,
        corrected: c.corrected,
        confidence: c.confidence,
      })),
      applied: corrections.length > 0 || llmApplied,
      llmApplied,
    };
  }

  /**
   * 快速增强（便捷方法）
   * @param text 原始转录文本
   * @param contacts 联系人列表（可选，不传则使用已加载的）
   * @returns 增强后的文本
   */
  async quickEnhance(text: string, contacts?: Contact[]): Promise<string> {
    if (contacts && contacts.length > 0) {
      this.loadContacts(contacts);
    }

    const result = await this.enhance(text);
    return result.enhancedText;
  }
}

// 单例实例
let enhancerInstance: TranscriptionEnhancer | null = null;

/**
 * 获取转录增强器实例（单例）
 */
export const getTranscriptionEnhancer = (): TranscriptionEnhancer => {
  if (!enhancerInstance) {
    enhancerInstance = new TranscriptionEnhancer();
  }
  return enhancerInstance;
};

/**
 * 重置增强器实例
 */
export const resetTranscriptionEnhancer = (): void => {
  enhancerInstance = null;
};

/**
 * 便捷函数：增强转录文本
 * @param text 原始转录文本
 * @param contacts 联系人列表
 * @returns 增强后的文本
 */
export const enhanceTranscription = async (text: string, contacts?: Contact[]): Promise<string> => {
  const enhancer = getTranscriptionEnhancer();
  return await enhancer.quickEnhance(text, contacts);
};

/**
 * 便捷函数：增强转录文本（带详细信息）
 * @param text 原始转录文本
 * @param contacts 联系人列表
 * @returns 增强结果（包含纠正详情）
 */
export const enhanceTranscriptionWithDetails = async (
  text: string,
  contacts?: Contact[]
): Promise<EnhancementResult> => {
  const enhancer = getTranscriptionEnhancer();
  if (contacts) {
    enhancer.loadContacts(contacts);
  }
  return await enhancer.enhance(text);
};

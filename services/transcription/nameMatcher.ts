import { findBestMatch, calculateCombinedSimilarity } from './similarity';
import { Contact } from '@/types';

export interface MatchResult {
  original: string;
  corrected: string;
  confidence: number;
}

/**
 * 联系人姓名匹配器
 * 用于语音识别后处理的姓名纠正
 */
export class ContactNameMatcher {
  private names: string[] = [];
  private nameVariants: Map<string, string> = new Map();
  
  /**
   * 从联系人列表加载姓名
   */
  loadContacts(contacts: Contact[]): void {
    this.names = [];
    this.nameVariants.clear();
    
    contacts.forEach(contact => {
      // 添加全名
      this.names.push(contact.name);
      
      // 生成常见变体（如添加"总"、"经理"等后缀）
      this.generateNameVariants(contact.name);
    });
    
    // 去重
    this.names = Array.from(new Set(this.names));
    
    console.log(`[ContactNameMatcher] Loaded ${this.names.length} names`);
  }
  
  /**
   * 生成姓名变体
   * 例如："张三" → ["张总", "张经理"]
   */
  private generateNameVariants(fullName: string): void {
    if (fullName.length >= 2) {
      const surname = fullName.charAt(0);
      const variants = [
        surname + '总',
        surname + '经理',
        surname + '董',
        surname + '董事长',
        surname + '总裁',
        surname + 'CEO',
        surname + 'CTO',
        surname + 'CFO',
      ];
      
      variants.forEach(variant => {
        this.nameVariants.set(variant, fullName);
        if (!this.names.includes(variant)) {
          this.names.push(variant);
        }
      });
    }
  }
  
  /**
   * 加载自定义词库
   * 用于添加行业术语、公司名等
   */
  loadCustomVocabulary(vocabulary: string[]): void {
    vocabulary.forEach(word => {
      if (!this.names.includes(word)) {
        this.names.push(word);
      }
    });
  }
  
  /**
   * 匹配单个词
   * @param word 待匹配的词
   * @param threshold 相似度阈值（默认0.75）
   * @returns 匹配结果，如果没有则返回null
   */
  matchWord(word: string, threshold: number = 0.75): MatchResult | null {
    // 如果已经在词库中，直接返回
    if (this.names.includes(word)) {
      return {
        original: word,
        corrected: word,
        confidence: 1,
      };
    }
    
    // 查找最佳匹配
    const bestMatch = findBestMatch(word, this.names, threshold);
    
    if (bestMatch) {
      // 检查是否是变体
      const corrected = this.nameVariants.get(bestMatch.target) || bestMatch.target;
      
      return {
        original: word,
        corrected,
        confidence: bestMatch.similarity,
      };
    }
    
    return null;
  }
  
  /**
   * 批量匹配文本中的词语
   * @param text 待处理的文本
   * @param threshold 相似度阈值
   * @returns 所有匹配结果
   */
  matchText(text: string, threshold: number = 0.75): MatchResult[] {
    const results: MatchResult[] = [];
    const words = this.segmentText(text);
    
    // 尝试不同长度的滑动窗口
    for (let len = 5; len >= 2; len--) {
      for (let i = 0; i <= words.length - len; i++) {
        const phrase = words.slice(i, i + len).join('');
        const match = this.matchWord(phrase, threshold);
        
        if (match && match.confidence >= threshold) {
          results.push({
            ...match,
            original: phrase,
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * 简单的文本分词（基于字符）
   * 实际项目中可以使用 jieba 等分词库
   */
  private segmentText(text: string): string[] {
    // 移除标点符号
    const cleanText = text.replace(/[，。？！；：""''（）【】《》、.,?!;:\"\'()[\]<>/]/g, ' ');
    
    // 按空格分割并过滤空字符串
    return cleanText.split(/\s+/).filter(word => word.length > 0);
  }
  
  /**
   * 纠正文本中的所有姓名
   * @param text 原始转录文本
   * @param threshold 相似度阈值
   * @returns 纠正后的文本
   */
  correctText(text: string, threshold: number = 0.75): { 
    corrected: string; 
    corrections: MatchResult[];
  } {
    let corrected = text;
    const corrections: MatchResult[] = [];
    
    // 从长到短匹配，避免短词覆盖长词
    const matches = this.matchText(text, threshold);
    
    // 按位置排序，避免重叠
    matches.sort((a, b) => b.original.length - a.original.length);
    
    // 执行替换
    matches.forEach(match => {
      if (corrected.includes(match.original)) {
        corrected = corrected.replace(match.original, match.corrected);
        corrections.push(match);
      }
    });
    
    return { corrected, corrections };
  }
}

// 单例实例
let matcherInstance: ContactNameMatcher | null = null;

/**
 * 获取姓名匹配器实例（单例）
 */
export const getContactNameMatcher = (): ContactNameMatcher => {
  if (!matcherInstance) {
    matcherInstance = new ContactNameMatcher();
  }
  return matcherInstance;
};

/**
 * 重置匹配器实例
 */
export const resetContactNameMatcher = (): void => {
  matcherInstance = null;
};

import { Contact } from '@/types';

export interface SmartAnalysisResult {
  eventType: 'activity' | 'meeting' | 'meal' | 'call' | 'gift' | 'other';
  eventDescription: string;
  date: string; // ISO 格式 YYYY-MM-DD
  time?: string; // HH:MM
  location?: string;
  participants: string[]; // 人名列表
  extractedContactName?: string; // 主要联系人
  confidence: number;
}

// 事件类型关键词
const EVENT_PATTERNS: Record<string, string[]> = {
  activity: ['爬山', '游泳', '打球', '运动', '健身', '跑步', '旅游', '旅行', '逛街', '徒步', '骑行', '滑雪', '潜水'],
  meeting: ['开会', '会议', '约谈', '见面', '谈事', '聊', '讨论', '汇报', '沟通', '协商', '谈判'],
  meal: ['吃饭', '聚餐', '请客', '晚宴', '午餐', '晚餐', '早餐', '喝咖啡', '喝茶', '喝酒', '应酬'],
  call: ['电话', '通话', '打电话', '视频', '语音', '视频通话'],
  gift: ['送礼', '礼物', '红包', '请客', '招待', '馈赠'],
};

// 星期映射
const WEEKDAY_MAP: Record<string, number> = {
  '日': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
};

/**
 * 解析相对时间为绝对日期
 */
const parseRelativeTime = (text: string): Date => {
  const now = new Date();
  
  // 明天
  if (text.includes('明天')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  // 后天
  if (text.includes('后天')) {
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    return dayAfterTomorrow;
  }
  
  // 大后天
  if (text.includes('大后天')) {
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    return threeDaysLater;
  }
  
  // 下周X
  const weekdayMatch = text.match(/下周([一二三四五六日])/);
  if (weekdayMatch) {
    const targetWeekday = WEEKDAY_MAP[weekdayMatch[1]];
    const currentWeekday = now.getDay();
    const daysUntilNextWeek = 7 - currentWeekday + targetWeekday;
    const nextWeekDate = new Date(now);
    nextWeekDate.setDate(now.getDate() + daysUntilNextWeek);
    return nextWeekDate;
  }
  
  // 具体日期：X月X日
  const dateMatch = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (dateMatch) {
    const year = now.getFullYear();
    const month = parseInt(dateMatch[1]) - 1;
    const day = parseInt(dateMatch[2]);
    const date = new Date(year, month, day);
    // 如果日期已过，假设是明年
    if (date < now && now.getTime() - date.getTime() > 30 * 24 * 60 * 60 * 1000) {
      date.setFullYear(year + 1);
    }
    return date;
  }
  
  // 默认返回今天
  return now;
};

/**
 * 检测事件类型
 */
const detectEventType = (text: string): string => {
  for (const [type, keywords] of Object.entries(EVENT_PATTERNS)) {
    if (keywords.some(k => text.includes(k))) {
      return type;
    }
  }
  return 'other';
};

/**
 * 提取参与人
 */
const extractParticipants = (text: string): string[] => {
  const participants: string[] = [];
  
  // 匹配"和XXX去"、"与XXX一起"等模式
  const patterns = [
    /和([\u4e00-\u9fa5]{2,4})(?:去|一起|约|在)/g,
    /与([\u4e00-\u9fa5]{2,4})(?:去|一起|约|在)/g,
    /同([\u4e00-\u9fa5]{2,4})(?:去|一起|约)/g,
    /跟([\u4e00-\u9fa5]{2,4})(?:去|一起|约)/g,
    /约([\u4e00-\u9fa5]{2,4})(?:去|一起|吃饭|见面)/g,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length >= 2 && !participants.includes(name)) {
        participants.push(name);
      }
    }
  });
  
  // 如果没有匹配到，尝试匹配常见称呼
  if (participants.length === 0) {
    const namePattern = /([小老]?[\u4e00-\u9fa5]{1,2})(?:总|经理|先生|女士|老师|医生|教授)/g;
    let match;
    while ((match = namePattern.exec(text)) !== null) {
      const name = match[1].trim();
      if (name.length >= 1 && !participants.includes(name)) {
        participants.push(name);
      }
    }
  }
  
  return participants;
};

/**
 * 提取地点
 */
const extractLocation = (text: string): string | undefined => {
  const locationPatterns = [
    /在([\u4e00-\u9fa5]{2,10})(?:见面|吃饭|聊|谈|等|约)/,
    /去([\u4e00-\u9fa5]{2,10})(?:见面|吃饭|聊|谈|爬山|玩)/,
    /约([\u4e00-\u9fa5]{2,10})(?:见面|吃饭)/,
    /([\u4e00-\u9fa5]{2,6})(?:酒店|餐厅|咖啡厅|茶馆|公司|办公室|会议室)/,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return undefined;
};

/**
 * 匹配联系人
 */
const matchContact = (
  name: string,
  contacts: Contact[]
): { contact: Contact | null; confidence: number } => {
  if (!name || contacts.length === 0) {
    return { contact: null, confidence: 0 };
  }
  
  // 精确匹配
  const exactMatch = contacts.find(c => c.name === name);
  if (exactMatch) {
    return { contact: exactMatch, confidence: 1.0 };
  }
  
  // 包含匹配
  const containsMatch = contacts.find(c => c.name.includes(name) || name.includes(c.name));
  if (containsMatch) {
    const confidence = Math.min(name.length, containsMatch.name.length) / Math.max(name.length, containsMatch.name.length);
    return { contact: containsMatch, confidence };
  }
  
  // 模糊匹配（简化版）
  let bestMatch: Contact | null = null;
  let bestScore = 0;
  
  contacts.forEach(contact => {
    let score = 0;
    const contactName = contact.name;
    
    // 计算相似度
    for (let i = 0; i < Math.min(name.length, contactName.length); i++) {
      if (name[i] === contactName[i]) {
        score++;
      }
    }
    
    const similarity = score / Math.max(name.length, contactName.length);
    if (similarity > bestScore && similarity > 0.5) {
      bestScore = similarity;
      bestMatch = contact;
    }
  });
  
  return { contact: bestMatch, confidence: bestScore };
};

/**
 * 智能分析语音内容
 */
export const analyzeVoiceContent = async (
  text: string,
  contacts: Contact[]
): Promise<SmartAnalysisResult> => {
  console.log('[SmartAnalyzer] Analyzing:', text);
  
  // 1. 解析时间
  const date = parseRelativeTime(text);
  
  // 2. 检测事件类型
  const eventType = detectEventType(text) as SmartAnalysisResult['eventType'];
  
  // 3. 提取参与人
  const participants = extractParticipants(text);
  
  // 4. 提取地点
  const location = extractLocation(text);
  
  // 5. 匹配联系人
  let extractedContactName: string | undefined;
  let matchedContact: Contact | null = null;
  let confidence = 0;
  
  if (participants.length > 0) {
    extractedContactName = participants[0];
    const match = matchContact(extractedContactName, contacts);
    matchedContact = match.contact;
    confidence = match.confidence;
  }
  
  // 6. 生成事件描述
  let eventDescription = text;
  if (extractedContactName) {
    // 简化描述
    eventDescription = text.replace(/明天|后天|大后天|下周[一二三四五六日]/g, '').trim();
  }
  
  const result: SmartAnalysisResult = {
    eventType,
    eventDescription,
    date: date.toISOString().split('T')[0],
    location,
    participants,
    extractedContactName,
    confidence,
  };
  
  console.log('[SmartAnalyzer] Analysis result:', result);
  
  return result;
};

/**
 * 快速分析（便捷函数）
 */
export const quickAnalyze = async (
  text: string,
  contacts: Contact[]
): Promise<SmartAnalysisResult> => {
  return analyzeVoiceContent(text, contacts);
};

export default {
  analyzeVoiceContent,
  quickAnalyze,
};

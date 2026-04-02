import {
  EnhancedEntity,
  EnhancedAnalysisResult,
  EntityRelation,
  TimeEntity,
  LocationEntity,
  PersonEntity,
  EventEntity,
  NeedEntity,
  PreferenceEntity,
  HealthEntity,
  SuggestionEntity,
  OrganizationEntity,
  EnhancedActionItem,
  TranscriptionCorrection,
} from '@/types/entity';
import { Contact } from '@/types';

/**
 * 增强型实体提取服务
 * 支持多维度分析：时间、地点、对象、事件、特征、建议
 */

// 联系人数据库（用于语音识别修正）
let contactsDatabase: Contact[] = [];

export const setContactsDatabase = (contacts: Contact[]) => {
  contactsDatabase = contacts;
};

// 基于联系人的语音识别修正
export const correctTranscription = (
  text: string,
  contacts: Contact[]
): TranscriptionCorrection[] => {
  const corrections: TranscriptionCorrection[] = [];
  const words = text.split(/[\s,，。！？.;:；：]+/);

  contacts.forEach((contact) => {
    const name = contact.name;
    const pinyinName = contact.name; // 简化处理，实际应使用 pinyin 库

    // 模糊匹配名字
    words.forEach((word) => {
      if (word.length >= 2) {
        const similarity = calculateSimilarity(word, name);
        if (similarity > 0.6 && similarity < 1) {
          corrections.push({
            original: word,
            suggestion: name,
            confidence: similarity,
            reason: `匹配到联系人：${name}${contact.company ? ` (${contact.company})` : ''}`,
            source: 'contact_match',
          });
        }
      }
    });
  });

  return corrections.sort((a, b) => b.confidence - a.confidence);
};

// 字符串相似度计算（Levenshtein distance 简化版）
const calculateSimilarity = (str1: string, str2: string): number => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
};

// 提取时间实体
const extractTimeEntities = (text: string): TimeEntity[] => {
  const entities: TimeEntity[] = [];

  // 具体时间模式
  const specificTimePatterns = [
    { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日/g, type: 'specific' as const },
    { pattern: /(\d{1,2})月(\d{1,2})日/g, type: 'specific' as const },
    { pattern: /(\d{1,2}):(\d{2})/g, type: 'specific' as const },
    { pattern: /(\d{1,2})号/g, type: 'specific' as const },
  ];

  specificTimePatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'time',
        subtype: type,
        value: match[0],
        normalized: {
          timestamp: parseTimeToTimestamp(match[0]),
        },
        confidence: {
          score: 0.85,
          level: 'high',
          reason: '明确时间格式',
        },
        context: text.substring(Math.max(0, match.index - 15), match.index + match[0].length + 15),
      });
    }
  });

  // 相对时间模式
  const relativeTimePatterns = [
    { pattern: /明[天日]|昨[天日]|今[天日]|后[天]|大后[天]/g, type: 'relative' as const },
    { pattern: /下[个]?周[一二三四五六日]/g, type: 'relative' as const },
    { pattern: /[下上]?个?月/g, type: 'relative' as const },
  ];

  relativeTimePatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'time',
        subtype: type,
        value: match[0],
        normalized: {
          recurrence: type === 'relative' ? 'once' : undefined,
        },
        confidence: {
          score: 0.75,
          level: 'medium',
          reason: '相对时间描述',
        },
        context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
      });
    }
  });

  // 时间段模式
  const durationPatterns = [
    { pattern: /([一二两三四五六七八九十\d]+)(个)?小时/g, type: 'duration' as const },
    { pattern: /([一二两三四五六七八九十\d]+)(个)?半?小时/g, type: 'duration' as const },
    { pattern: /([一二两三四五六七八九十\d]+)天/g, type: 'duration' as const },
    { pattern: /([一二两三四五六七八九十\d]+)分钟/g, type: 'duration' as const },
  ];

  durationPatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'time',
        subtype: type,
        value: match[0],
        normalized: {},
        confidence: {
          score: 0.8,
          level: 'high',
          reason: '明确时间段',
        },
        context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
      });
    }
  });

  // 周期模式
  const recurringPatterns = [
    { pattern: /每[天日周月年]|定期|每周[一二三四五六日]/g, type: 'recurring' as const },
  ];

  recurringPatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'time',
        subtype: type,
        value: match[0],
        normalized: {
          recurrence: 'periodic',
        },
        confidence: {
          score: 0.7,
          level: 'medium',
          reason: '周期性时间描述',
        },
        context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
      });
    }
  });

  return entities;
};

// 解析时间字符串为时间戳
const parseTimeToTimestamp = (timeStr: string): number | undefined => {
  // 简化实现，实际应使用更复杂的日期解析
  const now = Date.now();
  return now; // 占位
};

// 提取地点实体
const extractLocationEntities = (text: string): LocationEntity[] => {
  const entities: LocationEntity[] = [];

  // 城市/地区
  const cityPatterns = [
    { pattern: /(北京|上海|广州|深圳|杭州|成都|伦敦|纽约|东京|新加坡|香港|台湾|澳门)/g, subtype: 'city' as const },
    { pattern: /(\w+)[省市]/g, subtype: 'region' as const },
  ];

  cityPatterns.forEach(({ pattern, subtype }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'location',
        subtype,
        value: match[1] || match[0],
        normalized: {
          city: match[1] || match[0],
        },
        confidence: {
          score: 0.85,
          level: 'high',
          reason: '明确城市/地区名称',
        },
        context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
      });
    }
  });

  // 场所/地点
  const venuePatterns = [
    { pattern: /(\w*)(?:酒店|餐厅|咖啡厅|茶馆|办公室|会议室|家里|公司)/g, subtype: 'venue' as const },
    { pattern: /(在|去|到|从)(.+?)(?:的|里|处|见面|聊)/g, subtype: 'venue' as const },
    { pattern: /(\w*广场|\w*大厦|\w*中心|\w*路\d+号)/g, subtype: 'venue' as const },
  ];

  venuePatterns.forEach(({ pattern, subtype }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const venue = match[2] || match[1] || match[0];
      if (venue && venue.length > 1 && venue.length < 20) {
        entities.push({
          type: 'location',
          subtype,
          value: venue,
          normalized: {
            venue: venue,
          },
          confidence: {
            score: 0.7,
            level: 'medium',
            reason: '地点上下文推断',
          },
          context: text.substring(Math.max(0, match.index - 15), match.index + match[0].length + 15),
        });
      }
    }
  });

  // 线上平台
  const onlinePatterns = [
    { pattern: /(微信|Zoom|腾讯会议|钉钉|飞书|线上|网上|电话)/g, subtype: 'online' as const },
  ];

  onlinePatterns.forEach(({ pattern, subtype }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'location',
        subtype,
        value: match[1],
        normalized: {
          isOnline: true,
          platform: match[1],
        },
        confidence: {
          score: 0.8,
          level: 'high',
          reason: '线上沟通平台',
        },
        context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
      });
    }
  });

  return entities;
};

// 提取人物实体
const extractPersonEntities = (text: string, contacts: Contact[]): PersonEntity[] => {
  const entities: PersonEntity[] = [];

  // 常见称呼模式
  const personPatterns = [
    { pattern: /([老王|老李|老张|老刘|老陈|老杨|老赵|老黄|老周|老吴|老徐|老孙|老朱|老高|老林|老何])([^，。,\s]{1,2})/g, subtype: 'contact' as const },
    { pattern: /(\w+)(?:总|经理|董|先生|女士|老师|教授|医生)/g, subtype: 'contact' as const },
    { pattern: /(?:儿子|女儿|老婆|老公|妻子|丈夫|父亲|母亲|爸爸|妈妈|哥哥|姐姐|弟弟|妹妹|叔叔|阿姨|舅舅|姑姑)的?(\w+)/g, subtype: 'family' as const },
  ];

  personPatterns.forEach(({ pattern, subtype }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[0];
      const relation = extractRelation(text, match.index);

      // 尝试匹配现有联系人
      const matchedContact = findBestContactMatch(name, contacts);

      entities.push({
        type: 'person',
        subtype,
        value: name,
        normalized: {
          name: name,
          relation: relation,
          contactId: matchedContact?.id,
          title: extractTitle(text, match.index),
          attributes: extractPersonAttributes(text, name),
        },
        confidence: {
          score: matchedContact ? 0.9 : 0.7,
          level: matchedContact ? 'high' : 'medium',
          reason: matchedContact ? '匹配到现有联系人' : '称呼模式识别',
        },
        context: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20),
      });
    }
  });

  // 尝试匹配所有联系人姓名
  contacts.forEach((contact) => {
    const namePattern = new RegExp(contact.name, 'g');
    let match;
    while ((match = namePattern.exec(text)) !== null) {
      // 检查是否已添加
      const alreadyExists = entities.some((e) => e.value === contact.name);
      if (!alreadyExists) {
        entities.push({
          type: 'person',
          subtype: 'contact',
          value: contact.name,
          normalized: {
            name: contact.name,
            contactId: contact.id,
            company: contact.company,
            title: contact.title,
          },
          confidence: {
            score: 0.95,
            level: 'high',
            reason: '精确匹配到联系人',
          },
          context: text.substring(Math.max(0, match.index - 15), match.index + match[0].length + 15),
        });
      }
    }
  });

  return entities;
};

// 提取人物关系
const extractRelation = (text: string, index: number): string | undefined => {
  const context = text.substring(Math.max(0, index - 30), index);
  const relations = ['朋友', '同事', '客户', '合作伙伴', '投资人', '老板', '下属', '亲戚'];
  for (const relation of relations) {
    if (context.includes(relation)) {
      return relation;
    }
  }
  return undefined;
};

// 提取职位
const extractTitle = (text: string, index: number): string | undefined => {
  const context = text.substring(index, Math.min(text.length, index + 30));
  const titleMatch = context.match(/(.{0,5})(?:总|经理|董|CEO|CTO|COO|VP|总监)/);
  return titleMatch ? titleMatch[0] : undefined;
};

// 提取人物特征
const extractPersonAttributes = (text: string, personName: string): any[] => {
  const attributes: any[] = [];
  const sentences = text.split(/[。！？;；]/);

  sentences.forEach((sentence) => {
    if (sentence.includes(personName) || sentence.includes('他') || sentence.includes('她')) {
      // 能力特征
      const capabilityMatch = sentence.match(/(很|非常|特别)?(擅长|精通|熟悉|了解|会|能)(.+?)(?:的|，|。)/);
      if (capabilityMatch) {
        attributes.push({
          category: 'capability',
          value: capabilityMatch[0],
          evidence: sentence,
        });
      }

      // 性格特征
      const personalityMatch = sentence.match(/(很|非常|特别)?(外向|内向|开朗|沉稳|谨慎|果断|细心|热情|冷漠|专业|靠谱)/);
      if (personalityMatch) {
        attributes.push({
          category: 'personality',
          value: personalityMatch[0],
          evidence: sentence,
        });
      }

      // 状态特征
      const statusMatch = sentence.match(/(最近|目前|现在|刚刚)(.+?)(?:的|，|。)/);
      if (statusMatch) {
        attributes.push({
          category: 'status',
          value: statusMatch[0],
          evidence: sentence,
        });
      }
    }
  });

  return attributes;
};

// 查找最佳联系人匹配
const findBestContactMatch = (name: string, contacts: Contact[]): Contact | undefined => {
  let bestMatch: Contact | undefined;
  let bestScore = 0;

  contacts.forEach((contact) => {
    const score = calculateSimilarity(name, contact.name);
    if (score > bestScore && score > 0.7) {
      bestScore = score;
      bestMatch = contact;
    }
  });

  return bestMatch;
};

// 提取事件实体
const extractEventEntities = (text: string): EventEntity[] => {
  const entities: EventEntity[] = [];

  // 会议/活动
  const eventPatterns = [
    { pattern: /(约|安排|组织|准备)(.+?)(?:会议|会面|见面|吃饭|聚会|活动)/g, type: 'meeting' as const },
    { pattern: /(开会|见面|聚餐|谈判|签约|合作|生日|婚礼|葬礼)/g, type: 'activity' as const },
    { pattern: /(\w+)(?:项目|活动|计划|任务)(?:启动|上线|完成|结束)/g, type: 'milestone' as const },
    { pattern: /(出|发生)(.+?)(?:问题|状况|事故|冲突|困难|挑战)/g, type: 'issue' as const },
    { pattern: /(机会|机遇|可能|潜力|前景|合作机会|商机)/g, type: 'opportunity' as const },
  ];

  eventPatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const eventValue = match[2] || match[1] || match[0];
      const importance = determineEventImportance(text, match.index, type);
      const status = determineEventStatus(text, match.index);

      entities.push({
        type: 'event',
        subtype: type,
        value: eventValue,
        normalized: {
          eventType: type,
          importance,
          status,
        },
        confidence: {
          score: 0.75,
          level: 'medium',
          reason: '事件关键词匹配',
        },
        context: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20),
      });
    }
  });

  return entities;
};

// 判断事件重要性
const determineEventImportance = (
  text: string,
  index: number,
  type: string
): 'critical' | 'high' | 'medium' | 'low' => {
  const context = text.substring(Math.max(0, index - 30), Math.min(text.length, index + 30));
  const criticalWords = ['紧急', '重要', '关键', '必须', '务必', '马上'];
  const highWords = ['尽快', '优先', '重要', '大'];

  if (criticalWords.some((w) => context.includes(w)) || type === 'milestone') {
    return 'critical';
  }
  if (highWords.some((w) => context.includes(w))) {
    return 'high';
  }
  if (type === 'opportunity') {
    return 'high';
  }
  return 'medium';
};

// 判断事件状态
const determineEventStatus = (
  text: string,
  index: number
): 'planned' | 'ongoing' | 'completed' | 'cancelled' => {
  const context = text.substring(Math.max(0, index - 20), Math.min(text.length, index + 20));

  if (context.includes('完成了') || context.includes('已经结束') || context.includes('搞定')) {
    return 'completed';
  }
  if (context.includes('正在进行') || context.includes('正在') || context.includes('已经开始')) {
    return 'ongoing';
  }
  if (context.includes('取消') || context.includes('不') || context.includes('推迟')) {
    return 'cancelled';
  }
  return 'planned';
};

// 提取需求实体
const extractNeedEntities = (text: string): NeedEntity[] => {
  const entities: NeedEntity[] = [];

  const needPatterns = [
    { pattern: /需要(.+?)(?:的|，|。|帮助|支持|协助|资源)/g, category: 'resource' as const },
    { pattern: /想(?:要|找|找)(.+?)(?:的|，|。)/g, category: 'info' as const },
    { pattern: /缺(.+?)(?:的|，|。|资源|人|钱|资金)/g, category: 'resource' as const },
    { pattern: /希望能?(.+?)(?:的|，|。|帮忙)/g, category: 'help' as const },
    { pattern: /急|紧急|迫切|立马|马上|尽快/g, category: 'resource' as const, urgency: 'immediate' as const },
  ];

  needPatterns.forEach((config: any) => {
    let match;
    const pattern = config.pattern;
    while ((match = pattern.exec(text)) !== null) {
      const needValue = match[1] || match[0];
      const urgency = config.urgency || determineUrgency(text, match.index);

      entities.push({
        type: 'need',
        subtype: urgency === 'immediate' ? 'urgent' : 'explicit',
        value: needValue,
        normalized: {
          category: config.category,
          urgency,
          description: needValue,
        },
        confidence: {
          score: urgency === 'immediate' ? 0.85 : 0.7,
          level: urgency === 'immediate' ? 'high' : 'medium',
          reason: urgency === 'immediate' ? '紧急需求关键词' : '需求表达模式',
        },
        context: text.substring(Math.max(0, match.index - 15), match.index + match[0].length + 15),
      });
    }
  });

  return entities;
};

// 判断紧急程度
const determineUrgency = (text: string, index: number): 'immediate' | 'shortterm' | 'longterm' => {
  const context = text.substring(Math.max(0, index - 20), Math.min(text.length, index + 20));
  const urgentWords = ['马上', '立刻', '现在', '急需', '紧急', '迫切', '立即'];
  const shorttermWords = ['尽快', '近期', '这周', '下周'];

  if (urgentWords.some((w) => context.includes(w))) {
    return 'immediate';
  }
  if (shorttermWords.some((w) => context.includes(w))) {
    return 'shortterm';
  }
  return 'longterm';
};

// 提取偏好实体
const extractPreferenceEntities = (text: string): PreferenceEntity[] => {
  const entities: PreferenceEntity[] = [];

  const preferencePatterns = [
    { pattern: /(?:喜欢|爱|偏好|最爱|钟情)(.+?)(?:的|了|，|。)/g, sentiment: 'positive' as const },
    { pattern: /(?:不喜欢|讨厌|厌恶|反感|拒绝)(.+?)(?:的|了|，|。)/g, sentiment: 'negative' as const },
    { pattern: /(?:不吃|不喝|不用|不碰|禁忌)(.+?)(?:的|了|，|。)/g, sentiment: 'negative' as const, subtype: 'taboo' as const },
    { pattern: /(?:习惯|经常|总是|爱)(.+?)(?:的|了|，|。)/g, sentiment: 'neutral' as const, subtype: 'habit' as const },
  ];

  preferencePatterns.forEach((config: any) => {
    let match;
    while ((match = config.pattern.exec(text)) !== null) {
      const prefValue = match[1]?.trim();
      if (prefValue && prefValue.length < 30) {
        const category = categorizePreference(prefValue);
        const intensity = determineIntensity(text, match.index);

        entities.push({
          type: 'preference',
          subtype: config.subtype || (config.sentiment === 'negative' ? 'dislike' : 'like'),
          value: prefValue,
          normalized: {
            category,
            sentiment: config.sentiment,
            intensity,
          },
          confidence: {
            score: 0.75,
            level: 'medium',
            reason: '偏好表达模式',
          },
          context: text.substring(Math.max(0, match.index - 15), match.index + match[0].length + 15),
        });
      }
    }
  });

  return entities;
};

// 偏好分类
const categorizePreference = (value: string): 'food' | 'drink' | 'activity' | 'topic' | 'communication' | 'gift' => {
  const foodWords = ['吃', '菜', '肉', '鱼', '火锅', '烧烤', '寿司', '披萨'];
  const drinkWords = ['喝', '酒', '茶', '咖啡', '水', '饮料', '果汁'];
  const activityWords = ['运动', '旅游', '看书', '电影', '音乐', '游戏', '健身'];
  const giftWords = ['礼物', '花', '巧克力', '手表', '包'];

  if (foodWords.some((w) => value.includes(w))) return 'food';
  if (drinkWords.some((w) => value.includes(w))) return 'drink';
  if (activityWords.some((w) => value.includes(w))) return 'activity';
  if (giftWords.some((w) => value.includes(w))) return 'gift';
  return 'topic';
};

// 判断强度
const determineIntensity = (text: string, index: number): 'strong' | 'moderate' | 'mild' => {
  const context = text.substring(Math.max(0, index - 10), index);
  const strongWords = ['非常', '特别', '极其', '最', '绝对', '超级'];
  const mildWords = ['有点', '稍微', '略微', '一般'];

  if (strongWords.some((w) => context.includes(w))) {
    return 'strong';
  }
  if (mildWords.some((w) => context.includes(w))) {
    return 'mild';
  }
  return 'moderate';
};

// 提取健康实体
const extractHealthEntities = (text: string): HealthEntity[] => {
  const entities: HealthEntity[] = [];

  const healthPatterns = [
    { pattern: /(痛风|高血压|糖尿病|心脏病|胃病|腰痛|颈椎|失眠|抑郁|焦虑)/g, severity: 'moderate' as const },
    { pattern: /(感冒|发烧|头痛|肚子痛|咳嗽|疲劳)/g, severity: 'mild' as const },
    { pattern: /(严重|急性|慢性|晚期|重症)(.+?)(?:的|，|。)/g, severity: 'critical' as const },
    { pattern: /(吃|服)(.+?)(?:药|治疗)/g, type: 'medication' as const },
    { pattern: /(过敏|对.+?过敏)/g, type: 'allergy' as const },
  ];

  healthPatterns.forEach((config: any) => {
    let match;
    while ((config.pattern as RegExp).exec(text) !== null) {
      match = (config.pattern as RegExp).exec(text);
      if (match) {
        const healthValue = match[2] || match[1] || match[0];
        const isOngoing = !text.substring(match.index - 10, match.index).includes('以前');

        entities.push({
          type: 'health',
          subtype: config.type || 'condition',
          value: healthValue,
          normalized: {
            condition: healthValue,
            severity: config.severity,
            isOngoing,
          },
          confidence: {
            score: 0.8,
            level: 'high',
            reason: '健康问题关键词',
          },
          context: text.substring(Math.max(0, match.index - 15), match.index + match[0].length + 15),
        });
      }
    }
  });

  return entities;
};

// 提取建议实体
const extractSuggestionEntities = (text: string): SuggestionEntity[] => {
  const entities: SuggestionEntity[] = [];

  const suggestionPatterns = [
    { pattern: /(?:建议|推荐|最好|可以|应该|不妨)(.+?)(?:的|，|。|送|给)/g, type: 'recommendation' as const },
    { pattern: /(?:记得|别忘了|注意|提醒)(.+?)(?:的|，|。|)/g, type: 'action' as const },
    { pattern: /(?:策略|方法|方式|手段)(.+?)(?:的|，|。|)/g, type: 'strategy' as const },
    { pattern: /(?:小心|注意|避免|别)(.+?)(?:的|，|。|)/g, type: 'warning' as const },
  ];

  suggestionPatterns.forEach((config: any) => {
    let match;
    while ((match = config.pattern.exec(text)) !== null) {
      const suggestionValue = match[1]?.trim();
      if (suggestionValue && suggestionValue.length < 50) {
        const category = categorizeSuggestion(suggestionValue);
        const priority = determineSuggestionPriority(text, match.index);

        entities.push({
          type: 'suggestion',
          subtype: config.type,
          value: suggestionValue,
          normalized: {
            category,
            priority,
            actionable: config.type !== 'warning',
          },
          confidence: {
            score: 0.7,
            level: 'medium',
            reason: '建议表达模式',
          },
          context: text.substring(Math.max(0, match.index - 15), match.index + match[0].length + 15),
        });
      }
    }
  });

  return entities;
};

// 建议分类
const categorizeSuggestion = (value: string): 'gift' | 'approach' | 'timing' | 'resource' | 'followup' => {
  const giftWords = ['送', '礼物', '花', '请吃饭', '请客', '招待'];
  const timingWords = ['时间', '时机', '时候', '等', '马上'];
  const resourceWords = ['资源', '人脉', '介绍', '推荐'];
  const followupWords = ['跟进', '联系', '约', '再'];

  if (giftWords.some((w) => value.includes(w))) return 'gift';
  if (timingWords.some((w) => value.includes(w))) return 'timing';
  if (resourceWords.some((w) => value.includes(w))) return 'resource';
  if (followupWords.some((w) => value.includes(w))) return 'followup';
  return 'approach';
};

// 判断建议优先级
const determineSuggestionPriority = (text: string, index: number): 'high' | 'medium' | 'low' => {
  const context = text.substring(Math.max(0, index - 15), Math.min(text.length, index + 15));
  const highWords = ['重要', '关键', '必须', '务必', '一定'];

  if (highWords.some((w) => context.includes(w))) {
    return 'high';
  }
  return 'medium';
};

// 提取组织实体
const extractOrganizationEntities = (text: string): OrganizationEntity[] => {
  const entities: OrganizationEntity[] = [];

  const orgPatterns = [
    { pattern: /(\w+)(?:公司|集团|企业|科技|网络|咨询|投资|银行)/g, subtype: 'company' as const },
    { pattern: /(\w+)(?:大学|学院|研究所|中心)/g, subtype: 'institution' as const },
    { pattern: /(\w+)(?:部门|团队|组)/g, subtype: 'department' as const },
  ];

  orgPatterns.forEach(({ pattern, subtype }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const orgName = match[1] + (match[0].match(/公司|集团|企业|科技|网络|咨询|投资|银行|大学|学院|研究所|中心|部门|团队|组/)?.[0] || '');

      entities.push({
        type: 'organization',
        subtype,
        value: orgName,
        normalized: {
          name: orgName,
          industry: extractIndustry(orgName),
        },
        confidence: {
          score: 0.8,
          level: 'high',
          reason: '组织名称模式',
        },
        context: text.substring(Math.max(0, match.index - 15), match.index + match[0].length + 15),
      });
    }
  });

  return entities;
};

// 提取行业
const extractIndustry = (orgName: string): string | undefined => {
  const industries: Record<string, string[]> = {
    '科技': ['科技', '互联网', '软件', 'AI', '智能'],
    '金融': ['银行', '投资', '基金', '证券', '保险', '财富'],
    '咨询': ['咨询', '顾问', '服务'],
    '教育': ['教育', '学校', '学院', '培训'],
    '医疗': ['医院', '医疗', '医药', '健康'],
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some((k) => orgName.includes(k))) {
      return industry;
    }
  }
  return undefined;
};

// 提取实体关系
const extractEntityRelations = (entities: EnhancedEntity[]): EntityRelation[] => {
  const relations: EntityRelation[] = [];
  const persons = entities.filter((e) => e.type === 'person') as PersonEntity[];
  const events = entities.filter((e) => e.type === 'event') as EventEntity[];
  const times = entities.filter((e) => e.type === 'time') as TimeEntity[];
  const locations = entities.filter((e) => e.type === 'location') as LocationEntity[];

  // 人物-事件关系
  persons.forEach((person) => {
    events.forEach((event) => {
      if (event.context.includes(person.value)) {
        relations.push({
          source: person.value,
          target: event.value,
          relationType: 'social',
          description: `${person.value} 参与 ${event.value}`,
          confidence: 0.75,
        });
      }
    });
  });

  // 时间-事件关系
  times.forEach((time) => {
    events.forEach((event) => {
      if (Math.abs(time.context.indexOf(event.value) - event.context.indexOf(time.value)) < 50) {
        relations.push({
          source: time.value,
          target: event.value,
          relationType: 'temporal',
          description: `${event.value} 发生在 ${time.value}`,
          confidence: 0.7,
        });
      }
    });
  });

  // 地点-事件关系
  locations.forEach((location) => {
    events.forEach((event) => {
      if (event.context.includes(location.value)) {
        relations.push({
          source: location.value,
          target: event.value,
          relationType: 'spatial',
          description: `${event.value} 在 ${location.value} 进行`,
          confidence: 0.7,
        });
      }
    });
  });

  return relations;
};

// 生成待办事项
const generateActionItems = (entities: EnhancedEntity[], text: string): EnhancedActionItem[] => {
  const items: EnhancedActionItem[] = [];

  // 从建议生成待办
  const suggestions = entities.filter((e) => e.type === 'suggestion') as SuggestionEntity[];
  suggestions.forEach((suggestion, index) => {
    items.push({
      id: `suggestion-${index}`,
      description: suggestion.value,
      category: suggestion.normalized.category === 'gift' ? 'gift' : 'followup',
      priority: suggestion.normalized.priority === 'high' ? 'high' : 'medium',
      relatedEntities: [suggestion.value],
      completed: false,
      createdAt: Date.now(),
    });
  });

  // 从需求生成待办
  const needs = entities.filter((e) => e.type === 'need') as NeedEntity[];
  needs.forEach((need, index) => {
    if (need.normalized.urgency === 'immediate') {
      items.push({
        id: `need-${index}`,
        description: `协助解决需求：${need.value}`,
        category: 'task',
        priority: 'high',
        relatedEntities: [need.value],
        completed: false,
        createdAt: Date.now(),
      });
    }
  });

  // 从事件生成待办
  const events = entities.filter((e) => e.type === 'event') as EventEntity[];
  events.forEach((event, index) => {
    if (event.normalized.importance === 'critical' || event.normalized.importance === 'high') {
      items.push({
        id: `event-${index}`,
        description: `跟进重要事件：${event.value}`,
        category: 'followup',
        priority: event.normalized.importance === 'critical' ? 'critical' : 'high',
        relatedEntities: [event.value],
        completed: false,
        createdAt: Date.now(),
      });
    }
  });

  return items;
};

// 生成摘要
const generateSummary = (entities: EnhancedEntity[], text: string) => {
  const persons = entities.filter((e) => e.type === 'person');
  const events = entities.filter((e) => e.type === 'event');
  const needs = entities.filter((e) => e.type === 'need');

  const mainTopic = persons.length > 0
    ? `关于 ${persons.map((p) => p.value).join('、')} 的交流记录`
    : '语音交流记录';

  const keyPoints: string[] = [];
  if (events.length > 0) {
    keyPoints.push(`涉及 ${events.length} 个重要事件`);
  }
  if (needs.length > 0) {
    keyPoints.push(`发现 ${needs.length} 个需求/机会`);
  }

  // 简单情感分析
  const positiveWords = ['好', '不错', '满意', '开心', '成功', '顺利'];
  const negativeWords = ['问题', '困难', '失败', '不满意', '担心', '麻烦'];
  const posCount = positiveWords.filter((w) => text.includes(w)).length;
  const negCount = negativeWords.filter((w) => text.includes(w)).length;

  let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
  if (posCount > negCount + 2) sentiment = 'positive';
  else if (negCount > posCount + 2) sentiment = 'negative';
  else if (posCount > 0 && negCount > 0) sentiment = 'mixed';

  // 紧急程度
  const urgencyWords = ['紧急', '马上', '立即', '尽快', '急'];
  const urgency: 'high' | 'medium' | 'low' = urgencyWords.some((w) => text.includes(w)) ? 'high' : 'medium';

  return {
    mainTopic,
    keyPoints,
    sentiment,
    urgency,
  };
};

/**
 * 主提取函数
 */
export const extractEnhancedEntities = async (
  text: string,
  contacts: Contact[] = []
): Promise<EnhancedAnalysisResult> => {
  console.log('[EnhancedEntityExtractor] Starting extraction...');

  // 1. 语音识别修正
  const corrections = correctTranscription(text, contacts);
  let correctedText = text;
  corrections.forEach((correction) => {
    if (correction.confidence > 0.8) {
      correctedText = correctedText.replace(correction.original, correction.suggestion);
    }
  });

  // 2. 提取各类实体
  const entities: EnhancedEntity[] = [];

  // 时间
  const timeEntities = extractTimeEntities(correctedText);
  entities.push(...timeEntities);

  // 地点
  const locationEntities = extractLocationEntities(correctedText);
  entities.push(...locationEntities);

  // 人物
  const personEntities = extractPersonEntities(correctedText, contacts);
  entities.push(...personEntities);

  // 事件
  const eventEntities = extractEventEntities(correctedText);
  entities.push(...eventEntities);

  // 需求
  const needEntities = extractNeedEntities(correctedText);
  entities.push(...needEntities);

  // 偏好
  const preferenceEntities = extractPreferenceEntities(correctedText);
  entities.push(...preferenceEntities);

  // 健康
  const healthEntities = extractHealthEntities(correctedText);
  entities.push(...healthEntities);

  // 建议
  const suggestionEntities = extractSuggestionEntities(correctedText);
  entities.push(...suggestionEntities);

  // 组织
  const organizationEntities = extractOrganizationEntities(correctedText);
  entities.push(...organizationEntities);

  // 3. 提取实体关系
  const relations = extractEntityRelations(entities);

  // 4. 生成待办
  const actionItems = generateActionItems(entities, correctedText);

  // 5. 生成摘要
  const summary = generateSummary(entities, correctedText);

  console.log('[EnhancedEntityExtractor] Extraction complete:', {
    entityCount: entities.length,
    relationCount: relations.length,
    actionItemCount: actionItems.length,
    correctionCount: corrections.length,
  });

  return {
    entities,
    relations,
    summary,
    actionItems,
    suggestions: suggestionEntities,
  };
};

export default extractEnhancedEntities;

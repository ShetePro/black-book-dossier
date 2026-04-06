import { ExtractedEntity, ActionItem } from '@/types';

interface ExtractionResult {
  entities: ExtractedEntity[];
  actionItems: ActionItem[];
  contactName?: string;
}

/**
 * 使用静态正则提取实体
 */
export const extractEntities = async (text: string): Promise<ExtractionResult> => {
  const entities: ExtractedEntity[] = [];
  const actionItems: ActionItem[] = [];
  
  // 提取人物（2-4个中文字符）
  const namePattern = /[\u4e00-\u9fa5]{2,4}/g;
  let match;
  const foundNames = new Set<string>();
  
  while ((match = namePattern.exec(text)) !== null) {
    const name = match[0];
    // 过滤常见非人名词
    const nonNames = ['今天', '明天', '后天', '昨天', '一起', '然后', '但是', '因为', '所以'];
    if (!foundNames.has(name) && !nonNames.includes(name) && name.length >= 2 && name.length <= 4) {
      foundNames.add(name);
      entities.push({
        type: 'person',
        value: name,
        confidence: 0.7,
        context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
      });
    }
  }
  
  // 提取时间
  const datePattern = /(今天|明天|后天|昨天|下周|上周|\d{1,2}月\d{1,2}日?|\d{4}年)/g;
  while ((match = datePattern.exec(text)) !== null) {
    entities.push({
      type: 'date',
      value: match[1],
      confidence: 0.85,
      context: text,
    });
  }
  
  // 提取地点
  const locationPatterns = [
    /(在|去|到|于)([\u4e00-\u9fa5]{2,10})(?:的|里|处|)/,
    /([\u4e00-\u9fa5]+)(?:咖啡厅|餐厅|公司|家里|办公室|酒店|银行|医院|学校)/,
  ];
  
  for (const pattern of locationPatterns) {
    const locMatch = text.match(pattern);
    if (locMatch) {
      const location = locMatch[2] || locMatch[1];
      if (location && location.length >= 2) {
        entities.push({
          type: 'location',
          value: location,
          confidence: 0.75,
          context: text,
        });
        break;
      }
    }
  }
  
  // 提取活动/事件
  const activityPatterns = [
    /(一起|去|来)([\u4e00-\u9fa5]{2,8})(?:了|过|的)?/,
    /([\u4e00-\u9fa5]{2,6})(?:代码|项目|会议|吃饭|咖啡|茶|运动|旅游)/,
  ];
  
  for (const pattern of activityPatterns) {
    const actMatch = text.match(pattern);
    if (actMatch) {
      const activity = actMatch[2] || actMatch[1];
      if (activity && activity.length >= 2) {
        entities.push({
          type: 'event',
          value: activity,
          confidence: 0.8,
          context: text,
        });
        break;
      }
    }
  }
  
  const personEntities = entities.filter((e) => e.type === 'person');
  const contactName = personEntities[0]?.value;
  
  return {
    entities,
    actionItems,
    contactName,
  };
};

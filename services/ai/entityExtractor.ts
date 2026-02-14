import { ExtractedEntity, ActionItem } from '@/types';

interface ExtractionResult {
  entities: ExtractedEntity[];
  actionItems: ActionItem[];
  contactName?: string;
}

export const extractEntities = async (text: string): Promise<ExtractionResult> => {
  const entities: ExtractedEntity[] = [];
  const actionItems: ActionItem[] = [];
  
  const namePattern = /([老王|老李|老张|老刘|老陈|老杨|老赵|老黄|老周|老吴|老徐|老孙|老朱|老高|老林|老何])([^，。,.\s]{1,2})/g;
  let match;
  while ((match = namePattern.exec(text)) !== null) {
    entities.push({
      type: 'person',
      value: match[0],
      confidence: 0.8,
      context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
    });
  }
  
  const healthPatterns = [
    { pattern: /(痛风|高血压|糖尿病|心脏病|胃病|腰痛|颈椎)/g, type: 'health_issue' },
    { pattern: /(生病|不舒服|住院|看病|吃药|治疗)/g, type: 'health_issue' },
  ];
  
  healthPatterns.forEach(({ pattern, type }) => {
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: type as any,
        value: match[1] || match[0],
        confidence: 0.75,
        context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
      });
    }
  });
  
  const locationPatterns = [
    /(北京|上海|广州|深圳|杭州|成都|伦敦|纽约|东京|新加坡|香港|台湾)/g,
    /(\w+)(?:市|省|国|岛)/g,
  ];
  
  locationPatterns.forEach((pattern) => {
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'location',
        value: match[1] || match[0],
        confidence: 0.7,
        context: text.substring(Math.max(0, match.index - 5), match.index + match[0].length + 5),
      });
    }
  });
  
  const needPatterns = [
    /找(.+?)(?:药|公寓|房子|工作|机会|资源)/g,
    /需要(.+?)(?:帮忙|协助|支持)/g,
    /想(?:要|找)(.+?)(?:的|了)/g,
  ];
  
  needPatterns.forEach((pattern) => {
    while ((match = pattern.exec(text)) !== null) {
      const need = match[1]?.trim();
      if (need && need.length < 20) {
        entities.push({
          type: 'need',
          value: need,
          confidence: 0.65,
          context: text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10),
        });
        
        actionItems.push({
          id: generateId(),
          description: `协助寻找：${need}`,
          completed: false,
          priority: 'medium',
          createdAt: Date.now(),
        });
      }
    }
  });
  
  const familyPatterns = [
    { pattern: /(女儿|儿子|妻子|丈夫|父亲|母亲|老婆|老公)(.{1,10}?)(?:去|在|要)/g, type: 'event' },
  ];
  
  familyPatterns.forEach(({ pattern, type }) => {
    while ((match = pattern.exec(text)) !== null) {
      const relation = match[1];
      const context = match[2];
      
      entities.push({
        type: 'person',
        value: `${relation}`,
        confidence: 0.7,
        context: text.substring(Math.max(0, match.index - 5), match.index + match[0].length + 20),
      });
      
      if (context.includes('读研') || context.includes('读书') || context.includes('学校')) {
        entities.push({
          type: 'event',
          value: `${relation}求学`,
          confidence: 0.75,
          context: text.substring(Math.max(0, match.index - 5), match.index + match[0].length + 20),
        });
      }
    }
  });
  
  const preferencePatterns = [
    /(?:喜欢|爱|偏好|只)(.+?)(?:的|了|。)/g,
    /(?:不喝|不吃|不用)(.+?)(?:，|。|；)/g,
  ];
  
  preferencePatterns.forEach((pattern) => {
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'preference',
        value: match[1]?.trim(),
        confidence: 0.6,
        context: text.substring(Math.max(0, match.index - 5), match.index + match[0].length + 5),
      });
    }
  });
  
  const datePatterns = [
    /(下(?:个)?月|明[天年]|今[天年]|后[天]|\d{1,2}月|\d{1,2}号)/g,
  ];
  
  datePatterns.forEach((pattern) => {
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        type: 'date',
        value: match[1],
        confidence: 0.7,
        context: text.substring(Math.max(0, match.index - 5), match.index + match[0].length + 5),
      });
    }
  });
  
  const personEntities = entities.filter((e) => e.type === 'person');
  const contactName = personEntities[0]?.value;
  
  return {
    entities,
    actionItems,
    contactName,
  };
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

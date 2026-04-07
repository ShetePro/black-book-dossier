import { tools, ToolDefinition } from './tools';
import { DormantContact } from '@/types/database';

export interface ParsedQuery {
  intent: string;
  toolName: string;
  parameters: Record<string, unknown>;
  confidence: number;
  originalQuestion: string;
}

export interface IntentPattern {
  intent: string;
  toolName: string;
  patterns: RegExp[];
  parameterExtractors: Record<string, (match: RegExpMatchArray, question: string) => unknown>;
  confidence: number;
}

const intentPatterns: IntentPattern[] = [
  {
    intent: 'count_contacts_by_activity',
    toolName: 'query_contact_activity_stats',
    patterns: [
      /(?:有多少|几个).*(?:人|联系人).*(?:打过|参与|参加|喜欢|玩|做).*(篮球|足球|羽毛球|乒乓球|网球|爬山|徒步|游泳|跑步|健身|电影|吃饭|聚餐|咖啡|会议|见面)/i,
      /(?:篮球|足球|羽毛球|乒乓球|网球|爬山|徒步|游泳|跑步|健身|电影|吃饭|聚餐|咖啡|会议|见面).*(?:有多少|几个).*(?:人|联系人)/i,
      /谁.*(?:和我|一起).*(?:打过|参与|参加|喜欢|玩|做).*(篮球|足球|羽毛球|乒乓球|网球|爬山|徒步|游泳|跑步|健身|电影|吃饭|聚餐|咖啡|会议|见面)/i,
    ],
    parameterExtractors: {
      activityTypes: (match, question) => {
        const activityMap: Record<string, string> = {
          '篮球': 'basketball',
          '足球': 'football',
          '羽毛球': 'badminton',
          '乒乓球': 'pingpong',
          '网球': 'tennis',
          '爬山': 'hiking',
          '徒步': 'hiking',
          '游泳': 'swimming',
          '跑步': 'running',
          '健身': 'fitness',
          '电影': 'movie',
          '吃饭': 'dinner',
          '聚餐': 'dinner',
          '咖啡': 'coffee',
          '会议': 'meeting',
          '见面': 'meeting',
        };

        for (const [cn, en] of Object.entries(activityMap)) {
          if (question.includes(cn)) {
            return [en];
          }
        }
        return ['unknown'];
      },
      queryType: () => 'both',
    },
    confidence: 0.9,
  },

  {
    intent: 'list_contacts_by_activity',
    toolName: 'query_contact_activity_stats',
    patterns: [
      /(?:列出|看看|给我|显示).*(?:谁|哪些人|联系人).*(?:打过|参与|参加|喜欢|玩|做).*(篮球|足球|羽毛球|乒乓球|网球|爬山|徒步|游泳|跑步|健身|电影|吃饭|聚餐|咖啡|会议|见面)/i,
      /(?:篮球|足球|羽毛球|乒乓球|网球|爬山|徒步|游泳|跑步|健身|电影|吃饭|聚餐|咖啡|会议|见面).*(?:和谁|和谁一起|有哪些人)/i,
    ],
    parameterExtractors: {
      activityTypes: (match, question) => {
        const activityMap: Record<string, string> = {
          '篮球': 'basketball',
          '足球': 'football',
          '羽毛球': 'badminton',
          '乒乓球': 'pingpong',
          '网球': 'tennis',
          '爬山': 'hiking',
          '徒步': 'hiking',
          '游泳': 'swimming',
          '跑步': 'running',
          '健身': 'fitness',
          '电影': 'movie',
          '吃饭': 'dinner',
          '聚餐': 'dinner',
          '咖啡': 'coffee',
          '会议': 'meeting',
          '见面': 'meeting',
        };

        for (const [cn, en] of Object.entries(activityMap)) {
          if (question.includes(cn)) {
            return [en];
          }
        }
        return ['unknown'];
      },
      queryType: () => 'list',
    },
    confidence: 0.85,
  },

  {
    intent: 'query_dormant_contacts',
    toolName: 'query_dormant_contacts',
    patterns: [
      /(?:多久|多长时间).*(?:没联系|没有联系|没见面|没见过)/i,
      /(?:哪些|谁).*(?:很久|长时间|长期).*(?:没联系|没有联系|没见面)/i,
      /(?:休眠|沉睡|冷淡).*(?:关系|联系人)/i,
      /(?:超过|大于|多于).*(\d+).*(?:天|个月|年).*(?:没联系|没有联系)/i,
      /(?:3个月|三个月|半年|6个月|一年|1年).*(?:没联系|没有联系)/i,
    ],
    parameterExtractors: {
      daysThreshold: (match, question) => {
        if (question.includes('3个月') || question.includes('三个月')) return 90;
        if (question.includes('半年') || question.includes('6个月')) return 180;
        if (question.includes('一年') || question.includes('1年')) return 365;

        const dayMatch = question.match(/(\d+)\s*(?:天|个月|年)/);
        if (dayMatch) {
          const num = parseInt(dayMatch[1]);
          if (question.includes('年')) return num * 365;
          if (question.includes('个月')) return num * 30;
          return num;
        }

        return 90;
      },
      limit: () => 20,
    },
    confidence: 0.88,
  },

  {
    intent: 'query_activity_history',
    toolName: 'query_activity_history',
    patterns: [
      /(?:我和|跟|与).*(.+?).*(?:最近|上次|之前|以前).*(?:活动|见面|吃饭|打球|做什么)/i,
      /(?:最近|上次|之前|以前).*(?:和|跟|与).*(.+?).*(?:活动|见面|吃饭|打球|做什么)/i,
      /(?:查看|看看|给我).*(.+?).*(?:活动|历史|记录)/i,
    ],
    parameterExtractors: {
      contactName: (match, question) => {
        const nameMatch = question.match(/(?:我和|跟|与|和|跟|与)\s*([^\s]+?)(?:\s|$)/);
        return nameMatch ? nameMatch[1].trim() : '';
      },
      limit: () => 10,
    },
    confidence: 0.82,
  },

  {
    intent: 'get_statistics',
    toolName: 'get_activity_statistics',
    patterns: [
      /(?:统计|数据|分析|报告).*(?:活动|运动|社交)/i,
      /(?:多少|几个).*(?:活动|记录)/i,
      /(?:活动|运动).*(?:统计|数据)/i,
    ],
    parameterExtractors: {},
    confidence: 0.8,
  },
];

export class NLPProcessor {
  parseQuestion(question: string): ParsedQuery | null {
    const normalizedQuestion = question.toLowerCase().trim();

    for (const pattern of intentPatterns) {
      for (const regex of pattern.patterns) {
        const match = normalizedQuestion.match(regex);
        if (match) {
          const parameters: Record<string, unknown> = {};

          for (const [key, extractor] of Object.entries(pattern.parameterExtractors)) {
            parameters[key] = extractor(match, normalizedQuestion);
          }

          return {
            intent: pattern.intent,
            toolName: pattern.toolName,
            parameters,
            confidence: pattern.confidence,
            originalQuestion: question,
          };
        }
      }
    }

    return null;
  }

  async parseWithLLM(question: string, llmCallback: (prompt: string) => Promise<string>): Promise<ParsedQuery | null> {
    const toolDescriptions = Object.values(tools).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));

    const prompt = `You are a natural language parser for a social activity tracking app.

Available tools:
${JSON.stringify(toolDescriptions, null, 2)}

User question: "${question}"

Parse this question and return a JSON object with:
- toolName: the name of the tool to use
- parameters: the parameters to pass to the tool
- confidence: a number between 0 and 1 indicating your confidence

Return ONLY the JSON object, no other text.`;

    try {
      const response = await llmCallback(prompt);
      const parsed = JSON.parse(response);

      if (parsed.toolName && tools[parsed.toolName]) {
        return {
          intent: 'llm_parsed',
          toolName: parsed.toolName,
          parameters: parsed.parameters || {},
          confidence: parsed.confidence || 0.7,
          originalQuestion: question,
        };
      }
    } catch {
      // LLM parsing failed, fall back to null
    }

    return null;
  }

  generateResponse(query: ParsedQuery, result: unknown): string {
    const data = result as any;

    switch (query.intent) {
      case 'count_contacts_by_activity':
      case 'list_contacts_by_activity': {
        const activityTypes = query.parameters.activityTypes as string[];
        const activityTypeStr = activityTypes.join('、');

        if (data.count === 0) {
          return `没有找到参与${activityTypeStr}的联系人。`;
        }

        if (data.contacts && data.contacts.length > 0) {
          const contactNames = data.contacts.map((c: any) => c.contactName).join('、');
          return `有 ${data.count} 个人参与过${activityTypeStr}：${contactNames}`;
        }

        return `有 ${data.count} 个人参与过${activityTypeStr}。`;
      }

      case 'query_dormant_contacts': {
        const days = query.parameters.daysThreshold as number;

        if (data.count === 0) {
          return `没有超过 ${days} 天未联系的联系人，继续保持！`;
        }

        const contactList = data.contacts
          .slice(0, 5)
          .map((c: DormantContact) => `${c.contactName}(${c.daysSinceLastInteraction}天)`)
          .join('、');

        const more = data.count > 5 ? ` 等共 ${data.count} 人` : '';
        return `超过 ${days} 天未联系的联系人：${contactList}${more}。建议尽快联系维护关系。`;
      }

      case 'query_activity_history': {
        if (data.count === 0) {
          return `没有找到与 ${data.contactName} 的活动记录。`;
        }

        const activities = data.activities
          .slice(0, 3)
          .map((a: any) => {
            const date = new Date(a.startedAt).toLocaleDateString('zh-CN');
            return `${date} ${a.title}`;
          })
          .join('；');

        const more = data.count > 3 ? ` 等共 ${data.count} 次活动` : '';
        return `与 ${data.contactName} 的最近活动：${activities}${more}。`;
      }

      case 'get_statistics': {
        return `活动统计：共 ${data.totalCount} 次活动。`;
      }

      default:
        return `查询完成。`;
    }
  }
}

export const nlpProcessor = new NLPProcessor();

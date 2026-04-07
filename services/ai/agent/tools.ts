import * as SQLite from 'expo-sqlite';
import { getDatabase } from '@/db/operations';
import { getActivitiesByContact, getActivityStats } from '@/services/db/activities';
import { getParticipantsWithContactInfo } from '@/services/db/activityParticipants';
import { getDormantContacts, getContactsByActivityType, getActivityCountByContact } from '@/services/db/contactQueries';
import { Activity, DormantContact } from '@/types/database';

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
  properties?: Record<string, ToolParameter>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  sql?: string;
}

export const tools: Record<string, ToolDefinition> = {
  query_contact_activity_stats: {
    name: 'query_contact_activity_stats',
    description: '统计与特定活动类型相关的联系人数量或列表',
    parameters: {
      type: 'object',
      properties: {
        activityTypes: {
          type: 'array',
          items: { type: 'string' },
          description: '活动类型列表，如 ["basketball", "hiking"]',
        },
        queryType: {
          type: 'string',
          enum: ['count', 'list', 'both'],
          description: '查询类型：统计数量、列出名单、或两者都要',
        },
        timeRange: {
          type: 'object',
          description: '时间范围筛选',
          properties: {
            start: { type: 'string', description: '开始时间 ISO 格式' },
            end: { type: 'string', description: '结束时间 ISO 格式' },
          },
        },
      },
      required: ['activityTypes', 'queryType'],
    },
  },

  query_dormant_contacts: {
    name: 'query_dormant_contacts',
    description: '找出超过指定时间未联系的人',
    parameters: {
      type: 'object',
      properties: {
        daysThreshold: {
          type: 'number',
          description: '未联系天数阈值',
        },
        limit: {
          type: 'number',
          description: '返回结果数量限制',
        },
        orderBy: {
          type: 'string',
          enum: ['last_interaction_desc', 'last_interaction_asc'],
          description: '排序方式',
        },
      },
      required: ['daysThreshold'],
    },
  },

  query_activity_history: {
    name: 'query_activity_history',
    description: '查询与特定联系人的活动历史',
    parameters: {
      type: 'object',
      properties: {
        contactName: {
          type: 'string',
          description: '联系人姓名（支持模糊匹配）',
        },
        activityTypes: {
          type: 'array',
          items: { type: 'string' },
          description: '筛选特定活动类型',
        },
        limit: {
          type: 'number',
          description: '返回结果数量限制',
        },
      },
      required: ['contactName'],
    },
  },

  query_activity_details: {
    name: 'query_activity_details',
    description: '查询特定活动的详细信息，包括所有参与者',
    parameters: {
      type: 'object',
      properties: {
        activityId: {
          type: 'string',
          description: '活动ID',
        },
      },
      required: ['activityId'],
    },
  },

  get_activity_statistics: {
    name: 'get_activity_statistics',
    description: '获取活动统计数据，包括总数、按类型分布、按月分布等',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: '用户ID（可选）',
        },
      },
      required: [],
    },
  },
};

export class AgentTools {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await getDatabase();
  }

  async executeTool(toolName: string, params: Record<string, unknown>): Promise<ToolResult> {
    if (!this.db) {
      await this.init();
    }

    try {
      switch (toolName) {
        case 'query_contact_activity_stats':
          return await this.queryContactActivityStats(params);
        case 'query_dormant_contacts':
          return await this.queryDormantContacts(params);
        case 'query_activity_history':
          return await this.queryActivityHistory(params);
        case 'query_activity_details':
          return await this.queryActivityDetails(params);
        case 'get_activity_statistics':
          return await this.getActivityStatistics(params);
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async queryContactActivityStats(params: Record<string, unknown>): Promise<ToolResult> {
    const activityTypes = params.activityTypes as string[];
    const queryType = params.queryType as 'count' | 'list' | 'both';

    if (!this.db) throw new Error('Database not initialized');

    const contacts = await getContactsByActivityType(this.db, activityTypes);

    let result: unknown;

    if (queryType === 'count') {
      result = { count: contacts.length };
    } else if (queryType === 'list') {
      result = { contacts };
    } else {
      result = {
        count: contacts.length,
        contacts,
      };
    }

    return {
      success: true,
      data: result,
      sql: `SELECT c.id, c.name, COUNT(*) as count FROM contacts c JOIN activity_participants ap ON c.id = ap.contact_id JOIN activities a ON ap.activity_id = a.id WHERE a.activity_type IN (${activityTypes.map(() => '?').join(',')}) GROUP BY c.id`,
    };
  }

  private async queryDormantContacts(params: Record<string, unknown>): Promise<ToolResult> {
    const daysThreshold = (params.daysThreshold as number) || 90;
    const limit = (params.limit as number) || 20;

    if (!this.db) throw new Error('Database not initialized');

    const contacts = await getDormantContacts(this.db, daysThreshold, limit);

    return {
      success: true,
      data: {
        count: contacts.length,
        contacts,
        threshold: daysThreshold,
      },
      sql: `SELECT c.id, c.name, c.last_interaction_at FROM contacts c WHERE c.last_interaction_at < ${Date.now() - daysThreshold * 24 * 60 * 60 * 1000} ORDER BY c.last_interaction_at ASC LIMIT ${limit}`,
    };
  }

  private async queryActivityHistory(params: Record<string, unknown>): Promise<ToolResult> {
    const contactName = params.contactName as string;
    const activityTypes = params.activityTypes as string[] | undefined;
    const limit = (params.limit as number) || 10;

    if (!this.db) throw new Error('Database not initialized');

    const contactRow = await this.db.getFirstAsync<{ id: string; name: string }>(
      'SELECT id, name FROM contacts WHERE name LIKE ? LIMIT 1',
      [`%${contactName}%`]
    );

    if (!contactRow) {
      return {
        success: true,
        data: {
          contactName,
          activities: [],
          message: `未找到联系人: ${contactName}`,
        },
      };
    }

    let activities = await getActivitiesByContact(this.db, contactRow.id, limit);

    if (activityTypes && activityTypes.length > 0) {
      activities = activities.filter(a => activityTypes.includes(a.activityType));
    }

    const activitiesWithParticipants = await Promise.all(
      activities.map(async (activity) => {
        const participants = await getParticipantsWithContactInfo(this.db!, activity.id);
        return {
          ...activity,
          participants: participants.map(p => p.contactName),
        };
      })
    );

    return {
      success: true,
      data: {
        contactId: contactRow.id,
        contactName: contactRow.name,
        activities: activitiesWithParticipants,
        count: activitiesWithParticipants.length,
      },
      sql: `SELECT a.* FROM activities a JOIN activity_participants ap ON a.id = ap.activity_id JOIN contacts c ON ap.contact_id = c.id WHERE c.name LIKE '%${contactName}%' ORDER BY a.started_at DESC LIMIT ${limit}`,
    };
  }

  private async queryActivityDetails(params: Record<string, unknown>): Promise<ToolResult> {
    const activityId = params.activityId as string;

    if (!this.db) throw new Error('Database not initialized');

    const { getActivityWithParticipants } = await import('@/services/db/activities');
    const activity = await getActivityWithParticipants(this.db, activityId);

    if (!activity) {
      return {
        success: false,
        error: `Activity not found: ${activityId}`,
      };
    }

    return {
      success: true,
      data: activity,
    };
  }

  private async getActivityStatistics(params: Record<string, unknown>): Promise<ToolResult> {
    const userId = params.userId as string | undefined;

    if (!this.db) throw new Error('Database not initialized');

    const stats = await getActivityStats(this.db, userId);

    return {
      success: true,
      data: stats,
    };
  }
}

export const agentTools = new AgentTools();

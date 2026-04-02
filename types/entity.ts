/**
 * 增强型实体类型定义
 * 支持多维度信息提取：时间、地点、对象、事件、特征、建议
 */

// 基础置信度类型
export interface ConfidenceScore {
  score: number; // 0-1
  level: 'high' | 'medium' | 'low';
  reason?: string; // 置信度说明
}

// 时间维度
export interface TimeEntity {
  type: 'time';
  subtype: 'specific' | 'relative' | 'duration' | 'recurring' | 'period';
  value: string; // 原始文本
  normalized: {
    timestamp?: number; // Unix timestamp (if specific)
    dateRange?: { start: number; end: number }; // 时间段
    recurrence?: string; // 重复模式 (e.g., "weekly", "monthly")
    timezone?: string;
  };
  confidence: ConfidenceScore;
  context: string;
}

// 地点维度
export interface LocationEntity {
  type: 'location';
  subtype: 'city' | 'venue' | 'address' | 'region' | 'online';
  value: string;
  normalized: {
    city?: string;
    venue?: string; // 具体场所名
    address?: string;
    coordinates?: { lat: number; lng: number };
    isOnline?: boolean;
    platform?: string; // 线上平台 (微信, Zoom, etc.)
  };
  confidence: ConfidenceScore;
  context: string;
}

// 人物/对象维度
export interface PersonEntity {
  type: 'person';
  subtype: 'contact' | 'family' | 'colleague' | 'other';
  value: string; // 姓名
  normalized: {
    name: string;
    title?: string; // 职位/头衔
    company?: string;
    relation?: string; // 与当前联系人的关系
    role?: string; // 在对话中的角色
    contactId?: string; // 匹配到的联系人ID
    attributes?: PersonAttribute[];
  };
  confidence: ConfidenceScore;
  context: string;
}

export interface PersonAttribute {
  category: 'personality' | 'capability' | 'status' | 'preference';
  value: string;
  evidence: string; // 原文证据
}

// 事件维度
export interface EventEntity {
  type: 'event';
  subtype: 'meeting' | 'activity' | 'milestone' | 'issue' | 'opportunity';
  value: string;
  normalized: {
    eventType: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
    outcome?: string;
    relatedPeople?: string[];
    relatedTime?: string;
    relatedLocation?: string;
  };
  confidence: ConfidenceScore;
  context: string;
}

// 需求/意图维度
export interface NeedEntity {
  type: 'need';
  subtype: 'explicit' | 'implicit' | 'urgent' | 'longterm';
  value: string;
  normalized: {
    category: 'resource' | 'connection' | 'info' | 'help' | 'opportunity';
    urgency: 'immediate' | 'shortterm' | 'longterm';
    description: string;
    relatedTo?: string[]; // 相关人物
  };
  confidence: ConfidenceScore;
  context: string;
}

// 偏好/禁忌维度
export interface PreferenceEntity {
  type: 'preference';
  subtype: 'like' | 'dislike' | 'taboo' | 'habit';
  value: string;
  normalized: {
    category: 'food' | 'drink' | 'activity' | 'topic' | 'communication' | 'gift';
    sentiment: 'positive' | 'negative' | 'neutral';
    intensity: 'strong' | 'moderate' | 'mild';
  };
  confidence: ConfidenceScore;
  context: string;
}

// 健康状况维度
export interface HealthEntity {
  type: 'health';
  subtype: 'condition' | 'medication' | 'allergy' | 'lifestyle';
  value: string;
  normalized: {
    condition?: string;
    severity?: 'critical' | 'moderate' | 'mild';
    isOngoing: boolean;
    relatedRestrictions?: string[];
  };
  confidence: ConfidenceScore;
  context: string;
}

// 建议/推荐维度
export interface SuggestionEntity {
  type: 'suggestion';
  subtype: 'recommendation' | 'action' | 'strategy' | 'warning';
  value: string;
  normalized: {
    category: 'gift' | 'approach' | 'timing' | 'resource' | 'followup';
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    relatedTo?: string[]; // 相关人物或事件
    expectedOutcome?: string;
  };
  confidence: ConfidenceScore;
  context: string;
}

// 组织/公司维度
export interface OrganizationEntity {
  type: 'organization';
  subtype: 'company' | 'institution' | 'group' | 'department';
  value: string;
  normalized: {
    name: string;
    industry?: string;
    size?: string;
    relation?: string; // 与当前联系人的关系
  };
  confidence: ConfidenceScore;
  context: string;
}

// 通用增强实体
export type EnhancedEntity =
  | TimeEntity
  | LocationEntity
  | PersonEntity
  | EventEntity
  | NeedEntity
  | PreferenceEntity
  | HealthEntity
  | SuggestionEntity
  | OrganizationEntity;

// 实体关系
export interface EntityRelation {
  source: string; // entity id or value
  target: string;
  relationType: 'temporal' | 'spatial' | 'social' | 'causal' | 'topical';
  description: string;
  confidence: number;
}

// 分析结果
export interface EnhancedAnalysisResult {
  entities: EnhancedEntity[];
  relations: EntityRelation[];
  summary: {
    mainTopic: string;
    keyPoints: string[];
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    urgency: 'high' | 'medium' | 'low';
  };
  actionItems: EnhancedActionItem[];
  suggestions: SuggestionEntity[];
}

// 增强型待办事项
export interface EnhancedActionItem {
  id: string;
  description: string;
  category: 'followup' | 'task' | 'reminder' | 'gift' | 'intro';
  priority: 'critical' | 'high' | 'medium' | 'low';
  deadline?: number;
  relatedEntities: string[]; // 相关实体引用
  completed: boolean;
  createdAt: number;
}

// 语音识别修正建议
export interface TranscriptionCorrection {
  original: string;
  suggestion: string;
  confidence: number;
  reason: string; // 修正原因（如：匹配到联系人）
  source: 'contact_match' | 'context_analysis' | 'dictionary';
}

// 联系人匹配上下文
export interface ContactMatchContext {
  contactId: string;
  name: string;
  company?: string;
  title?: string;
  relation?: string;
  relevanceScore: number;
  matchedFields: string[];
}

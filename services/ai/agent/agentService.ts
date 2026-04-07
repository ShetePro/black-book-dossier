import { agentTools, ToolResult } from './tools';
import { nlpProcessor, ParsedQuery } from './nlpProcessor';
import { isModelDownloaded, getCurrentModelId } from '@/services/ai/llmModelManager';
import llmInference from '@/services/ai/llmInference';

export interface AgentQueryRequest {
  question: string;
  useLLM?: boolean;
  context?: Record<string, unknown>;
}

export interface AgentQueryResponse {
  success: boolean;
  answer: string;
  data?: unknown;
  toolUsed?: string;
  confidence: number;
  sql?: string;
  processingTime: number;
  error?: string;
}

export interface QueryHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  success: boolean;
}

export class AgentService {
  private queryHistory: QueryHistoryItem[] = [];
  private maxHistorySize = 50;

  async query(request: AgentQueryRequest): Promise<AgentQueryResponse> {
    const startTime = Date.now();

    try {
      await agentTools.init();

      let parsedQuery: ParsedQuery | null = null;

      if (request.useLLM) {
        const modelId = await getCurrentModelId();
        if (modelId && await isModelDownloaded(modelId)) {
          parsedQuery = await nlpProcessor.parseWithLLM(
            request.question,
            async (prompt) => {
              return await llmInference.quickCorrect(prompt);
            }
          );
        }
      }

      if (!parsedQuery) {
        parsedQuery = nlpProcessor.parseQuestion(request.question);
      }

      if (!parsedQuery) {
        const response: AgentQueryResponse = {
          success: false,
          answer: '抱歉，我不太理解您的问题。您可以尝试问：\n- "有多少人和我打过篮球？"\n- "哪些联系人超过3个月没联系了？"\n- "我和张三最近的活动"',
          confidence: 0,
          processingTime: Date.now() - startTime,
        };
        this.addToHistory(request.question, response.answer, false);
        return response;
      }

      const toolResult = await agentTools.executeTool(
        parsedQuery.toolName,
        parsedQuery.parameters
      );

      if (!toolResult.success) {
        const response: AgentQueryResponse = {
          success: false,
          answer: `查询失败：${toolResult.error}`,
          toolUsed: parsedQuery.toolName,
          confidence: parsedQuery.confidence,
          sql: toolResult.sql,
          processingTime: Date.now() - startTime,
        };
        this.addToHistory(request.question, response.answer, false);
        return response;
      }

      const answer = nlpProcessor.generateResponse(parsedQuery, toolResult.data);

      const response: AgentQueryResponse = {
        success: true,
        answer,
        data: toolResult.data,
        toolUsed: parsedQuery.toolName,
        confidence: parsedQuery.confidence,
        sql: toolResult.sql,
        processingTime: Date.now() - startTime,
      };

      this.addToHistory(request.question, answer, true);
      return response;
    } catch (error) {
      const response: AgentQueryResponse = {
        success: false,
        answer: '查询过程中出现错误，请稍后重试。',
        confidence: 0,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.addToHistory(request.question, response.answer, false);
      return response;
    }
  }

  async queryBatch(questions: string[]): Promise<AgentQueryResponse[]> {
    const responses: AgentQueryResponse[] = [];

    for (const question of questions) {
      const response = await this.query({ question });
      responses.push(response);
    }

    return responses;
  }

  async queryWithSuggestions(question: string): Promise<{
    response: AgentQueryResponse;
    suggestions: string[];
  }> {
    const response = await this.query({ question });

    const suggestions = this.generateSuggestions(question, response);

    return {
      response,
      suggestions,
    };
  }

  private generateSuggestions(
    question: string,
    response: AgentQueryResponse
  ): string[] {
    const suggestions: string[] = [];

    if (response.toolUsed === 'query_contact_activity_stats') {
      suggestions.push('查看这些联系人的详细信息');
      suggestions.push('我和他们最近的活动');
    } else if (response.toolUsed === 'query_dormant_contacts') {
      suggestions.push('查看这些联系人的联系方式');
      suggestions.push('我和他们上次见面是什么时候');
    } else if (response.toolUsed === 'query_activity_history') {
      suggestions.push('查看活动详情');
      suggestions.push('还有哪些人参加了');
    }

    suggestions.push('活动统计概览');
    suggestions.push('还有哪些人超过90天没联系');

    return suggestions.slice(0, 3);
  }

  private addToHistory(question: string, answer: string, success: boolean): void {
    const historyItem: QueryHistoryItem = {
      id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question,
      answer,
      timestamp: Date.now(),
      success,
    };

    this.queryHistory.unshift(historyItem);

    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(0, this.maxHistorySize);
    }
  }

  getQueryHistory(limit: number = 10): QueryHistoryItem[] {
    return this.queryHistory.slice(0, limit);
  }

  clearHistory(): void {
    this.queryHistory = [];
  }

  getQuickQueries(): string[] {
    return [
      '有多少人和我打过篮球？',
      '哪些联系人超过3个月没联系了？',
      '我和张三最近的活动',
      '活动统计',
      '谁和我最常一起吃饭？',
    ];
  }
}

export const agentService = new AgentService();

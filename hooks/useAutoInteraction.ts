import { useCallback } from 'react';
import { Contact, Interaction } from '@/types';
import { SmartAnalysisResult } from '@/services/ai/smartAnalyzer';
import { useInteractionStore } from '@/store/interactions/interactionStore';

export interface AutoInteractionResult {
  success: boolean;
  interaction?: Interaction;
  error?: string;
}

export const useAutoInteraction = () => {
  const { addInteraction } = useInteractionStore();

  const createInteractionFromVoice = useCallback(async (
    analysisResult: SmartAnalysisResult,
    matchedContact: Contact,
    originalText: string
  ): Promise<AutoInteractionResult> => {
    try {
      // 构建交往记录
      const interactionData = {
        contactId: matchedContact.id,
        type: analysisResult.eventType,
        content: analysisResult.eventDescription,
        date: analysisResult.date,
        time: analysisResult.time,
        location: analysisResult.location,
        metadata: {
          extractedFromVoice: true,
          originalText,
          confidence: analysisResult.confidence,
          participants: analysisResult.participants,
        },
      };

      // 保存到数据库
      const interaction = await addInteraction(interactionData);

      return {
        success: true,
        interaction,
      };
    } catch (error) {
      console.error('[useAutoInteraction] Error creating interaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建交往记录失败',
      };
    }
  }, [addInteraction]);

  const createInteractionFromVoiceQuick = useCallback(async (
    text: string,
    contact: Contact
  ): Promise<AutoInteractionResult> => {
    try {
      // 快速创建（简化版）
      const interactionData = {
        contactId: contact.id,
        type: 'other' as const,
        content: text,
        date: new Date().toISOString().split('T')[0],
        metadata: {
          extractedFromVoice: true,
          originalText: text,
        },
      };

      const interaction = await addInteraction(interactionData);

      return {
        success: true,
        interaction,
      };
    } catch (error) {
      console.error('[useAutoInteraction] Error creating interaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建交往记录失败',
      };
    }
  }, [addInteraction]);

  return {
    createInteractionFromVoice,
    createInteractionFromVoiceQuick,
  };
};

export default useAutoInteraction;

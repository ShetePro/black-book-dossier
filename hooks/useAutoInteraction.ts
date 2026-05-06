import { useCallback } from 'react';
import { Contact, Interaction, ExtractedEntity, ActionItem } from '@/types';
import { LLMAnalysisResult } from '@/services/ai/llmAnalyzer';
import { useInteractionStore } from '@/store/interactions/interactionStore';
import { v4 as uuidv4 } from 'uuid';

export interface AutoInteractionResult {
  success: boolean;
  interaction?: Interaction;
  error?: string;
}

export const useAutoInteraction = () => {
  const { addInteraction } = useInteractionStore();

  const createInteractionFromVoice = useCallback(async (
    analysisResult: LLMAnalysisResult,
    matchedContact: Contact,
    originalText: string
  ): Promise<AutoInteractionResult> => {
    try {
      const entities: ExtractedEntity[] = [
        ...analysisResult.entities.persons.map(p => ({ type: 'person' as const, value: p, confidence: 0.9 })),
        ...analysisResult.entities.locations.map(l => ({ type: 'location' as const, value: l, confidence: 0.85 })),
        ...analysisResult.entities.events.map(e => ({ type: 'event' as const, value: e, confidence: 0.8 })),
        ...analysisResult.entities.health.map(h => ({ type: 'health_issue' as const, value: h, confidence: 0.75 })),
        ...analysisResult.entities.needs.map(n => ({ type: 'need' as const, value: n, confidence: 0.8 })),
        ...analysisResult.entities.preferences.map(p => ({ type: 'preference' as const, value: p, confidence: 0.75 })),
      ];

      const interaction: Interaction = {
        id: uuidv4(),
        contactId: matchedContact.id,
        type: 'meeting',
        content: analysisResult.entities.events.join(', ') || originalText,
        rawTranscript: originalText,
        extractedEntities: entities,
        actionItems: [],
        date: Date.now(),
        valueExchange: 'neutral',
        createdAt: Date.now(),
      };

      await addInteraction(interaction);

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
      const interaction: Interaction = {
        id: uuidv4(),
        contactId: contact.id,
        type: 'other',
        content: text,
        rawTranscript: text,
        extractedEntities: [],
        actionItems: [],
        date: Date.now(),
        valueExchange: 'neutral',
        createdAt: Date.now(),
      };

      await addInteraction(interaction);

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

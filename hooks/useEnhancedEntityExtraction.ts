import { useCallback, useState } from 'react';
import { extractEnhancedEntities, setContactsDatabase } from '@/services/ai/enhancedEntityExtractor';
import { EnhancedAnalysisResult, TranscriptionCorrection } from '@/types/entity';
import { Contact } from '@/types';

interface UseEnhancedEntityExtractionReturn {
  analyze: (text: string, contacts: Contact[]) => Promise<EnhancedAnalysisResult>;
  isAnalyzing: boolean;
  result: EnhancedAnalysisResult | null;
  corrections: TranscriptionCorrection[];
  error: string | null;
}

export const useEnhancedEntityExtraction = (): UseEnhancedEntityExtractionReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EnhancedAnalysisResult | null>(null);
  const [corrections, setCorrections] = useState<TranscriptionCorrection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (text: string, contacts: Contact[]): Promise<EnhancedAnalysisResult> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Set contacts for name correction
      setContactsDatabase(contacts);

      // Perform enhanced extraction
      const analysisResult = await extractEnhancedEntities(text, contacts);

      // Calculate corrections
      const calculatedCorrections: TranscriptionCorrection[] = [];
      contacts.forEach((contact) => {
        const name = contact.name;
        const words = text.split(/[\s,，。！？.;:；：]+/);

        words.forEach((word) => {
          if (word.length >= 2) {
            const similarity = calculateSimilarity(word, name);
            if (similarity > 0.6 && similarity < 1) {
              calculatedCorrections.push({
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

      setCorrections(calculatedCorrections.sort((a, b) => b.confidence - a.confidence));
      setResult(analysisResult);

      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析失败';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    analyze,
    isAnalyzing,
    result,
    corrections,
    error,
  };
};

// Levenshtein distance for string similarity
function calculateSimilarity(str1: string, str2: string): number {
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
}

export default useEnhancedEntityExtraction;

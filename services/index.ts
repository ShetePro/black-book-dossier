// Transcription Services
export { 
  levenshteinDistance, 
  calculateSimilarity, 
  toPinyin, 
  calculatePinyinSimilarity,
  calculateCombinedSimilarity,
  isSimilar,
  findBestMatch,
} from './transcription/similarity';

export { 
  ContactNameMatcher, 
  getContactNameMatcher, 
  resetContactNameMatcher,
  type MatchResult,
} from './transcription/nameMatcher';

export { 
  getTranscriptionEnhancer, 
  resetTranscriptionEnhancer,
  enhanceTranscription,
  enhanceTranscriptionWithDetails,
  type EnhancementResult,
} from './transcription/postProcessor';

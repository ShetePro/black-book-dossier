import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  findMatchingContacts,
  MatchResult,
  shouldAutoSelect,
  shouldShowSuggestion,
  CONFIDENCE_THRESHOLDS,
} from '@/services/ai/contactMatcher';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useThemeColor } from '@/hooks/useThemeColor';
import { analyzeWithLLM, LLMAnalysisResult } from '@/services/ai/llmAnalyzer';
import { extractAndParseTimeFromTags, formatTimestamp } from '@/services/ai/timeParser';
import { LLMReasoningCard } from '@/components/analysis/LLMReasoningCard';
import { useAutoInteraction } from '@/hooks/useAutoInteraction';
import { AutoInteractionConfirm } from '@/components/interaction/AutoInteractionConfirm';
import { ExtractedEntity, ActionItem, Contact } from '@/types';
import { useContactStore } from '@/store';
import { useInteractionStore } from '@/store/interactions/interactionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { hasAnyModelDownloaded } from '@/services/ai/llmModelManager';
import { ContactSelectorSheet } from '@/components/contact/ContactSelectorSheet';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface AnalyzedData {
  transcription: string;
  entities: ExtractedEntity[];
  actionItems: ActionItem[];
  contactName?: string;
  summary?: string;
}

// 实体类型配置
const ENTITY_CONFIG: Record<string, { labelKey: string; icon: any; color: string; bgColor: string }> = {
  person: { labelKey: 'agentReview.entityTypes.person', icon: 'person', color: '#c9a962', bgColor: '#c9a96220' },
  health_issue: { labelKey: 'agentReview.entityTypes.health_issue', icon: 'medical', color: '#ef4444', bgColor: '#ef444420' },
  location: { labelKey: 'agentReview.entityTypes.location', icon: 'location', color: '#3b82f6', bgColor: '#3b82f620' },
  need: { labelKey: 'agentReview.entityTypes.need', icon: 'help-circle', color: '#f59e0b', bgColor: '#f59e0b20' },
  event: { labelKey: 'agentReview.entityTypes.event', icon: 'calendar', color: '#8b5cf6', bgColor: '#8b5cf620' },
  preference: { labelKey: 'agentReview.entityTypes.preference', icon: 'heart', color: '#ec4899', bgColor: '#ec489920' },
  date: { labelKey: 'agentReview.entityTypes.date', icon: 'time', color: '#10b981', bgColor: '#10b98120' },
  organization: { labelKey: 'agentReview.entityTypes.organization', icon: 'business', color: '#6366f1', bgColor: '#6366f120' },
};

export default function AgentReviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColor();
  const params = useLocalSearchParams();
  const { contacts } = useContactStore();
  const { addInteraction } = useInteractionStore();
  const { settings } = useSettingsStore();

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  const [matchedContacts, setMatchedContacts] = useState<MatchResult[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectingContactIndex, setSelectingContactIndex] = useState<number | null>(null);
  const [usingLocalLLM, setUsingLocalLLM] = useState(false);
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);

  // 智能交往记录分析状态
  // SmartAnalyzer related state removed - using LLM analyzer only
  const [llmAnalysis, setLlmAnalysis] = useState<LLMAnalysisResult | null>(null);
  const [showAutoInteractionConfirm, setShowAutoInteractionConfirm] = useState(false);
  const [isCreatingInteraction, setIsCreatingInteraction] = useState(false);
  const { createInteractionFromVoice } = useAutoInteraction();

  // 音频播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [audioLoadError, setAudioLoadError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 使用 ref 避免闭包陷阱
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const isPlayingRef = useRef(false);

  const audioUri = params.audioUri as string;
  const textInput = params.text as string;
  const inputMode = (params.mode as 'voice' | 'text') || 'voice';

  // 获取当前语言显示
  const getLanguageDisplay = () => {
    const langMap: Record<string, string> = {
      'cn': t('language.chinese'),
      'en': t('language.english'),
    };
    return langMap[settings.language] || settings.language;
  };

  const transcription = params.transcription as string || textInput;

  // 动画值
  const headerProgress = useSharedValue(0);
  const contentProgress = useSharedValue(0);

  useEffect(() => {
    analyzeTranscription();
    // 启动入场动画
    headerProgress.value = withSpring(1, { damping: 15 });
    contentProgress.value = withDelay(200, withSpring(1, { damping: 15 }));

    // 加载音频（仅语音模式）
    if (audioUri && inputMode === 'voice') {
      loadAudio();
    }
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: (1 - headerProgress.value) * -20 }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentProgress.value,
    transform: [{ translateY: (1 - contentProgress.value) * 30 }],
  }));

  const analyzeTranscription = async () => {
    try {
      setIsAnalyzing(true);

      const hasLocalModel = await hasAnyModelDownloaded();
      const useLLM = hasLocalModel && settings.ai.localModel.enabled;
      setUsingLocalLLM(useLLM);

      if (!useLLM) {
        console.warn('[AgentReview] No local LLM available, returning empty result');
        setAnalyzedData({
          transcription,
          entities: [],
          actionItems: [],
          contactName: undefined,
          summary: t('agentReview.summary.noLLM'),
        });
        setIsAnalyzing(false);
        return;
      }

      console.log('[AgentReview] Using local LLM for analysis');
      const result = await analyzeWithLocalLLM(transcription);

      setAnalyzedData({
        transcription,
        entities: result.entities,
        actionItems: result.actionItems,
        contactName: result.contactName,
        summary: generateSummary(result.entities, result.actionItems),
      });

      const localResult = result as any;
      if (localResult.matchedContacts && localResult.matchedContacts.length > 0) {
        setMatchedContacts(localResult.matchedContacts);
        if (shouldAutoSelect(localResult.matchedContacts[0].confidence)) {
          setSelectedContactId(localResult.matchedContacts[0].contact.id);
        }
      } else if (result.contactName) {
        const matches = await performContactMatching(result.contactName, result.entities);
        setMatchedContacts(matches);
        if (matches.length > 0 && shouldAutoSelect(matches[0].confidence)) {
          setSelectedContactId(matches[0].contact.id);
        }
      }

      // 3. 智能分析交往记录（已禁用，使用 LLM 分析替代）
      /*
      try {
        const smartResult = await analyzeVoiceContent(transcription, contacts);
        setSmartAnalysis(smartResult);

        // 如果置信度高且匹配到联系人，显示自动创建弹窗
        if (smartResult.confidence > 0.7 && smartResult.extractedContactName) {
          const matchedContact = contacts.find(c =>
            c.name === smartResult.extractedContactName ||
            c.name.includes(smartResult.extractedContactName!) ||
            smartResult.extractedContactName!.includes(c.name)
          );
          if (matchedContact) {
            setShowAutoInteractionConfirm(true);
          }
        }
      } catch (smartError) {
        console.error('[AgentReview] Smart analysis failed:', smartError);
      }
      */
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert(t('agentReview.analysisFailed'), t('agentReview.analysisFailedMessage'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 生成摘要
  const generateSummary = (entities: ExtractedEntity[], actionItems: ActionItem[]): string => {
    const personEntities = entities.filter(e => e.type === 'person');
    const healthIssues = entities.filter(e => e.type === 'health_issue');
    const needs = entities.filter(e => e.type === 'need');

    let summary = '';

    if (personEntities.length > 0) {
      summary += t('agentReview.summary.persons', { count: personEntities.length });
    }

    if (healthIssues.length > 0) {
      summary += summary
        ? t('agentReview.summary.healthWithPrefix', { count: healthIssues.length })
        : t('agentReview.summary.health', { count: healthIssues.length });
    }

    if (needs.length > 0) {
      summary += summary
        ? t('agentReview.summary.needsWithPrefix', { count: needs.length })
        : t('agentReview.summary.needs', { count: needs.length });
    }

    if (actionItems.length > 0) {
      summary += summary
        ? t('agentReview.summary.actionItemsWithPrefix', { count: actionItems.length })
        : t('agentReview.summary.actionItems', { count: actionItems.length });
    }

    return summary || t('agentReview.summary.default');
  };

  // 本地 LLM 分析
  const analyzeWithLocalLLM = async (text: string) => {
    console.log('[AgentReview] Using LLM analyzer for analysis');
    const result = await analyzeWithLLM(text, contacts);
    console.log(result, '大模型分析')
    setLlmAnalysis(result);

    // Convert LLM result to AnalyzedData format
    const entities: ExtractedEntity[] = [];
    const matchedContacts: MatchResult[] = [];

    // 1. 从 suggestedTags 中提取所有人名并匹配
    const personTags = [...new Set(result.suggestedTags.filter(t => !t.startsWith('time:') && !t.startsWith('location:')))];

    for (const personName of personTags) {
      // 精确匹配
      const exactMatch = contacts.find(c => c.name === personName);
      if (exactMatch) {
        entities.push({ type: 'person', value: exactMatch.name, confidence: 1.0 });
        if (!matchedContacts.find(m => m.contact.id === exactMatch.id)) {
          matchedContacts.push({ contact: exactMatch, confidence: 1.0, reason: t('agentReview.matchReasons.exact'), matchedFields: ['name'] });
        }
      } else {
        // 模糊匹配
        const fuzzyMatch = contacts.find(c => c.name.includes(personName) || personName.includes(c.name));
        if (fuzzyMatch) {
          entities.push({ type: 'person', value: fuzzyMatch.name, confidence: 0.8 });
          if (!matchedContacts.find(m => m.contact.id === fuzzyMatch.id)) {
            matchedContacts.push({ contact: fuzzyMatch, confidence: 0.8, reason: t('agentReview.matchReasons.contains'), matchedFields: ['name'] });
          }
        }
      }
    }

    // 2. 添加活动实体
    result.insights.activities.forEach(activity => {
      entities.push({
        type: 'event',
        value: activity,
        confidence: 0.8,
      });
    });

    // 3. 添加偏好实体
    result.insights.preferences.forEach(pref => {
      entities.push({
        type: 'preference',
        value: pref,
        confidence: 0.75,
      });
    });

    // 4. 添加时间和地点实体
    result.suggestedTags.forEach(tag => {
      if (tag.startsWith('time:')) {
        entities.push({
          type: 'date',
          value: tag.replace('time:', ''),
          confidence: 0.8,
        });
      } else if (tag.startsWith('location:')) {
        entities.push({
          type: 'location',
          value: tag.replace('location:', ''),
          confidence: 0.8,
        });
      }
    });

    return {
      entities,
      actionItems: [],
      contactName: matchedContacts.length > 0 ? matchedContacts[0].contact.name : undefined,
      matchedContacts,
    };
  };

  // 使用新的 AI 联系人匹配服务进行匹配
  const performContactMatching = async (name: string, entities: ExtractedEntity[]) => {
    const context = {
      entities,
      company: entities.find((e) => e.type === 'organization')?.value,
    };
    // 新的匹配器返回 MatchResult[]，使用新的 API 调用
    const results: MatchResult[] = await (findMatchingContacts as any)(name, contacts as any, context as any, {
      threshold: CONFIDENCE_THRESHOLDS.LOW,
      maxResults: 3,
      useContext: true,
    });
    return results;
  };

  // 简化的拼音匹配
  const isPinyinMatch = (name1: string, name2: string) => {
    // 实际项目中应使用 pinyin 库
    // 这里简化处理，仅匹配首字母
    const getInitials = (str: string) => {
      return str.split('').map(char => {
        // 这里应该是拼音首字母提取
        // 简化：返回原字符
        return char;
      }).join('');
    };

    return getInitials(name1) === getInitials(name2);
  };

  // 按类型分组实体
  const groupEntitiesByType = (entities: ExtractedEntity[]) => {
    const grouped: Record<string, ExtractedEntity[]> = {};
    entities.forEach(entity => {
      if (!grouped[entity.type]) {
        grouped[entity.type] = [];
      }
      grouped[entity.type].push(entity);
    });
    return grouped;
  };

  const handleCreateNewContact = async () => {
    await deleteAudioFile();
    router.push({
      pathname: '/(views)/contact/new',
      params: {
        transcription,
        entities: JSON.stringify(analyzedData?.entities),
        actionItems: JSON.stringify(analyzedData?.actionItems),
      }
    });
  };

  const handleAddToExisting = async () => {
    if (!selectedContactId) {
      Alert.alert(t('agentReview.selectContact'), t('agentReview.selectContactMessage'));
      return;
    }

    await deleteAudioFile();
    router.push({
      pathname: '/(views)/contact/[id]',
      params: {
        id: selectedContactId,
        transcription,
        entities: JSON.stringify(analyzedData?.entities),
        actionItems: JSON.stringify(analyzedData?.actionItems),
        mode: 'append',
      }
    });
  };

  // 加载音频
  const loadAudio = async () => {
    if (!audioUri) {
      console.log('[AgentReview] No audio URI provided');
      setAudioLoadError(t('errors.audioNoFile'));
      return;
    }

    try {
      console.log('[AgentReview] Checking audio file:', audioUri);
      const fileInfo = await FileSystem.getInfoAsync(audioUri);

      console.log('[AgentReview] File info:', {
        exists: fileInfo.exists,
        size: fileInfo.exists ? (fileInfo as any).size : 0,
        uri: audioUri,
      });

      if (!fileInfo.exists) {
        console.warn('[AgentReview] Audio file does not exist:', audioUri);
        setAudioLoadError(t('errors.audioNotFound'));
        return;
      }

      const fileSize = (fileInfo as any).size || 0;
      if (fileSize === 0) {
        console.warn('[AgentReview] Audio file is empty (0 bytes):', audioUri);
        setAudioLoadError(t('errors.audioEmpty'));
        return;
      }

      console.log(`[AgentReview] File verified: ${fileSize} bytes`);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      console.log('[AgentReview] Creating audio sound object...');

      let sound: Audio.Sound | null = null;
      let retryCount = 0;
      const maxRetries = 1;

      while (retryCount <= maxRetries) {
        try {
          const result = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: false, progressUpdateIntervalMillis: 100 },
            onPlaybackStatusUpdate
          );
          sound = result.sound;
          break;
        } catch (loadError: any) {
          retryCount++;
          console.warn(`[AgentReview] Audio load attempt ${retryCount} failed:`, loadError);

          if (retryCount > maxRetries) {
            const errorMessage = loadError?.message || '';
            const errorCode = loadError?.code || '';

            if (errorMessage.includes('-11800') || errorMessage.includes('-12842')) {
              throw new Error(t('errors.audioFormat'));
            } else if (errorMessage.includes('does not exist')) {
              throw new Error(t('errors.audioPathInvalid'));
            } else {
              throw new Error(t('errors.audioLoadFailed', { message: errorMessage || t('errors.unknown') }));
            }
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (!sound) {
        throw new Error(t('errors.audioPlayerCreation'));
      }

      soundRef.current = sound;

      const status = await sound.getStatusAsync();
      console.log('[AgentReview] Audio loaded successfully:', {
        isLoaded: status.isLoaded,
        durationMillis: (status as any).durationMillis,
      });

      if (status.isLoaded) {
        const duration = (status as any).durationMillis || 0;
        const position = (status as any).positionMillis || 0;

        durationRef.current = duration;
        positionRef.current = position;
        isPlayingRef.current = (status as any).isPlaying;

        setPlaybackDuration(duration);
        setPlaybackPosition(position);
        setIsPlaying((status as any).isPlaying);
        setAudioLoadError(null);
      } else {
        throw new Error(t('errors.audioLoadAbnormal'));
      }
    } catch (error: any) {
      const errorMessage = error?.message || t('errors.unknown');
      console.error('[AgentReview] Failed to load audio:', {
        message: errorMessage,
        code: error?.code,
        uri: audioUri,
      });

      setAudioLoadError(errorMessage);

      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }
    }
  };

  // 播放状态更新回调 - 不使用 useCallback 以确保总是使用最新状态
  const onPlaybackStatusUpdate = (status: any) => {
    console.log('[AgentReview] Playback status update:', {
      isLoaded: status.isLoaded,
      isPlaying: status.isPlaying,
      positionMillis: status.positionMillis,
      durationMillis: status.durationMillis,
      didJustFinish: status.didJustFinish,
    });

    if (!status.isLoaded) {
      console.log('[AgentReview] Status not loaded, skipping update');
      return;
    }

    const position = status.positionMillis || 0;
    const duration = status.durationMillis || 0;
    const playing = status.isPlaying;

    // 更新 React state
    setPlaybackPosition(position);
    setIsPlaying(playing);

    // 更新时长
    if (duration > 0 && duration !== durationRef.current) {
      setPlaybackDuration(duration);
      durationRef.current = duration;
    }

    // 更新 refs
    positionRef.current = position;
    isPlayingRef.current = playing;

    // 播放完成处理
    if (status.didJustFinish) {
      console.log('[AgentReview] Playback finished');
      positionRef.current = 0;
      isPlayingRef.current = false;
      setPlaybackPosition(0);
      setIsPlaying(false);
      setTimeout(() => {
        soundRef.current?.setPositionAsync(0);
      }, 100);
    }
  };

  // 播放/暂停切换
  const togglePlayback = async () => {
    console.log('[AgentReview] Toggle playback, current state:', isPlayingRef.current);

    if (!soundRef.current) {
      console.log('[AgentReview] Loading audio first...');
      await loadAudio();
      // 加载完成后返回，等待下一次点击
      return;
    }

    try {
      const status = await soundRef.current.getStatusAsync();
      console.log('[AgentReview] Current status before toggle:', status);

      if (!status.isLoaded) {
        console.error('[AgentReview] Sound not loaded');
        return;
      }

      // 检查是否播放完成或接近完成
      const isFinished = status.didJustFinish ||
                        positionRef.current >= durationRef.current - 100 ||
                        (durationRef.current > 0 && positionRef.current / durationRef.current > 0.99);

      if (isFinished) {
        console.log('[AgentReview] Resetting to start...');
        await soundRef.current.setPositionAsync(0);
        positionRef.current = 0;
        setPlaybackPosition(0);
        await soundRef.current.playAsync();
      } else if (status.isPlaying || isPlayingRef.current) {
        console.log('[AgentReview] Pausing...');
        await soundRef.current.pauseAsync();
      } else {
        console.log('[AgentReview] Playing...');
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('[AgentReview] Toggle playback error:', error);
    }
  };

  // 格式化时间
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 清理音频资源
  const cleanupAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  // 删除音频文件
  const deleteAudioFile = async () => {
    if (audioUri) {
      try {
        await cleanupAudio();
        await FileSystem.deleteAsync(audioUri);
        console.log('[AgentReview] Audio file deleted');
      } catch (error) {
        console.warn('[AgentReview] Failed to delete audio file:', error);
      }
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // 获取当前使用的模型名称
  const getModelName = () => {
    if (usingLocalLLM && settings.ai.localModel.modelName) {
      return settings.ai.localModel.modelName;
    }
    return t('agentReview.modelRule');
  };

  const handleEditInfo = () => {
    // 跳转到编辑页面，预填充提取的信息
    router.push({
      pathname: '/(views)/contact/new',
      params: {
        transcription,
        entities: JSON.stringify(analyzedData?.entities),
        actionItems: JSON.stringify(analyzedData?.actionItems),
        editMode: 'true',
      }
    });
  };

  // 处理智能交往记录确认（已禁用 SmartAnalyzer）
  const handleAutoInteractionConfirm = async () => {
    // SmartAnalyzer 已禁用，此功能暂不可用
    console.log('[AgentReview] Auto interaction creation disabled - SmartAnalyzer removed');
    return;
  };

  const handleAutoInteractionCancel = () => {
    setShowAutoInteractionConfirm(false);
  };

  // 取消分析
  const handleCancelAnalysis = async () => {
    await deleteAudioFile();
    router.back();
  };

  // 打开联系人选择器
  const handleOpenContactSelector = (index: number) => {
    setSelectingContactIndex(index);
    setShowContactSelector(!showContactSelector);
  };

  // 关闭联系人选择器
  const handleCloseContactSelector = () => {
    setShowContactSelector(false);
    setSelectingContactIndex(null);
  };

  // 选择联系人替换
  const handleSelectContact = (contact: Contact) => {
    if (selectingContactIndex !== null) {
      const newMatchedContacts = [...matchedContacts];
      newMatchedContacts[selectingContactIndex] = {
        contact,
        confidence: 1.0,
        reason: t('agentReview.manualSelect'),
        matchedFields: ['manual'],
      };
      setMatchedContacts(newMatchedContacts);
      handleCloseContactSelector();
    }
  };

  // 添加活动到已匹配的联系人
  const handleAddActivityToContact = async () => {
    const activities = llmAnalysis?.insights?.activities || [];
    const locationTag = llmAnalysis?.suggestedTags?.find(t => t.startsWith('location:'))?.replace('location:', '');

    const timeResult = extractAndParseTimeFromTags(llmAnalysis?.suggestedTags || []);
    const activityDate = timeResult.timestamp;
    const activityDateDisplay = timeResult.confidence > 0 ? formatTimestamp(activityDate) : '';

    if (activities.length === 0) {
      Alert.alert(t('common.notice'), t('agentReview.noActivities'));
      return;
    }

    const targetContacts = matchedContacts.map(m => m.contact);

    if (targetContacts.length === 0) {
      Alert.alert(t('common.notice'), t('agentReview.noMatchedContacts'));
      return;
    }

    await deleteAudioFile();
    router.push({
      pathname: '/(views)/interaction/new',
      params: {
        contactIds: JSON.stringify(targetContacts.map(c => c.id)),
        content: activities.join('、'),
        location: locationTag || '',
        transcription: transcription || '',
        activityDate: activityDate.toString(),
        activityDateDisplay,
      }
    });
  };

  // 创建新联系人并带入数据
  const handleCreateContactWithData = async () => {
    const suggestedName = llmAnalysis?.contactMatch?.suggestedName ||
                         analyzedData?.contactName || '';

    // 准备传递的数据
    const activities = llmAnalysis?.insights?.activities || [];
    const preferences = llmAnalysis?.insights?.preferences || [];

    await deleteAudioFile();
    router.push({
      pathname: '/(views)/contact/new',
      params: {
        name: suggestedName,
        transcription,
        activities: JSON.stringify(activities),
        preferences: JSON.stringify(preferences),
        summary: analyzedData?.summary || '',
      }
    });
  };

  if (isAnalyzing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.analyzingContainer}>
          <View style={styles.analyzingIconContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={[styles.analyzingText, { color: colors.text }]}>
            {t('recording.aiAnalyzing')}
          </Text>
          <Text style={[styles.analyzingSubtext, { color: colors.textMuted }]}>
            {t('recording.modelInfo', { model: getModelName(), language: getLanguageDisplay() })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const groupedEntities = analyzedData ? groupEntitiesByType(analyzedData.entities) : {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity
          onPress={async () => {
            await deleteAudioFile();
            router.back();
          }}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{t('navigation.aiReview')}</Text>
          <View style={styles.modelBadge}>
            <Ionicons name="hardware-chip-outline" size={12} color={colors.primary} />
            <Text style={[styles.modelText, { color: colors.primary }]}>
              {getModelName()}
            </Text>
          </View>
          {analyzedData?.summary && (
            <Text style={[styles.summaryText, { color: colors.textMuted }]}>
              {analyzedData.summary}
            </Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 原始语音文本 - 可折叠 */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.transcriptionHeader}
            onPress={() => setIsTranscriptionExpanded(!isTranscriptionExpanded)}
            activeOpacity={0.8}
          >
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name={inputMode === 'voice' ? 'mic' : 'create'} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {inputMode === 'voice' ? t('agentReview.originalVoice') : t('agentReview.inputText')}
              </Text>
            </View>
            <Ionicons
              name={isTranscriptionExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <View style={[
            styles.transcriptionContent,
            !isTranscriptionExpanded && styles.transcriptionCollapsed
          ]}>
            <Text style={[styles.transcription, { color: colors.textSecondary }]}>
              {transcription}
            </Text>
          </View>

          {audioUri && !audioLoadError && inputMode === 'voice' && (
            <View style={styles.audioPlayerContainer}>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: colors.primary }]}
                onPress={togglePlayback}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#0a0a0a"
                />
              </TouchableOpacity>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: `${colors.textMuted}30` }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: playbackDuration > 0
                          ? `${Math.min((playbackPosition / playbackDuration) * 100, 100)}%`
                          : '0%',
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.timeContainer}>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {formatTime(playbackPosition)}
                  </Text>
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {formatTime(playbackDuration)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {audioLoadError && inputMode === 'voice' && (
            <View style={[styles.audioErrorContainer, { backgroundColor: `${colors.danger}15` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={[styles.audioErrorText, { color: colors.danger }]}>
                {t('agentReview.audioPlayError')}: {audioLoadError}
              </Text>
            </View>
          )}

          {!isTranscriptionExpanded && (
            <Text style={[styles.transcriptionHint, { color: colors.textMuted }]}>
              {t('ai.expandHint', { language: getLanguageDisplay() })}
            </Text>
          )}
        </View>

        {/* 匹配到的联系人 */}
        {matchedContacts.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="people" size={16} color={colors.primary} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ai.matchedContacts')}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {t('ai.matchedContactsSubtitle')}
                </Text>
              </View>
            </View>

            <View style={styles.contactsList}>
              {matchedContacts.map((match, index) => (
                <TouchableOpacity
                  key={match.contact.id}
                  style={[
                    styles.contactCard,
                    {
                      backgroundColor: colors.elevated
                    },
                  ]}
                  onPress={() => handleOpenContactSelector(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.contactAvatar}>
                    <Text style={styles.contactAvatarText}>
                      {match.contact.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>
                      {match.contact.name}
                    </Text>
                    <Text style={[styles.contactMeta, { color: colors.textMuted }]}>
                      {match.contact.company || t('contacts.noCompany')} · {match.contact.title || t('contacts.noTitle')}
                    </Text>
                  </View>
                  <View style={styles.contactArrow}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.newContactOption,
                { borderColor: colors.border }
              ]}
              onPress={() => {
                const suggestedName = llmAnalysis?.contactMatch?.suggestedName || analyzedData?.contactName || '';
                const activities = llmAnalysis?.insights?.activities || [];
                const preferences = llmAnalysis?.insights?.preferences || [];

                router.push({
                  pathname: '/(views)/contact/new',
                  params: {
                    name: suggestedName,
                    transcription,
                    activities: JSON.stringify(activities),
                    preferences: JSON.stringify(preferences),
                    summary: analyzedData?.summary || '',
                  }
                });
              }}
              activeOpacity={0.8}
            >
              <View style={[
                styles.newContactIcon,
                { backgroundColor: colors.elevated }
              ]}>
                <Ionicons
                  name="add"
                  size={20}
                  color={colors.textMuted}
                />
              </View>
              <Text style={[
                styles.newContactText,
                { color: colors.text }
              ]}>
                {t('ai.createNewContact')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 提取的关键信息 */}
        {Object.keys(groupedEntities).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="search" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ai.extractedInfo')}</Text>
            </View>

            <View style={styles.entitiesContainer}>
              {Object.entries(groupedEntities).map(([type, entities]) => {
                const config = ENTITY_CONFIG[type] || {
                  labelKey: 'agentReview.entityTypes.unknown',
                  icon: 'information-circle',
                  color: colors.textMuted,
                  bgColor: `${colors.textMuted}20`,
                };

                return (
                  <View key={type} style={styles.entityGroupCard}>
                    <View style={[styles.entityGroupHeader, { backgroundColor: config.bgColor }]}>
                      <Ionicons name={config.icon} size={16} color={config.color} />
                      <Text style={[styles.entityType, { color: config.color }]}>
                        {t(config.labelKey)}
                      </Text>
                      <View style={[styles.entityCount, { backgroundColor: config.color }]}>
                        <Text style={styles.entityCountText}>{entities.length}</Text>
                      </View>
                    </View>

                    <View style={styles.entityItemsContainer}>
                      {entities.map((entity, idx) => (
                        <View key={idx} style={styles.entityItem}>
                          <View style={styles.entityItemContent}>
                            <Text style={[styles.entityValue, { color: colors.text }]}>
                              {entity.value}
                            </Text>
                            {entity.context && entity.context !== entity.value && (
                              <Text style={[styles.entityContext, { color: colors.textMuted }]}>
                                {entity.context}
                              </Text>
                            )}
                          </View>
                          <View style={styles.confidenceIndicator}>
                            <View
                              style={[
                                styles.confidenceBar,
                                {
                                  width: `${entity.confidence * 100}%`,
                                  backgroundColor: entity.confidence > 0.7 ? '#10b981' :
                                                  entity.confidence > 0.4 ? '#f59e0b' : '#ef4444'
                                }
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 生成的待办事项 */}
        {analyzedData?.actionItems && analyzedData.actionItems.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.iconBadge, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="checkbox-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('ai.actionItems')}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {t('ai.actionItemsCount', { count: analyzedData.actionItems.length })}
                </Text>
              </View>
            </View>

            <View style={styles.actionItemsList}>
              {analyzedData.actionItems.map((item, index) => (
                <View key={item.id} style={styles.actionItemCard}>
                  <View style={[styles.actionItemIcon, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="square-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.actionItemContent}>
                    <Text style={[styles.actionItemText, { color: colors.text }]}>
                      {item.description}
                    </Text>
                    <View style={styles.actionItemMeta}>
                      <View style={[
                        styles.priorityBadge,
                        { backgroundColor: item.priority === 'high' ? '#ef444420' :
                                          item.priority === 'medium' ? '#f59e0b20' : '#10b98120' }
                      ]}>
                        <Text style={[
                          styles.priorityText,
                          { color: item.priority === 'high' ? '#ef4444' :
                                   item.priority === 'medium' ? '#f59e0b' : '#10b981' }
                        ]}>
                          {item.priority === 'high' ? t('ai.priorityHigh') :
                           item.priority === 'medium' ? t('ai.priorityMedium') : t('ai.priorityLow')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* LLM 推理结果展示 */}
        {llmAnalysis && !isAnalyzing && (
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <LLMReasoningCard
              result={llmAnalysis}
              onApplyCorrection={(original, corrected) => {
                console.log('[AgentReview] Apply correction:', original, '->', corrected);
              }}
            />
          </View>
        )}

        {/* 底部留白 */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* 智能交往记录确认弹窗 - 已禁用 */}
      {showAutoInteractionConfirm && (
        <AutoInteractionConfirm
          visible={showAutoInteractionConfirm}
          analysis={null}
          matchedContact={contacts.find(c => c.id === selectedContactId) || null}
          onConfirm={handleAutoInteractionConfirm}
          onCancel={handleAutoInteractionCancel}
        />
      )}

      {/* 底部操作按钮 */}
      {!isAnalyzing && analyzedData && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {llmAnalysis?.contactMatch?.found ? (
            <>
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: colors.surface }]}
                onPress={handleCancelAnalysis}
                activeOpacity={0.8}
              >
                <Text style={[styles.footerButtonText, { color: colors.textMuted }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleAddActivityToContact}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color="#0a0a0a" />
                <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>{t('agentReview.addActivity')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.footerButton, { backgroundColor: colors.surface }]}
                onPress={handleCancelAnalysis}
                activeOpacity={0.8}
              >
                <Text style={[styles.footerButtonText, { color: colors.textMuted }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonPrimary, { backgroundColor: colors.primary }]}
                onPress={handleCreateContactWithData}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={20} color="#0a0a0a" />
                <Text style={[styles.footerButtonText, styles.footerButtonTextPrimary]}>{t('agentReview.createContact')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* 联系人选择器 - 条件渲染确保每次都是全新状态 */}
      {showContactSelector && (
        <ContactSelectorSheet
          onClose={handleCloseContactSelector}
          onSelect={handleSelectContact}
          contacts={contacts}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    gap: 4,
  },
  modelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  analyzingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  analyzingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  analyzingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 140,
  },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  // 转录区域
  transcriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  transcriptionContent: {
    overflow: 'hidden',
  },
  transcriptionCollapsed: {
    maxHeight: 80,
  },
  transcription: {
    fontSize: 15,
    lineHeight: 24,
  },
  transcriptionHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  // 音频播放器
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  audioErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  audioErrorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  // 联系人卡片
  contactsList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#c9a962',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  contactArrow: {
    paddingLeft: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactCheckbox: {
    marginLeft: 8,
  },
  checkboxActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  newContactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 12,
    gap: 12,
  },
  newContactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newContactText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  // 实体信息
  entitiesContainer: {
    gap: 12,
  },
  entityGroupCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  entityGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  entityType: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  entityCount: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  entityItemsContainer: {
    padding: 12,
    gap: 10,
  },
  entityItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
  },
  entityItemContent: {
    marginBottom: 8,
  },
  entityValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  entityContext: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  confidenceIndicator: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  // 待办事项
  actionItemsList: {
    gap: 10,
  },
  actionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
  },
  actionItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionItemContent: {
    flex: 1,
  },
  actionItemText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionItemMeta: {
    flexDirection: 'row',
    marginTop: 6,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerButtonPrimary: {
    flex: 1.5,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerButtonTextPrimary: {
    color: '#0a0a0a',
  },
});

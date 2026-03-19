import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import * as FileSystem from 'expo-file-system';
import { useThemeColor } from '@/hooks/useThemeColor';
import { extractEntities } from '@/services/ai/entityExtractor';
import { ExtractedEntity, ActionItem } from '@/types';
import { useContactStore } from '@/store';
import { useSettingsStore } from '@/store/settingsStore';
import { hasAnyModelDownloaded } from '@/services/ai/llmModelManager';
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
const ENTITY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  person: { label: '人物', icon: 'person', color: '#c9a962', bgColor: '#c9a96220' },
  health_issue: { label: '健康状况', icon: 'medical', color: '#ef4444', bgColor: '#ef444420' },
  location: { label: '地点', icon: 'location', color: '#3b82f6', bgColor: '#3b82f620' },
  need: { label: '需求', icon: 'help-circle', color: '#f59e0b', bgColor: '#f59e0b20' },
  event: { label: '事件', icon: 'calendar', color: '#8b5cf6', bgColor: '#8b5cf620' },
  preference: { label: '偏好', icon: 'heart', color: '#ec4899', bgColor: '#ec489920' },
  date: { label: '时间', icon: 'time', color: '#10b981', bgColor: '#10b98120' },
  organization: { label: '组织', icon: 'business', color: '#6366f1', bgColor: '#6366f120' },
};

export default function AgentReviewScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const params = useLocalSearchParams();
  const { contacts } = useContactStore();
  const { settings } = useSettingsStore();
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);
  const [matchedContacts, setMatchedContacts] = useState<any[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [usingLocalLLM, setUsingLocalLLM] = useState(false);
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false);

  // 音频播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // 使用 ref 避免闭包陷阱
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const isPlayingRef = useRef(false);

  const audioUri = params.audioUri as string;

  // 获取当前语言显示
  const getLanguageDisplay = () => {
    const langMap: Record<string, string> = {
      'cn': '中文',
      'en': 'English',
    };
    return langMap[settings.language] || settings.language;
  };

  const transcription = params.transcription as string;

  // 动画值
  const headerProgress = useSharedValue(0);
  const contentProgress = useSharedValue(0);

  useEffect(() => {
    analyzeTranscription();
    // 启动入场动画
    headerProgress.value = withSpring(1, { damping: 15 });
    contentProgress.value = withDelay(200, withSpring(1, { damping: 15 }));
    
    // 加载音频
    if (audioUri) {
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
      
      // 检查是否可以使用本地 LLM
      const hasLocalModel = await hasAnyModelDownloaded();
      const useLLM = hasLocalModel && settings.ai.localModel.enabled;
      setUsingLocalLLM(useLLM);
      
      let result;
      
      if (useLLM) {
        // 使用本地 LLM 进行分析
        console.log('[AgentReview] Using local LLM for analysis');
        result = await analyzeWithLocalLLM(transcription);
      } else {
        // 使用规则引擎
        console.log('[AgentReview] Using rule-based extraction');
        result = await extractEntities(transcription);
      }
      
      setAnalyzedData({
        transcription,
        entities: result.entities,
        actionItems: result.actionItems,
        contactName: result.contactName,
        summary: generateSummary(result.entities, result.actionItems),
      });

      // 2. 匹配现有联系人
      if (result.contactName) {
        const matches = findMatchingContacts(result.contactName, result.entities);
        setMatchedContacts(matches);
        
        // 使用设置中的阈值自动选择
        const threshold = settings.ai.matching.threshold;
        if (matches.length > 0 && matches[0].confidence > threshold) {
          setSelectedContactId(matches[0].contact.id);
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert('分析失败', '无法解析语音内容，请重试');
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
      summary += `识别到 ${personEntities.length} 位相关人物`;
    }
    
    if (healthIssues.length > 0) {
      summary += summary ? `，提及 ${healthIssues.length} 项健康信息` : `提及 ${healthIssues.length} 项健康信息`;
    }
    
    if (needs.length > 0) {
      summary += summary ? `，发现 ${needs.length} 个需求` : `发现 ${needs.length} 个需求`;
    }
    
    if (actionItems.length > 0) {
      summary += summary ? `，生成 ${actionItems.length} 个待办` : `生成 ${actionItems.length} 个待办`;
    }
    
    return summary || '已分析语音内容';
  };

  // 本地 LLM 分析（占位实现）
  const analyzeWithLocalLLM = async (text: string) => {
    // TODO: 实现本地 LLM 推理
    // 目前先回退到规则引擎
    console.log('[AgentReview] Local LLM not fully implemented, falling back to rules');
    return await extractEntities(text);
  };

  // 简单的联系人匹配算法
  const findMatchingContacts = (name: string, entities: ExtractedEntity[]) => {
    const matches: { contact: any; confidence: number; reason: string }[] = [];
    
    contacts.forEach((contact) => {
      let confidence = 0;
      let reason = '';
      
      // 精确匹配
      if (contact.name === name) {
        confidence = 1.0;
        reason = '姓名完全匹配';
      }
      // 包含匹配
      else if (contact.name.includes(name) || name.includes(contact.name)) {
        confidence = 0.8;
        reason = '姓名相似';
      }
      // 拼音匹配（简化版）
      else if (isPinyinMatch(contact.name, name)) {
        confidence = 0.6;
        reason = '拼音匹配';
      }
      
      // 通过公司、职位等辅助信息提高置信度
      const orgEntities = entities.filter(e => e.type === 'organization');
      if (orgEntities.length > 0 && contact.company) {
        const orgMatch = orgEntities.some(e => 
          contact.company?.toLowerCase().includes(e.value.toLowerCase()) ||
          e.value.toLowerCase().includes(contact.company?.toLowerCase() || '')
        );
        if (orgMatch) {
          confidence = Math.min(confidence + 0.1, 1.0);
          reason += reason ? '，公司匹配' : '公司匹配';
        }
      }
      
      if (confidence > 0.3) {
        matches.push({ contact, confidence, reason });
      }
    });
    
    // 按置信度排序
    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
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
      Alert.alert('请选择联系人', '请先选择一个要更新的联系人');
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
    if (!audioUri) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      console.log('[AgentReview] Loading audio:', audioUri);
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 },
        onPlaybackStatusUpdate
      );
      
      soundRef.current = sound;
      
      // 立即获取一次状态来设置时长
      const status = await sound.getStatusAsync();
      console.log('[AgentReview] Audio status:', status);
      
      if (status.isLoaded) {
        const duration = status.durationMillis || 0;
        const position = status.positionMillis || 0;
        
        durationRef.current = duration;
        positionRef.current = position;
        isPlayingRef.current = status.isPlaying;
        
        setPlaybackDuration(duration);
        setPlaybackPosition(position);
        setIsPlaying(status.isPlaying);
      }
    } catch (error) {
      console.error('[AgentReview] Failed to load audio:', error);
    }
  };

  // 播放状态更新回调 - 使用 useCallback 避免闭包陷阱
  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) return;
    
    const position = status.positionMillis || 0;
    const duration = status.durationMillis || 0;
    const playing = status.isPlaying;
    
    // 更新 React state - 每次都要更新位置确保进度条移动
    setPlaybackPosition(position);
    setIsPlaying(playing);
    
    // 更新时长（比较前先检查 ref）
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
  }, []);

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
    return '规则引擎';
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

  if (isAnalyzing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style="light" />
        <View style={styles.analyzingContainer}>
          <View style={styles.analyzingIconContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={[styles.analyzingText, { color: colors.text }]}>
            AI 正在分析语音内容...
          </Text>
          <Text style={[styles.analyzingSubtext, { color: colors.textMuted }]}>
            模型: {getModelName()} · 语言: {getLanguageDisplay()} · 提取关键信息并匹配联系人
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
          <Text style={[styles.title, { color: colors.text }]}>AI 分析结果</Text>
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
                <Ionicons name="mic" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>原始语音</Text>
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
          
          {/* 音频播放控制 */}
          {audioUri && (
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

          {!isTranscriptionExpanded && (
            <Text style={[styles.transcriptionHint, { color: colors.textMuted }]}>
              点击展开查看完整内容 · 识别语言: {getLanguageDisplay()}
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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>匹配到的联系人</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  选择联系人以添加记录，或创建新联系人
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
                      backgroundColor: selectedContactId === match.contact.id 
                        ? `${colors.primary}15` 
                        : colors.elevated 
                    },
                    selectedContactId === match.contact.id && { 
                      borderColor: colors.primary,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => setSelectedContactId(match.contact.id)}
                  activeOpacity={0.8}
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
                      {match.contact.company || '无公司'} · {match.contact.title || '无职位'}
                    </Text>
                    <View style={[styles.confidenceBadge, { backgroundColor: `${colors.primary}15` }]}>
                      <Ionicons name="flash" size={12} color={colors.primary} />
                      <Text style={[styles.confidenceText, { color: colors.primary }]}>
                        {Math.round(match.confidence * 100)}% · {match.reason}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.contactCheckbox}>
                    {selectedContactId === match.contact.id ? (
                      <View style={[styles.checkboxActive, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={16} color="#0a0a0a" />
                      </View>
                    ) : (
                      <View style={[styles.checkboxInactive, { borderColor: colors.border }]} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[
                styles.newContactOption, 
                { borderColor: selectedContactId === null ? colors.primary : colors.border }
              ]}
              onPress={() => setSelectedContactId(null)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.newContactIcon,
                { backgroundColor: selectedContactId === null ? `${colors.primary}20` : colors.elevated }
              ]}>
                <Ionicons 
                  name="add" 
                  size={20} 
                  color={selectedContactId === null ? colors.primary : colors.textMuted} 
                />
              </View>
              <Text style={[
                styles.newContactText, 
                { color: selectedContactId === null ? colors.primary : colors.text }
              ]}>
                创建新联系人
              </Text>
              {selectedContactId === null && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>提取的关键信息</Text>
            </View>
            
            <View style={styles.entitiesContainer}>
              {Object.entries(groupedEntities).map(([type, entities]) => {
                const config = ENTITY_CONFIG[type] || { 
                  label: type, 
                  icon: 'information-circle', 
                  color: colors.textMuted,
                  bgColor: `${colors.textMuted}20`,
                };
                
                return (
                  <View key={type} style={styles.entityGroupCard}>
                    <View style={[styles.entityGroupHeader, { backgroundColor: config.bgColor }]}>
                      <Ionicons name={config.icon} size={16} color={config.color} />
                      <Text style={[styles.entityType, { color: config.color }]}>
                        {config.label}
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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>待办事项</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {analyzedData.actionItems.length} 个待办
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
                          {item.priority === 'high' ? '高优先级' : 
                           item.priority === 'medium' ? '中优先级' : '低优先级'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 底部留白 */}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* 底部操作栏 */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {selectedContactId ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleAddToExisting}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={20} color="#0a0a0a" />
            <Text style={styles.primaryButtonText}>添加到现有联系人</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateNewContact}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color="#0a0a0a" />
            <Text style={styles.primaryButtonText}>创建新联系人</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleEditInfo}
          activeOpacity={0.8}
        >
          <Ionicons name="create" size={18} color={colors.text} />
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            编辑
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
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
});

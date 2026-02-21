import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { extractEntities } from '@/services/ai/entityExtractor';
import { ExtractedEntity, ActionItem } from '@/types';
import { useContactStore } from '@/store';
import { useSettingsStore } from '@/store/settingsStore';
import { hasAnyModelDownloaded } from '@/services/ai/llmModelManager';
import { StatusBar } from 'expo-status-bar';

interface AnalyzedData {
  transcription: string;
  entities: ExtractedEntity[];
  actionItems: ActionItem[];
  contactName?: string;
}

// 实体类型配置
const ENTITY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  person: { label: '人物', icon: 'person', color: '#c9a962' },
  health_issue: { label: '健康状况', icon: 'medical', color: '#ef4444' },
  location: { label: '地点', icon: 'location', color: '#3b82f6' },
  need: { label: '需求', icon: 'help-circle', color: '#f59e0b' },
  event: { label: '事件', icon: 'calendar', color: '#8b5cf6' },
  preference: { label: '偏好', icon: 'heart', color: '#ec4899' },
  date: { label: '时间', icon: 'time', color: '#10b981' },
  organization: { label: '组织', icon: 'business', color: '#6366f1' },
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

  const transcription = params.transcription as string;

  useEffect(() => {
    analyzeTranscription();
  }, []);

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

  const handleCreateNewContact = () => {
    router.push({
      pathname: '/(views)/contact/new',
      params: {
        transcription,
        entities: JSON.stringify(analyzedData?.entities),
        actionItems: JSON.stringify(analyzedData?.actionItems),
      }
    });
  };

  const handleAddToExisting = () => {
    if (!selectedContactId) {
      Alert.alert('请选择联系人', '请先选择一个要更新的联系人');
      return;
    }
    
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
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.analyzingText, { color: colors.text }]}>
            AI 正在分析语音内容...
          </Text>
          <Text style={[styles.analyzingSubtext, { color: colors.textMuted }]}>
            {usingLocalLLM ? '使用本地 LLM 模型' : '使用规则引擎'} · 提取关键信息并匹配联系人
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>AI 分析结果</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 原始文本 */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 原始语音</Text>
          <Text style={[styles.transcription, { color: colors.textSecondary }]}>
            {transcription}
          </Text>
        </View>

        {/* 匹配到的联系人 */}
        {matchedContacts.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>👤 匹配到的联系人</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              选择要更新的联系人，或创建新联系人
            </Text>
            
            {matchedContacts.map((match, index) => (
              <TouchableOpacity
                key={match.contact.id}
                style={[
                  styles.contactCard,
                  { 
                    backgroundColor: selectedContactId === match.contact.id 
                      ? `${colors.primary}20` 
                      : colors.elevated 
                  },
                  { borderColor: selectedContactId === match.contact.id ? colors.primary : 'transparent' },
                ]}
                onPress={() => setSelectedContactId(match.contact.id)}
              >
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: colors.text }]}>
                    {match.contact.name}
                  </Text>
                  <Text style={[styles.contactMeta, { color: colors.textMuted }]}>
                    {match.contact.company || '无公司信息'} · {match.contact.title || '无职位'}
                  </Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={[styles.confidenceText, { color: colors.primary }]}>
                      匹配度: {Math.round(match.confidence * 100)}% · {match.reason}
                    </Text>
                  </View>
                </View>
                {selectedContactId === match.contact.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.newContactOption, { borderColor: colors.border }]}
              onPress={() => setSelectedContactId(null)}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary} />
              <Text style={[styles.newContactText, { color: colors.primary }]}>
                这不是现有联系人，创建新联系人
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 提取的关键信息 */}
        {Object.keys(groupedEntities).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🔍 提取的关键信息</Text>
            
            {Object.entries(groupedEntities).map(([type, entities]) => {
              const config = ENTITY_CONFIG[type] || { 
                label: type, 
                icon: 'information-circle', 
                color: colors.textMuted 
              };
              
              return (
                <View key={type} style={styles.entityGroup}>
                  <View style={styles.entityHeader}>
                    <Ionicons name={config.icon as any} size={16} color={config.color} />
                    <Text style={[styles.entityType, { color: config.color }]}>
                      {config.label}
                    </Text>
                  </View>
                  
                  {entities.map((entity, idx) => (
                    <View key={idx} style={styles.entityItem}>
                      <Text style={[styles.entityValue, { color: colors.text }]}>
                        • {entity.value}
                      </Text>
                      {entity.context && (
                        <Text style={[styles.entityContext, { color: colors.textMuted }]}>
                          上下文: "{entity.context}"
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* 生成的待办事项 */}
        {analyzedData?.actionItems && analyzedData.actionItems.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>✅ 待办事项</Text>
            {analyzedData.actionItems.map((item, index) => (
              <View key={item.id} style={styles.actionItem}>
                <Ionicons name="square-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.actionItemText, { color: colors.text }]}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 底部留白 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {selectedContactId ? (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleAddToExisting}
          >
            <Ionicons name="person-add" size={20} color="#0a0a0a" />
            <Text style={styles.primaryButtonText}>添加到现有联系人</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateNewContact}
          >
            <Ionicons name="add-circle" size={20} color="#0a0a0a" />
            <Text style={styles.primaryButtonText}>创建新联系人</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleEditInfo}
        >
          <Ionicons name="create" size={18} color={colors.text} />
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
            编辑信息
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
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
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
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  transcription: {
    fontSize: 15,
    lineHeight: 24,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
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
    marginTop: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  newContactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  newContactText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  entityGroup: {
    marginBottom: 12,
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  entityType: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  entityItem: {
    paddingLeft: 22,
    marginBottom: 4,
  },
  entityValue: {
    fontSize: 15,
  },
  entityContext: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  actionItemText: {
    fontSize: 15,
    marginLeft: 8,
    flex: 1,
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

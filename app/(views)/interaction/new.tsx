import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useInteractionStore } from '@/store/interactions/interactionStore';
import { useContactStore } from '@/store';
import { Interaction, Contact } from '@/types';

const INTERACTION_TYPES: {
  type: Interaction['type'];
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}[] = [
  { type: 'meeting', icon: 'restaurant', label: '聚餐', color: '#f59e0b' },
  { type: 'call', icon: 'bicycle', label: '户外运动', color: '#22c55e' },
  { type: 'message', icon: 'school', label: '学习', color: '#3b82f6' },
  { type: 'gift', icon: 'golf', label: '娱乐', color: '#8b5cf6' },
  { type: 'other', icon: 'ellipsis-horizontal', label: '其他', color: '#6b7280' },
];

const VALUE_EXCHANGE_OPTIONS: {
  value: Interaction['valueExchange'];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'neutral', label: '普通', icon: 'remove-circle' },
  { value: 'given', label: '送出', icon: 'arrow-up-circle' },
  { value: 'received', label: '收到', icon: 'arrow-down-circle' },
];

export default function NewInteractionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useThemeColor();
  const { addInteraction } = useInteractionStore();
  const { contacts } = useContactStore();

  // 解析传入的联系人 ID（支持单个 contactId 或多个 contactIds）
  const targetContactIds = useMemo(() => {
    if (params.contactIds) {
      try {
        return JSON.parse(params.contactIds as string) as string[];
      } catch {
        return params.contactId ? [params.contactId as string] : [];
      }
    }
    return params.contactId ? [params.contactId as string] : [];
  }, [params.contactId, params.contactIds]);

  const targetContacts = useMemo(() => {
    return contacts.filter(c => targetContactIds.includes(c.id));
  }, [contacts, targetContactIds]);

  const [selectedType, setSelectedType] = useState<Interaction['type']>('meeting');
  const [content, setContent] = useState((params.content as string) || '');
  const [location, setLocation] = useState((params.location as string) || '');
  const [valueExchange, setValueExchange] = useState<Interaction['valueExchange']>('neutral');
  const [valueDescription, setValueDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入交往内容');
      return;
    }

    if (targetContactIds.length === 0) {
      Alert.alert('错误', '未指定联系人');
      return;
    }

    setIsSaving(true);

    try {
      const promises = targetContactIds.map(contactId => {
        const newInteraction: Interaction = {
          id: `interaction_${Date.now()}_${contactId}`,
          contactId,
          type: selectedType,
          content: content.trim(),
          rawTranscript: (params.transcription as string) || undefined,
          extractedEntities: [],
          actionItems: [],
          location: location.trim() || undefined,
          date: Date.now(),
          valueExchange,
          valueDescription: valueDescription.trim() || undefined,
          createdAt: Date.now(),
        };
        return addInteraction(newInteraction);
      });

      await Promise.all(promises);
      
      // 清除中间页面栈，跳转到联系人详情，返回时直接回到主页
      router.dismissAll();
      router.push({
        pathname: '/(views)/contact/[id]',
        params: { id: targetContactIds[0] },
      });
    } catch (error) {
      console.error('Failed to save interaction:', error);
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>
            取消
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>添加记录</Text>

        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[
            styles.saveButton,
            { color: isSaving ? colors.textMuted : colors.primary }
          ]}>
            {isSaving ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 目标联系人展示区域 */}
      {targetContacts.length > 0 && (
        <View style={[styles.contactsBanner, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={18} color={colors.primary} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactsScroll}>
            {targetContacts.map((contact, index) => (
              <View key={contact.id} style={styles.contactChip}>
                <Text style={[styles.contactChipText, { color: colors.text }]}>
                  {contact.name}
                </Text>
                {index < targetContacts.length - 1 && (
                  <Text style={[styles.contactChipDivider, { color: colors.textMuted }]}>·</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>类型</Text>
          <View style={styles.typeGrid}>
            {INTERACTION_TYPES.map((item) => (
              <TouchableOpacity
                key={item.type}
                onPress={() => setSelectedType(item.type)}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: selectedType === item.type ? item.color : 'transparent',
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={selectedType === item.type ? item.color : colors.textMuted}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    {
                      color: selectedType === item.type ? item.color : colors.textSecondary,
                      fontWeight: selectedType === item.type ? '600' : '400',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>内容</Text>
          <View style={[styles.contentCard, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.contentInput, { color: colors.text }]}
              placeholder="记录这次交往的详细内容..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>地点（可选）</Text>
          <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="输入地点"
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>价值交换</Text>
          <View style={styles.valueExchangeRow}>
            {VALUE_EXCHANGE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setValueExchange(option.value)}
                style={[
                  styles.valueButton,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1.5,
                    borderColor: valueExchange === option.value ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={valueExchange === option.value ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.valueLabel,
                    {
                      color: valueExchange === option.value ? colors.primary : colors.textSecondary,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {valueExchange !== 'neutral' && (
            <View style={[styles.inputCard, { backgroundColor: colors.surface, marginTop: 12, paddingVertical: 14 }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={valueExchange === 'given' ? '描述送出了什么...' : '描述收到了什么...'}
                placeholderTextColor={colors.textMuted}
                value={valueDescription}
                onChangeText={setValueDescription}
              />
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  cancelButton: {
    fontSize: 16,
    width: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    width: 60,
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  typeLabel: {
    fontSize: 14,
  },
  contentCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 150,
  },
  contentInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
  },
  inputCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  valueExchangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  valueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  contactsScroll: {
    flex: 1,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  contactChipDivider: {
    fontSize: 13,
    marginHorizontal: 6,
  },
});

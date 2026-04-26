import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import DatePicker from 'expo-datepicker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useInteractionStore } from '@/store/interactions/interactionStore';
import { useContactStore } from '@/store';
import { Interaction, Contact } from '@/types';
import { formatTimestamp } from '@/services/ai/timeParser';

const INTERACTION_TYPES: {
  type: Interaction['type'];
  icon: keyof typeof Ionicons.glyphMap;
  i18nKey: string;
  color: string;
}[] = [
  { type: 'meeting', icon: 'people', i18nKey: 'interaction.types.meeting', color: '#f59e0b' },
  { type: 'call', icon: 'call', i18nKey: 'interaction.types.call', color: '#22c55e' },
  { type: 'message', icon: 'chatbubble', i18nKey: 'interaction.types.message', color: '#3b82f6' },
  { type: 'meal', icon: 'restaurant', i18nKey: 'interaction.types.meal', color: '#eab308' },
  { type: 'exercise', icon: 'fitness', i18nKey: 'interaction.types.exercise', color: '#06b6d4' },
  { type: 'gift', icon: 'gift', i18nKey: 'interaction.types.gift', color: '#8b5cf6' },
  { type: 'other', icon: 'ellipsis-horizontal', i18nKey: 'interaction.types.other', color: '#6b7280' },
];

const VALUE_EXCHANGE_OPTIONS: {
  value: Interaction['valueExchange'];
  i18nKey: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'neutral', i18nKey: 'interaction.valueTypes.neutral', icon: 'remove-circle' },
  { value: 'given', i18nKey: 'interaction.valueTypes.given', icon: 'arrow-up-circle' },
  { value: 'received', i18nKey: 'interaction.valueTypes.received', icon: 'arrow-down-circle' },
];

export default function NewInteractionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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

  const initialActivityDate = useMemo(() => {
    const dateParam = params.activityDate as string;
    if (dateParam) {
      const parsed = parseInt(dateParam, 10);
      if (!isNaN(parsed) && parsed > 1000000000000 && parsed < 2000000000000) {
        return parsed;
      }
    }
    return Date.now();
  }, [params.activityDate]);

  const [activityDate, setActivityDate] = useState(initialActivityDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const safeFormatDate = (timestamp: number): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const getSafeDate = (timestamp: number): Date => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return new Date();
    return date;
  };

  const safeDate = getSafeDate(activityDate);
  const activityDateDisplay = formatTimestamp(activityDate);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert(t('common.notice'), t('interaction.validationError'));
      return;
    }

    if (targetContactIds.length === 0) {
      Alert.alert(t('common.error'), t('interaction.noContact'));
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
          date: activityDate,
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
      Alert.alert(t('common.error'), t('interaction.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>{t('interaction.add')}</Text>

        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[
            styles.saveButton,
            { color: isSaving ? colors.textMuted : colors.primary }
          ]}>
            {isSaving ? t('actionItem.saveLoading') : t('common.save')}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('interaction.type')}</Text>
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
                  {t(item.i18nKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('interaction.content')}</Text>
          <View style={[styles.contentCard, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.contentInput, { color: colors.text }]}
              placeholder={t('interaction.contentPlaceholder')}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('interaction.location')}</Text>
          <View style={[styles.inputCard, { backgroundColor: colors.surface }]}>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t('interaction.locationPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('interaction.activityTime')}</Text>
          <TouchableOpacity
            style={[styles.dateCard, { backgroundColor: colors.surface }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {formatTimestamp(activityDate)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('interaction.selectDate')}
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <DatePicker
                date={safeFormatDate(activityDate)}
                onChange={(dateStr: string) => {
                  const newDate = new Date(dateStr);
                  if (isNaN(newDate.getTime())) return;
                  const current = getSafeDate(activityDate);
                  newDate.setHours(current.getHours());
                  newDate.setMinutes(current.getMinutes());
                  setActivityDate(newDate.getTime());
                }}
                backgroundColor={colors.elevated}
                borderColor={colors.border}
                modalBackgroundColor={colors.surface}
                selectedColor={colors.primary}
                selectedTextColor="#0a0a0a"
              />
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>
                {t('interaction.selectTime')}
              </Text>
              <View style={styles.timeOptionsRow}>
                {['上午', '中午', '下午', '晚上'].map((period, idx) => {
                  const hours = [9, 12, 15, 20];
                  return (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor: colors.elevated,
                          borderColor: safeDate.getHours() === hours[idx] ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        const newDate = getSafeDate(activityDate);
                        newDate.setHours(hours[idx]);
                        newDate.setMinutes(0);
                        setActivityDate(newDate.getTime());
                      }}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        { color: safeDate.getHours() === hours[idx] ? colors.primary : colors.text },
                      ]}>
                        {period}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.customTimeRow}>
                <Text style={[styles.customTimeLabel, { color: colors.text }]}>
                  {t('interaction.customTime')}
                </Text>
                <TouchableOpacity
                  style={[styles.timeInputButton, { backgroundColor: colors.elevated }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                  <Text style={[styles.timeInputText, { color: colors.text }]}>
                    {`${String(safeDate.getHours()).padStart(2, '0')}:${String(safeDate.getMinutes()).padStart(2, '0')}`}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('interaction.selectTime')}
                </Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerRow}>
                  <TouchableOpacity
                    style={[styles.timePickerButton, { backgroundColor: colors.elevated }]}
                    onPress={() => {
                      const newDate = getSafeDate(activityDate);
                      const currentHour = newDate.getHours();
                      newDate.setHours(Math.max(0, currentHour - 1));
                      setActivityDate(newDate.getTime());
                    }}
                  >
                    <Ionicons name="chevron-up" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timePickerButton, { backgroundColor: colors.elevated }]}
                    onPress={() => {
                      const newDate = getSafeDate(activityDate);
                      const currentMinute = newDate.getMinutes();
                      newDate.setMinutes(Math.max(0, currentMinute - 10));
                      setActivityDate(newDate.getTime());
                    }}
                  >
                    <Ionicons name="chevron-up" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.timeDisplayRow}>
                  <View style={[styles.timeDisplayBox, { backgroundColor: colors.elevated }]}>
                    <Text style={[styles.timeDisplayText, { color: colors.text }]}>
                      {String(safeDate.getHours()).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
                  <View style={[styles.timeDisplayBox, { backgroundColor: colors.elevated }]}>
                    <Text style={[styles.timeDisplayText, { color: colors.text }]}>
                      {String(safeDate.getMinutes()).padStart(2, '0')}
                    </Text>
                  </View>
                </View>
                <View style={styles.timePickerRow}>
                  <TouchableOpacity
                    style={[styles.timePickerButton, { backgroundColor: colors.elevated }]}
                    onPress={() => {
                      const newDate = getSafeDate(activityDate);
                      const currentHour = newDate.getHours();
                      newDate.setHours(Math.min(23, currentHour + 1));
                      setActivityDate(newDate.getTime());
                    }}
                  >
                    <Ionicons name="chevron-down" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.timePickerButton, { backgroundColor: colors.elevated }]}
                    onPress={() => {
                      const newDate = getSafeDate(activityDate);
                      const currentMinute = newDate.getMinutes();
                      newDate.setMinutes(Math.min(59, currentMinute + 10));
                      setActivityDate(newDate.getTime());
                    }}
                  >
                    <Ionicons name="chevron-down" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.modalButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('interaction.valueExchange')}</Text>
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
                  {t(option.i18nKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {valueExchange !== 'neutral' && (
            <View style={[styles.inputCard, { backgroundColor: colors.surface, marginTop: 12, paddingVertical: 14 }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={valueExchange === 'given' ? t('interaction.valueGivenPlaceholder') : t('interaction.valueReceivedPlaceholder')}
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
    gap: 8,
  },
  typeButton: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  typeLabel: {
    fontSize: 13,
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
  dateCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  dateHint: {
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  timeLabel: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  timeOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  customTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  customTimeLabel: {
    fontSize: 14,
  },
  timeInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  timeInputText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timePickerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 20,
  },
  timePickerButton: {
    width: 60,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  timeDisplayBox: {
    width: 60,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplayText: {
    fontSize: 28,
    fontWeight: '600',
  },
  timeColon: {
    fontSize: 28,
    fontWeight: '600',
  },
});

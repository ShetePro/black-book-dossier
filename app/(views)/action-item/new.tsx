import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useActionItems } from '@/hooks/actionItem';
import { useContacts } from '@/hooks/contact';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ActionItem } from '@/types';

export default function NewActionItemScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const { t } = useTranslation();
  const { contactId, itemId } = useLocalSearchParams<{ contactId?: string; itemId?: string }>();
  
  const { actionItems, isLoading, addActionItem, updateActionItem } = useActionItems();
  const { contacts } = useContacts();
  
  const isEditMode = !!itemId;
  const existingItem = actionItems.find((item) => item.id === itemId);
  
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ActionItem['priority']>('medium');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [relatedContactId, setRelatedContactId] = useState<string | undefined>(contactId);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isEditMode && isLoading && !existingItem) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted, marginTop: 12 }]}>
          {t('actionItem.loading')}
        </Text>
      </View>
    );
  }

  if (isEditMode && !isLoading && !existingItem) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text, marginTop: 16 }]}>
          {t('common.error')}
        </Text>
        <Text style={[styles.errorText, { color: colors.textMuted, marginTop: 8, textAlign: 'center' }]}>
          {t('actionItem.notFound')}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButtonLarge, { backgroundColor: colors.primary, marginTop: 24 }]}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  useEffect(() => {
    if (isEditMode && existingItem) {
      setDescription(existingItem.description);
      setPriority(existingItem.priority);
      setDueDate(existingItem.dueDate ? new Date(existingItem.dueDate) : null);
      setRelatedContactId(existingItem.relatedContactId);
    }
  }, [isEditMode, existingItem]);

  const priorityOptions: Array<{ value: ActionItem['priority']; label: string; color: string }> = [
    { value: 'high', label: t('actionItem.priorityHigh'), color: '#ef4444' },
    { value: 'medium', label: t('actionItem.priorityMedium'), color: '#f59e0b' },
    { value: 'low', label: t('actionItem.priorityLow'), color: '#6b7280' },
  ];

  const handleSave = useCallback(async () => {
    if (!description.trim()) {
      Alert.alert(t('common.notice'), t('actionItem.validation.descriptionRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && existingItem) {
        const updatedItem: ActionItem = {
          ...existingItem,
          description: description.trim(),
          priority,
          dueDate: dueDate?.getTime(),
          relatedContactId,
        };
        await updateActionItem(updatedItem);
      } else {
        const newActionItem: ActionItem = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description: description.trim(),
          completed: false,
          priority,
          dueDate: dueDate?.getTime(),
          relatedContactId,
          createdAt: Date.now(),
        };
        await addActionItem(newActionItem);
      }
      router.back();
    } catch (error) {
      console.error('Failed to save action item:', error);
      Alert.alert(t('common.error'), t('actionItem.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditMode, existingItem, description, priority, dueDate, relatedContactId, addActionItem, updateActionItem, router, t]);

  const clearDueDate = useCallback(() => {
    setDueDate(null);
  }, []);

  const addDays = useCallback((days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    setDueDate(date);
  }, []);

  const getFutureDate = useCallback((days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const isSameDay = useCallback((date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }, []);

  const selectedContact = contacts.find((c) => c.id === relatedContactId);
  const priorityOption = priorityOptions.find((p) => p.value === priority);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditMode ? t('actionItem.editTitle') : t('actionItem.newTitle')}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting || !description.trim()}
          style={[
            styles.saveButton,
            {
              backgroundColor: description.trim() ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? t('actionItem.saveLoading') : t('actionItem.save')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 描述输入 */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t('actionItem.description')} *
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('actionItem.descriptionPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
          </View>
        </Animated.View>

        {/* 优先级选择 */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t('actionItem.priority')}
          </Text>
          <View style={styles.priorityContainer}>
            {priorityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setPriority(option.value)}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor:
                      priority === option.value
                        ? `${option.color}20`
                        : colors.surface,
                    borderColor:
                      priority === option.value ? option.color : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: option.color },
                  ]}
                />
                <Text
                  style={[
                    styles.priorityButtonText,
                    {
                      color:
                        priority === option.value ? option.color : colors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* 截止日期 */}
        <Animated.View entering={FadeInUp.delay(300)} style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t('actionItem.dueDate')}
          </Text>
          <View style={styles.dueDateContainer}>
            {[
              { label: t('actionItem.dueToday'), days: 0 },
              { label: t('actionItem.dueTomorrow'), days: 1 },
              { label: t('actionItem.dueDayAfter'), days: 2 },
              { label: t('actionItem.dueWeek'), days: 7 },
            ].map(({ label, days }) => (
              <TouchableOpacity
                key={label}
                onPress={() => addDays(days)}
                style={[
                  styles.dueDateChip,
                  {
                    backgroundColor:
                      dueDate && isSameDay(dueDate, getFutureDate(days))
                        ? `${colors.primary}20`
                        : colors.surface,
                    borderColor:
                      dueDate && isSameDay(dueDate, getFutureDate(days))
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dueDateChipText,
                    {
                      color:
                        dueDate && isSameDay(dueDate, getFutureDate(days))
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
            {dueDate && (
              <TouchableOpacity onPress={clearDueDate} style={styles.clearButton}>
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
          {dueDate && (
            <Text style={[styles.selectedDateText, { color: colors.textMuted }]}>
              {t('actionItem.dueSelected', { date: dueDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }) })}
            </Text>
          )}
        </Animated.View>

        {/* 关联联系人 */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t('actionItem.relatedContact')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowContactSelector(!showContactSelector)}
            style={[
              styles.contactButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={relatedContactId ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.contactButtonText,
                {
                  color: relatedContactId ? colors.text : colors.textMuted,
                },
              ]}
            >
              {selectedContact?.name || t('actionItem.selectContact')}
            </Text>
            <Ionicons
              name={showContactSelector ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showContactSelector && (
            <Animated.View
              entering={FadeInUp}
              style={[
                styles.contactList,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setRelatedContactId(undefined);
                  setShowContactSelector(false);
                }}
                style={[
                  styles.contactItem,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor:
                      relatedContactId === undefined
                        ? `${colors.primary}15`
                        : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.contactItemText,
                    {
                      color:
                        relatedContactId === undefined
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {t('actionItem.noContact')}
                </Text>
                {relatedContactId === undefined && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>

              {contacts.map((contact, index) => (
                <TouchableOpacity
                  key={contact.id}
                  onPress={() => {
                    setRelatedContactId(contact.id);
                    setShowContactSelector(false);
                  }}
                  style={[
                    styles.contactItem,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor:
                        relatedContactId === contact.id
                          ? `${colors.primary}15`
                          : 'transparent',
                      borderBottomWidth:
                        index === contacts.length - 1 ? 0 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.contactItemText,
                      {
                        color:
                          relatedContactId === contact.id
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {contact.name}
                  </Text>
                  {relatedContactId === contact.id && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>

        {/* 预览 */}
        {description.trim() && (
          <Animated.View entering={FadeInUp.delay(500)} style={styles.previewSection}>
            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t('actionItem.preview')}
            </Text>
            <View
              style={[
                styles.previewCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.previewRow}>
                <View
                  style={[
                    styles.previewCheckbox,
                    { borderColor: colors.border },
                  ]}
                />
                <View style={styles.previewContent}>
                  <Text style={[styles.previewDescription, { color: colors.text }]}>
                    {description.trim()}
                  </Text>
                  <View style={styles.previewMeta}>
                    <View
                      style={[
                        styles.previewBadge,
                        { backgroundColor: `${priorityOption?.color}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.previewBadgeText,
                          { color: priorityOption?.color },
                        ]}
                      >
                        {priorityOption?.label.charAt(0)}
                      </Text>
                    </View>
                    {dueDate && (
                      <Text
                        style={[
                          styles.previewDueDate,
                          { color: colors.textMuted },
                        ]}
                      >
                        {dueDate.toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
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
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#0a0a0a',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 80,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dueDateChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  dueDateChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dueDateText: {
    fontSize: 15,
    fontWeight: '500',
  },
  selectedDateText: {
    fontSize: 13,
    marginTop: 8,
  },
  clearButton: {
    padding: 4,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  contactButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  contactList: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    maxHeight: 200,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  previewSection: {
    marginTop: 8,
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    marginTop: 2,
  },
  previewContent: {
    flex: 1,
    marginLeft: 12,
  },
  previewDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  previewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  previewDueDate: {
    fontSize: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  backButtonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#0a0a0a',
    fontSize: 15,
    fontWeight: '600',
  },
});

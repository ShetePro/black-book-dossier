import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useContact } from '@/hooks/contact';
import { useInteractions } from '@/hooks/interaction';
import { useContactStore } from '@/store';
import { DefaultAvatar } from '@/components/DefaultAvatar';
import { ContactSkeleton } from '@/components/contact/ContactSkeleton';
import { InteractionList } from '@/components/interaction';
import type { FamilyMember } from '@/types';

export default function ContactDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const colors = useThemeColor();
  const { contact, isLoading: isContactLoading } = useContact(id as string);
  const { interactions, isLoading: isInteractionsLoading, deleteInteraction } = useInteractions(id as string);
  const { deleteContact } = useContactStore();

  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: 1 - scrollY.value / 200,
    transform: [{ translateY: -scrollY.value / 2 }],
  }));

  const handleAddInteraction = () => {
    router.push(`/(views)/interaction/new?contactId=${id}` as any);
  };

  const handleDeleteContact = () => {
    Alert.alert(
      t('contact.deleteTitle'),
      t('contact.deleteDetailMessage', { name: contact?.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('contact.deleteButton'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteContact(id as string);
              router.replace('/(tabs)/contacts');
            } catch (error) {
              console.error('Failed to delete contact:', error);
              Alert.alert(t('common.error'), t('contact.deleteError'));
            }
          },
        },
      ]
    );
  };

  const isLoading = isContactLoading || isInteractionsLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ContactSkeleton count={8} />
      </SafeAreaView>
    );
  }

  if (!contact) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>{t('contact.notFound')}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary }}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="call" size={22} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.surface, marginLeft: 8 }]}
            onPress={() => router.push(`/(views)/contact/edit?id=${id}`)}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.surface, marginLeft: 8 }]}
            onPress={handleDeleteContact}
          >
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollY.value = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.profileCard, { backgroundColor: colors.surface }, headerStyle]}>
          <DefaultAvatar nickname={contact.name} size={100} />
          
          <Text style={[styles.name, { color: colors.text }]}>{contact.name}</Text>
          
          {(contact.title || contact.company) && (
            <Text style={[styles.title, { color: colors.textSecondary }]}>
              {[contact.title, contact.company].filter(Boolean).join(' · ')}
            </Text>
          )}
          
          {contact.tags && contact.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {contact.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contact.contactInfo')}</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            {contact.phone && <InfoRow icon="call" label={t('contact.phone')} value={contact.phone} colors={colors} />}
            {contact.email && <InfoRow icon="mail" label={t('contact.email')} value={contact.email} colors={colors} />}
            {contact.company && <InfoRow icon="business" label={t('contact.company')} value={contact.company} colors={colors} />}
          </View>
        </View>

        <IntelligenceSection contact={contact} colors={colors} t={t} />

        {contact.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contact.notes')}</Text>
            <View style={[styles.notesCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>{contact.notes}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('contact.interactions')}</Text>
            <TouchableOpacity
              onPress={handleAddInteraction}
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="add" size={18} color="#0a0a0a" />
              <Text style={styles.addButtonText}>{t('common.add')}</Text>
            </TouchableOpacity>
          </View>
          <InteractionList
            interactions={interactions}
            isLoading={isInteractionsLoading}
            onDelete={deleteInteraction}
          />
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

interface IntelligenceCategory {
  key: string;
  title: string;
  icon: string;
  color: string;
  items: string[] | FamilyMember[];
  isFamily?: boolean;
}

function IntelligenceSection({
  contact,
  colors,
  t,
}: {
  contact: {
    healthIssues: string[];
    preferences: string[];
    taboos: string[];
    familyMembers: FamilyMember[];
  };
  colors: any;
  t: (key: string) => string;
}) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const categories: IntelligenceCategory[] = [
    {
      key: 'health',
      title: t('contact.intelligence.health'),
      icon: 'fitness',
      color: colors.success || '#22c55e',
      items: contact.healthIssues,
    },
    {
      key: 'preferences',
      title: t('contact.intelligence.preferences'),
      icon: 'star',
      color: colors.info || '#60a5fa',
      items: contact.preferences,
    },
    {
      key: 'taboos',
      title: t('contact.intelligence.taboos'),
      icon: 'warning',
      color: colors.danger || '#ef4444',
      items: contact.taboos,
    },
    {
      key: 'family',
      title: t('contact.intelligence.family'),
      icon: 'people',
      color: colors.primary || '#c9a962',
      items: contact.familyMembers,
      isFamily: true,
    },
  ].filter((cat) => cat.items && cat.items.length > 0);

  if (categories.length === 0) return null;

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('contact.intelligence.title')}
      </Text>
      <View style={[styles.intelligenceCard, { backgroundColor: colors.surface }]}>
        {categories.map((category, index) => (
          <IntelligenceAccordion
            key={category.key}
            category={category}
            isExpanded={expandedKeys.includes(category.key)}
            onToggle={() => toggleExpand(category.key)}
            colors={colors}
            isLast={index === categories.length - 1}
            t={t}
          />
        ))}
      </View>
    </View>
  );
}

function IntelligenceAccordion({
  category,
  isExpanded,
  onToggle,
  colors,
  isLast,
  t,
}: {
  category: IntelligenceCategory;
  isExpanded: boolean;
  onToggle: () => void;
  colors: any;
  isLast: boolean;
  t: (key: string) => string;
}) {
  return (
    <View
      style={[
        styles.accordionItem,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border || 'rgba(128,128,128,0.1)',
        },
      ]}
    >
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.accordionLeft}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: `${category.color}20` },
            ]}
          >
            <Ionicons
              name={category.icon as any}
              size={18}
              color={category.color}
            />
          </View>
          <Text style={[styles.accordionTitle, { color: colors.text }]}>
            {category.title}
          </Text>
        </View>
        <View style={styles.accordionRight}>
          <Text
            style={[
              styles.accordionCount,
              { color: colors.textMuted },
            ]}
          >
            {category.items.length}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.accordionContent}>
          {category.isFamily
            ? (category.items as FamilyMember[]).map((member, idx) => (
                <FamilyMemberItem
                  key={idx}
                  member={member}
                  colors={colors}
                  isLast={idx === category.items.length - 1}
                  t={t}
                />
              ))
            : (category.items as string[]).map((item, idx) => (
                <IntelligenceItem
                  key={idx}
                  text={item}
                  color={category.color}
                  colors={colors}
                  isLast={idx === category.items.length - 1}
                />
              ))}
        </View>
      )}
    </View>
  );
}

function IntelligenceItem({
  text,
  color,
  colors,
  isLast,
}: {
  text: string;
  color: string;
  colors: any;
  isLast: boolean;
}) {
  return (
    <View
      style={[
        styles.intelligenceItem,
        !isLast && { marginBottom: 8 },
      ]}
    >
      <View style={[styles.bullet, { backgroundColor: color }]} />
      <Text
        style={[styles.intelligenceText, { color: colors.textSecondary }]}
      >
        {text}
      </Text>
    </View>
  );
}

function FamilyMemberItem({
  member,
  colors,
  isLast,
  t,
}: {
  member: FamilyMember;
  colors: any;
  isLast: boolean;
  t: (key: string) => string;
}) {
  return (
    <View
      style={[
        styles.familyItem,
        !isLast && { marginBottom: 12 },
      ]}
    >
      <View style={styles.familyHeader}>
        <Text style={[styles.familyName, { color: colors.text }]}>
          {member.name}
        </Text>
        <View
          style={[
            styles.relationBadge,
            { backgroundColor: `${colors.primary}20` },
          ]}
        >
          <Text
            style={[styles.relationText, { color: colors.primary }]}
          >
            {member.relation}
          </Text>
        </View>
      </View>
      {(member.age || member.occupation) && (
        <Text
          style={[
            styles.familyMeta,
            { color: colors.textMuted },
          ]}
        >
          {[member.age ? `${member.age}${t('contact.intelligence.ageSuffix')}` : '', member.occupation]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      )}
      {member.notes && (
        <Text
          style={[
            styles.familyNotes,
            { color: colors.textSecondary },
          ]}
        >
          {member.notes}
        </Text>
      )}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon as any} size={20} color={colors.textMuted} />
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>{value}</Text>
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  profileCard: {
    margin: 16,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    color: '#0a0a0a',
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  notesCard: {
    borderRadius: 16,
    padding: 16,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  intelligenceCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  accordionItem: {
    paddingHorizontal: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  accordionContent: {
    paddingBottom: 16,
  },
  intelligenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 44,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  intelligenceText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  familyItem: {
    marginLeft: 44,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.05)',
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  familyName: {
    fontSize: 15,
    fontWeight: '600',
  },
  relationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  relationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  familyMeta: {
    fontSize: 13,
    marginBottom: 4,
  },
  familyNotes: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

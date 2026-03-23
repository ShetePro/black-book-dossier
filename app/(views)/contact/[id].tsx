import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useContact } from '@/hooks/contact';
import { DefaultAvatar } from '@/components/DefaultAvatar';
import { ContactSkeleton } from '@/components/contact/ContactSkeleton';

export default function ContactDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colors = useThemeColor();
  const { contact, isLoading } = useContact(id as string);
  
  const scrollY = useSharedValue(0);
  
  const headerStyle = useAnimatedStyle(() => ({
    opacity: 1 - scrollY.value / 200,
    transform: [{ translateY: -scrollY.value / 2 }],
  }));

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
          <Text style={[styles.errorText, { color: colors.text }]}>联系人不存在</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary }}>返回</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>联系方式</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            {contact.phone && <InfoRow icon="call" label="电话" value={contact.phone} colors={colors} />}
            {contact.email && <InfoRow icon="mail" label="邮箱" value={contact.email} colors={colors} />}
            {contact.company && <InfoRow icon="business" label="公司" value={contact.company} colors={colors} />}
          </View>
        </View>

        {contact.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>备忘录</Text>
            <View style={[styles.notesCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>{contact.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
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
});

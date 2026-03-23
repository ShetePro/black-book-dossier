import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useContacts } from '@/hooks/contact';
import { ContactList } from '@/components/contact';
import { Contact } from '@/types';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ContactsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { contacts, isLoading, refresh } = useContacts();

  const headerY = useSharedValue(-20);
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerY.value = withSpring(0, { damping: 15 });
    headerOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOpacity.value,
  }));

  const handleContactPress = (contact: Contact) => {
    router.push(`/(views)/contact/${contact.id}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('contacts.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {contacts.length > 0
              ? `${contacts.length} ${t('contacts.all')}`
              : t('contacts.noContacts')}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(views)/recording')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#0a0a0a" />
        </TouchableOpacity>
      </Animated.View>

      <AnimatedTouchable
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <Text style={[styles.searchText, { color: colors.textMuted }]}>
          {t('contacts.search')}
        </Text>
      </AnimatedTouchable>

      <ContactList
        contacts={contacts}
        isLoading={isLoading}
        onRefresh={refresh}
        onContactPress={handleContactPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: 'Georgia',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  searchText: {
    fontSize: 15,
    flex: 1,
  },
});

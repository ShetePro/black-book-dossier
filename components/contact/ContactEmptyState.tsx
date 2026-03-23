import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';

export const ContactEmptyState: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}
        >
          <Ionicons name="people-outline" size={56} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {t('contacts.noContacts')}
        </Text>

        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t('contacts.addByRecording')}
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(views)/recording')}
          activeOpacity={0.9}
        >
          <Ionicons name="mic" size={20} color="#0a0a0a" />
          <Text style={styles.buttonText}>{t('recording.holdToRecord')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  card: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    borderStyle: 'dashed',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    gap: 10,
    shadowColor: '#c9a962',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0a0a0a',
  },
});

export default ContactEmptyState;

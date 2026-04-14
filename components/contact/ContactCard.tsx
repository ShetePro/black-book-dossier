import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Contact } from '@/types';
import { DefaultAvatar } from '@/components/DefaultAvatar';

interface ContactCardProps {
  contact: Contact;
  onPress?: (contact: Contact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onPress }) => {
  const colors = useThemeColor();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={() => onPress?.(contact)}
      activeOpacity={0.7}
    >
      <DefaultAvatar nickname={contact.name} size={44} />

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {contact.name}
          </Text>
          {contact.priority === 'high' && (
            <View style={[styles.priorityBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={[styles.priorityText, { color: '#ef4444' }]}>重要</Text>
            </View>
          )}
        </View>

        {(contact.title || contact.company) && (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {[contact.title, contact.company].filter(Boolean).join(' · ')}
          </Text>
        )}

        {contact.tags && contact.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {contact.tags.slice(0, 2).map((tag, index) => (
              <View
                key={index}
                style={[
                  styles.tag,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {contact.tags.length > 2 && (
              <Text style={[styles.moreTags, { color: colors.textMuted }]}>
                +{contact.tags.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    marginBottom: 5,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreTags: {
    fontSize: 10,
  },
});

export default ContactCard;

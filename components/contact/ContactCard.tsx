import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Contact } from '@/types';

interface ContactCardProps {
  contact: Contact;
  onPress?: (contact: Contact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onPress }) => {
  const colors = useThemeColor();

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return colors.textMuted;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={() => onPress?.(contact)}
      activeOpacity={0.8}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>
          {contact.name}
        </Text>
        
        {(contact.title || contact.company) && (
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {[contact.title, contact.company].filter(Boolean).join(' · ')}
          </Text>
        )}

        {contact.tags && contact.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {contact.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={[
                  styles.tag,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {contact.tags.length > 3 && (
              <Text style={[styles.moreTags, { color: colors.textMuted }]}>
                +{contact.tags.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>

      <View
        style={[
          styles.priorityIndicator,
          { backgroundColor: getPriorityColor(contact.priority) },
        ]}
      />

      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreTags: {
    fontSize: 11,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
});

export default ContactCard;

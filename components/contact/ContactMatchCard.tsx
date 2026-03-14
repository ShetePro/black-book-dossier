import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Contact } from '@/types';
import { ThemedText } from '@/components/ThemedText';

interface ContactMatchCardProps {
  contact: Contact;
  confidence: number;
  reason: string;
  isSelected: boolean;
  onPress: () => void;
  primaryColor?: string;
  elevatedColor?: string;
  borderColor?: string;
}

export const ContactMatchCard: React.FC<ContactMatchCardProps> = ({
  contact,
  confidence,
  reason,
  isSelected,
  onPress,
  primaryColor = '#c9a962',
  elevatedColor = '#1a1a1a',
  borderColor = '#2a2a2a',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { 
          backgroundColor: isSelected 
            ? `${primaryColor}15` 
            : elevatedColor 
        },
        isSelected && { 
          borderColor: primaryColor,
          borderWidth: 1.5,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
        <ThemedText style={styles.avatarText}>
          {contact.name.charAt(0)}
        </ThemedText>
      </View>
      
      <View style={styles.info}>
        <ThemedText style={styles.name}>
          {contact.name}
        </ThemedText>
        <ThemedText style={[styles.meta, { color: '#737373' }]}>
          {contact.company || '无公司'} · {contact.title || '无职位'}
        </ThemedText>
        <View style={[styles.confidenceBadge, { backgroundColor: `${primaryColor}15` }]}>
          <Ionicons name="flash" size={12} color={primaryColor} />
          <ThemedText style={[styles.confidenceText, { color: primaryColor }]}>
            {Math.round(confidence * 100)}% · {reason}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.checkbox}>
        {isSelected ? (
          <View style={[styles.checkboxActive, { backgroundColor: primaryColor }]}>
            <Ionicons name="checkmark" size={16} color="#0a0a0a" />
          </View>
        ) : (
          <View style={[styles.checkboxInactive, { borderColor: borderColor }]} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#f5f5f5',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkbox: {
    marginLeft: 8,
  },
  checkboxActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInactive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
});

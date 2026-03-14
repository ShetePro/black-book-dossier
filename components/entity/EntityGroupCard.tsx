import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExtractedEntity } from '@/types';
import { ThemedText } from '@/components/ThemedText';

interface EntityConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

interface EntityGroupCardProps {
  type: string;
  entities: ExtractedEntity[];
  config: EntityConfig;
}

export const EntityGroupCard: React.FC<EntityGroupCardProps> = ({
  type,
  entities,
  config,
}) => {
  return (
    <View style={styles.card}>
      <View style={[styles.header, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon as any} size={16} color={config.color} />
        <ThemedText style={[styles.typeLabel, { color: config.color }]}>
          {config.label}
        </ThemedText>
        <View style={[styles.count, { backgroundColor: config.color }]}>
          <ThemedText style={styles.countText}>{entities.length}</ThemedText>
        </View>
      </View>
      
      <View style={styles.itemsContainer}>
        {entities.map((entity, idx) => (
          <View key={idx} style={styles.item}>
            <View style={styles.itemContent}>
              <ThemedText style={styles.entityValue}>
                {entity.value}
              </ThemedText>
              {entity.context && entity.context !== entity.value && (
                <ThemedText style={styles.entityContext}>
                  {entity.context}
                </ThemedText>
              )}
            </View>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { 
                    width: `${entity.confidence * 100}%`,
                    backgroundColor: entity.confidence > 0.7 ? '#10b981' : 
                                    entity.confidence > 0.4 ? '#f59e0b' : '#ef4444'
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  count: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  itemsContainer: {
    padding: 12,
    gap: 10,
  },
  item: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 12,
  },
  itemContent: {
    marginBottom: 8,
  },
  entityValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f5f5f5',
  },
  entityContext: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    color: '#a3a3a3',
  },
  confidenceBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});

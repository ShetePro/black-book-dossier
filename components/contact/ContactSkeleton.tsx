import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ContactSkeletonProps {
  count?: number;
}

export const ContactSkeleton: React.FC<ContactSkeletonProps> = ({ count = 3 }) => {
  const colors = useThemeColor();

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Animated.View
          key={index}
          entering={FadeIn.delay(index * 100)}
          layout={Layout.springify()}
          style={[
            styles.skeleton,
            { backgroundColor: colors.surface },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.elevated },
            ]}
          />
          <View style={styles.content}>
            <View
              style={[
                styles.line,
                { backgroundColor: colors.elevated, width: '60%' },
              ]}
            />
            <View
              style={[
                styles.line,
                { backgroundColor: colors.elevated, width: '40%', marginTop: 8 },
              ]}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  line: {
    height: 16,
    borderRadius: 4,
  },
});

export default ContactSkeleton;

import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export const LoadingDots: React.FC = () => {
  const opacity1 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0.3)).current;
  const opacity3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      // 创建循环动画序列
      Animated.sequence([
        // 第一个点亮
        Animated.timing(opacity1, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity3, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        
        // 第二个点亮
        Animated.timing(opacity1, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity2, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity3, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        
        // 第三个点亮
        Animated.timing(opacity1, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity3, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => animate()); // 循环
    };
    
    animate();
    
    return () => {
      opacity1.stopAnimation();
      opacity2.stopAnimation();
      opacity3.stopAnimation();
    };
  }, []);

  return (
    <Text style={styles.container}>
      <Animated.Text style={{ opacity: opacity1 }}>.</Animated.Text>
      <Animated.Text style={{ opacity: opacity2 }}>.</Animated.Text>
      <Animated.Text style={{ opacity: opacity3 }}>.</Animated.Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    fontSize: 16,
    color: '#c9a962', // 金色
    marginLeft: 4,
  },
});

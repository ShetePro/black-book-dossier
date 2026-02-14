import React, { useEffect } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CenterTabBarButton() {
  const colors = useThemeColor();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.6);

  // 脉冲动画
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1500 }),
        withTiming(0.6, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    router.push("/(views)/recording");
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <View style={styles.container}>
      {/* 外层光晕脉冲 */}
      <Animated.View 
        style={[
          styles.pulseRing,
          pulseStyle,
          { backgroundColor: colors.primary + '30' }
        ]} 
      />
      
      {/* 按钮主体 */}
      <AnimatedPressable
        style={[
          styles.button,
          animatedStyle,
          { 
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          }
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Ionicons name="mic" size={32} color="#0a0a0a" />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -32,
    left: "50%",
    marginLeft: -32,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    // 金色光晕阴影
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    // 内发光边框
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
});

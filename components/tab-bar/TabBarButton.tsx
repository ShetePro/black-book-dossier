import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, type ComponentProps } from "react";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  Extrapolate,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";

interface TabBarButtonProps {
  routeName: string;
  onPress: () => void;
  onLongPress: () => void;
  label: string;
  isFocused: boolean;
}

// 图标映射
const icons: Record<string, ComponentProps<typeof Ionicons>["name"]> = {
  index: "home-outline",
  "index-fill": "home",
  contacts: "people-outline",
  "contacts-fill": "people",
  history: "time-outline",
  "history-fill": "time",
  user: "person-outline",
  "user-fill": "person",
  charts: "stats-chart-outline",
  "charts-fill": "stats-chart",
};

export default function TabBarButton({
  onLongPress,
  onPress,
  label,
  routeName,
  isFocused,
}: TabBarButtonProps) {
  const colors = useThemeColor();
  const scale = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 250,
    });
  }, [scale, isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(
      scale.value,
      [0, 1],
      [1, 0.85],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [{ scale: scaleValue }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scale.value,
      [0, 1],
      [1, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity,
    };
  });

  const iconName = isFocused 
    ? icons[`${routeName}-fill`] || icons[routeName] 
    : icons[routeName];

  // 暗夜金奢配色
  const activeColor = colors.primary; // 金色
  const inactiveColor = colors.textMuted; // 柔和灰
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabBarItem}
    >
      <Animated.View style={animatedIconStyle}>
        <Ionicons
          name={iconName}
          size={26}
          color={color}
        />
      </Animated.View>
      
      <Animated.Text 
        style={[
          styles.label,
          { color },
          animatedTextStyle,
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});

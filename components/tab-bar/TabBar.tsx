import {
  View,
  StyleSheet,
  Dimensions,
  useColorScheme,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useCallback, useEffect } from "react";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";
import TabBarButton from "@/components/tab-bar/TabBarButton";
import CenterTabBarButton from "@/components/tab-bar/CenterTabBarButton";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 暗夜金奢 TabBar 配置
const TAB_BAR_CONFIG = {
  height: 72,
  borderRadius: 32,
  horizontalPadding: 8,
  itemSpacing: 6,
  blurIntensity: 50,
};

export default function TabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = useThemeColor();
  const isDark = colorScheme === 'dark';
  
  // 动画值
  const indicatorPosition = useSharedValue(0);
  const tabWidth = (SCREEN_WIDTH - 64 - TAB_BAR_CONFIG.itemSpacing * (state.routes.length - 1)) / state.routes.length;
  
  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(indicatorPosition.value, {
        damping: 20,
        stiffness: 180,
      }) }
    ],
  }));

  const handlePress = useCallback((index: number) => {
    const route = state.routes[index];
    const isFocused = state.index === index;
    
    indicatorPosition.value = index * (tabWidth + TAB_BAR_CONFIG.itemSpacing);

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }, [navigation, state.routes, state.index, tabWidth, indicatorPosition]);

  useEffect(() => {
    indicatorPosition.value = state.index * (tabWidth + TAB_BAR_CONFIG.itemSpacing);
  }, [state.index, tabWidth, indicatorPosition]);

  // 暗夜金奢配色
  const blurTint = isDark ? 'dark' : 'light';
  const backgroundColor = isDark ? 'rgba(20, 20, 20, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  const indicatorColor = colors.primary + '25'; // 金色半透明
  const borderColor = isDark ? 'rgba(201, 169, 98, 0.2)' : 'rgba(201, 169, 98, 0.3)';

  return (
    <View style={styles.container}>
      {/* 光晕背景 */}
      <View style={[styles.glow, { 
        shadowColor: colors.primary,
        shadowOpacity: isDark ? 0.15 : 0.1,
      }]} />
      
      <BlurView
        intensity={TAB_BAR_CONFIG.blurIntensity}
        tint={blurTint}
        style={[styles.blurContainer, { 
          backgroundColor,
          borderColor,
        }]}
      >
        {/* 金色活跃指示器 */}
        <Animated.View 
          style={[
            styles.activeIndicator,
            { 
              width: tabWidth, 
              backgroundColor: indicatorColor,
              borderColor: colors.primary + '40',
            },
            indicatorAnimatedStyle,
          ]} 
        />
        
        {/* Tab 按钮 */}
        <View style={styles.tabsContainer}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const label = t(`tabs.${route.name}`);

            return (
              <TabBarButton
                key={route.name}
                routeName={route.name}
                onPress={() => handlePress(index)}
                onLongPress={() => {
                  navigation.emit({
                    type: "tabLongPress",
                    target: route.key,
                  });
                }}
                label={label as string}
                isFocused={isFocused}
              />
            );
          })}
        </View>
      </BlurView>
      
      {/* 中央悬浮按钮 */}
      <CenterTabBarButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  glow: {
    position: "absolute",
    bottom: -10,
    left: 20,
    right: 20,
    height: 60,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 30,
    elevation: 10,
  },
  blurContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: TAB_BAR_CONFIG.height,
    borderRadius: TAB_BAR_CONFIG.borderRadius,
    paddingHorizontal: TAB_BAR_CONFIG.horizontalPadding,
    overflow: "hidden",
    borderWidth: 1,
    // 内阴影效果
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  activeIndicator: {
    position: "absolute",
    height: 52,
    borderRadius: 24,
    left: TAB_BAR_CONFIG.horizontalPadding,
    borderWidth: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
  },
});

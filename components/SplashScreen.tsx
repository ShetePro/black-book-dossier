import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Appearance,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  isReady: boolean;
  onAnimationComplete: () => void;
}

export function CustomSplashScreen({
  isReady,
  onAnimationComplete,
}: SplashScreenProps) {
  const colorScheme = Appearance.getColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  
  // 动画值
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(15)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  
  const [showLoader, setShowLoader] = useState(false);

  // 入场动画
  useEffect(() => {
    Animated.sequence([
      // Logo 渐显 + 缩放
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 35,
          useNativeDriver: true,
        }),
      ]),
      
      // 标题进入
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      // 副标题进入
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLoader(true);
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // 退出动画
  useEffect(() => {
    if (isReady) {
      setTimeout(() => {
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onAnimationComplete();
        });
      }, 400);
    }
  }, [isReady]);

  // 渐变背景色
  const gradientColors = isDark
    ? ["#1e1b4b", "#312e81", "#1e1b4b"] as const
    : ["#4f46e5", "#6366f1", "#818cf8"] as const;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* 渐变背景 */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 柔和的装饰圆环 */}
      <View style={styles.decorations} pointerEvents="none">
        <View style={[styles.ring1, { borderColor: "rgba(255,255,255,0.1)" }]} />
        <View style={[styles.ring2, { borderColor: "rgba(255,255,255,0.08)" }]} />
        <View style={[styles.ring3, { borderColor: "rgba(255,255,255,0.05)" }]} />
      </View>

      {/* 主要内容 */}
      <View style={styles.content}>
        {/* Logo - 直接显示，无背景 wrapper */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            contentFit="cover"
            transition={300}
          />
        </Animated.View>

        {/* 品牌名称 */}
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          <Text style={styles.title}>Black Book</Text>
        </Animated.View>

        {/* 副标题 */}
        <Animated.View style={{ opacity: subtitleOpacity }}>
          <Text style={styles.subtitle}>您的私人情报系统</Text>
          <Text style={styles.subtitleEn}>Your Private Intelligence</Text>
        </Animated.View>
      </View>

      {/* 底部加载区域 */}
      <Animated.View
        style={[
          styles.footer,
          { opacity: loaderOpacity },
        ]}
      >
        {showLoader && (
          <>
            <ActivityIndicator
              size="small"
              color="rgba(255,255,255,0.9)"
              style={styles.loader}
            />
            <Text style={styles.loadingText}>
              {isReady ? "准备就绪" : "正在初始化..."}
            </Text>
          </>
        )}
      </Animated.View>

      {/* 版本号 */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  decorations: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  ring1: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    borderWidth: 1,
  },
  ring2: {
    position: "absolute",
    width: width * 1.0,
    height: width * 1.0,
    borderRadius: width * 0.5,
    borderWidth: 1,
  },
  ring3: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    borderWidth: 0.5,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 24,
    // 无背景色，直接显示图标
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    // 添加微妙的阴影让图标有层次感
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.95)",
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitleEn: {
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  footer: {
    position: "absolute",
    bottom: 100,
    alignItems: "center",
  },
  loader: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },
  versionContainer: {
    position: "absolute",
    bottom: 40,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.5)",
  },
});

export default CustomSplashScreen;

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StatusBar } from "expo-status-bar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function RecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const waveAnimation = useSharedValue(0);
  
  // 5个波形条的动画值
  const waveValues = Array.from({ length: 5 }, () => useSharedValue(1));

  // 波形条动画样式
  const getWaveBarStyle = (index: number) => {
    return useAnimatedStyle(() => ({
      transform: [{ scaleY: waveValues[index].value }],
      height: 40 + index * 10,
    }));
  };

  // 启动波形动画
  const startWaveAnimation = useCallback(() => {
    waveValues.forEach((value, index) => {
      value.value = withRepeat(
        withSequence(
          withTiming(0.5 + Math.random() * 0.3, { duration: 300 + index * 50 }),
          withTiming(1.2 + Math.random() * 0.3, { duration: 300 + index * 50 })
        ),
        -1,
        true
      );
    });
  }, []);

  // 停止波形动画
  const stopWaveAnimation = useCallback(() => {
    waveValues.forEach((value) => {
      value.value = withTiming(1);
    });
  }, []);

  // 开始录音动画
  const startRecordingAnimation = useCallback(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
    waveAnimation.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      false
    );
    startWaveAnimation();
  }, [startWaveAnimation]);

  // 停止录音动画
  const stopRecordingAnimation = useCallback(() => {
    pulseScale.value = withTiming(1);
    waveAnimation.value = 0;
    stopWaveAnimation();
  }, [stopWaveAnimation]);

  // 处理录音按钮按下
  const handlePressIn = () => {
    micScale.value = withSpring(0.9, { damping: 20 });
  };

  // 处理录音按钮松开
  const handlePressOut = () => {
    micScale.value = withSpring(1, { damping: 20 });
  };

  // 开始/停止录音
  const toggleRecording = async () => {
    if (isRecording) {
      // 停止录音
      setIsRecording(false);
      stopRecordingAnimation();
      setIsAnalyzing(true);
      
      // 模拟 AI 分析
      setTimeout(() => {
        setIsAnalyzing(false);
        // 导航到联系人详情或创建页面
        router.push("/(views)/contact/new");
      }, 2000);
    } else {
      // 开始录音
      setIsRecording(true);
      startRecordingAnimation();
      setRecordingDuration(0);
    }
  };

  // 录音时长计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 0.3 + (pulseScale.value - 1) * 0.5,
  }));

  const micStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + waveAnimation.value * 0.5 }],
    opacity: 1 - waveAnimation.value,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {isAnalyzing 
            ? t("recording.aiAnalyzing") 
            : isRecording 
              ? t("recording.listening") 
              : t("recording.recordIntelligence")
          }
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* 录音状态显示 */}
      <View style={styles.content}>
        {isAnalyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.analyzingText, { color: colors.textSecondary }]}>
              {t("recording.aiAnalyzing")}
            </Text>
          </View>
        ) : (
          <>
            {/* 录音波形可视化 */}
            <View style={styles.waveContainer}>
              {Array.from({ length: 5 }, (_, i) => {
                const waveBarStyle = getWaveBarStyle(i);
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        backgroundColor: isRecording ? colors.primary : colors.surface,
                      },
                      isRecording && waveBarStyle,
                    ]}
                  />
                );
              })}
            </View>

            {/* 录音提示文字 */}
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {isRecording 
                ? t("recording.releaseToComplete") 
                : t("recording.holdToRecord")
              }
            </Text>

            {/* 录音时长 */}
            {isRecording && (
              <Text style={[styles.duration, { color: colors.primary }]}>
                {Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:
                {(recordingDuration % 60).toString().padStart(2, "0")}
              </Text>
            )}
          </>
        )}
      </View>

      {/* 底部录音按钮 */}
      {!isAnalyzing && (
        <View style={styles.bottomContainer}>
          <View style={styles.micContainer}>
            {/* 脉冲光圈 */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  { backgroundColor: colors.primary },
                  pulseStyle,
                ]}
              />
            )}
            
            {/* 波纹效果 */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.waveRing,
                  { borderColor: colors.primary },
                  waveStyle,
                ]}
              />
            )}
            
            {/* 录音按钮 */}
            <Animated.View style={micStyle}>
              <TouchableOpacity
                onPress={toggleRecording}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.8}
                style={[
                  styles.micButton,
                  {
                    backgroundColor: isRecording ? colors.danger : colors.primary,
                    shadowColor: isRecording ? colors.danger : colors.primary,
                  },
                ]}
              >
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={36}
                  color="#0a0a0a"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  analyzingContainer: {
    alignItems: "center",
    gap: 20,
  },
  analyzingText: {
    fontSize: 16,
    marginTop: 16,
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 120,
    marginBottom: 40,
  },
  waveBar: {
    width: 8,
    borderRadius: 4,
    height: 40,
  },
  hint: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  duration: {
    fontSize: 48,
    fontWeight: "300",
    fontVariant: ["tabular-nums"],
  },
  bottomContainer: {
    paddingBottom: 60,
    alignItems: "center",
  },
  micContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  waveRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});

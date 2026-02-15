import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  GestureResponderEvent,
  Animated as RNAnimated,
  PanResponder,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function RecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [waveHeights, setWaveHeights] = useState([40, 50, 35, 55, 45]);
  
  // 录音模式：true = 按住说话，false = 切换说话
  const [isHoldMode, setIsHoldMode] = useState(true);
  
  // 是否在取消区域
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const waveAnimation = useSharedValue(0);
  const cancelOpacity = useSharedValue(0);
  
  // 取消区域的 ref
  const cancelZoneRef = useRef<View>(null);
  const micButtonRef = useRef<View>(null);

  // 波形动画效果
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setWaveHeights(
          Array.from({ length: 5 }, () => 30 + Math.random() * 50)
        );
      }, 200);
    } else {
      setWaveHeights([40, 50, 35, 55, 45]);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

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
  }, []);

  // 停止录音动画
  const stopRecordingAnimation = useCallback(() => {
    pulseScale.value = withTiming(1);
    waveAnimation.value = 0;
    cancelOpacity.value = withTiming(0);
  }, []);

  // 开始录音
  const startRecording = useCallback(() => {
    setIsRecording(true);
    startRecordingAnimation();
    setRecordingDuration(0);
    if (isHoldMode) {
      cancelOpacity.value = withTiming(1);
    }
  }, [startRecordingAnimation, isHoldMode, cancelOpacity]);

  // 停止录音并保存
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopRecordingAnimation();
    setIsAnalyzing(true);
    
    // 模拟 AI 分析
    setTimeout(() => {
      setIsAnalyzing(false);
      router.push("/(views)/contact/new");
    }, 2000);
  }, [stopRecordingAnimation, router]);

  // 取消录音
  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    setIsInCancelZone(false);
    stopRecordingAnimation();
    setRecordingDuration(0);
    // 显示取消提示
    // 可以在这里添加一个 toast 提示
  }, [stopRecordingAnimation]);

  // 检查是否在取消区域
  const checkInCancelZone = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    
    cancelZoneRef.current?.measure((fx, fy, width, height, px, py) => {
      if (
        pageX >= px &&
        pageX <= px + width &&
        pageY >= py &&
        pageY <= py + height
      ) {
        setIsInCancelZone(true);
      } else {
        setIsInCancelZone(false);
      }
    });
  };

  // 处理录音按钮按下（按住说话模式）
  const handlePressIn = () => {
    micScale.value = withSpring(0.9, { damping: 20 });
    if (isHoldMode && !isRecording) {
      startRecording();
    }
  };

  // 处理录音按钮松开（按住说话模式）
  const handlePressOut = () => {
    micScale.value = withSpring(1, { damping: 20 });
    if (isHoldMode && isRecording) {
      if (isInCancelZone) {
        cancelRecording();
      } else {
        stopRecording();
      }
    }
  };

  // 处理拖动（按住说话模式）
  const handleMove = (event: GestureResponderEvent) => {
    if (isHoldMode && isRecording) {
      checkInCancelZone(event);
    }
  };

  // 切换说话模式：点击切换录音状态
  const handleTogglePress = () => {
    if (!isHoldMode) {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  // 切换模式下的取消按钮
  const handleToggleCancel = () => {
    if (!isHoldMode && isRecording) {
      cancelRecording();
    }
  };

  // 录音时长计时器
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: cancelOpacity.value,
    transform: [{ scale: isInCancelZone ? 1.2 : 1 }],
  }));

  // 获取提示文字
  const getHintText = () => {
    if (isRecording) {
      if (isHoldMode) {
        return isInCancelZone ? "松开取消" : t("recording.releaseToComplete");
      }
      return t("recording.recording");
    }
    return isHoldMode ? t("recording.holdToRecord") : t("recording.tapToRecord");
  };

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

      {/* 模式切换按钮 */}
      {!isRecording && !isAnalyzing && (
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              isHoldMode && [styles.modeButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setIsHoldMode(true)}
          >
            <Ionicons 
              name="hand-left" 
              size={16} 
              color={isHoldMode ? "#0a0a0a" : colors.text} 
            />
            <Text style={[
              styles.modeText,
              isHoldMode && { color: "#0a0a0a", fontWeight: "600" }
            ]}>
              按住说话
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              !isHoldMode && [styles.modeButtonActive, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setIsHoldMode(false)}
          >
            <Ionicons 
              name="toggle" 
              size={16} 
              color={!isHoldMode ? "#0a0a0a" : colors.text} 
            />
            <Text style={[
              styles.modeText,
              !isHoldMode && { color: "#0a0a0a", fontWeight: "600" }
            ]}>
              点击切换
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
              {waveHeights.map((height, i) => (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: isRecording ? colors.primary : colors.surface,
                      height: height,
                    },
                  ]}
                />
              ))}
            </View>

            {/* 录音提示文字 */}
            <Text style={[styles.hint, { 
              color: isInCancelZone ? colors.danger : colors.textMuted 
            }]}>
              {getHintText()}
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

      {/* 底部区域 */}
      {!isAnalyzing && (
        <View style={styles.bottomContainer}>
          {/* 取消区域 - 仅在按住模式录音时显示 */}
          {isHoldMode && isRecording && (
            <Animated.View 
              ref={cancelZoneRef}
              style={[
                styles.cancelZone,
                { 
                  backgroundColor: isInCancelZone 
                    ? `${colors.danger}40` 
                    : `${colors.danger}20`,
                  borderColor: isInCancelZone ? colors.danger : `${colors.danger}50`,
                },
                cancelStyle,
              ]}
            >
              <Ionicons 
                name="close-circle" 
                size={32} 
                color={isInCancelZone ? colors.danger : `${colors.danger}80`} 
              />
              <Text style={[styles.cancelText, { 
                color: isInCancelZone ? colors.danger : `${colors.danger}80` 
              }]}>
                拖动到此处取消
              </Text>
            </Animated.View>
          )}

          {/* 切换模式下的取消按钮 */}
          {!isHoldMode && isRecording && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.danger }]}
              onPress={handleToggleCancel}
            >
              <Ionicons name="close" size={24} color={colors.danger} />
              <Text style={[styles.cancelButtonText, { color: colors.danger }]}>
                取消
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.micContainer}>
            {/* 脉冲光圈 */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.pulseRing,
                  { backgroundColor: isInCancelZone ? colors.danger : colors.primary },
                  pulseStyle,
                ]}
              />
            )}
            
            {/* 波纹效果 */}
            {isRecording && (
              <Animated.View
                style={[
                  styles.waveRing,
                  { borderColor: isInCancelZone ? colors.danger : colors.primary },
                  waveStyle,
                ]}
              />
            )}
            
            {/* 录音按钮 */}
            <Animated.View 
              style={micStyle}
              onTouchMove={handleMove}
            >
              <TouchableOpacity
                ref={micButtonRef}
                onPress={handleTogglePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.8}
                style={[
                  styles.micButton,
                  {
                    backgroundColor: isRecording 
                      ? (isInCancelZone ? colors.danger : colors.primary) 
                      : colors.primary,
                    shadowColor: isRecording 
                      ? (isInCancelZone ? colors.danger : colors.primary) 
                      : colors.primary,
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
  modeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
  modeButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modeText: {
    fontSize: 14,
    color: "#666",
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
    gap: 20,
  },
  cancelZone: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 20,
  },
  cancelText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
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

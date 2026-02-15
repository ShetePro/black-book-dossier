import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
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
import { Audio } from "expo-av";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 音频可视化配置
const WAVE_BAR_COUNT = 5;
const MIN_BAR_HEIGHT = 20;
const MAX_BAR_HEIGHT = 100;
const UPDATE_INTERVAL = 50; // 更新频率 50ms

export default function RecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [waveHeights, setWaveHeights] = useState(
    Array(WAVE_BAR_COUNT).fill(40)
  );
  
  // 录音模式：true = 按住说话，false = 切换说话
  const [isHoldMode, setIsHoldMode] = useState(true);
  
  // 是否在取消区域
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  
  // 音频录制引用
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 取消区域的布局信息
  const cancelZoneLayout = useRef<{ 
    x: number; 
    y: number; 
    width: number; 
    height: number 
  } | null>(null);
  
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const waveAnimation = useSharedValue(0);
  const cancelOpacity = useSharedValue(0);

  // 将音频电平转换为波形高度
  const meteringToHeight = (metering: number): number => {
    // metering 范围通常是 -160 到 0 dB
    // 将其映射到 MIN_BAR_HEIGHT 到 MAX_BAR_HEIGHT
    const normalized = Math.max(0, (metering + 160) / 160); // 0 到 1
    return MIN_BAR_HEIGHT + normalized * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
  };

  // 请求麦克风权限
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("请求麦克风权限失败:", error);
      return false;
    }
  };

  // 开始音频录制
  const startAudioRecording = async () => {
    try {
      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 创建录音实例
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100 // 每100ms更新一次metering
      );

      recordingRef.current = recording;

      // 开始实时获取音频电平
      meteringIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording) {
            const metering = status.metering ?? -160;
            const baseHeight = meteringToHeight(metering);
            
            // 为每个波形条生成略有不同的高度，形成波浪效果
            const newHeights = Array.from({ length: WAVE_BAR_COUNT }, (_, i) => {
              const variation = Math.sin(Date.now() / 200 + i * 0.5) * 10;
              return Math.max(MIN_BAR_HEIGHT, Math.min(MAX_BAR_HEIGHT, baseHeight + variation));
            });
            
            setWaveHeights(newHeights);
          }
        }
      }, UPDATE_INTERVAL);

      return true;
    } catch (error) {
      console.error("开始录音失败:", error);
      return false;
    }
  };

  // 停止音频录制
  const stopAudioRecording = async (): Promise<string | null> => {
    try {
      // 清除metering定时器
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
        meteringIntervalRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        recordingRef.current = null;
        return uri;
      }
      return null;
    } catch (error) {
      console.error("停止录音失败:", error);
      return null;
    }
  };

  // 取消音频录制
  const cancelAudioRecording = async () => {
    try {
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
        meteringIntervalRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (error) {
      console.error("取消录音失败:", error);
    }
  };

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
    // 重置波形
    setWaveHeights(Array(WAVE_BAR_COUNT).fill(40));
  }, []);

  // 开始录音
  const startRecording = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      alert("需要麦克风权限才能录音");
      return;
    }

    const started = await startAudioRecording();
    if (started) {
      setIsRecording(true);
      startRecordingAnimation();
      setRecordingDuration(0);
      if (isHoldMode) {
        cancelOpacity.value = withTiming(1);
      }
    }
  }, [startRecordingAnimation, isHoldMode, cancelOpacity]);

  // 停止录音并保存
  const stopRecording = useCallback(async () => {
    const uri = await stopAudioRecording();
    setIsRecording(false);
    stopRecordingAnimation();
    
    if (uri) {
      setIsAnalyzing(true);
      
      // 模拟 AI 分析
      setTimeout(() => {
        setIsAnalyzing(false);
        router.push("/(views)/contact/new");
      }, 2000);
    }
  }, [stopRecordingAnimation, router]);

  // 取消录音
  const cancelRecording = useCallback(async () => {
    await cancelAudioRecording();
    setIsRecording(false);
    setIsInCancelZone(false);
    stopRecordingAnimation();
    setRecordingDuration(0);
  }, [stopRecordingAnimation]);

  // 检查是否在取消区域
  const checkInCancelZone = useCallback((pageX: number, pageY: number) => {
    if (!cancelZoneLayout.current) return false;
    
    const { x, y, width, height } = cancelZoneLayout.current;
    return pageX >= x && pageX <= x + width && pageY >= y && pageY <= y + height;
  }, []);

  // 处理取消区域布局变化
  const onCancelZoneLayout = (event: any) => {
    const viewRef = event.target;
    if (viewRef) {
      viewRef.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
        cancelZoneLayout.current = { x: px, y: py, width: w, height: h };
      });
    }
  };

  // 创建 PanResponder 用于按住模式的拖动检测
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => isHoldMode && !isRecording,
      onMoveShouldSetPanResponder: () => isHoldMode && isRecording,
      onPanResponderGrant: () => {
        if (isHoldMode && !isRecording) {
          startRecording();
          micScale.value = withSpring(0.9, { damping: 20 });
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (isHoldMode && isRecording) {
          const inCancelZone = checkInCancelZone(gestureState.moveX, gestureState.moveY);
          setIsInCancelZone(inCancelZone);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isHoldMode && isRecording) {
          micScale.value = withSpring(1, { damping: 20 });
          
          const inCancelZone = checkInCancelZone(gestureState.moveX, gestureState.moveY);
          
          if (inCancelZone) {
            cancelRecording();
          } else {
            stopRecording();
          }
        }
      },
      onPanResponderTerminate: () => {
        if (isHoldMode && isRecording) {
          micScale.value = withSpring(1, { damping: 20 });
          cancelRecording();
        }
      },
    });
  }, [isHoldMode, isRecording, startRecording, stopRecording, cancelRecording, checkInCancelZone, micScale]);

  // 处理录音按钮按下（切换模式）
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

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

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
        return isInCancelZone ? t("recording.releaseToCancel") : t("recording.releaseToComplete");
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
            {/* 录音波形可视化 - 真实音频 */}
            <View style={styles.waveContainer}>
              {waveHeights.map((height, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      backgroundColor: isRecording ? colors.primary : colors.surface,
                      height: height,
                      transform: [{ scaleY: isRecording ? 1 : 0.3 }],
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
              onLayout={onCancelZoneLayout}
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
                {t("recording.dragToCancel")}
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
                {t("common.cancel")}
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
            <Animated.View style={micStyle}>
              <View
                {...(isHoldMode ? panResponder.panHandlers : {})}
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
                <TouchableOpacity
                  onPress={handleTogglePress}
                  disabled={isHoldMode}
                  activeOpacity={0.8}
                  style={styles.micButtonInner}
                >
                  <Ionicons
                    name={isRecording ? "stop" : "mic"}
                    size={36}
                    color="#0a0a0a"
                  />
                </TouchableOpacity>
              </View>
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
    minHeight: 20,
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
  micButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: "center",
    justifyContent: "center",
  },
});

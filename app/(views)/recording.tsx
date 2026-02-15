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
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 波形配置 - 独立的音频条
const WAVE_BAR_COUNT = 30; // 波形条数量
const WAVE_WIDTH = SCREEN_WIDTH * 0.85; // 波形总宽度
const BAR_WIDTH = 4; // 单个条宽度
const BAR_GAP = 3; // 条间距
const MIN_BAR_HEIGHT = 6; // 最小高度
const MAX_BAR_HEIGHT = 120; // 最大高度（更大更明显）
const UPDATE_INTERVAL = 50; // 更新频率 50ms

// 平滑因子 - 用于平滑过渡
const SMOOTHING_FACTOR = 0.3;

// 音频电平转换为条高度
const meteringToBarHeight = (metering: number): number => {
  // metering 范围 -160 到 0 dB
  const normalized = Math.max(0, (metering + 160) / 160);
  // 使用指数曲线让小声更明显
  const amplified = Math.pow(normalized, 0.6);
  return MIN_BAR_HEIGHT + amplified * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
};

export default function RecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
    // 波形条数据 - 每个条独立
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT)
  );
  
  // 目标高度（用于平滑过渡）
  const targetHeightsRef = useRef<number[]>(Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT));
  
  // 录音模式
  const [isHoldMode, setIsHoldMode] = useState(true);
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  
  // 引用
  const recordingRef = useRef<Audio.Recording | null>(null);
  const meteringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelZoneLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // 动画值
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const waveAnimation = useSharedValue(0);
  const cancelOpacity = useSharedValue(0);

  // 更新波形条高度 - 根据音频电平，每条独立变化
  const updateBarHeights = (metering: number) => {
    const targetHeight = meteringToBarHeight(metering);
    
    // 为每个条设置不同的目标高度，创造自然的波形效果
    const newTargets = Array.from({ length: WAVE_BAR_COUNT }, (_, i) => {
      // 中间位置的条变化最大，两边的变化较小
      const centerOffset = Math.abs(i - WAVE_BAR_COUNT / 2) / (WAVE_BAR_COUNT / 2);
      const dampening = 1 - centerOffset * 0.4; // 两边最多减少40%
      
      // 添加随机变化，让波形更自然
      const randomVariation = (Math.random() - 0.5) * 20;
      
      return Math.max(
        MIN_BAR_HEIGHT,
        Math.min(MAX_BAR_HEIGHT, targetHeight * dampening + randomVariation)
      );
    });
    
    targetHeightsRef.current = newTargets;
  };
  
  // 平滑过渡动画帧
  const animateBars = () => {
    setBarHeights((prev) => {
      return prev.map((current, i) => {
        const target = targetHeightsRef.current[i];
        // 线性插值平滑过渡
        const smoothed = current + (target - current) * SMOOTHING_FACTOR;
        return smoothed;
      });
    });
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        50
      );

      recordingRef.current = recording;

      // 实时获取音频电平
      // 1. 更新目标高度（根据音频电平）
      meteringIntervalRef.current = setInterval(async () => {
        if (recordingRef.current) {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording) {
            const metering = status.metering ?? -160;
            updateBarHeights(metering);
          }
        }
      }, UPDATE_INTERVAL);
      
      // 2. 平滑动画（独立的高频更新）
      const animationInterval = setInterval(() => {
        animateBars();
      }, 16); // ~60fps
      
      // 保存动画interval以便清理
      (recordingRef as any).animationInterval = animationInterval;

      return true;
    } catch (error) {
      console.error("开始录音失败:", error);
      return false;
    }
  };

  // 停止音频录制
  const stopAudioRecording = async (): Promise<string | null> => {
    try {
      if (meteringIntervalRef.current) {
        clearInterval(meteringIntervalRef.current);
        meteringIntervalRef.current = null;
      }
      
      // 清理动画interval
      if ((recordingRef as any).animationInterval) {
        clearInterval((recordingRef as any).animationInterval);
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
      
      // 清理动画interval
      if ((recordingRef as any).animationInterval) {
        clearInterval((recordingRef as any).animationInterval);
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
    // 重置波形条高度
    setBarHeights(Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT));
    targetHeightsRef.current = Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT);
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

  // PanResponder 用于按住模式
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
      if ((recordingRef as any).animationInterval) {
        clearInterval((recordingRef as any).animationInterval);
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

  const getHintText = () => {
    if (isRecording) {
      if (isHoldMode) {
        return isInCancelZone ? "松开取消" : "松手完成";
      }
      return "录音中...";
    }
    return isHoldMode ? "按住说话" : "点击录音";
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
            ? "AI分析中..." 
            : isRecording 
              ? "聆听中..." 
              : "记录情报"
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
              AI正在分析...
            </Text>
          </View>
        ) : (
          <>
            {/* 波形可视化 - 独立的音频条 */}
            <View style={styles.waveContainer}>
              {barHeights.map((height, index) => (
                <View
                  key={index}
                  style={[
                    styles.waveBar,
                    {
                      height: height,
                      backgroundColor: isRecording 
                        ? colors.primary 
                        : `${colors.primary}50`,
                      opacity: isRecording 
                        ? 0.8 + (index % 3) * 0.07 // 微妙的 staggered opacity
                        : 0.4,
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
    paddingHorizontal: 20,
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
    width: WAVE_WIDTH,
    height: MAX_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: BAR_GAP,
    marginBottom: 40,
  },
  waveBar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    backgroundColor: "#c9a962",
  },
  hint: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
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

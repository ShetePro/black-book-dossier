import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Alert,
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
import { useStreamingRecorder } from "@/hooks/useStreamingRecorder";
import { TranscriptionText } from "@/components/recording/TranscriptionText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 波形配置 - 独立的音频条
const WAVE_BAR_COUNT = 30;
const WAVE_WIDTH = SCREEN_WIDTH * 0.85;
const BAR_WIDTH = 4;
const BAR_GAP = 3;
const MIN_BAR_HEIGHT = 6;
const MAX_BAR_HEIGHT = 120;

// 平滑因子
const SMOOTHING_FACTOR = 0.3;

// 音频电平转换为条高度
const meteringToBarHeight = (metering: number): number => {
  const threshold = -50;
  
  if (metering < threshold) {
    return 0;
  }
  
  const normalized = (metering - threshold) / (0 - threshold);
  const amplified = Math.pow(normalized, 2.5);
  
  return MIN_BAR_HEIGHT + amplified * (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT);
};

export default function RecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  
  // 语音识别 Hook - 现在包含音频电平监测
  const {
    status,
    isRecording,
    liveTranscription,
    duration,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    initialize,
    isModelLoaded,
  } = useStreamingRecorder();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHoldMode, setIsHoldMode] = useState(true);
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // 波形条数据
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT)
  );
  const targetHeightsRef = useRef<number[]>(Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT));
  
  // 引用
  const cancelZoneLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // 动画值
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const waveAnimation = useSharedValue(0);
  const cancelOpacity = useSharedValue(0);

  // 初始化 Whisper 模型
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        await initialize();
      } catch (err) {
        console.error('Failed to initialize:', err);
        Alert.alert(
          '模型加载失败',
          '语音识别模型加载失败，请检查网络连接后重试。',
          [{ text: '确定' }]
        );
      } finally {
        setIsInitializing(false);
      }
    };
    
    init();
  }, [initialize]);

  // 监听音频电平变化，更新波形
  useEffect(() => {
    if (isRecording) {
      const targetHeight = meteringToBarHeight(audioLevel);
      
      const newTargets = Array.from({ length: WAVE_BAR_COUNT }, (_, i) => {
        const centerOffset = Math.abs(i - WAVE_BAR_COUNT / 2) / (WAVE_BAR_COUNT / 2);
        const dampening = 1 - centerOffset * 0.4;
        const randomVariation = (Math.random() - 0.5) * 20;
        
        return Math.max(
          MIN_BAR_HEIGHT,
          Math.min(MAX_BAR_HEIGHT, targetHeight * dampening + randomVariation)
        );
      });
      
      targetHeightsRef.current = newTargets;
      
      // 平滑过渡
      setBarHeights((prev) => {
        return prev.map((current, i) => {
          const target = targetHeightsRef.current[i];
          return current + (target - current) * SMOOTHING_FACTOR;
        });
      });
    } else {
      // 重置波形
      setBarHeights(Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT));
      targetHeightsRef.current = Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT);
    }
  }, [audioLevel, isRecording]);

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
  const handleStartRecording = useCallback(async () => {
    if (!isModelLoaded) {
      Alert.alert('请稍候', '语音识别模型正在加载中...');
      return;
    }

    await startRecording();
    startRecordingAnimation();
    
    if (isHoldMode) {
      cancelOpacity.value = withTiming(1);
    }
  }, [isModelLoaded, startRecording, isHoldMode, cancelOpacity, startRecordingAnimation]);

  // 停止录音并保存
  const handleStopRecording = useCallback(async () => {
    const finalTranscription = await stopRecording();
    stopRecordingAnimation();
    
    if (finalTranscription) {
      setIsAnalyzing(true);
      // 跳转到 AI Agent 确认页面进行分析和确认
      setTimeout(() => {
        setIsAnalyzing(false);
        router.push({
          pathname: "/(views)/agent-review",
          params: { transcription: finalTranscription }
        });
      }, 500);
    }
  }, [stopRecording, stopRecordingAnimation, router]);

  // 取消录音
  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
    setIsInCancelZone(false);
    stopRecordingAnimation();
  }, [cancelRecording, stopRecordingAnimation]);

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
          handleStartRecording();
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
            handleCancelRecording();
          } else {
            handleStopRecording();
          }
        }
      },
      onPanResponderTerminate: () => {
        if (isHoldMode && isRecording) {
          micScale.value = withSpring(1, { damping: 20 });
          handleCancelRecording();
        }
      },
    });
  }, [isHoldMode, isRecording, handleStartRecording, handleStopRecording, handleCancelRecording, checkInCancelZone, micScale]);

  // 处理录音按钮按下（切换模式）
  const handleTogglePress = () => {
    if (!isHoldMode) {
      if (isRecording) {
        handleStopRecording();
      } else {
        handleStartRecording();
      }
    }
  };

  // 切换模式下的取消按钮
  const handleToggleCancel = () => {
    if (!isHoldMode && isRecording) {
      handleCancelRecording();
    }
  };

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

  const getTitleText = () => {
    if (isInitializing) return "加载中...";
    if (isAnalyzing) return "AI分析中...";
    if (isRecording) return "聆听中...";
    return "记录情报";
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
          {getTitleText()}
        </Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* 模型加载提示 */}
      {isInitializing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            正在加载语音识别模型...
          </Text>
        </View>
      )}

      {/* 模式切换按钮 */}
      {!isRecording && !isAnalyzing && !isInitializing && (
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
            {/* 实时转录文本 */}
            <TranscriptionText
              text={liveTranscription}
              isRecording={isRecording}
              isTranscribing={status === 'transcribing'}
            />

            {/* 波形可视化 */}
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
                        ? 0.8 + (index % 3) * 0.07
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
                {Math.floor(duration / 60).toString().padStart(2, "0")}:
                {(duration % 60).toString().padStart(2, "0")}
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
                    opacity: isInitializing ? 0.5 : 1,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={handleTogglePress}
                  disabled={isHoldMode || isInitializing}
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
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
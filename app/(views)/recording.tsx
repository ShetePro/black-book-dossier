import React, { useState, useCallback, useEffect, useRef } from "react";
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
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StatusBar } from "expo-status-bar";
import { useRecorder } from "@/hooks/useRecorder";
import { isModelDownloaded, downloadModel, formatFileSize, getModelInfo } from "@/services/voice/whisper";
import { Alert } from "react-native";
import { useSettingsStore } from "@/store/settingsStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// 波形配置
const WAVE_BAR_COUNT = 30;
const WAVE_WIDTH = SCREEN_WIDTH * 0.85;
const BAR_WIDTH = 4;
const BAR_GAP = 3;
const MIN_BAR_HEIGHT = 6;
const MAX_BAR_HEIGHT = 120;

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

// 格式化时长
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function RecordingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { settings } = useSettingsStore();
  
  const {
    status,
    isRecording,
    isTranscribing,
    duration,
    error,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useRecorder();
  
  // 录音模式（从设置读取，默认长按）
  const isHoldMode = settings.recording.mode === 'hold';
  
  // 长按模式状态
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  const cancelZoneLayout = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // 波形条数据
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT)
  );
  
  // 动画值
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const cancelOpacity = useSharedValue(0);

  // 检查并下载模型
  const [isCheckingModel, setIsCheckingModel] = useState(false);
  const [modelDownloadProgress, setModelDownloadProgress] = useState(0);
  
  const checkAndDownloadModel = async (): Promise<boolean> => {
    setIsCheckingModel(true);
    setModelDownloadProgress(0);
    
    try {
      const hasModel = await isModelDownloaded();
      
      if (hasModel) {
        setIsCheckingModel(false);
        return true;
      }
      
      const modelInfo = getModelInfo();
      
      return new Promise((resolve) => {
        Alert.alert(
          '下载语音模型',
          `首次使用需要下载 Whisper Tiny 语音模型（${formatFileSize(modelInfo.size * 1024 * 1024)}）。\n\n建议在 Wi-Fi 环境下下载。`,
          [
            { 
              text: '取消', 
              style: 'cancel',
              onPress: () => {
                setIsCheckingModel(false);
                resolve(false);
              }
            },
            {
              text: '下载',
              onPress: async () => {
                const result = await downloadModel((progress) => {
                  setModelDownloadProgress(progress);
                });
                
                setIsCheckingModel(false);
                
                if (result.success) {
                  resolve(true);
                } else {
                  Alert.alert('下载失败', result.error || '请检查网络连接后重试');
                  resolve(false);
                }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error checking model:', error);
      setIsCheckingModel(false);
      return false;
    }
  };

  // 更新波形条
  useEffect(() => {
    if (!isRecording) {
      setBarHeights(Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT));
      return;
    }

    const targetHeight = meteringToBarHeight(audioLevel);
    
    setBarHeights(prev => {
      const newHeights = [...prev];
      newHeights.shift();
      newHeights.push(targetHeight);
      return newHeights;
    });
  }, [audioLevel, isRecording]);

  // 录音动画
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSpring(1.2, { damping: 10 }),
        -1,
        true
      );
      micScale.value = withSpring(0.9, { damping: 20 });
      if (isHoldMode) {
        cancelOpacity.value = withTiming(1);
      }
    } else {
      pulseScale.value = withSpring(1, { damping: 20 });
      micScale.value = withSpring(1, { damping: 20 });
      cancelOpacity.value = withTiming(0);
    }
  }, [isRecording, isHoldMode]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const cancelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cancelOpacity.value,
  }));

  // 检查是否在取消区域
  const checkInCancelZone = useCallback((pageX: number, pageY: number) => {
    if (!cancelZoneLayout.current) return false;
    
    const { x, y, width, height } = cancelZoneLayout.current;
    return (
      pageX >= x && 
      pageX <= x + width && 
      pageY >= y && 
      pageY <= y + height
    );
  }, []);

  // 开始录音
  const handleStartRecording = useCallback(async () => {
    const canRecord = await checkAndDownloadModel();
    if (!canRecord) {
      return;
    }
    
    await startRecording();
  }, [startRecording]);

  // 停止录音并转录
  const handleStopRecording = useCallback(async () => {
    const transcription = await stopRecording();
    
    if (transcription) {
      router.push({
        pathname: "/(views)/agent-review",
        params: { transcription }
      });
    }
  }, [stopRecording, router]);

  // 取消录音
  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
    setIsInCancelZone(false);
  }, [cancelRecording]);

  // PanResponder 用于长按模式
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isHoldMode && !isRecording,
      onMoveShouldSetPanResponder: () => isHoldMode && isRecording,
      onPanResponderGrant: () => {
        if (isHoldMode && !isRecording) {
          handleStartRecording();
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
          handleCancelRecording();
        }
      },
    })
  ).current;

  // 渲染波形
  const renderWaveform = () => {
    return (
      <View style={styles.waveformContainer}>
        <View style={[styles.waveform, { width: WAVE_WIDTH }]}>
          {barHeights.map((height, index) => (
            <View
              key={index}
              style={[
                styles.waveBar,
                {
                  width: BAR_WIDTH,
                  height: Math.max(height, MIN_BAR_HEIGHT),
                  marginHorizontal: BAR_GAP / 2,
                  backgroundColor: isRecording ? colors.primary : colors.textMuted,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // 获取提示文字
  const getHintText = () => {
    if (isRecording) {
      if (isHoldMode) {
        return isInCancelZone ? '松开取消录音' : '松开结束录音';
      }
      return '点击麦克风结束录音';
    }
    if (isHoldMode) {
      return '长按麦克风开始录音';
    }
    return '点击麦克风开始录音';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          {isTranscribing ? '正在转录...' : isRecording ? '正在录音' : '录音'}
        </Text>

        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* 波形 */}
        {renderWaveform()}

        {/* 时长显示 */}
        <Text style={[styles.duration, { color: colors.text }]}>
          {formatDuration(duration)}
        </Text>

        {/* 提示文字 */}
        {!isTranscribing && !isCheckingModel && (
          <Text style={[styles.hint, { 
            color: isInCancelZone ? colors.danger : colors.textMuted 
          }]}>
            {getHintText()}
          </Text>
        )}

        {/* 长按模式的取消区域 */}
        {isHoldMode && isRecording && (
          <Animated.View 
            style={[
              styles.cancelZone,
              cancelAnimatedStyle,
              { 
                backgroundColor: isInCancelZone ? `${colors.danger}30` : 'transparent',
                borderColor: isInCancelZone ? colors.danger : colors.textMuted,
              }
            ]}
            onLayout={(event) => {
              const { x, y, width, height } = event.nativeEvent.layout;
              cancelZoneLayout.current = { x, y, width, height };
            }}
          >
            <Ionicons 
              name="close-circle" 
              size={40} 
              color={isInCancelZone ? colors.danger : colors.textMuted} 
            />
            <Text style={[
              styles.cancelZoneText, 
              { color: isInCancelZone ? colors.danger : colors.textMuted }
            ]}>
              滑动到此处取消
            </Text>
          </Animated.View>
        )}

        {isTranscribing && (
          <View style={styles.transcribingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.transcribingText, { color: colors.text }]} >
              正在识别语音...
            </Text>
            <Text style={[styles.transcribingSubtext, { color: colors.textMuted }]} >
              请稍候
            </Text>
          </View>
        )}

        {isCheckingModel && (
          <View style={styles.transcribingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.transcribingText, { color: colors.text }]} >
              正在下载语音模型...
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.elevated }]}>
              <View
                style={[
                  styles.progressFill,
                  { 
                    backgroundColor: colors.primary,
                    width: `${modelDownloadProgress * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.transcribingSubtext, { color: colors.textMuted }]} >
              {(modelDownloadProgress * 100).toFixed(1)}%
            </Text>
          </View>
        )}

        {error && (
          <Text style={[styles.error, { color: colors.danger }]} >
            {error}
          </Text>
        )}
      </View>

      {/* 录音按钮 */}
      {!isTranscribing && !isCheckingModel && (
        <View style={styles.buttonContainer}>
          {/* 点击模式：录音时显示取消和停止按钮 */}
          {!isHoldMode && isRecording ? (
            <>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.danger }]}
                onPress={handleCancelRecording}
              >
                <Ionicons name="close" size={24} color={colors.danger} />
              </TouchableOpacity>

              <Animated.View style={[styles.recordButtonOuter, pulseAnimatedStyle]}>
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: colors.danger }]}
                  onPress={handleStopRecording}
                >
                  <Animated.View style={micAnimatedStyle}>
                    <Ionicons name="stop" size={32} color="#fff" />
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.placeholderButton} />
            </>
          ) : (
            /* 长按模式或空闲状态 */
            <View style={styles.placeholderButton} />
          )}

          {/* 麦克风按钮 */}
          {!isRecording && (
            <>
              {isHoldMode ? (
                /* 长按模式：使用 Animated.View 绑定 PanResponder */
                <Animated.View 
                  style={[styles.recordButton, pulseAnimatedStyle, { backgroundColor: colors.primary }]}
                  {...panResponder.panHandlers}
                >
                  <Ionicons name="mic" size={40} color="#0a0a0a" />
                </Animated.View>
              ) : (
                /* 点击模式：使用 TouchableOpacity */
                <TouchableOpacity
                  style={[styles.recordButton, { backgroundColor: colors.primary }]}
                  onPress={handleStartRecording}
                >
                  <Ionicons name="mic" size={40} color="#0a0a0a" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* 长按模式录音时，中间显示麦克风 */}
          {isHoldMode && isRecording && (
            <Animated.View 
              style={[styles.recordButton, pulseAnimatedStyle, { backgroundColor: colors.danger }]} 
              {...panResponder.panHandlers}
            >
              <Animated.View style={micAnimatedStyle}>
                <Ionicons name="stop" size={32} color="#fff" />
              </Animated.View>
            </Animated.View>
          )}

          <View style={styles.placeholderButton} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBar: {
    width: 200,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  waveformContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: MAX_BAR_HEIGHT,
  },
  waveBar: {
    borderRadius: 2,
  },
  duration: {
    fontSize: 48,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  hint: {
    fontSize: 15,
    textAlign: 'center',
  },
  cancelZone: {
    marginTop: 40,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    minHeight: 100,
  },
  cancelZoneText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  transcribingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  transcribingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  transcribingSubtext: {
    fontSize: 14,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
    gap: 40,
  },
  placeholderButton: {
    width: 60,
  },
  cancelButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

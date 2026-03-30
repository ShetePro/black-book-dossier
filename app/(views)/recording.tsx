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

// 取消阈值：手指向上滑动超过100px
const CANCEL_THRESHOLD = -100;

// 最大录音时长（秒）
const MAX_RECORDING_DURATION = 60;

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
  
  // 微信风格：手指上滑取消
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  const gestureStartY = useRef(0);

  // 使用 ref 跟踪录音状态和录音模式，供 PanResponder 使用（避免闭包问题）
  const isRecordingRef = useRef(isRecording);
  const isHoldModeRef = useRef(isHoldMode);
  
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);
  
  useEffect(() => {
    isHoldModeRef.current = isHoldMode;
  }, [isHoldMode]);
  
  // 波形条数据
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT)
  );
  
  // 动画值
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);
  const hintOpacity = useSharedValue(1);

  // 检查并下载模型
  const [isCheckingModel, setIsCheckingModel] = useState(false);
  const [modelDownloadProgress, setModelDownloadProgress] = useState(0);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [downloadResult, setDownloadResult] = useState<boolean | null>(null);
  
  const checkAndDownloadModel = async (): Promise<boolean> => {
    const hasModel = await isModelDownloaded();
    
    if (hasModel) {
      return true;
    }
    
    // 显示下载确认对话框
    setShowDownloadConfirm(true);
    
    // 等待用户选择
    return new Promise((resolve) => {
      const checkResult = () => {
        if (downloadResult !== null) {
          setShowDownloadConfirm(false);
          const result = downloadResult;
          setDownloadResult(null);
          resolve(result);
        } else {
          setTimeout(checkResult, 100);
        }
      };
      checkResult();
    });
  };
  
  const handleDownloadConfirm = async () => {
    setShowDownloadConfirm(false);
    setIsCheckingModel(true);
    setModelDownloadProgress(0);
    
    try {
      const result = await downloadModel((progress) => {
        setModelDownloadProgress(progress);
      });
      
      setIsCheckingModel(false);
      
      if (result.success) {
        setDownloadResult(true);
      } else {
        Alert.alert('下载失败', result.error || '请检查网络连接后重试');
        setDownloadResult(false);
      }
    } catch (error) {
      console.error('Download error:', error);
      setIsCheckingModel(false);
      Alert.alert('下载失败', '下载过程中出现错误');
      setDownloadResult(false);
    }
  };
  
  const handleDownloadCancel = () => {
    setShowDownloadConfirm(false);
    setDownloadResult(false);
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
        withSpring(1.15, { damping: 15 }),
        -1,
        true
      );
      micScale.value = withSpring(0.95, { damping: 20 });
    } else {
      pulseScale.value = withSpring(1, { damping: 20 });
      micScale.value = withSpring(1, { damping: 20 });
      hintOpacity.value = withTiming(1);
    }
  }, [isRecording]);

  // 倒计时检查
  useEffect(() => {
    if (isRecording && duration >= MAX_RECORDING_DURATION) {
      handleStopRecording();
    }
  }, [duration, isRecording]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

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
    const result = await stopRecording();
    
    if (result) {
      router.push({
        pathname: "/(views)/agent-review",
        params: { 
          transcription: result.text,
          audioUri: result.audioUri
        }
      });
    }
  }, [stopRecording, router]);

  // 取消录音
  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
    setIsInCancelZone(false);
  }, [cancelRecording]);

  // PanResponder 用于微信风格的长按模式
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isHoldModeRef.current && !isRecordingRef.current,
      onMoveShouldSetPanResponder: () => isHoldModeRef.current && isRecordingRef.current,
      onPanResponderGrant: () => {
        if (isHoldModeRef.current && !isRecordingRef.current) {
          gestureStartY.current = 0;
          setIsInCancelZone(false);
          handleStartRecording();
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (isHoldModeRef.current && isRecordingRef.current) {
          // 微信风格：手指向上滑动超过阈值进入取消区域
          const isCancel = gestureState.dy < CANCEL_THRESHOLD;
          setIsInCancelZone(isCancel);
          
          // 更新提示文字透明度
          if (isCancel) {
            hintOpacity.value = withTiming(0.5);
          } else {
            hintOpacity.value = withTiming(1);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        console.log('[Recording] Release - dy:', gestureState.dy, 'recording:', isRecordingRef.current);
        if (isHoldModeRef.current && isRecordingRef.current) {
          const isCancel = gestureState.dy < CANCEL_THRESHOLD;
          console.log('[Recording] Is cancel:', isCancel);
          
          if (isCancel) {
            handleCancelRecording();
          } else {
            handleStopRecording();
          }
          
          hintOpacity.value = withTiming(1);
        }
      },
      onPanResponderTerminate: () => {
        console.log('[Recording] Terminate - recording:', isRecordingRef.current);
        if (isHoldModeRef.current && isRecordingRef.current) {
          handleCancelRecording();
          hintOpacity.value = withTiming(1);
        }
      },
    })
  ).current;

  // 渲染波形
  const renderWaveform = () => {
    if (!isRecording) return null;
    
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
                  backgroundColor: isInCancelZone ? colors.danger : colors.primary,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // 获取倒计时显示
  const getCountdownText = () => {
    const remaining = MAX_RECORDING_DURATION - duration;
    if (remaining <= 10) {
      return `${remaining}s`;
    }
    return null;
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

        {/* 倒计时显示 */}
        <View style={styles.countdownContainer}>
          {isRecording && getCountdownText() && (
            <Text style={[styles.countdownText, { color: colors.danger }]}>
              {getCountdownText()}
            </Text>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* 波形 - 只在录音时显示 */}
        {renderWaveform()}

        {/* 时长显示 */}
        {isRecording && (
          <Text style={[styles.duration, { color: isInCancelZone ? colors.danger : colors.text }]}>
            {formatDuration(duration)}
          </Text>
        )}

        {/* 微信风格提示区域 */}
        {isHoldMode && isRecording && (
          <Animated.View style={[styles.hintContainer, { opacity: hintOpacity }]}>
            <Ionicons 
              name={isInCancelZone ? "trash" : "arrow-up"} 
              size={24} 
              color={isInCancelZone ? colors.danger : colors.textMuted} 
            />
            <Text style={[
              styles.hintText, 
              { color: isInCancelZone ? colors.danger : colors.textMuted }
            ]}>
              {isInCancelZone ? '松开手指，取消发送' : '手指上滑，取消发送'}
            </Text>
          </Animated.View>
        )}

        {/* 点击模式的提示 */}
        {!isHoldMode && !isTranscribing && !isCheckingModel && !isRecording && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            点击麦克风开始录音
          </Text>
        )}

        {showDownloadConfirm && (
          <View style={[styles.confirmContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>
              下载语音模型
            </Text>
            <Text style={[styles.confirmMessage, { color: colors.textMuted }]}>
              首次使用需要下载 Whisper Tiny 语音模型（{formatFileSize(getModelInfo().size * 1024 * 1024)}）。{"\n\n"}建议在 Wi-Fi 环境下下载。
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, { borderColor: colors.border }]}
                onPress={handleDownloadCancel}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text }]}>
                  取消
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handleDownloadConfirm}
              >
                <Text style={[styles.confirmButtonText, { color: '#0a0a0a' }]}>
                  下载
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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

      {/* 底部录音按钮区域 */}
      {!isTranscribing && !isCheckingModel && (
        <View style={styles.bottomContainer}>
          {/* 点击模式：录音时显示停止按钮 */}
          {!isHoldMode && isRecording ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleCancelRecording}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                  取消
                </Text>
              </TouchableOpacity>

              <Animated.View style={[styles.recordButtonLarge, pulseAnimatedStyle]}>
                <TouchableOpacity
                  style={[styles.recordButtonInner, { backgroundColor: colors.danger }]}
                  onPress={handleStopRecording}
                >
                  <Ionicons name="stop" size={32} color="#fff" />
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.placeholderSmall} />
            </View>
          ) : (
            /* 长按模式或空闲状态 */
            <View style={styles.holdButtonContainer}>
              {/* 长按模式提示文字 */}
              {isHoldMode && !isRecording && (
                <Text style={[styles.holdHint, { color: colors.textMuted }]}>
                  按住 说话
                </Text>
              )}

              {/* 麦克风按钮 */}
              <Animated.View 
                style={[
                  styles.recordButtonMain, 
                  pulseAnimatedStyle,
                  { 
                    backgroundColor: isRecording 
                      ? (isInCancelZone ? colors.danger : colors.primary)
                      : colors.primary,
                  }
                ]}
                collapsable={false}
                {...(isHoldMode ? panResponder.panHandlers : {})}
              >
                {isHoldMode ? (
                  // 长按模式：直接显示图标
                  <Animated.View style={micAnimatedStyle}>
                    <Ionicons 
                      name={isRecording ? "stop" : "mic"} 
                      size={36} 
                      color={isRecording ? "#fff" : "#0a0a0a"} 
                    />
                  </Animated.View>
                ) : (
                  // 点击模式：使用 TouchableOpacity
                  <TouchableOpacity
                    onPress={handleStartRecording}
                    style={styles.tapButtonInner}
                  >
                    <Ionicons name="mic" size={36} color="#0a0a0a" />
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* 长按模式录音时的提示 */}
              {isHoldMode && isRecording && (
                <Text style={[styles.recordingLabel, { color: colors.textMuted }]}>
                  松开发送
                </Text>
              )}
            </View>
          )}
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
  countdownContainer: {
    width: 44,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  waveformContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 36,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    marginBottom: 20,
  },
  hintContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  hintText: {
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    fontSize: 15,
    textAlign: 'center',
    color: '#999',
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
  progressBar: {
    width: 200,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 40,
  },
  bottomContainer: {
    paddingHorizontal: 40,
    paddingBottom: 80,
    paddingTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderSmall: {
    width: 80,
  },
  holdButtonContainer: {
    alignItems: 'center',
    gap: 16,
  },
  holdHint: {
    fontSize: 14,
  },
  recordingLabel: {
    fontSize: 14,
  },
  recordButtonMain: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

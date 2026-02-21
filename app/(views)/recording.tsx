import React, { useState, useCallback, useEffect, useRef } from "react";
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
  withRepeat,
} from "react-native-reanimated";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StatusBar } from "expo-status-bar";
import { useRecorder } from "@/hooks/useRecorder";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  
  // 波形条数据
  const [barHeights, setBarHeights] = useState<number[]>(
    Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT)
  );
  
  // 动画值
  const pulseScale = useSharedValue(1);
  const micScale = useSharedValue(1);

  // 更新波形条
  useEffect(() => {
    if (!isRecording) {
      setBarHeights(Array(WAVE_BAR_COUNT).fill(MIN_BAR_HEIGHT));
      return;
    }

    const targetHeight = meteringToBarHeight(audioLevel);
    
    setBarHeights(prev => {
      const newHeights = [...prev];
      // 移除第一个，添加新的
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
    } else {
      pulseScale.value = withSpring(1, { damping: 20 });
      micScale.value = withSpring(1, { damping: 20 });
    }
  }, [isRecording]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  // 开始录音
  const handleStartRecording = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  // 停止录音并转录
  const handleStopRecording = useCallback(async () => {
    const transcription = await stopRecording();
    
    if (transcription) {
      // 跳转到 AI Agent 分析页面
      router.push({
        pathname: "/(views)/agent-review",
        params: { transcription }
      });
    }
  }, [stopRecording, router]);

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
        {!isRecording && !isTranscribing && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            点击下方麦克风开始录音
          </Text>
        )}

        {isRecording && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            点击麦克风结束录音
          </Text>
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

        {error && (
          <Text style={[styles.error, { color: colors.danger }]} >
            {error}
          </Text>
        )}
      </View>

      {/* 录音按钮 */}
      {!isTranscribing && (
        <View style={styles.buttonContainer}>
          {isRecording ? (
            <>
              {/* 取消按钮 */}
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: colors.danger }]}
                onPress={cancelRecording}
              >
                <Ionicons name="close" size={24} color={colors.danger} />
              </TouchableOpacity>

              {/* 停止录音按钮 */}
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
            <>
              <View style={styles.placeholderButton} />

              <TouchableOpacity
                style={[styles.recordButton, { backgroundColor: colors.primary }]}
                onPress={handleStartRecording}
              >
                <Ionicons name="mic" size={40} color="#0a0a0a" />
              </TouchableOpacity>

              <View style={styles.placeholderButton} />
            </>
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
